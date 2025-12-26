/**
 * Console Setup for Sandbox
 *
 * Creates a console object that routes to host-side logging functions.
 */

// ============================================
// Types
// ============================================

/**
 * Console method signature
 */
type ConsoleMethod = (...args: unknown[]) => void;

/**
 * Console interface
 */
export interface SandboxConsole {
  log: ConsoleMethod;
  warn: ConsoleMethod;
  error: ConsoleMethod;
  debug: ConsoleMethod;
  info: ConsoleMethod;
  trace: ConsoleMethod;
  dir: (obj: unknown) => void;
  table: (data: unknown) => void;
  group: ConsoleMethod;
  groupCollapsed: ConsoleMethod;
  groupEnd: () => void;
  clear: () => void;
  count: (label?: string) => void;
  countReset: (label?: string) => void;
  assert: (condition: boolean, ...args: unknown[]) => void;
  time: (label?: string) => void;
  timeEnd: (label?: string) => void;
  timeLog: (label?: string, ...args: unknown[]) => void;
}

// ============================================
// Console Factory
// ============================================

/**
 * Host console callbacks interface
 */
export interface HostConsoleCallbacks {
  log: ConsoleMethod;
  warn: ConsoleMethod;
  error: ConsoleMethod;
  debug: ConsoleMethod;
  info: ConsoleMethod;
}

/**
 * Create a console object for the sandbox
 */
export function createSandboxConsole(
  hostCallbacks: HostConsoleCallbacks
): SandboxConsole {
  // Timer storage for time/timeEnd
  const timers = new Map<string, number>();

  // Counter storage for count/countReset
  const counters = new Map<string, number>();

  // Group depth for indentation
  let groupDepth = 0;

  /**
   * Add group indentation prefix
   */
  function withIndent(args: unknown[]): unknown[] {
    if (groupDepth === 0) return args;
    const indent = '  '.repeat(groupDepth);
    if (args.length > 0 && typeof args[0] === 'string') {
      return [indent + args[0], ...args.slice(1)];
    }
    return [indent, ...args];
  }

  const console: SandboxConsole = {
    log(...args: unknown[]): void {
      hostCallbacks.log(...withIndent(args));
    },

    warn(...args: unknown[]): void {
      hostCallbacks.warn(...withIndent(args));
    },

    error(...args: unknown[]): void {
      hostCallbacks.error(...withIndent(args));
    },

    debug(...args: unknown[]): void {
      hostCallbacks.debug(...withIndent(args));
    },

    info(...args: unknown[]): void {
      hostCallbacks.info(...withIndent(args));
    },

    trace(...args: unknown[]): void {
      hostCallbacks.log(...withIndent(['Trace:', ...args]));
      // Note: In sandbox we can't get real stack trace
    },

    dir(obj: unknown): void {
      hostCallbacks.log(obj);
    },

    table(data: unknown): void {
      // Simple table implementation - just log the data
      hostCallbacks.log('[table]', data);
    },

    group(...args: unknown[]): void {
      hostCallbacks.log(...withIndent(args));
      groupDepth++;
    },

    groupCollapsed(...args: unknown[]): void {
      hostCallbacks.log(...withIndent(['[collapsed]', ...args]));
      groupDepth++;
    },

    groupEnd(): void {
      if (groupDepth > 0) {
        groupDepth--;
      }
    },

    clear(): void {
      hostCallbacks.log('[clear]');
    },

    count(label?: string): void {
      const counterLabel = label ?? 'default';
      const current = counters.get(counterLabel) ?? 0;
      const next = current + 1;
      counters.set(counterLabel, next);
      hostCallbacks.log(...withIndent([`${counterLabel}: ${next}`]));
    },

    countReset(label?: string): void {
      const counterLabel = label ?? 'default';
      counters.set(counterLabel, 0);
    },

    assert(condition: boolean, ...args: unknown[]): void {
      if (!condition) {
        hostCallbacks.error(...withIndent(['Assertion failed:', ...args]));
      }
    },

    time(label?: string): void {
      const timerLabel = label ?? 'default';
      timers.set(timerLabel, Date.now());
    },

    timeEnd(label?: string): void {
      const timerLabel = label ?? 'default';
      const start = timers.get(timerLabel);
      if (start !== undefined) {
        const duration = Date.now() - start;
        hostCallbacks.log(...withIndent([`${timerLabel}: ${duration}ms`]));
        timers.delete(timerLabel);
      } else {
        hostCallbacks.warn(...withIndent([`Timer '${timerLabel}' does not exist`]));
      }
    },

    timeLog(label?: string, ...args: unknown[]): void {
      const timerLabel = label ?? 'default';
      const start = timers.get(timerLabel);
      if (start !== undefined) {
        const duration = Date.now() - start;
        hostCallbacks.log(...withIndent([`${timerLabel}: ${duration}ms`, ...args]));
      } else {
        hostCallbacks.warn(...withIndent([`Timer '${timerLabel}' does not exist`]));
      }
    },
  };

  return console;
}
