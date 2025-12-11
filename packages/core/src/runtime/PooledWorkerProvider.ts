/**
 * PooledWorkerProvider - JSEngineProvider that uses WorkerPool for multi-tenant scenarios
 *
 * Unlike WorkerJSEngineProvider which creates one worker per engine,
 * this provider shares workers across multiple engines via a pool.
 *
 * Benefits:
 * - Resource efficiency: Workers are reused across engines
 * - Fault isolation: Worker crash doesn't affect other engines
 * - Automatic recovery: Crashed workers are replaced
 * - Global resource limits: Max workers, queue depth
 *
 * Trade-offs:
 * - Slightly higher latency due to queueing
 * - Each eval creates fresh sandbox (no persistent context between evals)
 */

import type { JSEngineProvider, JSEngineContext, JSEngineRuntime } from './engine';
import { WorkerPool, type WorkerPoolOptions } from './WorkerPool';

export interface PooledWorkerProviderOptions {
  /**
   * Shared WorkerPool instance. If not provided, a pool will be created.
   */
  pool?: WorkerPool;

  /**
   * Pool options (only used if pool is not provided)
   */
  poolOptions?: Omit<WorkerPoolOptions, 'createWorker'>;

  /**
   * Execution timeout in ms
   */
  timeout?: number;

  /**
   * Factory to create workers (only used if pool is not provided)
   */
  createWorker?: () => Worker;
}

export class PooledWorkerProvider implements JSEngineProvider {
  private pool: WorkerPool;
  private ownsPool: boolean;
  private options: { timeout?: number };
  private engineId: string;
  private static engineCounter = 0;

  constructor(options: PooledWorkerProviderOptions) {
    this.engineId = `engine_${++PooledWorkerProvider.engineCounter}`;
    this.options = { timeout: options.timeout };

    if (options.pool) {
      this.pool = options.pool;
      this.ownsPool = false;
    } else {
      if (!options.createWorker) {
        throw new Error('[PooledWorkerProvider] Either pool or createWorker must be provided');
      }
      this.pool = new WorkerPool({
        ...options.poolOptions,
        createWorker: options.createWorker,
      });
      this.ownsPool = true;
    }
  }

  async createRuntime(): Promise<JSEngineRuntime> {
    let interruptHandler: (() => boolean) | null = null;
    const pendingGlobals = new Map<string, unknown>();
    let disposed = false;

    // Initialize a worker in the pool for this engine
    // The 'init' task ensures a worker is ready
    await this.pool.execute('init', {
      options: { timeout: this.options.timeout },
    }, { timeout: 10000 });

    const context: JSEngineContext = {
      eval: (code: string) => {
        throw new Error('[PooledWorkerProvider] Use evalAsync instead');
      },

      evalAsync: async (code: string) => {
        if (disposed) {
          throw new Error('[PooledWorkerProvider] Context has been disposed');
        }

        // Check interrupt handler
        if (interruptHandler && interruptHandler()) {
          throw new Error('[PooledWorkerProvider] Execution interrupted by handler');
        }

        // Execute in pool with globals
        const result = await this.pool.execute<{ ok: boolean; data?: unknown; error?: { message: string } }>(
          'eval',
          {
            code,
            globals: Object.fromEntries(pendingGlobals),
            engineId: this.engineId,
          },
          { timeout: this.options.timeout }
        );

        if (result && typeof result === 'object' && 'ok' in result) {
          if (!result.ok && result.error) {
            throw new Error(result.error.message);
          }
          return result.data;
        }

        return result;
      },

      setGlobal: (name: string, value: unknown) => {
        // Skip non-serializable values
        if (typeof value === 'function') return;
        if (value && typeof value === 'object') {
          const hasFunction = Object.values(value).some(v => typeof v === 'function');
          if (hasFunction) return;
        }
        pendingGlobals.set(name, value);
      },

      getGlobal: async (name: string) => {
        return pendingGlobals.get(name);
      },

      dispose: () => {
        disposed = true;
        pendingGlobals.clear();
        interruptHandler = null;
      },

      setInterruptHandler: (handler: () => boolean) => {
        interruptHandler = handler;
      },

      clearInterruptHandler: () => {
        interruptHandler = null;
      },
    };

    const runtime: JSEngineRuntime = {
      createContext: () => context,
      dispose: () => {
        context.dispose();
        // Only dispose pool if we own it
        if (this.ownsPool) {
          this.pool.dispose();
        }
      },
    };

    return runtime;
  }

  /**
   * Get the underlying pool for monitoring
   */
  getPool(): WorkerPool {
    return this.pool;
  }
}

/**
 * Create a shared pool for multiple PooledWorkerProvider instances
 */
export function createSharedWorkerPool(options: WorkerPoolOptions): WorkerPool {
  return new WorkerPool(options);
}
