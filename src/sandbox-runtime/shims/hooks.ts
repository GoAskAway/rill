/**
 * React Hooks Implementation for Sandbox
 *
 * Complete hooks system with per-instance state management.
 * Each component instance has its own hook state, keyed by instance ID.
 */

import type {
  DependencyList,
  Dispatch,
  EffectCallback,
  HookInstanceState,
  HooksState,
  PendingEffect,
  Reducer,
  RefObject,
  RillContext,
  ScheduleRender,
  SendToHost,
  StateUpdater,
} from '../types';

// ============================================
// Global Hooks State
// ============================================

/**
 * Global hooks state - manages all component instance states
 */
export const hooksState: HooksState = {
  instances: new Map<string, HookInstanceState>(),
  pendingEffects: [],
  idCounter: 0,
  isRendering: false,
  contexts: new Map(),
  rootElement: null,
  sendToHost: null,
};

// ============================================
// Instance ID Management
// ============================================

/**
 * Current instance ID - set by the reconciler during component render
 */
let currentInstanceId: string | undefined;

/**
 * Get the current instance ID
 */
export function getCurrentInstanceId(): string {
  return currentInstanceId ?? '__default__';
}

/**
 * Set the current instance ID (called by reconciler)
 */
export function setCurrentInstanceId(id: string | undefined): void {
  currentInstanceId = id;
}

// ============================================
// Instance Hooks Access
// ============================================

/**
 * Get or create hook state for current instance
 */
export function getInstanceHooks(): HookInstanceState {
  const instanceId = getCurrentInstanceId();

  const existing = hooksState.instances.get(instanceId);
  if (existing !== undefined) {
    return existing;
  }

  const newState: HookInstanceState = {
    states: [],
    refs: [],
    memos: [],
    effects: [],
    ids: [],
    index: 0,
  };

  hooksState.instances.set(instanceId, newState);
  return newState;
}

// ============================================
// Dependency Comparison
// ============================================

/**
 * Shallow compare two dependency arrays
 */
export function depsEqual(
  prevDeps: DependencyList | undefined,
  nextDeps: DependencyList | undefined
): boolean {
  if (prevDeps === nextDeps) return true;
  if (prevDeps === undefined || nextDeps === undefined) return false;
  if (prevDeps.length !== nextDeps.length) return false;

  for (let i = 0; i < prevDeps.length; i++) {
    if (!Object.is(prevDeps[i], nextDeps[i])) return false;
  }

  return true;
}

// ============================================
// Effect Flushing
// ============================================

/**
 * Run pending effects after render
 */
export function flushEffects(): void {
  const pending = hooksState.pendingEffects;
  hooksState.pendingEffects = [];

  for (const effect of pending) {
    runEffect(effect);
  }
}

/**
 * Run a single effect
 */
function runEffect(pending: PendingEffect): void {
  const { instanceId, index, effect, prevCleanup } = pending;

  // Run previous cleanup if exists
  if (typeof prevCleanup === 'function') {
    try {
      prevCleanup();
    } catch (e: unknown) {
      console.error('[rill] Effect cleanup error:', e);
    }
  }

  // Run effect and store cleanup
  try {
    const cleanup = effect();
    const instanceHooks = hooksState.instances.get(instanceId);
    const effectState = instanceHooks?.effects[index];
    if (effectState !== undefined) {
      effectState.cleanup = cleanup;
    }
  } catch (e: unknown) {
    console.error('[rill] Effect error:', e);
  }
}

// ============================================
// Schedule Render
// ============================================

/**
 * External schedule render function - set by runtime
 */
let externalScheduleRender: ScheduleRender | null = null;

/**
 * Set the external schedule render function
 */
export function setScheduleRender(fn: ScheduleRender): void {
  externalScheduleRender = fn;
}

/**
 * Schedule a re-render
 */
export function scheduleRender(): void {
  if (hooksState.isRendering) return;

  hooksState.isRendering = true;

  // Reset all instance indices before render
  for (const inst of hooksState.instances.values()) {
    inst.index = 0;
  }

  try {
    if (externalScheduleRender !== null) {
      externalScheduleRender();
    } else {
      console.warn('[rill:shim] scheduleRender: no external scheduler set');
    }
  } finally {
    hooksState.isRendering = false;
  }
}

// ============================================
// Hook Implementations
// ============================================

/**
 * useState hook
 */
