import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { WorkerPool } from './WorkerPool';

// Mock Worker class for testing
class MockWorker {
  onmessage: ((ev: MessageEvent<any>) => void) | null = null;
  onerror: ((ev: ErrorEvent) => void) | null = null;
  private listeners: Map<string, Set<(ev: any) => void>> = new Map();

  constructor(private behavior: 'normal' | 'slow' | 'crash' | 'fail' = 'normal') {}

  postMessage(msg: any) {
    // Simulate async response
    queueMicrotask(() => {
      if (this.behavior === 'crash') {
        this.onerror?.(new ErrorEvent('error', { message: 'Worker crashed' }));
        return;
      }

      if (this.behavior === 'fail') {
        this.dispatchMessage({
          type: 'result',
          id: msg.id,
          error: 'Task failed',
        });
        return;
      }

      const delay = this.behavior === 'slow' ? 50 : 0;
      setTimeout(() => {
        if (msg.type === 'init') {
          this.dispatchMessage({
            type: 'result',
            id: msg.id,
            result: 'ready',
          });
        } else if (msg.type === 'eval') {
          this.dispatchMessage({
            type: 'result',
            id: msg.id,
            result: { ok: true, data: 'eval result' },
          });
        } else {
          this.dispatchMessage({
            type: 'result',
            id: msg.id,
            result: null,
          });
        }
      }, delay);
    });
  }

  private dispatchMessage(data: any) {
    const event = { data } as MessageEvent;
    this.onmessage?.(event);
    this.listeners.get('message')?.forEach(handler => handler(event));
  }

  addEventListener(event: string, handler: (ev: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  removeEventListener(event: string, handler: (ev: any) => void) {
    this.listeners.get(event)?.delete(handler);
  }

  terminate() {
    this.listeners.clear();
    this.onmessage = null;
    this.onerror = null;
  }
}

describe('WorkerPool', () => {
  let pool: WorkerPool;

  afterEach(() => {
    pool?.dispose();
  });

  describe('Basic Operations', () => {
    it('should execute a task successfully', async () => {
      pool = new WorkerPool({
        createWorker: () => new MockWorker('normal') as unknown as Worker,
        maxWorkers: 2,
      });

      const result = await pool.execute('init', { options: {} });
      expect(result).toBe('ready');
    });

    it('should handle multiple concurrent tasks', async () => {
      pool = new WorkerPool({
        createWorker: () => new MockWorker('normal') as unknown as Worker,
        maxWorkers: 2,
      });

      const results = await Promise.all([
        pool.execute('init', {}),
        pool.execute('init', {}),
        pool.execute('init', {}),
      ]);

      expect(results).toHaveLength(3);
      expect(results.every(r => r === 'ready')).toBe(true);
    });

    it('should respect maxWorkers limit', async () => {
      let workerCount = 0;
      pool = new WorkerPool({
        createWorker: () => {
          workerCount++;
          return new MockWorker('slow') as unknown as Worker;
        },
        maxWorkers: 2,
      });

      // Start 4 tasks with only 2 workers
      const tasks = [
        pool.execute('init', {}),
        pool.execute('init', {}),
        pool.execute('init', {}),
        pool.execute('init', {}),
      ];

      // Should only create 2 workers initially
      await new Promise(r => setTimeout(r, 10));
      expect(workerCount).toBe(2);

      // All should complete eventually
      await Promise.all(tasks);
    });
  });

  describe('Fault Tolerance', () => {
    it('should handle task failures', async () => {
      pool = new WorkerPool({
        createWorker: () => new MockWorker('fail') as unknown as Worker,
        maxWorkers: 2,
        maxFailures: 3,
      });

      await expect(pool.execute('eval', { code: 'test' })).rejects.toThrow('Task failed');
    });

    it('should retire worker after max failures', async () => {
      let retiredCount = 0;
      pool = new WorkerPool({
        createWorker: () => new MockWorker('fail') as unknown as Worker,
        maxWorkers: 2,
        maxFailures: 2,
        onMetric: (name) => {
          if (name === 'workerpool.worker_retired') {
            retiredCount++;
          }
        },
      });

      // Trigger 2 failures to retire the worker
      try { await pool.execute('eval', {}); } catch {}
      try { await pool.execute('eval', {}); } catch {}

      await new Promise(r => setTimeout(r, 50));
      expect(retiredCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Queue Management', () => {
    it('should reject when queue is full', async () => {
      pool = new WorkerPool({
        createWorker: () => new MockWorker('slow') as unknown as Worker,
        maxWorkers: 1,
        maxQueueSize: 2,
      });

      // Fill up queue
      const task1 = pool.execute('init', {}); // Goes to worker
      const task2 = pool.execute('init', {}); // Queue slot 1
      const task3 = pool.execute('init', {}); // Queue slot 2

      // This should fail - queue is full
      await expect(pool.execute('init', {})).rejects.toThrow('queue is full');

      // Clean up
      await Promise.all([task1, task2, task3].map(t => t.catch(() => {})));
    });

    it('should handle task timeout in queue', async () => {
      pool = new WorkerPool({
        createWorker: () => new MockWorker('slow') as unknown as Worker,
        maxWorkers: 1,
        maxQueueSize: 10,
      });

      // First task occupies the worker (slow = 50ms)
      const task1 = pool.execute('init', {});

      // Second task has a very short timeout and should timeout while queued
      const task2Promise = pool.execute('init', {}, { timeout: 5 });

      await expect(task2Promise).rejects.toThrow('timeout');

      await task1;
    });
  });

  describe('Health Monitoring', () => {
    it('should report health status', async () => {
      pool = new WorkerPool({
        createWorker: () => new MockWorker('normal') as unknown as Worker,
        maxWorkers: 2,
      });

      await pool.execute('init', {});

      const health = pool.getHealth();
      expect(health.activeWorkers).toBeGreaterThanOrEqual(1);
      expect(health.totalTasksProcessed).toBe(1);
      expect(health.totalTasksFailed).toBe(0);
    });

    it('should track metrics via callback', async () => {
      const metrics: Array<{ name: string; value: number }> = [];
      pool = new WorkerPool({
        createWorker: () => new MockWorker('normal') as unknown as Worker,
        maxWorkers: 2,
        onMetric: (name, value) => metrics.push({ name, value }),
      });

      await pool.execute('init', {});

      expect(metrics.some(m => m.name === 'workerpool.task_duration')).toBe(true);
    });
  });

  describe('Disposal', () => {
    it('should reject tasks after disposal', async () => {
      pool = new WorkerPool({
        createWorker: () => new MockWorker('normal') as unknown as Worker,
        maxWorkers: 2,
      });

      pool.dispose();

      await expect(pool.execute('init', {})).rejects.toThrow('disposed');
    });

    it('should reject queued tasks on disposal', async () => {
      pool = new WorkerPool({
        createWorker: () => new MockWorker('slow') as unknown as Worker,
        maxWorkers: 1,
      });

      // Start first task to occupy the worker
      const task1Promise = pool.execute('init', {});

      // Queue second task
      const task2Promise = pool.execute('init', {});

      // Dispose immediately - task2 should be in queue
      pool.dispose();

      // Both tasks should be rejected or task1 might complete
      const results = await Promise.allSettled([task1Promise, task2Promise]);

      // At least task2 should be rejected as disposed
      const task2Result = results[1];
      expect(task2Result.status).toBe('rejected');
      if (task2Result.status === 'rejected') {
        expect(task2Result.reason.message).toContain('disposed');
      }
    });
  });
});
