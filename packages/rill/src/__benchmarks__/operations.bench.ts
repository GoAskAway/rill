/**
 * Operations Processing Benchmarks
 *
 * Tests operation collection and merging performance:
 * - Operation collection throughput
 * - Operation merging efficiency
 * - Batch processing performance
 */

import { describe, it, beforeEach, afterEach } from 'vitest';
import {
  OperationMerger,
  ThrottledScheduler,
  PerformanceMonitor,
} from '../runtime/performance';
import { benchmark } from './utils/benchmark';
import type { BenchmarkResult } from './utils/benchmark';
import type { Operation } from '../types';

describe('Operations Benchmarks', () => {
  const results: BenchmarkResult[] = [];

  afterEach(() => {
    if (results.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('OPERATIONS BENCHMARK RESULTS');
      console.log('='.repeat(80));
      results.forEach((result) => {
        console.log(`\n${result.name}:`);
        console.log(`  Mean: ${result.mean.toFixed(3)}ms`);
        console.log(`  Median: ${result.median.toFixed(3)}ms`);
        console.log(`  Min: ${result.min.toFixed(3)}ms`);
        console.log(`  Max: ${result.max.toFixed(3)}ms`);
        console.log(`  Ops/sec: ${result.ops.toFixed(0)}`);
      });
      console.log('\n' + '='.repeat(80) + '\n');
    }
  });

  describe('OperationMerger', () => {
    let merger: OperationMerger;

    beforeEach(() => {
      merger = new OperationMerger();
    });

    it('benchmark: Merge 10 UPDATE operations', async () => {
      const ops: Operation[] = [];
      for (let i = 0; i < 10; i++) {
        ops.push({
          op: 'UPDATE',
          id: 1,
          props: { [`prop${i}`]: i },
        });
      }

      const result = await benchmark(
        'OperationMerger.merge (10 UPDATEs)',
        () => {
          merger.merge(ops);
        },
        { iterations: 1000, warmup: 10 }
      );
      results.push(result);
    });

    it('benchmark: Merge 100 UPDATE operations', async () => {
      const ops: Operation[] = [];
      for (let i = 0; i < 100; i++) {
        ops.push({
          op: 'UPDATE',
          id: 1,
          props: { [`prop${i}`]: i },
        });
      }

      const result = await benchmark(
        'OperationMerger.merge (100 UPDATEs)',
        () => {
          merger.merge(ops);
        },
        { iterations: 500, warmup: 10 }
      );
      results.push(result);
    });

    it('benchmark: Merge mixed operations (1000 ops)', async () => {
      const ops: Operation[] = [];
      for (let i = 1; i <= 250; i++) {
        ops.push({ op: 'CREATE', id: i, type: 'View', props: {} });
        ops.push({ op: 'UPDATE', id: i, props: { style: { flex: 1 } } });
        ops.push({ op: 'UPDATE', id: i, props: { style: { padding: 10 } } });
        ops.push({ op: 'APPEND', id: i, parentId: 0, childId: i });
      }

      const result = await benchmark(
        'OperationMerger.merge (1000 mixed)',
        () => {
          merger.merge(ops);
        },
        { iterations: 100, warmup: 5 }
      );
      results.push(result);
    });

    it('benchmark: No merging (all different IDs)', async () => {
      const ops: Operation[] = [];
      for (let i = 1; i <= 100; i++) {
        ops.push({ op: 'UPDATE', id: i, props: { value: i } });
      }

      const result = await benchmark(
        'OperationMerger.merge (no merging possible)',
        () => {
          merger.merge(ops);
        },
        { iterations: 500, warmup: 10 }
      );
      results.push(result);
    });
  });

  describe('ThrottledScheduler', () => {
    let scheduler: ThrottledScheduler;

    beforeEach(() => {
      scheduler = new ThrottledScheduler(
        () => {
          // Callback for flush
        },
        { maxBatchSize: 1000, enableMerge: false }
      );
    });

    afterEach(() => {
      scheduler.dispose();
    });

    it('benchmark: Enqueue single operation', async () => {
      const result = await benchmark(
        'ThrottledScheduler.enqueue (single)',
        () => {
          scheduler.enqueue({ op: 'CREATE', id: 1, type: 'View', props: {} });
          scheduler.flush();
        },
        { iterations: 1000, warmup: 10 }
      );
      results.push(result);
    });

    it('benchmark: Enqueue 10 operations', async () => {
      const ops: Operation[] = [];
      for (let i = 1; i <= 10; i++) {
        ops.push({ op: 'CREATE', id: i, type: 'View', props: {} });
      }

      const result = await benchmark(
        'ThrottledScheduler.enqueueAll (10)',
        () => {
          scheduler.enqueueAll(ops);
          scheduler.flush();
        },
        { iterations: 500, warmup: 10 }
      );
      results.push(result);
    });

    it('benchmark: Enqueue 100 operations', async () => {
      const ops: Operation[] = [];
      for (let i = 1; i <= 100; i++) {
        ops.push({ op: 'CREATE', id: i, type: 'View', props: {} });
      }

      const result = await benchmark(
        'ThrottledScheduler.enqueueAll (100)',
        () => {
          scheduler.enqueueAll(ops);
          scheduler.flush();
        },
        { iterations: 200, warmup: 5 }
      );
      results.push(result);
    });

    it('benchmark: Enqueue with merge enabled', async () => {
      scheduler.dispose();
      scheduler = new ThrottledScheduler(
        () => {
          // Callback for flush
        },
        { maxBatchSize: 1000, enableMerge: true }
      );

      const ops: Operation[] = [];
      for (let i = 0; i < 100; i++) {
        ops.push({ op: 'UPDATE', id: 1, props: { [`prop${i}`]: i } });
      }

      const result = await benchmark(
        'ThrottledScheduler.enqueueAll (100 with merge)',
        () => {
          scheduler.enqueueAll(ops);
          scheduler.flush();
        },
        { iterations: 200, warmup: 5 }
      );
      results.push(result);
    });
  });

  describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor;

    beforeEach(() => {
      monitor = new PerformanceMonitor();
    });

    it('benchmark: Record single batch', async () => {
      const batch: OperationBatch = {
        version: 1,
        batchId: 1,
        operations: [
          { op: 'CREATE', id: 1, type: 'View', props: {} },
          { op: 'UPDATE', id: 1, props: { style: {} } },
        ],
      };

      const result = await benchmark(
        'PerformanceMonitor.recordBatch (single)',
        () => {
          monitor.recordBatch(batch);
        },
        { iterations: 1000, warmup: 10 }
      );
      results.push(result);
    });

    it('benchmark: Record batch with 100 operations', async () => {
      const operations: Operation[] = [];
      for (let i = 1; i <= 100; i++) {
        operations.push({ op: 'CREATE', id: i, type: 'View', props: {} });
      }

      const batch = {
        version: 1,
        batchId: 1,
        operations,
      };

      const result = await benchmark(
        'PerformanceMonitor.recordBatch (100 ops)',
        () => {
          monitor.recordBatch(batch);
        },
        { iterations: 500, warmup: 10 }
      );
      results.push(result);
    });

    it('benchmark: Get metrics', async () => {
      // Setup: record some batches
      for (let i = 1; i <= 10; i++) {
        monitor.recordBatch({
          version: 1,
          batchId: i,
          operations: [
            { op: 'CREATE', id: i, type: 'View', props: {} },
            { op: 'UPDATE', id: i, props: {} },
          ],
        });
      }

      const result = await benchmark(
        'PerformanceMonitor.getMetrics',
        () => {
          monitor.getMetrics();
        },
        { iterations: 10000, warmup: 100 }
      );
      results.push(result);
    });
  });

  describe('Throughput Tests', () => {
    it('benchmark: Operation processing throughput', async () => {
      const monitor = new PerformanceMonitor();

      const scheduler = new ThrottledScheduler(
        (batch) => {
          monitor.recordBatch(batch);
        },
        { maxBatchSize: 1000, enableMerge: true }
      );

      // Generate 10,000 operations
      const ops: Operation[] = [];
      for (let i = 1; i <= 10000; i++) {
        ops.push({ op: 'CREATE', id: i, type: 'View', props: {} });
      }

      const result = await benchmark(
        'Full pipeline (10k operations)',
        () => {
          scheduler.enqueueAll(ops);
          scheduler.flush();
        },
        { iterations: 10, warmup: 2 }
      );

      // Calculate throughput
      const opsPerSecond = 10000 / (result.mean / 1000);
      console.log(`\nThroughput: ${opsPerSecond.toFixed(0)} ops/sec`);

      results.push(result);
      scheduler.dispose();
    });
  });
});
