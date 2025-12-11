import { describe, it, expect, mock } from 'bun:test';
import { Receiver } from './receiver';
import { createRegistry } from './registry';
import React from 'react';

describe('Receiver render metrics - multi root & text nodes', () => {
  it('reports metrics for multi-root including text node', () => {
    const registry = createRegistry();
    const onMetric = mock();
    const Dummy = (props: any) => React.createElement('div', props, props.children);
    registry.register('View', Dummy as any);
    const receiver = new Receiver(registry, () => {}, () => {}, { onMetric });

    const ops: any[] = [];
    // text node id: 100
    ops.push({ op: 'CREATE', id: 1, type: 'View', props: {} });
    ops.push({ op: 'CREATE', id: 2, type: 'View', props: {} });
    ops.push({ op: 'CREATE', id: 100, type: '__TEXT__', props: {} });
    ops.push({ op: 'TEXT', id: 100, text: 'Hello' });
    // append 3 roots
    ops.push({ op: 'APPEND', parentId: 0, childId: 1 });
    ops.push({ op: 'APPEND', parentId: 0, childId: 2 });
    ops.push({ op: 'APPEND', parentId: 0, childId: 100 });

    receiver.applyBatch({ operations: ops } as any);
    const el = receiver.render();
    expect(el).not.toBeNull();

    const names = onMetric.mock.calls.map(c => c[0]);
    expect(names).toContain('receiver.render');
  });
});
