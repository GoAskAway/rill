import { describe, expect, it } from 'bun:test';

import { Engine } from './engine';
import { WorkerJSEngineProvider } from './WorkerJSEngineProvider';

function createWorker() {
  const url = new URL('./engine.worker.ts', import.meta.url);
  // @ts-expect-error
  return new Worker(url, { type: 'module' });
}

describe('WorkerJSEngineProvider JSX shim e2e', () => {
  it.skipIf(typeof Worker === 'undefined')(
    'should evaluate JSX with pre-injected React/JSXRuntime shims',
    async () => {
      const provider = new WorkerJSEngineProvider(createWorker, { timeout: 200 });
      const engine = new Engine({ quickjs: provider, debug: false });

      const code = `
      const el = ReactJSXRuntime.jsx('View', { id: 'ok' });
      // Simulate rill/sdk JSX compiled output shape
      // Not asserting host render here; just ensuring eval passes
    `;

      await engine.loadBundle(code);
      expect(engine.isLoaded).toBe(true);
      engine.destroy();
    }
  );
});
