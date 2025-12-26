/**
 * Guest Reconciler Entry Point
 *
 * This file is compiled and injected into Guest sandbox at runtime.
 * It exports render/unmount/unmountAll to globalThis.RillReconciler.
 *
 * IMPORTANT: This also exports React and ReactJSXRuntime to globalThis so that
 * Guest bundles (counterapp, etc.) use the same React as the reconciler.
 * This ensures hooks like useState/useEffect work correctly with react-reconciler.
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
  registerComponentType,
  releaseCallback,
  render,
  unmount,
  unmountAll,
  unregisterComponentTypes,
} from './reconciler';

// NOTE: We do NOT export React to globalThis here because:
// 1. JSCSandbox's jsValueToJSI causes infinite recursion with React's complex internals
// 2. The shims (injected before guest-bundle) provide globalThis.React
// 3. Guest bundles will use the shims' React for createElement/JSX
// 4. The reconciler internally uses the bundled React for actual rendering
//
// The shims' React.createElement creates rill-marked elements that the reconciler
// transforms via transformGuestElement before passing to the real React.

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
  // Component type registration - used by shims for JSI-safe function transport
  registerComponentType,
  unregisterComponentTypes,
};

// Log for debugging
// biome-ignore lint/suspicious/noExplicitAny: Checking global debug flag
if ((globalThis as any).__RILL_DEBUG__) {
  console.log('[RillReconciler] Initialized in Guest environment with bundled React');
}
