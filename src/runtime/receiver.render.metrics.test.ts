import { describe, expect, it, mock } from 'bun:test';
import React from 'react';
import { Receiver } from './receiver';
import { createRegistry } from './registry';

function makeTree(depth: number, breadth: number) {
  let id = 1;
  const ops: any[] = [];
  function addNode(level: number, parentId: number | 0) {
    const cur = id++;
    ops.push({ op: 'CREATE', id: cur, type: 'View', props: {} });
    if (parentId === 0) ops.push({ op: 'APPEND', parentId: 0, childId: cur });
    else ops.push({ op: 'APPEND', parentId, childId: cur });
    if (level < depth) {
      for (let i = 0; i < breadth; i++) addNode(level + 1, cur);
    }
  }
  addNode(1, 0);
  return { operations: ops } as any;
}

describe('Receiver render metrics - complex tree', () => {
  it('reports render metrics with nodeCount for deep tree', () => {
    const registry = createRegistry();
    // register a minimal component to render
    const Dummy = (props: any) => React.createElement('div', props, props.children);
    registry.register('View', Dummy as any);
    const onMetric = mock();
    const receiver = new Receiver(
      registry,
      () => {},
      () => {},
      { onMetric }
    );

    const batch = makeTree(3, 3); // 1 + 3 + 9 + 27 nodes total created, but appended subset; depends on ops
    receiver.applyBatch(batch);
    receiver.render();

    const names = onMetric.mock.calls.map((c) => c[0]);
    expect(names).toContain('receiver.render');

    const last = onMetric.mock.calls.reverse().find((c) => c[0] === 'receiver.render');
    const extra = last?.[2] as any;
    expect(typeof extra.nodeCount).toBe('number');
    expect(extra.nodeCount).toBeGreaterThan(0);
  });
});
