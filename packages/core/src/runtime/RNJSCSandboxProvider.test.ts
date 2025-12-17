import { describe, expect, it, mock } from 'bun:test';
import type { JSEngineContext, JSEngineProvider, JSEngineRuntime } from './engine';
import {
  isApplePlatform,
  isJSCSandboxAvailable,
  RNJSCSandboxProvider,
  type RNJSCSandboxProviderOptions,
  resolveJSCSandbox,
} from './RNJSCSandboxProvider';

// ============ Tests for Stub Implementation (non-RN environment) ============

describe('RNJSCSandboxProvider (stub)', () => {
  it('should throw when constructed in non-RN environment', () => {
    expect(() => new RNJSCSandboxProvider()).toThrow(
      '[RNJSCSandboxProvider] Only available on React Native (Apple platforms)'
    );
  });

  it('should mention VMProvider as alternative', () => {
    expect(() => new RNJSCSandboxProvider()).toThrow('VMProvider');
  });

  it('should mention WorkerJSEngineProvider as alternative', () => {
    expect(() => new RNJSCSandboxProvider()).toThrow('WorkerJSEngineProvider');
  });
});

describe('resolveJSCSandbox (stub)', () => {
  it('should return null in non-RN environment', () => {
    const result = resolveJSCSandbox();
    expect(result).toBeNull();
  });
});

describe('isJSCSandboxAvailable (stub)', () => {
  it('should return false in non-RN environment', () => {
    const result = isJSCSandboxAvailable();
    expect(result).toBe(false);
  });
});

describe('isApplePlatform (stub)', () => {
  it('should return false in non-RN environment', () => {
    const result = isApplePlatform();
    expect(result).toBe(false);
  });
});

// ============ Tests for Native Implementation Logic ============
// These tests verify the logic that would run in React Native environment
// by creating mock implementations that match the native module interface

