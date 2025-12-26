/**
 * Memory Leak Tests - Using Manual Operation Batches
 *
 * This version bypasses the Reconciler and manually constructs operation batches
 * to directly test the memory leak issue in CallbackRegistry.
 */

import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { Engine } from '../../engine';
import { createMockJSEngineProvider } from '../test-utils';
import { expectNoMemoryLeak } from './helpers/assertions';
import { MockComponents } from './helpers/mock-components';
import { wait } from './helpers/test-utils';

describe('E2E Memory Leak: Manual Operations', () => {
  let engine: Engine;

  beforeEach(() => {
    engine = new Engine({
      quickjs: createMockJSEngineProvider(),
      debug: false,
    });
    engine.register(MockComponents);
  });

  afterEach(async () => {
    await engine.destroy();
  });

  it('should track initial callback registry size', async () => {
    const receiver = engine.createReceiver(() => {});

    // Create a node with function props manually
    const guestCode = `
      globalThis.__sendToHost({
        version: 1,
        batchId: 1,
        operations: [
          {
            op: 'CREATE',
            id: 1,
            type: 'TouchableOpacity',
            props: {
              testID: 'button',
              onPress: () => {
                globalThis.__sendEventToHost('CLICK');
              }
            }
          },
          { op: 'APPEND', parentId: 0, childId: 1 }
        ]
      });
    `;

    await engine.loadBundle(guestCode);
    await wait(100);

    const registrySize = engine.guestCallbackCount;
    console.log('Initial registry size:', registrySize);

    expect(registrySize).toBeGreaterThan(0);
    expect(receiver.nodeCount).toBe(1);
  });

  it('should leak functions on repeated updates without cleanup', async () => {
    const _receiver = engine.createReceiver(() => {});

    // Initial render
    const guestCode = `
      let batchId = 1;

      // Initial create
      globalThis.__sendToHost({
        version: 1,
        batchId: batchId++,
        operations: [
          {
            op: 'CREATE',
            id: 1,
            type: 'TouchableOpacity',
            props: {
              testID: 'button',
              onPress: () => {
                globalThis.__sendEventToHost('CLICK_0');
              }
            }
          },
          { op: 'APPEND', parentId: 0, childId: 1 }
        ]
      });

      // Expose update function
      globalThis.__updateButton = (count) => {
        globalThis.__sendToHost({
          version: 1,
          batchId: batchId++,
          operations: [
            {
              op: 'UPDATE',
              id: 1,
              props: {
                onPress: () => {
                  globalThis.__sendEventToHost('CLICK_' + count);
                }
              }
            }
          ]
        });
      };
    `;

    await engine.loadBundle(guestCode);
    await wait(100);

    const initialSize = engine.guestCallbackCount;
    console.log('\n=== Memory Leak Test ===');
    console.log('Initial registry size:', initialSize);

    // Trigger 50 updates (each creates a new onPress function)
    for (let i = 1; i <= 50; i++) {
      await engine.context?.getGlobal('__updateButton')?.(i);
      await wait(5);

      if (i % 10 === 0) {
        const currentSize = engine.guestCallbackCount;
        console.log(
          `After ${i} updates: registry size = ${currentSize} (+${currentSize - initialSize})`
        );
      }
    }

    const finalSize = engine.guestCallbackCount;
    const leaked = finalSize - initialSize;

    console.log('Final registry size:', finalSize);
    console.log('Leaked functions:', leaked);
    console.log('========================\n');

    // ✅ After fix: Each update releases old functions before adding new ones
    // Expected: leaked < 5 (only current functions + small tolerance)
    expectNoMemoryLeak(initialSize, finalSize, 5);
  });

  it('should leak functions with multiple props updates', async () => {
    const _receiver = engine.createReceiver(() => {});

    const guestCode = `
      let batchId = 1;

      // Initial create with 3 function props
      globalThis.__sendToHost({
        version: 1,
        batchId: batchId++,
        operations: [
          {
            op: 'CREATE',
            id: 1,
            type: 'TouchableOpacity',
            props: {
              testID: 'button',
              onPress: () => globalThis.__sendEventToHost('PRESS_0'),
              onPressIn: () => globalThis.__sendEventToHost('PRESS_IN_0'),
              onPressOut: () => globalThis.__sendEventToHost('PRESS_OUT_0')
            }
          },
          { op: 'APPEND', parentId: 0, childId: 1 }
        ]
      });

      globalThis.__updateButton = (count) => {
        globalThis.__sendToHost({
          version: 1,
          batchId: batchId++,
          operations: [
            {
              op: 'UPDATE',
              id: 1,
              props: {
                onPress: () => globalThis.__sendEventToHost('PRESS_' + count),
                onPressIn: () => globalThis.__sendEventToHost('PRESS_IN_' + count),
                onPressOut: () => globalThis.__sendEventToHost('PRESS_OUT_' + count)
              }
            }
          ]
        });
      };
    `;

    await engine.loadBundle(guestCode);
    await wait(100);

    const initialSize = engine.guestCallbackCount;
    console.log('\n=== Multiple Props Leak Test ===');
    console.log('Initial registry size:', initialSize);
    console.log('Initial props: 3 functions (onPress, onPressIn, onPressOut)');

    // Trigger 30 updates
    for (let i = 1; i <= 30; i++) {
      await engine.context?.getGlobal('__updateButton')?.(i);
      await wait(5);

      if (i % 10 === 0) {
        const currentSize = engine.guestCallbackCount;
        console.log(
          `After ${i} updates: registry size = ${currentSize} (+${currentSize - initialSize})`
        );
      }
    }

    const finalSize = engine.guestCallbackCount;
    const leaked = finalSize - initialSize;

    console.log('Final registry size:', finalSize);
    console.log('Leaked functions:', leaked);
    console.log('Expected: No leak (functions released on update)');
    console.log('================================\n');

    // ✅ After fix: Each update releases old functions, leaked < 10
    expectNoMemoryLeak(initialSize, finalSize, 10);
  });

  it('should clean up functions on DELETE operation', async () => {
    const _receiver = engine.createReceiver(() => {});

    const guestCode = `
      let batchId = 1;

      // Create node with function
      globalThis.__sendToHost({
        version: 1,
        batchId: batchId++,
        operations: [
          {
            op: 'CREATE',
            id: 1,
            type: 'TouchableOpacity',
            props: {
              onPress: () => globalThis.__sendEventToHost('CLICK')
            }
          },
          { op: 'APPEND', parentId: 0, childId: 1 }
        ]
      });

      globalThis.__deleteNode = () => {
        globalThis.__sendToHost({
          version: 1,
          batchId: batchId++,
          operations: [
            { op: 'REMOVE', parentId: 0, childId: 1 },
            { op: 'DELETE', id: 1 }
          ]
        });
      };
    `;

    await engine.loadBundle(guestCode);
    await wait(100);

    const initialSize = engine.guestCallbackCount;
    console.log('\n=== DELETE Cleanup Test ===');
    console.log('Registry size before delete:', initialSize);
    expect(initialSize).toBeGreaterThan(0);

    // Delete the node
    await engine.context?.getGlobal('__deleteNode')?.();
    await wait(100);

    const finalSize = engine.guestCallbackCount;
    console.log('Registry size after delete:', finalSize);
    console.log('===========================\n');

    // ✅ This should work: Receiver.deleteNodeRecursive() calls callbackRegistry.release()
    // After deleting the node, the function should be cleaned up
    expect(finalSize).toBe(0);
  });

  it('should demonstrate the memory leak growth rate', async () => {
    const _receiver = engine.createReceiver(() => {});

    const guestCode = `
      let batchId = 1;
      let nodeId = 1;

      // Create 5 buttons
      for (let i = 0; i < 5; i++) {
        globalThis.__sendToHost({
          version: 1,
          batchId: batchId++,
          operations: [
            {
              op: 'CREATE',
              id: nodeId,
              type: 'TouchableOpacity',
              props: {
                testID: 'button-' + nodeId,
                onPress: () => globalThis.__sendEventToHost('CLICK_' + nodeId)
              }
            },
            { op: 'APPEND', parentId: 0, childId: nodeId }
          ]
        });
        nodeId++;
      }

      // Update all buttons
      globalThis.__updateAll = (iteration) => {
        for (let id = 1; id <= 5; id++) {
          globalThis.__sendToHost({
            version: 1,
            batchId: batchId++,
            operations: [
              {
                op: 'UPDATE',
                id: id,
                props: {
                  onPress: () => globalThis.__sendEventToHost('CLICK_' + id + '_' + iteration)
                }
              }
            ]
          });
        }
      };
    `;

    await engine.loadBundle(guestCode);
    await wait(100);

    console.log('\n=== Leak Growth Rate Analysis ===');
    const sizes: number[] = [];
    const initialSize = engine.guestCallbackCount;
    sizes.push(initialSize);
    console.log('Initial (5 buttons): ', initialSize);

    // Run 20 update cycles
    for (let i = 1; i <= 20; i++) {
      await engine.context?.getGlobal('__updateAll')?.(i);
      await wait(5);

      const currentSize = engine.guestCallbackCount;
      sizes.push(currentSize);

      if (i % 5 === 0) {
        const leaked = currentSize - initialSize;
        const leakRate = leaked / i;
        console.log(
          `After ${i} cycles: ${currentSize} (+${leaked}, rate: ${leakRate.toFixed(1)}/cycle)`
        );
      }
    }

    const finalSize = sizes[sizes.length - 1]!;
    const totalLeaked = finalSize - initialSize;
    const avgLeakRate = totalLeaked / 20;

    console.log('\nSummary:');
    console.log('  Initial size:', initialSize);
    console.log('  Final size:', finalSize);
    console.log('  Total leaked:', totalLeaked);
    console.log('  Average leak rate:', avgLeakRate.toFixed(1), 'functions/cycle');
    console.log('  Expected: No leak (functions released on update)');
    console.log('=================================\n');

    // ✅ Verify no memory leak
    expectNoMemoryLeak(initialSize, finalSize, 10);
  });
});
