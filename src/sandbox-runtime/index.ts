/**
 * Sandbox Runtime Entry Point
 *
 * This module combines all sandbox runtime components:
 * - React shims (createElement, hooks, etc.)
 * - Console setup
 * - Runtime helpers (event communication)
 * - DevTools integration
 *
 * Usage:
 * 1. For type-checked development: import directly from this module
 * 2. For sandbox injection: compile to IIFE and eval
 */

// ============================================
// Re-exports
// ============================================

// Types
export type {
  CloneElement,
  ComponentState,
  CreateContext,
  CreateElement,
  DependencyList,
  Dispatch,
  EffectCallback,
  EffectCleanup,
  HookInstanceState,
  HooksState,
  IsValidElement,
  Operation,
  OperationBatch,
  PendingEffect,
  PropsWithChildren,
  Reducer,
  RefObject,
  RegisterComponentType,
  RillCallbackRef,
  RillChildren,
  RillComponent,
  RillComponentClass,
  RillComponentTypeRef,
  RillContext,
  RillContextConsumer,
  RillContextProvider,
  RillElementType,
  RillFunctionComponent,
  RillJSXRuntime,
  RillProps,
  RillPropValue,
  RillReactAPI,
  RillReactElement,
  RillReactNativeComponents,
  SandboxGlobals,
  ScheduleRender,
  SendToHost,
  StateUpdater,
  UseCallback,
  UseContext,
  UseEffect,
  UseId,
  UseMemo,
  UseReducer,
  UseRef,
  UseState,
} from './types';

export { RILL_ELEMENT_MARKER, RILL_FRAGMENT_MARKER } from './types';

// Shims
export {
  // Main APIs
  React,
  ReactJSXDevRuntime,
  ReactJSXRuntime,
  ReactNative,
  // Core
  Children,
  cloneElement,
  createElement,
  Fragment,
  isValidElement,
  // Hooks
  depsEqual,
  flushEffects,
  getCurrentInstanceId,
  getInstanceHooks,
  hooksState,
  scheduleRender,
  setCurrentInstanceId,
  setScheduleRender,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useReducer,
  useRef,
  useState,
  wrapRender,
  // Context
  createContext,
  // Components
  Component,
  ComponentClass,
  PureComponent,
  PureComponentClass,
  // Registration
  setRegisterComponentType,
  // React Native
  ActivityIndicator,
  Button,
  FlatList,
  Image,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from './shims';

// Console
export type { HostConsoleCallbacks, SandboxConsole } from './console';
export { createSandboxConsole } from './console';

// Runtime Helpers
export type {
  EventListenerCallback,
  GetConfig,
  HostEventHandler,
  HostEventSubscription,
  UseHostEventReturn,
} from './runtime-helpers';
export {
  addEventListener,
  createUseHostEvent,
  dispatchEvent,
  getConfig,
  handleHostMessage,
  removeEventListener,
  sendEventToHost,
  setGetConfig,
  setSendEventToHost,
} from './runtime-helpers';

// DevTools
export type { DevToolsGuestAPI, ErrorContext, ErrorReport } from './devtools';
export { createDevToolsGuestAPI, installGlobalErrorHandlers } from './devtools';

// Debug
export {
  createSafeShim,
  debugLog,
  debugWarn,
  isDebugMode,
  setDebugMode,
} from './debug';

// ============================================
// Initialization
// ============================================

import type { RegisterComponentType, ScheduleRender, SendToHost } from './types';
import { createSandboxConsole, type HostConsoleCallbacks } from './console';
import { createSafeShim, setDebugMode } from './debug';
import { createDevToolsGuestAPI, installGlobalErrorHandlers } from './devtools';
import { setScheduleRender } from './shims/hooks';
import { setRegisterComponentType } from './shims/react-core';
import { React, ReactJSXRuntime, ReactNative } from './shims';
import {
  createUseHostEvent,
  setGetConfig,
  setSendEventToHost,
  type GetConfig,
  type HostEventHandler,
} from './runtime-helpers';

/**
 * Sandbox initialization options
 */
export interface SandboxInitOptions {
  readonly debug?: boolean;
  readonly consoleCallbacks: HostConsoleCallbacks;
  readonly sendEventToHost?: HostEventHandler;
  readonly getConfig?: GetConfig;
  readonly scheduleRender?: ScheduleRender;
  readonly registerComponentType?: RegisterComponentType;
  readonly sendToHost?: SendToHost;
}

/**
 * Initialize the sandbox runtime
 *
 * This sets up all globals and connections to the host.
 */
export function initializeSandboxRuntime(options: SandboxInitOptions): void {
  const {
    debug = false,
    consoleCallbacks,
    sendEventToHost,
    getConfig,
    scheduleRender,
    registerComponentType,
  } = options;

  // Set debug mode
  setDebugMode(debug);

  // Helper for type-safe global assignment
  const globals = globalThis as Record<string, unknown>;

  // Create and install console
  const sandboxConsole = createSandboxConsole(consoleCallbacks);
  globals['console'] = sandboxConsole;

  // Install React globals (with safe shim wrapper in debug mode)
  const wrappedReact = debug ? createSafeShim('React', React) : React;
  const wrappedJSXRuntime = debug
    ? createSafeShim('ReactJSXRuntime', ReactJSXRuntime)
    : ReactJSXRuntime;
  const wrappedReactNative = debug
    ? createSafeShim('ReactNative', ReactNative)
    : ReactNative;

  globals['React'] = wrappedReact;
  globals['ReactJSXRuntime'] = wrappedJSXRuntime;
  globals['ReactJSXDevRuntime'] = wrappedJSXRuntime;
  globals['ReactNative'] = wrappedReactNative;

  // Set external functions
  if (sendEventToHost !== undefined) {
    setSendEventToHost(sendEventToHost);
  }

  if (getConfig !== undefined) {
    setGetConfig(getConfig);
  }

  if (scheduleRender !== undefined) {
    setScheduleRender(scheduleRender);
  }

  if (registerComponentType !== undefined) {
    setRegisterComponentType(registerComponentType);
  }

  // Install host event hook
  globals['__useHostEvent'] = createUseHostEvent();
  globals['__getConfig'] = getConfig ?? (() => ({}));
  globals['__sendEventToHost'] = sendEventToHost;

  // Install DevTools if available
  const devtools = createDevToolsGuestAPI();
  installGlobalErrorHandlers(devtools);

  // Mark shims as installed
  globals['__REACT_SHIM__'] = true;
  globals['__RILL_DEBUG__'] = debug;
  globals['__RILL_GUEST_ENV__'] = true;
}
