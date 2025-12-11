/**
 * PooledEngine - Engine backed by shared WorkerPool
 *
 * For multi-tenant scenarios where multiple Guests share worker resources.
 * Provides fault isolation, resource limits, and automatic recovery.
 *
 * @example
 * ```typescript
 * // Simplest usage - uses global pool with defaults
 * const engine = new PooledEngine();
 *
 * // With custom pool
 * const pool = createWorkerPool({ maxWorkers: 2 });
 * const engine = new PooledEngine({ pool });
 * ```
 */

import type { IEngine, EngineEvents, EngineHealth, GuestMessage } from './IEngine';
import type { ComponentMap, ComponentRegistry } from './registry';
import type { Receiver } from './receiver';
import type { SerializedValue } from '../types';
import { Engine, type EngineOptions } from './engine';
import { WorkerPool, getGlobalWorkerPool, type WorkerPoolOptions } from './WorkerPool';
import { PooledWorkerProvider } from './PooledWorkerProvider';

/**
 * PooledEngine configuration options
 */
export interface PooledEngineOptions extends Omit<EngineOptions, 'provider' | 'quickjs' | 'sandbox'> {
  /**
   * Shared WorkerPool instance.
   * If not provided, uses the global shared pool.
   */
  pool?: WorkerPool;

  /**
   * Options for creating the pool (only used if pool is not provided)
   */
  poolOptions?: Omit<WorkerPoolOptions, 'createWorker'>;
}

/**
 * PooledEngine - Engine implementation using shared WorkerPool
 *
 * Benefits over standalone Engine:
 * - Resource efficiency: Workers are reused across engines
 * - Fault isolation: Worker crash doesn't affect other engines
 * - Automatic recovery: Crashed workers are replaced
 * - Global resource limits: Max workers, queue depth
 *
 * Trade-offs:
 * - Slightly higher latency due to task queueing
 * - Fresh sandbox per eval (no persistent context between evaluations)
 */
export class PooledEngine implements IEngine {
  private readonly engine: Engine;
  private readonly pool: WorkerPool;
  private readonly ownsPool: boolean;

  constructor(options: PooledEngineOptions = {}) {
    // Get or create pool
    if (options.pool) {
      this.pool = options.pool;
      this.ownsPool = false;
    } else {
      this.pool = getGlobalWorkerPool(options.poolOptions);
      this.ownsPool = false; // Global pool is shared, don't dispose
    }

    // Create provider using the pool
    const provider = new PooledWorkerProvider({
      pool: this.pool,
      timeout: options.timeout,
    });

    // Create underlying engine with the pooled provider
    this.engine = new Engine({
      ...options,
      provider,
    });
  }

  // Delegate all IEngine methods to underlying engine

  register(components: ComponentMap): void {
    this.engine.register(components);
  }

  loadBundle(source: string, initialProps?: Record<string, unknown>): Promise<void> {
    return this.engine.loadBundle(source, initialProps);
  }

  on<K extends keyof EngineEvents>(
    event: K,
    listener: EngineEvents[K] extends () => void
      ? () => void
      : (data: Parameters<EngineEvents[K]>[0]) => void
  ): () => void {
    return this.engine.on(event, listener);
  }

  sendEvent(eventName: string, payload?: SerializedValue): void {
    this.engine.sendEvent(eventName, payload);
  }

  updateConfig(config: Record<string, SerializedValue>): void {
    this.engine.updateConfig(config);
  }

  createReceiver(onUpdate: () => void): Receiver {
    return this.engine.createReceiver(onUpdate);
  }

  getReceiver(): Receiver | null {
    return this.engine.getReceiver();
  }

  getRegistry(): ComponentRegistry {
    return this.engine.getRegistry();
  }

  get isLoaded(): boolean {
    return this.engine.isLoaded;
  }

  get isDestroyed(): boolean {
    return this.engine.isDestroyed;
  }

  getHealth(): EngineHealth {
    return this.engine.getHealth();
  }

  destroy(): void {
    this.engine.destroy();
    // Note: We don't dispose the pool here - it may be shared
  }

  /**
   * Get the underlying WorkerPool for monitoring/debugging
   */
  getPool(): WorkerPool {
    return this.pool;
  }

  /**
   * Get pool health metrics
   */
  getPoolHealth() {
    return this.pool.getHealth();
  }
}
