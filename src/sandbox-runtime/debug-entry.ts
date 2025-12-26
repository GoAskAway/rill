#!/usr/bin/env bun
/**
 * Debug Entry Point
 *
 * This file allows you to run business code in a pure TypeScript environment
 * with full type checking, without needing the React Native app or JSC sandbox.
 *
 * Usage:
 *   1. Import your business code
 *   2. Call initializeSandboxRuntime with mock callbacks
 *   3. Use React.createElement and render
 *   4. Inspect the operations sent to host
 *
 * Example:
 *   bun src/sandbox-runtime/debug-entry.ts
 */

import type { OperationBatch, RillReactElement, SendToHost } from './types';
import { initializeSandboxRuntime, React, createElement } from './index';

// ============================================
// Save Original Console (before initialization replaces it)
// ============================================

const originalConsole = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug.bind(console),
  info: console.info.bind(console),
};

// ============================================
// Mock Host Callbacks
// ============================================

/**
 * Collected operations for inspection
 */
const collectedBatches: OperationBatch[] = [];

/**
 * Mock sendToHost that collects operations
 */
const mockSendToHost: SendToHost = (batch: OperationBatch): void => {
  collectedBatches.push(batch);
  originalConsole.log('\n[Host] Received batch:', JSON.stringify(batch, null, 2));
};

/**
 * Mock console callbacks - use original console to avoid recursion
 */
const mockConsoleCallbacks = {
  log: (...args: unknown[]): void => originalConsole.log('[Guest]', ...args),
  warn: (...args: unknown[]): void => originalConsole.warn('[Guest]', ...args),
  error: (...args: unknown[]): void => originalConsole.error('[Guest]', ...args),
  debug: (...args: unknown[]): void => originalConsole.debug('[Guest]', ...args),
  info: (...args: unknown[]): void => originalConsole.info('[Guest]', ...args),
};

// ============================================
// Initialize Runtime
// ============================================

originalConsole.log('='.repeat(60));
originalConsole.log('Sandbox Runtime Debug Entry');
originalConsole.log('='.repeat(60));

initializeSandboxRuntime({
  debug: true,
  consoleCallbacks: mockConsoleCallbacks,
  sendEventToHost: (eventName, payload) => {
    originalConsole.log(`[Host] Event: ${eventName}`, payload);
  },
  getConfig: () => ({ theme: 'dark', version: '1.0.0' }),
  scheduleRender: () => {
    originalConsole.log('[Host] Schedule render requested');
  },
  registerComponentType: (fn) => {
    const id = `cmp_debug_${Math.random().toString(36).slice(2, 8)}`;
    originalConsole.log(`[Host] Registered component: ${fn.name ?? 'Anonymous'} -> ${id}`);
    return id;
  },
});

originalConsole.log('\n✓ Runtime initialized\n');

// ============================================
// Example Business Code
// ============================================

originalConsole.log('--- Running Example Business Code ---\n');

// Example 1: Simple element
const simpleElement = createElement('View', { style: { flex: 1 } },
  createElement('Text', null, 'Hello, Rill!')
);

originalConsole.log('Simple element:', JSON.stringify(simpleElement, null, 2));

// Example 2: Function component
function Counter({ initialCount = 0 }: { initialCount?: number }): RillReactElement {
  // Note: In real usage, useState would be called here
  // For demo, we just return a static element
  return createElement('View', { style: { padding: 10 } },
    createElement('Text', null, `Count: ${initialCount}`),
    createElement('Text', { style: { color: 'blue' } }, 'Tap to increment')
  );
}

// Set display name for better debugging
Counter.displayName = 'Counter';

const counterElement = createElement(Counter, { initialCount: 5 });
originalConsole.log('\nCounter element:', JSON.stringify(counterElement, null, 2));

// Example 3: Fragment with children
const fragmentElement = createElement(React.Fragment, null,
  createElement('Text', null, 'First'),
  createElement('Text', null, 'Second'),
  createElement('Text', null, 'Third')
);

originalConsole.log('\nFragment element:', JSON.stringify(fragmentElement, null, 2));

// ============================================
// Summary
// ============================================

originalConsole.log('\n' + '='.repeat(60));
originalConsole.log('Debug session complete!');
originalConsole.log('='.repeat(60));
originalConsole.log(`
Next steps:
1. Import your actual business code here
2. Call render() with your root component
3. Inspect the operations in collectedBatches

To run with your code:
  bun src/sandbox-runtime/debug-entry.ts
`);
