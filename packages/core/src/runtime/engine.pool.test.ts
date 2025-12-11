import { describe, it, expect, afterEach } from 'bun:test';
import { Engine } from './engine';
import { PooledEngine } from './PooledEngine';
import { WorkerPool, createWorkerPool, getGlobalWorkerPool, disposeGlobalWorkerPool } from './WorkerPool';

// Mock Worker class for pool testing
class MockWorker {
  onmessage: ((ev: MessageEvent<any>) => void) | null = null;
  onerror: ((ev: ErrorEvent) => void) | null = null;
  private listeners: Map<string, Set<(ev: any) => void>> = new Map();

  postMessage(msg: any) {
    queueMicrotask(() => {
      if (msg.type === 'init') {
        this.dispatchMessage({ type: 'result', id: msg.id, result: 'ready' });
      } else if (msg.type === 'eval') {
        this.dispatchMessage({
          type: 'result',
          id: msg.id,
          result: { ok: true, data: undefined },
        });
      } else {
        this.dispatchMessage({ type: 'result', id: msg.id, result: null });
      }
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

describe('Engine (Standalone)', () => {
  it('should create engine without pool', () => {
    const engine = new Engine({ sandbox: 'none' });
    expect(engine).toBeDefined();
    engine.destroy();
  });

  it('should auto-detect provider when no sandbox specified', () => {
    const engine = new Engine({});
    expect(engine).toBeDefined();
    engine.destroy();
  });

  it('should support provider option', () => {
    const mockProvider = {
      createRuntime: () => ({
        createContext: () => ({
          eval: () => {},
          setGlobal: () => {},
          getGlobal: () => undefined,
          dispose: () => {},
        }),
        dispose: () => {},
      }),
    };

    const engine = new Engine({ provider: mockProvider });
    expect(engine).toBeDefined();
    engine.destroy();
  });
});

describe('PooledEngine (Pooled)', () => {
  let pool: WorkerPool;

  afterEach(() => {
    pool?.dispose();
    disposeGlobalWorkerPool();
  });

  it('should create with custom pool', () => {
    pool = new WorkerPool({
      createWorker: () => new MockWorker() as unknown as Worker,
    });

    const engine = new PooledEngine({ pool });
    expect(engine).toBeDefined();
    expect(engine.getPool()).toBe(pool);
    engine.destroy();
  });

  it('should share pool across multiple engines', () => {
    pool = new WorkerPool({
      createWorker: () => new MockWorker() as unknown as Worker,
    });

    const engine1 = new PooledEngine({ pool });
    const engine2 = new PooledEngine({ pool });

    expect(engine1.getPool()).toBe(engine2.getPool());

    engine1.destroy();
    engine2.destroy();
  });
});

describe('WorkerPool Factory Functions', () => {
  afterEach(() => {
    disposeGlobalWorkerPool();
  });

  it('createWorkerPool should create pool with defaults', () => {
    const pool = createWorkerPool({
      createWorker: () => ({ terminate: () => {} } as unknown as Worker),
    });
    expect(pool).toBeDefined();
    expect(pool.getHealth().activeWorkers).toBe(0);
    pool.dispose();
  });

  it('getGlobalWorkerPool should return singleton', () => {
    const pool1 = getGlobalWorkerPool({
      createWorker: () => ({ terminate: () => {} } as unknown as Worker),
    });
    const pool2 = getGlobalWorkerPool();

    expect(pool1).toBe(pool2);
  });

  it('disposeGlobalWorkerPool should reset singleton', () => {
    const pool1 = getGlobalWorkerPool({
      createWorker: () => ({ terminate: () => {} } as unknown as Worker),
    });
    disposeGlobalWorkerPool();
    const pool2 = getGlobalWorkerPool({
      createWorker: () => ({ terminate: () => {} } as unknown as Worker),
    });

    expect(pool1).not.toBe(pool2);
  });
});

describe('Engine vs PooledEngine Interface', () => {
  it('both should have same core methods', () => {
    const coreMethods = [
      'register',
      'loadBundle',
      'on',
      'sendEvent',
      'updateConfig',
      'createReceiver',
      'getReceiver',
      'getRegistry',
      'getHealth',
      'destroy',
    ];

    // Check Engine
    for (const method of coreMethods) {
      expect(typeof Engine.prototype[method as keyof Engine]).toBe('function');
    }

    // Check PooledEngine
    for (const method of coreMethods) {
      expect(typeof PooledEngine.prototype[method as keyof PooledEngine]).toBe('function');
    }
  });
});
