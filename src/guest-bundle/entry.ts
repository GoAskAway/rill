/**
 * Guest Reconciler Entry Point
 *
 * This file is compiled and injected into Guest sandbox at runtime.
 * It exports render/unmount/unmountAll to globalThis.RillReconciler.
 */

// CRITICAL: Import guest-init FIRST before any other imports!
// This sets up __RILL_GUEST_ENV__ and __callbacks BEFORE CallbackRegistry constructor runs.
// Bundlers process imports in order, and guest-init has no imports so it runs first.
import './init';

// Import reconciler functions - this triggers reconciler module init
// CallbackRegistry constructor will now see __RILL_GUEST_ENV__ === true
import {
  getCallbackCount,
  invokeCallback,
  releaseCallback,
  render,
  unmount,
  unmountAll,
} from './reconciler';

// Export to globalThis for Guest access
// biome-ignore lint/suspicious/noExplicitAny: Exporting reconciler to global for guest access
(globalThis as any).RillReconciler = {
  render,
  unmount,
  unmountAll,
  // Callback management - used by Host's Bridge for routing and cleanup
  invokeCallback,
  releaseCallback,
  getCallbackCount,
};

// Log for debugging
// biome-ignore lint/suspicious/noExplicitAny: Checking global debug flag
if ((globalThis as any).__RILL_DEBUG__) {
  console.log('[RillReconciler] Initialized in Guest environment');
}
