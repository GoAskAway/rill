import { describe, it, expect } from 'bun:test';

import { Engine } from './engine';
import { WorkerJSEngineProvider } from './WorkerJSEngineProvider';

class SlowWorker {
  onmessage: ((ev: MessageEvent<any>) => void) | null = null;
  postMessage(msg: any){
    if (msg.type === 'init') {
      // Respond to init immediately
      setTimeout(() => {
        this.onmessage && this.onmessage({ data: { type: 'result', id: msg.id, result: null } } as any);
      }, 0);
    } else if (msg.type === 'eval') {
      // Simulate a long-running eval inside worker (non-blocking for main thread)
      setTimeout(() => {
        this.onmessage && this.onmessage({ data: { type: 'result', id: msg.id, result: null } } as any);
      }, 100);
    }
  }
  terminate(){}
}

function createSlowWorker(){ return new SlowWorker() as unknown as Worker; }


describe('Worker isolation (simulated) - main thread remains responsive', () => {
  it('main thread timers tick while worker eval is in-flight', async () => {
    const provider = new WorkerJSEngineProvider(createSlowWorker);
    const engine = new Engine({ quickjs: provider, debug: false });

    let ticked = false;
    setTimeout(() => { ticked = true; }, 10);

    // Start loadBundle but don't await it immediately
    const loadPromise = engine.loadBundle('/* code */');

    // Wait for the timer to tick (give it 20ms to be safe)
    await new Promise(resolve => setTimeout(resolve, 20));

    // The slow worker responds after 100ms; our 10ms timer should have fired by now
    expect(ticked).toBe(true);

    // Now wait for loadBundle to complete
    await loadPromise;
    engine.destroy();
  });
});
