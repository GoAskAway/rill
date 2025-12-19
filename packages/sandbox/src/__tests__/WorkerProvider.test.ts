import { describe, expect, it } from 'bun:test';
import { WorkerProvider } from '../providers/WorkerProvider';

// Mock Worker implementation
class MockWorker {
  onmessage: ((ev: MessageEvent) => void) | null = null;
  messageQueue: any[] = [];

  postMessage(msg: any) {
    this.messageQueue.push(msg);

    // Process messages asynchronously
    queueMicrotask(() => {
      const message = msg;

      if (message.type === 'eval') {
        // Simulate successful eval
        this.respond(message.id, 'eval result');
      } else if (message.type === 'setGlobal') {
        this.respond(message.id, true);
      } else if (message.type === 'getGlobal') {
        this.respond(message.id, undefined);
      } else if (message.type === 'dispose') {
        this.respond(message.id, true);
      }
    });
  }

  private respond(id: string, result: unknown, error?: { name: string; message: string }) {
    if (this.onmessage) {
      this.onmessage({
        data: { id, result, error },
      } as MessageEvent);
    }
  }

  terminate() {
    this.onmessage = null;
  }
}

describe('WorkerProvider', () => {
  it('should create runtime successfully', async () => {
    const provider = new WorkerProvider(() => new MockWorker() as unknown as Worker);
    const runtime = await provider.createRuntime();

    expect(runtime).toBeDefined();
    expect(runtime.createContext).toBeDefined();
  });

  it('should create context successfully', async () => {
    const provider = new WorkerProvider(() => new MockWorker() as unknown as Worker);
    const runtime = await provider.createRuntime();
    const context = runtime.createContext();

    expect(context).toBeDefined();
    expect(context.eval).toBeDefined();
    expect((context as any).evalAsync).toBeDefined();
    expect(context.setGlobal).toBeDefined();
    expect(context.dispose).toBeDefined();
  });

  it('should throw error when using sync eval', async () => {
    const provider = new WorkerProvider(() => new MockWorker() as unknown as Worker);
    const runtime = await provider.createRuntime();
    const context = runtime.createContext();

    expect(() => context.eval('code')).toThrow('Use evalAsync');
  });

  it('should execute code via evalAsync', async () => {
    const provider = new WorkerProvider(() => new MockWorker() as unknown as Worker);
    const runtime = await provider.createRuntime();
    const context = runtime.createContext();

    const result = await (context as any).evalAsync?.('return 1 + 1');
    expect(result).toBe('eval result');
  });

  it('should handle errors in evalAsync', async () => {
    class ErrorWorker extends MockWorker {
      postMessage(msg: any) {
        queueMicrotask(() => {
          if (msg.type === 'eval') {
            this.onmessage?.({
              data: { id: msg.id, error: { name: 'Error', message: 'Eval failed' } },
            } as MessageEvent);
          }
        });
      }
    }

    const provider = new WorkerProvider(() => new ErrorWorker() as unknown as Worker);
    const runtime = await provider.createRuntime();
    const context = runtime.createContext();

    await expect((context as any).evalAsync?.('bad code')).rejects.toThrow('Eval failed');
  });

  it('should support setGlobal for serializable values', async () => {
    const trackingWorker = new MockWorker();
    const provider = new WorkerProvider(() => trackingWorker as unknown as Worker);
    const runtime = await provider.createRuntime();
    const context = runtime.createContext();

    // Should work for primitives
    context.setGlobal('test', 123);
    context.setGlobal('name', 'value');

    // Check that messages were sent
    expect(
      trackingWorker.messageQueue.some(
        (msg: any) => msg.type === 'setGlobal' && msg.name === 'test' && msg.value === 123
      )
    ).toBe(true);
  });

  it('should skip functions in setGlobal', async () => {
    const trackingWorker = new MockWorker();
    const provider = new WorkerProvider(() => trackingWorker as unknown as Worker);
    const runtime = await provider.createRuntime();
    const context = runtime.createContext();

    // Should skip functions
    context.setGlobal('func', () => {});

    // Should not have setGlobal message for function
    const funcMessages = trackingWorker.messageQueue.filter(
      (msg: any) => msg.type === 'setGlobal' && msg.name === 'func'
    );
    expect(funcMessages.length).toBe(0);
  });

  it('should skip objects containing functions in setGlobal', async () => {
    const trackingWorker = new MockWorker();
    const provider = new WorkerProvider(() => trackingWorker as unknown as Worker);
    const runtime = await provider.createRuntime();
    const context = runtime.createContext();

    // Should skip objects with functions
    context.setGlobal('console', { log: () => {} });

    const consoleMessages = trackingWorker.messageQueue.filter(
      (msg: any) => msg.type === 'setGlobal' && msg.name === 'console'
    );
    expect(consoleMessages.length).toBe(0);
  });

  it('should return cached value for getGlobal', async () => {
    const provider = new WorkerProvider(() => new MockWorker() as unknown as Worker);
    const runtime = await provider.createRuntime();
    const context = runtime.createContext();

    // Set a global first
    context.setGlobal('testVar', 42);

    // getGlobal should return from local cache
    const result = context.getGlobal('testVar');
    expect(result).toBe(42);
  });

  it('should support dispose', async () => {
    const provider = new WorkerProvider(() => new MockWorker() as unknown as Worker);
    const runtime = await provider.createRuntime();
    const context = runtime.createContext();

    context.dispose();
    // Should not throw
    expect(true).toBe(true);
  });

  it('should pass timeout option', async () => {
    const provider = new WorkerProvider(() => new MockWorker() as unknown as Worker, {
      timeout: 5000,
    });

    const runtime = await provider.createRuntime();
    expect(runtime).toBeDefined();
  });

  it('should handle runtime dispose', async () => {
    const mockWorker = new MockWorker();
    const provider = new WorkerProvider(() => mockWorker as unknown as Worker);
    const runtime = await provider.createRuntime();

    runtime.dispose?.();
    // Verify worker is terminated
    expect(mockWorker.onmessage).toBeNull();
  });
});
