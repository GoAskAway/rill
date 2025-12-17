/**
 * Shared test utilities for rill engine tests
 */

import type { JSEngineContext, JSEngineProvider, JSEngineRuntime } from './engine';

/**
 * Creates a mock JS engine provider for testing.
 * Uses an isolated sandboxGlobalThis to prevent test pollution.
 */
export function createMockJSEngineProvider(): JSEngineProvider {
  return {
    createRuntime(): JSEngineRuntime {
      const globals = new Map<string, unknown>();
      // Create an isolated globalThis for this sandbox
      const sandboxGlobalThis: Record<string, unknown> = {};

      return {
        createContext(): JSEngineContext {
          return {
            eval(code: string): unknown {
              // Build parameter list: explicit globals + sandboxed globalThis
              const globalNames = Array.from(globals.keys());
              const globalValues = Array.from(globals.values());

              // Wrap code to use sandboxed globalThis instead of real globalThis
              // This prevents Object.defineProperty(globalThis, ...) from polluting the host
              const wrappedCode = `
                "use strict";
                // Shadow globalThis with our sandbox version
                var globalThis = arguments[arguments.length - 1];
                ${code}
              `;

              const fn = new Function(...globalNames, wrappedCode);
              return fn(...globalValues, sandboxGlobalThis);
            },
            setGlobal(name: string, value: unknown): void {
              globals.set(name, value);
              // Also set on sandboxGlobalThis for code that accesses globalThis.xxx
              sandboxGlobalThis[name] = value;
            },
            getGlobal(name: string): unknown {
              // Check sandboxGlobalThis first (for properties defined via Object.defineProperty)
              if (name in sandboxGlobalThis) {
                return sandboxGlobalThis[name];
              }
              return globals.get(name);
            },
            dispose(): void {
              globals.clear();
              // Clean up sandboxGlobalThis
              for (const key of Object.keys(sandboxGlobalThis)) {
                delete sandboxGlobalThis[key];
              }
            },
          };
        },
        dispose(): void {},
      };
    },
  };
}
