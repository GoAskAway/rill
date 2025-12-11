import { describe, it, expect } from 'bun:test';

import { Engine } from './engine';
import { WorkerJSEngineProvider } from './WorkerJSEngineProvider';

function createWorker(){
  const url = new URL('./engine.worker.ts', import.meta.url);
  // @ts-ignore
  return new Worker(url, { type: 'module' });
}

describe('WorkerJSEngineProvider JSX complex templates e2e', () => {
  it.skipIf(typeof Worker === 'undefined')('should evaluate nested/jsxs with children arrays and deep props', async () => {
    const provider = new WorkerJSEngineProvider(createWorker, { timeout: 500 });
    const engine = new Engine({ quickjs: provider, debug: false });

    // Simulate typical compiled JSX output using ReactJSXRuntime.jsxs / .jsx
    const code = `
      const deep = ReactJSXRuntime.jsxs('View', {
        style: { flex: 1, padding: 8, nested: { a: 1, b: [1,2,3] } },
        id: 'root',
        children: [
          ReactJSXRuntime.jsx('Text', { key: 't1', children: 'hello' }),
          ReactJSXRuntime.jsxs('View', {
            key: 'v1',
            style: { gap: 4 },
            children: [
              ReactJSXRuntime.jsx('Text', { key: 't2', children: 'world' }),
              ReactJSXRuntime.jsxs('View', {
                key: 'v2',
                data: { list: [{ id: 1 }, { id: 2 }], flags: [true, false] },
                children: [
                  ReactJSXRuntime.jsx('Text', { key: 't3', children: 'nested' }),
                  ReactJSXRuntime.jsx('Text', { key: 't4', children: String(42) })
                ]
              })
            ]
          }),
          ReactJSXRuntime.jsx('Image', { key: 'img', source: { uri: 'http://example.com/a.png' } })
        ]
      });
    `;

    await engine.loadBundle(code);
    expect(engine.isLoaded).toBe(true);
    engine.destroy();
  });
});