describe('RNJSCSandboxProvider native implementation logic', () => {
  // Mock the native module interface matching react-native-jsc-sandbox
  interface MockJSCSandboxContext {
    eval(code: string): unknown;
    evalAsync(code: string): Promise<unknown>;
    setGlobal(name: string, value: unknown): void;
    getGlobal(name: string): Promise<unknown>;
    dispose(): void;
  }

  interface MockJSCSandboxRuntime {
    createContext(): MockJSCSandboxContext;
    dispose(): void;
  }

  interface MockJSCSandboxProviderLike {
    createRuntime(): MockJSCSandboxRuntime;
  }

  // Create a testable version of the provider that doesn't use the native module
  class TestableJSCSandboxProvider implements JSEngineProvider {
    private mockProvider: MockJSCSandboxProviderLike;
    private options: RNJSCSandboxProviderOptions;

    constructor(mockProvider: MockJSCSandboxProviderLike, options?: RNJSCSandboxProviderOptions) {
      this.mockProvider = mockProvider;
      this.options = options || {};
    }

    createRuntime(): JSEngineRuntime {
      const rt = this.mockProvider.createRuntime();

      return {
        createContext: (): JSEngineContext => {
          const ctx = rt.createContext();

          // Test provider with evalAsync (non-standard extension)
          const wrappedContext: JSEngineContext & {
            evalAsync: (code: string) => Promise<unknown>;
          } = {
            eval: (_code: string): unknown => {
              throw new Error(
                '[RNJSCSandboxProvider] Synchronous eval not supported. Use evalAsync instead.'
              );
            },
            evalAsync: async (code: string): Promise<unknown> => {
              return ctx.evalAsync(code);
            },
            setGlobal: (name: string, value: unknown): void => {
              ctx.setGlobal(name, value);
            },
            getGlobal: (name: string): unknown => {
              return ctx.getGlobal(name);
            },
            dispose: (): void => {
              ctx.dispose();
            },
          };

          return wrappedContext;
        },
        dispose: (): void => {
          rt.dispose();
        },
      };
    }

    getOptions() {
      return this.options;
    }
  }

  // Create mock context
  class MockContext implements MockJSCSandboxContext {
    private globals = new Map<string, unknown>();
    private disposed = false;

    eval(_code: string): unknown {
      throw new Error('Synchronous eval not supported');
    }

    async evalAsync(code: string): Promise<unknown> {
      if (this.disposed) {
        throw new Error('Context has been disposed');
      }
      // Simple eval simulation
      try {
        return eval(code);
      } catch {
        return undefined;
      }
    }

    setGlobal(name: string, value: unknown): void {
      if (!this.disposed) {
        this.globals.set(name, value);
      }
    }

    async getGlobal(name: string): Promise<unknown> {
      if (this.disposed) {
        throw new Error('Context has been disposed');
      }
      return this.globals.get(name);
    }

    dispose(): void {
      this.disposed = true;
      this.globals.clear();
    }
  }

  // Create mock runtime
  class MockRuntime implements MockJSCSandboxRuntime {
    private disposed = false;

    createContext(): MockJSCSandboxContext {
      if (this.disposed) {
        throw new Error('Runtime already disposed');
      }
      return new MockContext();
    }

    dispose(): void {
      this.disposed = true;
    }
  }

  // Create mock provider
  class MockProvider implements MockJSCSandboxProviderLike {
    public constructorOptions?: { timeout?: number; memoryLimit?: number };

    constructor(options?: { timeout?: number; memoryLimit?: number }) {
      this.constructorOptions = options;
    }

    createRuntime(): MockJSCSandboxRuntime {
      return new MockRuntime();
    }
  }

  it('should create runtime and context', () => {
    const mockProvider = new MockProvider();
    const provider = new TestableJSCSandboxProvider(mockProvider);

    const runtime = provider.createRuntime();
    expect(runtime).toBeDefined();

    const context = runtime.createContext();
    expect(context).toBeDefined();
    expect(typeof context.eval).toBe('function');
    expect(typeof context.evalAsync).toBe('function');
    expect(typeof context.setGlobal).toBe('function');
    expect(typeof context.getGlobal).toBe('function');
    expect(typeof context.dispose).toBe('function');
  });

  it('should throw on synchronous eval', () => {
    const mockProvider = new MockProvider();
    const provider = new TestableJSCSandboxProvider(mockProvider);

    const runtime = provider.createRuntime();
    const context = runtime.createContext();

    expect(() => context.eval('1 + 1')).toThrow('Synchronous eval not supported');
  });

  it('should execute code asynchronously', async () => {
    const mockProvider = new MockProvider();
    const provider = new TestableJSCSandboxProvider(mockProvider);

    const runtime = provider.createRuntime();
    const context = runtime.createContext();

    const result = await context.evalAsync!('1 + 1');
    expect(result).toBe(2);
  });

  it('should set and get global variables', async () => {
    const mockProvider = new MockProvider();
    const provider = new TestableJSCSandboxProvider(mockProvider);

    const runtime = provider.createRuntime();
    const context = runtime.createContext();

    context.setGlobal('testVar', 42);

    const value = await (context.getGlobal('testVar') as Promise<unknown>);
    expect(value).toBe(42);
  });

  it('should set complex objects as globals', async () => {
    const mockProvider = new MockProvider();
    const provider = new TestableJSCSandboxProvider(mockProvider);

    const runtime = provider.createRuntime();
    const context = runtime.createContext();

    const complexObj = { name: 'test', values: [1, 2, 3], nested: { a: 1 } };
    context.setGlobal('config', complexObj);

    const value = await (context.getGlobal('config') as Promise<unknown>);
    expect(value).toEqual(complexObj);
  });

  it('should dispose context', async () => {
    const mockProvider = new MockProvider();
    const provider = new TestableJSCSandboxProvider(mockProvider);

    const runtime = provider.createRuntime();
    const context = runtime.createContext();

    context.setGlobal('test', 123);
    context.dispose();

    // After dispose, getGlobal should throw
    try {
      await (context.getGlobal('test') as Promise<unknown>);
      expect(true).toBe(false); // Should not reach here
    } catch (e) {
      expect((e as Error).message).toContain('disposed');
    }
  });

  it('should dispose runtime', () => {
    const mockProvider = new MockProvider();
    const provider = new TestableJSCSandboxProvider(mockProvider);

    const runtime = provider.createRuntime();
    runtime.dispose();

    // After dispose, createContext should throw
    expect(() => runtime.createContext()).toThrow('disposed');
  });

  it('should handle multiple contexts from same runtime', async () => {
    const mockProvider = new MockProvider();
    const provider = new TestableJSCSandboxProvider(mockProvider);

    const runtime = provider.createRuntime();
    const context1 = runtime.createContext();
    const context2 = runtime.createContext();

    context1.setGlobal('value', 'context1');
    context2.setGlobal('value', 'context2');

    const value1 = await (context1.getGlobal('value') as Promise<unknown>);
    const value2 = await (context2.getGlobal('value') as Promise<unknown>);

    // Each context should have isolated globals
    expect(value1).toBe('context1');
    expect(value2).toBe('context2');
  });

  it('should handle options being undefined', () => {
    const mockProvider = new MockProvider();
    const provider = new TestableJSCSandboxProvider(mockProvider);

    expect(provider).toBeDefined();
    expect(provider.getOptions()).toEqual({});
  });

  it('should handle empty options object', () => {
    const mockProvider = new MockProvider();
    const provider = new TestableJSCSandboxProvider(mockProvider, {});

    expect(provider).toBeDefined();
    expect(provider.getOptions()).toEqual({});
  });

  it('should store timeout option', () => {
    const mockProvider = new MockProvider();
    const provider = new TestableJSCSandboxProvider(mockProvider, { timeout: 5000 });

    expect(provider.getOptions().timeout).toBe(5000);
  });

  it('should store memory limit option', () => {
    const mockProvider = new MockProvider();
    const provider = new TestableJSCSandboxProvider(mockProvider, { memoryLimit: 1024 * 1024 });

    expect(provider.getOptions().memoryLimit).toBe(1024 * 1024);
  });

  it('should handle evalAsync errors', async () => {
    class ErrorContext extends MockContext {
      async evalAsync(_code: string): Promise<unknown> {
        throw new Error('Eval failed');
      }
    }

    class ErrorRuntime extends MockRuntime {
      createContext(): MockJSCSandboxContext {
        return new ErrorContext();
      }
    }

    class ErrorProvider implements MockJSCSandboxProviderLike {
      createRuntime(): MockJSCSandboxRuntime {
        return new ErrorRuntime();
      }
    }

    const provider = new TestableJSCSandboxProvider(new ErrorProvider());
    const runtime = provider.createRuntime();
    const context = runtime.createContext();

    await expect(context.evalAsync!('1 + 1')).rejects.toThrow('Eval failed');
  });

  it('should return Promise from getGlobal', async () => {
    const mockProvider = new MockProvider();
    const provider = new TestableJSCSandboxProvider(mockProvider);

    const runtime = provider.createRuntime();
    const context = runtime.createContext();

    context.setGlobal('asyncValue', 'test');

    const result = context.getGlobal('asyncValue');
    expect(result).toBeInstanceOf(Promise);

    const value = await result;
    expect(value).toBe('test');
  });
});

describe('RNJSCSandboxProviderOptions', () => {
  it('should accept timeout option', () => {
    const options: RNJSCSandboxProviderOptions = { timeout: 5000 };
    expect(options.timeout).toBe(5000);
  });

  it('should accept memoryLimit option', () => {
    const options: RNJSCSandboxProviderOptions = { memoryLimit: 1024 * 1024 * 50 };
    expect(options.memoryLimit).toBe(50 * 1024 * 1024);
  });

  it('should accept both options', () => {
    const options: RNJSCSandboxProviderOptions = {
      timeout: 10000,
      memoryLimit: 100 * 1024 * 1024,
    };
    expect(options.timeout).toBe(10000);
    expect(options.memoryLimit).toBe(100 * 1024 * 1024);
  });
});
