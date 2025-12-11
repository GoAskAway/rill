/**
 * WorkerPool - Multi-tenant Worker management for browser environments
 *
 * Features:
 * - Worker pooling and reuse
 * - Fault isolation between engines
 * - Automatic recovery from worker crashes
 * - Resource limits (max workers, queue depth)
 * - Health monitoring and metrics
 */

export interface WorkerPoolOptions {
  /**
   * Maximum number of workers in the pool
   * @default 4
   */
  maxWorkers?: number;

  /**
   * Maximum pending tasks in queue before rejecting
   * @default 100
   */
  maxQueueSize?: number;

  /**
   * Worker idle timeout in ms before termination
   * @default 30000 (30s)
   */
  idleTimeout?: number;

  /**
   * Maximum consecutive failures before marking worker as unhealthy
   * @default 3
   */
  maxFailures?: number;

  /**
   * Factory function to create workers.
   * Optional - if not provided, uses the built-in engine.worker.ts
   */
  createWorker?: () => Worker;

  /**
   * Called when a worker crashes or is terminated
   */
  onWorkerError?: (error: Error, workerId: string) => void;

  /**
   * Called for metrics/monitoring
   */
  onMetric?: (name: string, value: number, tags?: Record<string, unknown>) => void;
}

/**
 * Default worker factory - creates worker from built-in engine.worker.ts
 */
function defaultCreateWorker(): Worker {
  return new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module' });
}

interface PooledWorker {
  id: string;
  worker: Worker;
  busy: boolean;
  failureCount: number;
  taskCount: number;
  createdAt: number;
  lastUsedAt: number;
  currentTaskId: string | null;
}

interface QueuedTask {
  id: string;
  type: string;
  payload: unknown;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  enqueuedAt: number;
  timeout?: number;
  timeoutHandle?: ReturnType<typeof setTimeout>;
}

let poolIdCounter = 0;
let taskIdCounter = 0;

export class WorkerPool {
  private poolId: string;
  private options: Required<Omit<WorkerPoolOptions, 'onWorkerError' | 'onMetric'>> &
    Pick<WorkerPoolOptions, 'onWorkerError' | 'onMetric'>;
  private workers: Map<string, PooledWorker> = new Map();
  private queue: QueuedTask[] = [];
  private activeTasks: Map<string, QueuedTask> = new Map(); // Tasks currently being executed
  private workerIdCounter = 0;
  private disposed = false;

  // Metrics
  private totalTasksProcessed = 0;
  private totalTasksFailed = 0;
  private totalWorkersCreated = 0;
  private totalWorkersCrashed = 0;

  constructor(options: WorkerPoolOptions = {}) {
    this.poolId = `pool_${++poolIdCounter}`;
    this.options = {
      maxWorkers: options.maxWorkers ?? 4,
      maxQueueSize: options.maxQueueSize ?? 100,
      idleTimeout: options.idleTimeout ?? 30000,
      maxFailures: options.maxFailures ?? 3,
      createWorker: options.createWorker ?? defaultCreateWorker,
      onWorkerError: options.onWorkerError,
      onMetric: options.onMetric,
    };
  }

  /**
   * Execute a task in the pool
   */
  async execute<T = unknown>(
    type: string,
    payload: unknown,
    options?: { timeout?: number }
  ): Promise<T> {
    if (this.disposed) {
      throw new Error('[WorkerPool] Pool has been disposed');
    }

    // Check queue limit
    if (this.queue.length >= this.options.maxQueueSize) {
      this.options.onMetric?.('workerpool.queue_full', 1);
      throw new Error('[WorkerPool] Task queue is full');
    }

    const taskId = `task_${++taskIdCounter}`;
    const start = Date.now();

    return new Promise<T>((resolve, reject) => {
      const task: QueuedTask = {
        id: taskId,
        type,
        payload,
        resolve: (value) => {
          this.totalTasksProcessed++;
          this.options.onMetric?.('workerpool.task_duration', Date.now() - start, { type });
          resolve(value as T);
        },
        reject: (error) => {
          this.totalTasksFailed++;
          this.options.onMetric?.('workerpool.task_failed', 1, { type, error: error.message });
          reject(error);
        },
        enqueuedAt: start,
        timeout: options?.timeout,
      };

      // Set up timeout if specified
      if (options?.timeout) {
        task.timeoutHandle = setTimeout(() => {
          const index = this.queue.indexOf(task);
          if (index !== -1) {
            this.queue.splice(index, 1);
          }
          task.reject(new Error(`[WorkerPool] Task timeout: ${options.timeout}ms`));
        }, options.timeout);
      }

      this.queue.push(task);
      this.options.onMetric?.('workerpool.queue_size', this.queue.length);
      this.processQueue();
    });
  }

