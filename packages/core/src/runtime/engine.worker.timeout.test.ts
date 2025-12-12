import { describe, expect, it } from 'bun:test';
import { Engine } from './engine';
import { WorkerJSEngineProvider } from './WorkerJSEngineProvider';

describe('WorkerJSEngineProvider', () => {
  it.skipIf(typeof Worker === 'undefined')('should interrupt long-running code', async () => {
    const createWorker = () =>
      new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module' });
    const provider = new WorkerJSEngineProvider(createWorker, { timeout: 100 });

    const engine = new Engine({
      quickjs: provider,
      debug: false,
      timeout: 100, // Pass timeout to the engine as well
    });

    let threw = false;
    try {
      await engine.loadBundle('for(;;){}');
    } catch (_e) {
      threw = true;
    }

    expect(threw).toBe(true);
    engine.destroy();
  });
});
