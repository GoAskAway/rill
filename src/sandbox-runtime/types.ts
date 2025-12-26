/**
 * Sandbox Runtime Type Definitions
 *
 * Strict types for the sandbox runtime environment.
 * These types define the contract between Guest and Host.
 */

// ============================================
// React Element Types
// ============================================

/**
 * Rill-marked React element that can cross the JSI boundary.
 * Uses string markers instead of Symbols (which don't survive JSI).
 */
export interface RillReactElement<P = RillProps> {
  readonly __rillTypeMarker: '__rill_react_element__';
  readonly type: RillElementType;
  readonly props: P;
  readonly key?: string | number | null;
  readonly ref?: unknown;
}

/**
 * Valid element types in Rill
 */
export type RillElementType =
  | string // Native component name: 'View', 'Text', etc.
  | RillComponentTypeRef // Registered function component reference
  | typeof RILL_FRAGMENT_MARKER; // Fragment marker

/**
 * Reference to a registered function component.
 * Used instead of raw function to survive JSI boundary.
 */
export interface RillComponentTypeRef {
  readonly __rillComponentId: string;
  readonly displayName?: string;
}

/**
 * Fragment marker constant
 */
export const RILL_FRAGMENT_MARKER = '__rill_fragment__' as const;

/**
 * Element marker constant
 */
export const RILL_ELEMENT_MARKER = '__rill_react_element__' as const;

// ============================================
// Props Types
// ============================================

/**
 * Base props type - record of serializable values
 */
export type RillProps = Readonly<Record<string, RillPropValue>>;

/**
 * Valid prop value types (must be serializable)
 * Note: Uses interface to avoid circular reference
 */
export type RillPropValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | RillReactElement
  | RillCallbackRef
  | RillPropValueArray
  | RillPropValueRecord;

/**
 * Array of prop values (avoids circular reference)
 */
export interface RillPropValueArray extends ReadonlyArray<RillPropValue> {}

/**
 * Record of prop values (avoids circular reference)
 */
export interface RillPropValueRecord
  extends Readonly<Record<string, RillPropValue>> {}

/**
 * Reference to a registered callback function.
 * Raw functions cannot cross JSI - they must be registered and referenced by ID.
 */
export interface RillCallbackRef {
  readonly __type: 'function';
  readonly __fnId: string;
}

// ============================================
// Hook Types
// ============================================

/**
 * State setter function returned by useState
 */
export type StateUpdater<T> = (value: T | ((prev: T) => T)) => void;

/**
 * Ref object returned by useRef
 */
export interface RefObject<T> {
  current: T;
}

/**
 * Effect cleanup function
 */
export type EffectCleanup = void | (() => void);

/**
 * Effect function
 */
export type EffectCallback = () => EffectCleanup;

/**
 * Dependency array for hooks
 */
export type DependencyList = ReadonlyArray<unknown>;

/**
 * Reducer function for useReducer
 */
export type Reducer<S, A> = (prevState: S, action: A) => S;

/**
 * Dispatch function returned by useReducer
 */
export type Dispatch<A> = (action: A) => void;

// ============================================
// Hook Instance State
// ============================================

/**
 * Per-instance hook state storage
 */
export interface HookInstanceState {
  states: unknown[];
  refs: Array<RefObject<unknown>>;
  memos: Array<{ deps: DependencyList | undefined; value: unknown }>;
  effects: Array<{
    effect: EffectCallback;
    deps: DependencyList | undefined;
    cleanup: EffectCleanup;
  }>;
  ids: string[];
  index: number;
}

/**
 * Pending effect to run after render
 */
export interface PendingEffect {
  readonly instanceId: string;
  readonly index: number;
  readonly effect: EffectCallback;
  readonly prevCleanup: EffectCleanup;
}

/**
 * Global hooks state manager
 */
export interface HooksState {
  readonly instances: Map<string, HookInstanceState>;
  pendingEffects: PendingEffect[];
  idCounter: number;
  isRendering: boolean;
  readonly contexts: Map<RillContext<unknown>, unknown>;
  rootElement: RillReactElement | null;
  sendToHost: SendToHost | null;
}