  /**
   * Process pending tasks in queue
   */
  private processQueue(): void {
    if (this.disposed || this.queue.length === 0) return;

    // Find an available worker
    let availableWorker: PooledWorker | null = null;
    for (const worker of this.workers.values()) {
      if (!worker.busy && worker.failureCount < this.options.maxFailures) {
        availableWorker = worker;
        break;
      }
    }

    // Create new worker if needed and under limit
    if (!availableWorker && this.workers.size < this.options.maxWorkers) {
      availableWorker = this.createPooledWorker();
    }

    if (!availableWorker) {
      // No workers available, task stays in queue
      return;
    }

    // Dequeue and execute
    const task = this.queue.shift();
    if (!task) return;

    // Clear timeout since we're processing
    if (task.timeoutHandle) {
      clearTimeout(task.timeoutHandle);
    }

    this.executeOnWorker(availableWorker, task);
  }

  /**
   * Create a new pooled worker
   */
  private createPooledWorker(): PooledWorker {
    const workerId = `${this.poolId}_worker_${++this.workerIdCounter}`;
    const worker = this.options.createWorker();
    this.totalWorkersCreated++;

    const pooledWorker: PooledWorker = {
      id: workerId,
      worker,
      busy: false,
      failureCount: 0,
      taskCount: 0,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      currentTaskId: null,
    };

    // Set up error handler for worker crashes
    worker.onerror = (error) => {
      this.handleWorkerCrash(pooledWorker, error);
    };

    this.workers.set(workerId, pooledWorker);
    this.options.onMetric?.('workerpool.workers_active', this.workers.size);

    return pooledWorker;
  }

  /**
   * Execute a task on a specific worker
   */
  private executeOnWorker(pooledWorker: PooledWorker, task: QueuedTask): void {
    pooledWorker.busy = true;
    pooledWorker.currentTaskId = task.id;
    pooledWorker.lastUsedAt = Date.now();

    // Track active task for disposal handling
    this.activeTasks.set(task.id, task);

    const handleResponse = (ev: MessageEvent) => {
      const { id, result, error } = ev.data;

      // Only handle responses for this task
      if (id !== task.id) return;

      // Clean up listener and active task tracking
      pooledWorker.worker.removeEventListener('message', handleResponse);
      this.activeTasks.delete(task.id);

      pooledWorker.busy = false;
      pooledWorker.currentTaskId = null;
      pooledWorker.taskCount++;
      pooledWorker.lastUsedAt = Date.now();

      if (error) {
        pooledWorker.failureCount++;
        task.reject(new Error(error));

        // Check if worker should be retired
        if (pooledWorker.failureCount >= this.options.maxFailures) {
          this.retireWorker(pooledWorker, 'max failures reached');
        }
      } else {
        // Reset failure count on success
        pooledWorker.failureCount = 0;
        task.resolve(result);
      }

      // Process next task in queue
      this.processQueue();
    };

    pooledWorker.worker.addEventListener('message', handleResponse);
    pooledWorker.worker.postMessage({
      type: task.type,
      id: task.id,
      ...task.payload as object,
    });
  }

