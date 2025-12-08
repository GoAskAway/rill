/**
 * Receiver Performance Benchmarks
 *
 * Tests Receiver operations:
 * - Batch processing performance
 * - Rendering performance
 * - Node tree operations
 * - Update performance
 */

import { describe, it, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { ComponentRegistry } from '../runtime/registry';
import { Receiver } from '../runtime/receiver';
import { benchmark } from './utils/benchmark';
import { measureMemory, formatMemoryMeasurement } from './utils/memory';
import type { BenchmarkResult } from './utils/benchmark';
import type { Operation, OperationBatch } from '../types';

// Mock components
const MockView: React.FC<{ children?: React.ReactNode }> = ({ children }) =>
  React.createElement('mock-view', null, children);

const MockText: React.FC<{ children?: React.ReactNode }> = ({ children }) =>
  React.createElement('mock-text', null, children);

// Helper to create operation batch
function createBatch(operations: Operation[]): OperationBatch {
  return {
    version: 1,
    batchId: Math.floor(Math.random() * 10000),
    operations,
  };
}

describe('Receiver Benchmarks', () => {
  const results: BenchmarkResult[] = [];
  let registry: ComponentRegistry;
  let receiver: Receiver;

  beforeEach(() => {
    registry = new ComponentRegistry();
    registry.registerAll({
      View: MockView,
      Text: MockText,
    });

    receiver = new Receiver(
      registry,
      () => {},
      () => {}
    );
  });

  afterEach(() => {
    receiver.clear();
  });

  afterEach(() => {
    if (results.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('RECEIVER BENCHMARK RESULTS');
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

  it('benchmark: Apply single CREATE operation', async () => {
    const operations: Operation[] = [
      { op: 'CREATE', id: 1, type: 'View', props: {} },
      { op: 'APPEND', id: 1, parentId: 0, childId: 1 },
    ];

    const result = await benchmark(
      'Receiver.applyBatch (1 node)',
      () => {
        receiver.applyBatch(createBatch(operations));
        receiver.clear();
      },
      { iterations: 1000, warmup: 10 }
    );
    results.push(result);
  });

  it('benchmark: Apply 10 CREATE operations', async () => {
    const operations: Operation[] = [];
    for (let i = 1; i <= 10; i++) {
      operations.push({ op: 'CREATE', id: i, type: 'View', props: {} });
    }
    for (let i = 2; i <= 10; i++) {
      operations.push({ op: 'APPEND', id: i, parentId: 1, childId: i });
    }
    operations.push({ op: 'APPEND', id: 1, parentId: 0, childId: 1 });

    const result = await benchmark(
      'Receiver.applyBatch (10 nodes)',
      () => {
        receiver.applyBatch(createBatch(operations));
        receiver.clear();
      },
      { iterations: 500, warmup: 10 }
    );
    results.push(result);
  });

  it('benchmark: Apply 100 CREATE operations', async () => {
    const operations: Operation[] = [];
    for (let i = 1; i <= 100; i++) {
      operations.push({ op: 'CREATE', id: i, type: 'View', props: {} });
    }
    for (let i = 2; i <= 100; i++) {
      operations.push({ op: 'APPEND', id: i, parentId: 1, childId: i });
    }
    operations.push({ op: 'APPEND', id: 1, parentId: 0, childId: 1 });

    const result = await benchmark(
      'Receiver.applyBatch (100 nodes)',
      () => {
        receiver.applyBatch(createBatch(operations));
        receiver.clear();
      },
      { iterations: 100, warmup: 5 }
    );
    results.push(result);
  });

  it('benchmark: Apply 1000 CREATE operations', async () => {
    const operations: Operation[] = [];
    for (let i = 1; i <= 1000; i++) {
      operations.push({ op: 'CREATE', id: i, type: 'View', props: {} });
    }
    for (let i = 2; i <= 1000; i++) {
      operations.push({ op: 'APPEND', id: i, parentId: 1, childId: i });
    }
    operations.push({ op: 'APPEND', id: 1, parentId: 0, childId: 1 });

    const result = await benchmark(
      'Receiver.applyBatch (1000 nodes)',
      () => {
        receiver.applyBatch(createBatch(operations));
        receiver.clear();
      },
      { iterations: 10, warmup: 2 }
    );
    results.push(result);
  });

  it('benchmark: UPDATE operations', async () => {
    // Setup: create 100 nodes
    const setupOps: Operation[] = [];
    for (let i = 1; i <= 100; i++) {
      setupOps.push({ op: 'CREATE', id: i, type: 'View', props: {} });
    }
    for (let i = 2; i <= 100; i++) {
      setupOps.push({ op: 'APPEND', id: i, parentId: 1, childId: i });
    }
    setupOps.push({ op: 'APPEND', id: 1, parentId: 0, childId: 1 });
    receiver.applyBatch(createBatch(setupOps));

    // Benchmark: update all nodes
    const updateOps: Operation[] = [];
    for (let i = 1; i <= 100; i++) {
      updateOps.push({ op: 'UPDATE', id: i, props: { style: { flex: i } } });
    }

    const result = await benchmark(
      'Receiver.applyBatch (100 UPDATEs)',
      () => {
        receiver.applyBatch(createBatch(updateOps));
      },
      { iterations: 100, warmup: 5 }
    );
    results.push(result);
  });

  it('benchmark: DELETE operations', async () => {
    const result = await benchmark(
      'Receiver.applyBatch (100 DELETEs)',
      () => {
        // Setup: create 100 nodes
        const setupOps: Operation[] = [];
        for (let i = 1; i <= 100; i++) {
          setupOps.push({ op: 'CREATE', id: i, type: 'View', props: {} });
        }
        for (let i = 2; i <= 100; i++) {
          setupOps.push({ op: 'APPEND', id: i, parentId: 1, childId: i });
        }
        setupOps.push({ op: 'APPEND', id: 1, parentId: 0, childId: 1 });
        receiver.applyBatch(createBatch(setupOps));

        // Delete all nodes
        const deleteOps: Operation[] = [];
        for (let i = 100; i >= 1; i--) {
          if (i > 1) {
            deleteOps.push({ op: 'REMOVE', id: i, parentId: 1, childId: i });
          }
          deleteOps.push({ op: 'DELETE', id: i });
        }
        receiver.applyBatch(createBatch(deleteOps));
      },
      { iterations: 50, warmup: 3 }
    );
    results.push(result);
  });

  it('benchmark: Render tree (10 nodes)', async () => {
    const operations: Operation[] = [];
    for (let i = 1; i <= 10; i++) {
      operations.push({ op: 'CREATE', id: i, type: 'View', props: {} });
    }
    for (let i = 2; i <= 10; i++) {
      operations.push({ op: 'APPEND', id: i, parentId: 1, childId: i });
    }
    operations.push({ op: 'APPEND', id: 1, parentId: 0, childId: 1 });
    receiver.applyBatch(createBatch(operations));

    const result = await benchmark(
      'Receiver.render (10 nodes)',
      () => {
        receiver.render();
      },
      { iterations: 1000, warmup: 10 }
    );
    results.push(result);
  });

  it('benchmark: Render tree (100 nodes)', async () => {
    const operations: Operation[] = [];
    for (let i = 1; i <= 100; i++) {
      operations.push({ op: 'CREATE', id: i, type: 'View', props: {} });
    }
    for (let i = 2; i <= 100; i++) {
      operations.push({ op: 'APPEND', id: i, parentId: 1, childId: i });
    }
    operations.push({ op: 'APPEND', id: 1, parentId: 0, childId: 1 });
    receiver.applyBatch(createBatch(operations));

    const result = await benchmark(
      'Receiver.render (100 nodes)',
      () => {
        receiver.render();
      },
      { iterations: 500, warmup: 10 }
    );
    results.push(result);
  });

  it('memory: Create 1000 nodes', async () => {
    const operations: Operation[] = [];
    for (let i = 1; i <= 1000; i++) {
      operations.push({ op: 'CREATE', id: i, type: 'View', props: {} });
    }
    for (let i = 2; i <= 1000; i++) {
      operations.push({ op: 'APPEND', id: i, parentId: 1, childId: i });
    }
    operations.push({ op: 'APPEND', id: 1, parentId: 0, childId: 1 });

    const measurement = await measureMemory(() => {
      receiver.applyBatch(createBatch(operations));
    });

    console.log('\n' + formatMemoryMeasurement(measurement));
  });
});