// ============================================
// Context Types
// ============================================

/**
 * React Context object
 */
export interface RillContext<T> {
  readonly _currentValue: T;
  readonly Provider: RillContextProvider<T>;
  readonly Consumer: RillContextConsumer<T>;
}

/**
 * Context Provider component
 */
export type RillContextProvider<T> = (props: {
  value: T;
  children?: RillChildren;
}) => RillChildren;

/**
 * Context Consumer component
 */
export type RillContextConsumer<T> = (props: {
  children: (value: T) => RillReactElement;
}) => RillReactElement;

// ============================================
// Component Types
// ============================================

/**
 * Valid children types
 */
export type RillChildren =
  | RillReactElement
  | string
  | number
  | boolean
  | null
  | undefined
  | ReadonlyArray<RillChildren>;

/**
 * Function component type
 */
export interface RillFunctionComponent<P extends RillProps = RillProps> {
  (props: P): RillReactElement | null;
  displayName?: string;
  name?: string;
}

/**
 * Props with children
 */
export interface PropsWithChildren<P = unknown> {
  readonly children?: RillChildren;
  readonly [key: string]: P | RillChildren | undefined;
}

// ============================================
// Class Component Types
// ============================================

/**
 * Class component state
 */
export type ComponentState = Readonly<Record<string, unknown>>;

/**
 * Class component interface
 */
export interface RillComponent<
  P extends RillProps = RillProps,
  S extends ComponentState = ComponentState,
> {
  props: Readonly<P>;
  state: S;
  setState(
    partialState: Partial<S> | ((prevState: S, props: P) => Partial<S>),
    callback?: () => void
  ): void;
  forceUpdate(callback?: () => void): void;
  render(): RillReactElement | null;
}

// ============================================
// Bridge Types
// ============================================

/**
 * Send operation batch to host
 */
export type SendToHost = (batch: OperationBatch) => void;

/**
 * Operation batch sent to host
 */
export interface OperationBatch {
  readonly version: number;
  readonly batchId: number;
  readonly operations: ReadonlyArray<Operation>;
}

/**
 * Single operation in a batch
 */
export type Operation =
  | CreateOperation
  | UpdateOperation
  | DeleteOperation
  | ReorderOperation;

export interface CreateOperation {
  readonly op: 'CREATE';
  readonly id: number;
  readonly type: string;
  readonly props: RillProps;
  readonly parentId: number | null;
}

export interface UpdateOperation {
  readonly op: 'UPDATE';
  readonly id: number;
  readonly props: RillProps;
}

export interface DeleteOperation {
  readonly op: 'DELETE';
  readonly id: number;
}

export interface ReorderOperation {
  readonly op: 'REORDER';
  readonly id: number;
  readonly children: ReadonlyArray<number>;
}

// ============================================
// Global Registration Types
// ============================================

/**
 * Function to register a component type with the host
 */
export type RegisterComponentType = (
  fn: RillFunctionComponent
) => string | null;

/**
 * Function to schedule a re-render
 */
export type ScheduleRender = () => void;

// ============================================
// Sandbox Global Augmentation
// ============================================

/**
 * Globals available in the sandbox environment
 */
export interface SandboxGlobals {
  // React
  React: RillReactAPI;
  ReactJSXRuntime: RillJSXRuntime;
  ReactJSXDevRuntime: RillJSXRuntime;
  ReactNative: RillReactNativeComponents;

  // Rill internals
  __rillHooks: HooksState;
  __rillCurrentInstanceId: string | undefined;
  __rillGetInstanceHooks: () => HookInstanceState;
  __rillDepsEqual: (
    prevDeps: DependencyList | undefined,
    nextDeps: DependencyList | undefined
  ) => boolean;
  __rillFlushEffects: () => void;
  __rillScheduleRender: ScheduleRender;
  __rillCreateSafeShim: <T extends object>(name: string, obj: T) => T;

  // Host communication
  __sendToHost: SendToHost;
  __rill_register_component_type: RegisterComponentType;
  __rill_schedule_render: ScheduleRender;

  // Flags
  __REACT_SHIM__: boolean;
  __RILL_DEBUG__: boolean;
  __RILL_GUEST_ENV__: boolean;
}