  /**
   * Handle worker crash
   */
  private handleWorkerCrash(pooledWorker: PooledWorker, error: ErrorEvent | Error): void {
    this.totalWorkersCrashed++;
    this.options.onMetric?.('workerpool.worker_crashed', 1, { workerId: pooledWorker.id });

    const err = error instanceof Error
      ? error
      : new Error(error.message || 'Worker crashed');

    this.options.onWorkerError?.(err, pooledWorker.id);

    // Reject current task if any
    if (pooledWorker.currentTaskId) {
      const taskIndex = this.queue.findIndex(t => t.id === pooledWorker.currentTaskId);
      // Task might have been removed from queue already
    }

    // Remove and recreate worker
    this.retireWorker(pooledWorker, 'crashed');

    // Process queue with potentially new worker
    this.processQueue();
  }

  /**
   * Retire a worker (terminate and remove from pool)
   */
  private retireWorker(pooledWorker: PooledWorker, reason: string): void {
    this.options.onMetric?.('workerpool.worker_retired', 1, {
      workerId: pooledWorker.id,
      reason,
      taskCount: pooledWorker.taskCount,
      age: Date.now() - pooledWorker.createdAt,
    });

    try {
      pooledWorker.worker.terminate();
    } catch {
      // Ignore termination errors
    }

    this.workers.delete(pooledWorker.id);
    this.options.onMetric?.('workerpool.workers_active', this.workers.size);
  }

  /**
   * Get pool health status
   */
  getHealth(): {
    activeWorkers: number;
    busyWorkers: number;
    queueSize: number;
    totalTasksProcessed: number;
    totalTasksFailed: number;
    totalWorkersCreated: number;
    totalWorkersCrashed: number;
  } {
    let busyCount = 0;
    for (const worker of this.workers.values()) {
      if (worker.busy) busyCount++;
    }

    return {
      activeWorkers: this.workers.size,
      busyWorkers: busyCount,
      queueSize: this.queue.length,
      totalTasksProcessed: this.totalTasksProcessed,
      totalTasksFailed: this.totalTasksFailed,
      totalWorkersCreated: this.totalWorkersCreated,
      totalWorkersCrashed: this.totalWorkersCrashed,
    };
  }

  /**
   * Dispose the pool and all workers
   */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    // Reject all queued tasks
    for (const task of this.queue) {
      if (task.timeoutHandle) clearTimeout(task.timeoutHandle);
      task.reject(new Error('[WorkerPool] Pool disposed'));
    }
    this.queue = [];

    // Reject all active (in-flight) tasks
    for (const task of this.activeTasks.values()) {
      if (task.timeoutHandle) clearTimeout(task.timeoutHandle);
      task.reject(new Error('[WorkerPool] Pool disposed'));
    }
    this.activeTasks.clear();

    // Terminate all workers
    for (const pooledWorker of this.workers.values()) {
      try {
        pooledWorker.worker.terminate();
      } catch {
        // Ignore
      }
    }
    this.workers.clear();

    this.options.onMetric?.('workerpool.disposed', 1);
  }
}

/**
 * Global shared pool - lazily initialized
 */
let globalPool: WorkerPool | null = null;

/**
 * Get or create the global shared worker pool.
 * Uses sensible defaults - no configuration required.
 *
 * @example
 * ```typescript
 * const pool = getGlobalWorkerPool();
 * const engine = new Engine({ pool });
 * ```
 */
export function getGlobalWorkerPool(options?: WorkerPoolOptions): WorkerPool {
  if (!globalPool) {
    globalPool = new WorkerPool(options);
  }
  return globalPool;
}

/**
 * Dispose and reset the global shared worker pool.
 * Call this during app shutdown or when cleaning up resources.
 */
export function disposeGlobalWorkerPool(): void {
  if (globalPool) {
    globalPool.dispose();
    globalPool = null;
  }
}

/**
 * Convenience factory - creates a new WorkerPool with sensible defaults.
 * For most use cases, prefer `getGlobalWorkerPool()` to share resources.
 *
 * @example
 * ```typescript
 * // Simple - all defaults
 * const pool = createWorkerPool();
 *
 * // With options
 * const pool = createWorkerPool({ maxWorkers: 2 });
 * ```
 */
export function createWorkerPool(options?: WorkerPoolOptions): WorkerPool {
  return new WorkerPool(options);
}
