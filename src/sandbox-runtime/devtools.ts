/**
 * DevTools Integration for Sandbox
 *
 * Error capturing and reporting to host DevTools.
 */

import { sendEventToHost } from './runtime-helpers';

// ============================================
// Types
// ============================================

/**
 * Error context for DevTools
 */
export interface ErrorContext {
  readonly component?: string;
  readonly hook?: string;
  readonly action?: string;
  readonly [key: string]: unknown;
}

/**
 * Error report payload
 */
export interface ErrorReport {
  readonly message: string;
  readonly stack?: string | undefined;
  readonly context?: ErrorContext | undefined;
}

// ============================================
// DevTools Guest API
// ============================================

/**
 * DevTools guest-side API
 */
export interface DevToolsGuestAPI {
  readonly captureError: (error: unknown, context?: ErrorContext) => void;
}

/**
 * Create DevTools guest API
 */
export function createDevToolsGuestAPI(): DevToolsGuestAPI {
  return {
    captureError(error: unknown, context?: ErrorContext): void {
      const report = createErrorReport(error, context);
      sendEventToHost('devtools:error', report);
    },
  };
}

/**
 * Create an error report from an error
 */
function createErrorReport(
  error: unknown,
  context?: ErrorContext
): ErrorReport {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      context,
    };
  }

  return {
    message: String(error),
    context,
  };
}

// ============================================
// Global Error Handlers
// ============================================

/**
 * Install global error handlers
 */
export function installGlobalErrorHandlers(devtools: DevToolsGuestAPI): void {
  // Note: In sandbox environment, we may not have access to
  // window.onerror or process.on('uncaughtException').
  // The host should set up appropriate error boundaries.

  // Store reference for potential use by error boundaries
  (globalThis as Record<string, unknown>)['__rill_devtools_guest'] = devtools;
}
