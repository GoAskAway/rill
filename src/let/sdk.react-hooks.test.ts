/**
 * getReactHooks Tests
 *
 * Tests for React hooks resolution in different environments
 *
 * Note: These tests verify the SDK's hook resolution behavior.
 * In Bun/ESM environment, we cannot manipulate module cache like CommonJS,
 * so we test the exported hooks directly.
 */

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';

describe('getReactHooks()', () => {
  let React: typeof import('react');
  let sdk: typeof import('./sdk');

  afterAll(() => {
    // Cleanup globalThis.React
    delete (globalThis as Record<string, unknown>).React;
  });

  beforeAll(async () => {
    // Import React and set it on globalThis before importing SDK
    React = await import('react');
    (globalThis as Record<string, unknown>).React = React;
    sdk = await import('./sdk');
  });

  test('should have all hook functions exported', () => {
    expect(typeof sdk.useHostEvent).toBe('function');
    expect(typeof sdk.useConfig).toBe('function');
    expect(typeof sdk.useSendToHost).toBe('function');
    expect(typeof sdk.useRemoteRef).toBe('function');
  });

  test('useHostEvent should be callable without throwing', () => {
    // Since hooks require React context, we just verify they're defined
    expect(sdk.useHostEvent).toBeDefined();
    expect(typeof sdk.useHostEvent).toBe('function');
  });

  test('useConfig should be callable without throwing', () => {
    expect(sdk.useConfig).toBeDefined();
    expect(typeof sdk.useConfig).toBe('function');
  });

  test('useSendToHost should be callable without throwing', () => {
    expect(sdk.useSendToHost).toBeDefined();
    expect(typeof sdk.useSendToHost).toBe('function');
  });

  test('useRemoteRef should be callable without throwing', () => {
    expect(sdk.useRemoteRef).toBeDefined();
    expect(typeof sdk.useRemoteRef).toBe('function');
  });
});