// ============================================
// React API Interface
// ============================================

/**
 * Complete React API exposed in sandbox
 */
export interface RillReactAPI {
  createElement: CreateElement;
  Fragment: typeof RILL_FRAGMENT_MARKER;
  useState: UseState;
  useRef: UseRef;
  useMemo: UseMemo;
  useCallback: UseCallback;
  useReducer: UseReducer;
  useId: UseId;
  useEffect: UseEffect;
  useContext: UseContext;
  createContext: CreateContext;
  Component: RillComponentClass;
  PureComponent: RillComponentClass;
  Children: RillChildrenUtils;
  isValidElement: IsValidElement;
  cloneElement: CloneElement;
}

/**
 * createElement function signature
 */
export type CreateElement = <P extends RillProps>(
  type: string | RillFunctionComponent<P> | typeof RILL_FRAGMENT_MARKER,
  props: P | null,
  ...children: RillChildren[]
) => RillReactElement<P>;

/**
 * useState hook signature
 */
export type UseState = <T>(
  initialValue: T | (() => T)
) => readonly [T, StateUpdater<T>];

/**
 * useRef hook signature
 */
export type UseRef = <T>(initialValue: T) => RefObject<T>;

/**
 * useMemo hook signature
 */
export type UseMemo = <T>(factory: () => T, deps: DependencyList) => T;

/**
 * useCallback hook signature
 */
export type UseCallback = <T extends (...args: never[]) => unknown>(
  callback: T,
  deps: DependencyList
) => T;

/**
 * useReducer hook signature
 */
export type UseReducer = <S, A>(
  reducer: Reducer<S, A>,
  initialArg: S,
  init?: (arg: S) => S
) => readonly [S, Dispatch<A>];

/**
 * useId hook signature
 */
export type UseId = () => string;

/**
 * useEffect hook signature
 */
export type UseEffect = (
  effect: EffectCallback,
  deps?: DependencyList
) => void;

/**
 * useContext hook signature
 */
export type UseContext = <T>(context: RillContext<T>) => T;

/**
 * createContext function signature
 */
export type CreateContext = <T>(defaultValue: T) => RillContext<T>;

/**
 * isValidElement function signature
 */
export type IsValidElement = (object: unknown) => object is RillReactElement;

/**
 * cloneElement function signature
 */
export type CloneElement = <P extends RillProps>(
  element: RillReactElement<P>,
  props?: Partial<P>,
  ...children: RillChildren[]
) => RillReactElement<P>;

/**
 * Component class constructor
 */
export interface RillComponentClass {
  new <P extends RillProps, S extends ComponentState>(
    props: P
  ): RillComponent<P, S>;
  getDerivedStateFromError?: ((error: Error) => ComponentState | null) | null;
}

/**
 * Children utilities
 */
export interface RillChildrenUtils {
  map: <T>(
    children: RillChildren,
    fn: (child: RillChildren, index: number) => T
  ) => T[];
  forEach: (
    children: RillChildren,
    fn: (child: RillChildren, index: number) => void
  ) => void;
  count: (children: RillChildren) => number;
  only: (children: RillChildren) => RillReactElement;
  toArray: (children: RillChildren) => RillChildren[];
}

// ============================================
// JSX Runtime Interface
// ============================================

/**
 * JSX Runtime API
 */
export interface RillJSXRuntime {
  jsx: CreateElement;
  jsxs: CreateElement;
  jsxDEV: CreateElement;
  Fragment: typeof RILL_FRAGMENT_MARKER;
}

// ============================================
// React Native Components
// ============================================

/**
 * React Native component registry
 */
export interface RillReactNativeComponents {
  readonly View: 'View';
  readonly Text: 'Text';
  readonly Image: 'Image';
  readonly ScrollView: 'ScrollView';
  readonly TouchableOpacity: 'TouchableOpacity';
  readonly Button: 'Button';
  readonly ActivityIndicator: 'ActivityIndicator';
  readonly FlatList: 'FlatList';
  readonly TextInput: 'TextInput';
  readonly Switch: 'Switch';
}
