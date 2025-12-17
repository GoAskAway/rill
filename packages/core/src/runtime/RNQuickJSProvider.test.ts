import { describe, expect, it, mock } from 'bun:test';
import {
  type RNQuickJSContext,
  type RNQuickJSLike,
  RNQuickJSProvider,
  type RNQuickJSRuntime,
  resolveRNQuickJS,
} from './RNQuickJSProvider';

// ============ Mock RNQuickJS Implementation ============

class MockRNQuickJSContext implements RNQuickJSContext {
  private globals = new Map<string, unknown>();

  eval(code: string): unknown {
    // Simple eval simulation
    if (code.includes('return')) {
      const match = code.match(/return\s+(.+)/);
      if (match) {
        try {
          return eval(match[1]);
        } catch {
          return undefined;
        }
      }
    }
    return undefined;
  }

  evalAsync(code: string): Promise<unknown> {
    return Promise.resolve(this.eval(code));
  }

  setGlobal(name: string, value: unknown): void {
    this.globals.set(name, value);
  }

  getGlobal(name: string): unknown {
    return this.globals.get(name);
  }

  dispose(): void {
    this.globals.clear();
  }

  setInterruptHandler(_handler: () => boolean): void {
    // Mock implementation
  }

  clearInterruptHandler(): void {
    // Mock implementation
  }
}

class MockRNQuickJSRuntime implements RNQuickJSRuntime {
  private disposed = false;

  createContext(): RNQuickJSContext {
    if (this.disposed) {
      throw new Error('Runtime already disposed');
    }
    return new MockRNQuickJSContext();
  }

  dispose(): void {
    this.disposed = true;
  }

  setTimeout(_ms: number): void {
    // Mock implementation
  }

  setMemoryLimit(_bytes: number): void {
    // Mock implementation
  }

  setMaxStackSize(_size: number): void {
    // Mock implementation
  }
}

class MockRNQuickJS implements RNQuickJSLike {
  createRuntime(_options?: { timeout?: number; memoryLimit?: number }): RNQuickJSRuntime {
    return new MockRNQuickJSRuntime();
  }
}

// ============ Tests ============

describe('RNQuickJSProvider', () => {
  it('should create runtime and context', () => {
    const mockQuickJS = new MockRNQuickJS();
    const provider = new RNQuickJSProvider(mockQuickJS);

    const runtime = provider.createRuntime();
    expect(runtime).toBeDefined();

    const context = runtime.createContext();
    expect(context).toBeDefined();
    expect(typeof context.eval).toBe('function');
    expect(typeof context.setGlobal).toBe('function');
    expect(typeof context.getGlobal).toBe('function');
    expect(typeof context.dispose).toBe('function');
  });

  it('should pass timeout option to runtime', () => {
    const mockQuickJS = new MockRNQuickJS();
    const setTimeoutSpy = mock();

    // Override setTimeout to track calls
    const originalCreateRuntime = mockQuickJS.createRuntime.bind(mockQuickJS);
    mockQuickJS.createRuntime = (options) => {
      const rt = originalCreateRuntime(options);
      rt.setTimeout = setTimeoutSpy;
      return rt;
    };

    const provider = new RNQuickJSProvider(mockQuickJS, { timeout: 5000 });
    provider.createRuntime();

    expect(setTimeoutSpy).toHaveBeenCalledWith(5000);
  });

  it('should pass memory limit option to runtime', () => {
    const createRuntimeSpy = mock((_options) => new MockRNQuickJSRuntime());
    const mockQuickJS = { createRuntime: createRuntimeSpy };

    const provider = new RNQuickJSProvider(mockQuickJS, { memoryLimit: 1024 * 1024 });
    provider.createRuntime();

    expect(createRuntimeSpy).toHaveBeenCalledWith({
      timeout: undefined,
      memoryLimit: 1024 * 1024,
    });
  });

  it('should execute code in context', () => {
    const mockQuickJS = new MockRNQuickJS();
    const provider = new RNQuickJSProvider(mockQuickJS);

    const runtime = provider.createRuntime();
    const context = runtime.createContext();

    const result = context.eval('return 1 + 1');
    expect(result).toBe(2);
  });

  it('should set and get global variables', () => {
    const mockQuickJS = new MockRNQuickJS();
    const provider = new RNQuickJSProvider(mockQuickJS);

    const runtime = provider.createRuntime();
    const context = runtime.createContext();

    context.setGlobal('testVar', 42);
    const value = context.getGlobal('testVar');
    expect(value).toBe(42);
  });

  it('should support async evaluation', async () => {
    const mockQuickJS = new MockRNQuickJS();
    const provider = new RNQuickJSProvider(mockQuickJS);

    const runtime = provider.createRuntime();
    const context = runtime.createContext();

    if (context.evalAsync) {
      const result = await context.evalAsync('return 3 + 3');
      expect(result).toBe(6);
    }
  });

  it('should dispose context', () => {
    const mockQuickJS = new MockRNQuickJS();
    const provider = new RNQuickJSProvider(mockQuickJS);

    const runtime = provider.createRuntime();
    const context = runtime.createContext();

    context.setGlobal('test', 123);
    context.dispose();

    // After dispose, getGlobal should return undefined
    const value = context.getGlobal('test');
    expect(value).toBeUndefined();
  });

  it('should dispose runtime', () => {
    const mockQuickJS = new MockRNQuickJS();
    const provider = new RNQuickJSProvider(mockQuickJS);

    const runtime = provider.createRuntime();
    runtime.dispose();

    // After dispose, createContext should throw
    expect(() => runtime.createContext()).toThrow();
  });
});

describe('resolveRNQuickJS', () => {
  it('should return null when no RN QuickJS package is available', () => {
    // In test environment, these packages are not available
    const result = resolveRNQuickJS();
    expect(result).toBeNull();
  });
});