export function useState<T>(initialValue: T | (() => T)): readonly [T, StateUpdater<T>] {
  const instanceHooks = getInstanceHooks();
  const currentIndex = instanceHooks.index++;
  const instanceId = getCurrentInstanceId();

  // Initialize on first render
  if (currentIndex >= instanceHooks.states.length) {
    const value =
      typeof initialValue === 'function'
        ? (initialValue as () => T)()
        : initialValue;
    instanceHooks.states.push(value);
  }

  const setState: StateUpdater<T> = (newValue: T | ((prev: T) => T)): void => {
    const instHooks = hooksState.instances.get(instanceId);
    if (instHooks === undefined) return;

    const prevValue = instHooks.states[currentIndex] as T;
    const nextValue =
      typeof newValue === 'function'
        ? (newValue as (prev: T) => T)(prevValue)
        : newValue;

    if (!Object.is(nextValue, prevValue)) {
      instHooks.states[currentIndex] = nextValue;
      scheduleRender();
    }
  };

  return [instanceHooks.states[currentIndex] as T, setState] as const;
}

/**
 * useRef hook
 */
export function useRef<T>(initialValue: T): RefObject<T> {
  const instanceHooks = getInstanceHooks();
  const currentIndex = instanceHooks.index++;

  // Initialize on first render
  if (currentIndex >= instanceHooks.refs.length) {
    instanceHooks.refs.push({ current: initialValue });
  }

  return instanceHooks.refs[currentIndex] as RefObject<T>;
}

/**
 * useMemo hook
 */
export function useMemo<T>(factory: () => T, deps: DependencyList): T {
  const instanceHooks = getInstanceHooks();
  const currentIndex = instanceHooks.index++;

  const prevMemo = instanceHooks.memos[currentIndex];

  // Check if deps changed
  if (prevMemo !== undefined && depsEqual(prevMemo.deps, deps)) {
    return prevMemo.value as T;
  }

  // Compute new value
  const value = factory();
  instanceHooks.memos[currentIndex] = { deps, value };
  return value;
}

/**
 * useCallback hook
 */
export function useCallback<T extends (...args: never[]) => unknown>(
  callback: T,
  deps: DependencyList
): T {
  return useMemo(() => callback, deps);
}

/**
 * useReducer hook
 */
export function useReducer<S, A>(
  reducer: Reducer<S, A>,
  initialArg: S,
  init?: (arg: S) => S
): readonly [S, Dispatch<A>] {
  const initialState = init !== undefined ? init(initialArg) : initialArg;
  const [state, setState] = useState(initialState);

  const dispatch: Dispatch<A> = useCallback(
    (action: A): void => {
      setState((prevState: S) => reducer(prevState, action));
    },
    [reducer]
  );

  return [state, dispatch] as const;
}

/**
 * useId hook
 */
export function useId(): string {
  const instanceHooks = getInstanceHooks();
  const currentIndex = instanceHooks.index++;

  // Initialize on first render
  if (currentIndex >= instanceHooks.ids.length) {
    const id = `rill:r${++hooksState.idCounter}`;
    instanceHooks.ids.push(id);
  }

  const storedId = instanceHooks.ids[currentIndex];
  if (storedId === undefined) {
    throw new Error('[rill] useId: ID not found at index');
  }

  return storedId;
}

/**
 * useEffect hook
 */
export function useEffect(
  effect: EffectCallback,
  deps?: DependencyList
): void {
  const instanceHooks = getInstanceHooks();
  const currentIndex = instanceHooks.index++;
  const instanceId = getCurrentInstanceId();

  const prevEffect = instanceHooks.effects[currentIndex];

  // Check if deps changed (undefined deps = always run)
  const shouldRun =
    prevEffect === undefined ||
    deps === undefined ||
    !depsEqual(prevEffect.deps, deps);

  if (shouldRun) {
    // Store effect info
    instanceHooks.effects[currentIndex] = {
      effect,
      deps,
      cleanup: undefined,
    };

    // Queue effect to run after render
    const pendingEffect: PendingEffect = {
      instanceId,
      index: currentIndex,
      effect,
      prevCleanup: prevEffect?.cleanup,
    };

    hooksState.pendingEffects.push(pendingEffect);
  }
}

/**
 * useContext hook
 */
export function useContext<T>(context: RillContext<T>): T {
  // Look up context value from registry
  const value = hooksState.contexts.get(context as RillContext<unknown>);
  if (value !== undefined) {
    return value as T;
  }

  // Return default value if not provided
  return context._currentValue;
}

// ============================================
// Render Wrapper
// ============================================

/**
 * Wrap render function to track root and enable re-renders
 */
export function wrapRender<E, S extends SendToHost>(
  originalRender: (element: E, sendToHost: S) => void
): (element: E, sendToHost: S) => void {
  return (element: E, sendToHost: S): void => {
    // Reset all instance indices before render
    for (const inst of hooksState.instances.values()) {
      inst.index = 0;
    }

    hooksState.rootElement = element as unknown as HooksState['rootElement'];
    hooksState.sendToHost = sendToHost as unknown as SendToHost;

    originalRender(element, sendToHost);

    // Flush effects after render (async to not block render)
    if (hooksState.pendingEffects.length > 0) {
      Promise.resolve()
        .then(flushEffects)
        .catch((e: unknown) => {
          console.error('[rill] Effect flush error:', e);
        });
    }
  };
}
