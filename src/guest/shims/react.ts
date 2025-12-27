/**
 * React API for Sandbox
 *
 * Complete React API combining all modules.
 * This is the main export that provides the React global.
 */

import type { RillJSXRuntime, RillReactAPI } from '../types';
import { Component, PureComponent } from './component';
import { createContext } from './context';
import {
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useReducer,
  useRef,
  useState,
} from './hooks';
import { Children, cloneElement, createElement, Fragment, isValidElement } from './react-core';

// ============================================
// React Internals for react-reconciler compatibility
// ============================================
// react-reconciler accesses React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
// We provide a minimal implementation of the Scheduler (S) property

// Scheduler priority constants
const ImmediatePriority = 1;
const UserBlockingPriority = 2;
const NormalPriority = 3;
const LowPriority = 4;
const IdlePriority = 5;

// Minimal scheduler implementation for react-reconciler
// biome-ignore lint/suspicious/noExplicitAny: React internals require any
const MinimalScheduler: any = {
  unstable_ImmediatePriority: ImmediatePriority,
  unstable_UserBlockingPriority: UserBlockingPriority,
  unstable_NormalPriority: NormalPriority,
  unstable_LowPriority: LowPriority,
  unstable_IdlePriority: IdlePriority,

  unstable_now: () => performance?.now?.() ?? Date.now(),

  // biome-ignore lint/suspicious/noExplicitAny: Scheduler callback type
  unstable_scheduleCallback: (priority: number, callback: any) => {
    // Use setTimeout for scheduling in sandbox environment
    const timeoutId = setTimeout(() => {
      try {
        callback();
      } catch (e) {
        console.error('[rill:scheduler] Callback error:', e);
      }
    }, 0);
    return { id: timeoutId };
  },

  // biome-ignore lint/suspicious/noExplicitAny: Scheduler task type
  unstable_cancelCallback: (task: any) => {
    if (task && task.id) {
      clearTimeout(task.id);
    }
  },

  unstable_shouldYield: () => false,

  unstable_requestPaint: () => {},

  unstable_getCurrentPriorityLevel: () => NormalPriority,

  // biome-ignore lint/suspicious/noExplicitAny: Scheduler callback type
  unstable_runWithPriority: (priority: number, callback: any) => callback(),

  // biome-ignore lint/suspicious/noExplicitAny: Scheduler callback type
  unstable_wrapCallback: (callback: any) => callback,

  unstable_next: (callback: () => void) => callback(),

  unstable_forceFrameRate: () => {},

  unstable_Profiling: null,
};

// React 19 internals structure
// react-reconciler accesses these properties directly on ReactSharedInternals
// biome-ignore lint/suspicious/noExplicitAny: React internals
const ReactSharedInternals: any = {
  H: null, // ReactCurrentDispatcher (hooks)
  A: null, // ReactCurrentActQueue
  T: null, // ReactCurrentBatchConfig
  S: MinimalScheduler, // Scheduler - required by react-reconciler
  // react-reconciler checks `null !== ReactSharedInternals.actQueue` before using
  // Setting to null prevents act() testing mode from being activated
  actQueue: null,
};

// ============================================
// React API Object
// ============================================

/**
 * Complete React API for sandbox environment
 * Includes internals required by react-reconciler
 */
// biome-ignore lint/suspicious/noExplicitAny: React object needs internals attached
export const React: RillReactAPI & Record<string, any> = {
  // Core
  createElement,
  Fragment,
  isValidElement,
  cloneElement,
  Children,

  // Hooks
  useState,
  useRef,
  useMemo,
  useCallback,
  useReducer,
  useId,
  useEffect,
  useContext,

  // Context
  createContext,

  // Components
  Component,
  PureComponent,

  // React internals for react-reconciler compatibility
  // React 19 uses different property names in different versions
  __CLIENT_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_WARNED: ReactSharedInternals,
  __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE: ReactSharedInternals,
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: ReactSharedInternals,
};

// ============================================
// JSX Runtime
// ============================================

/**
 * JSX Runtime for modern JSX transform
 */
export const ReactJSXRuntime: RillJSXRuntime = {
  jsx: createElement,
  jsxs: createElement,
  jsxDEV: createElement,
  Fragment,
};

/**
 * JSX Dev Runtime (same as production for sandbox)
 */
export const ReactJSXDevRuntime: RillJSXRuntime = ReactJSXRuntime;

// ============================================
// Re-exports for convenience
// ============================================

export {
  // Core
  Children,
  cloneElement,
  createElement,
  Fragment,
  isValidElement,
  // Context
  createContext,
  // Components
  Component,
  PureComponent,
  // Hooks
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useReducer,
  useRef,
  useState,
  // Internals - exported for CommonJS wrapper compatibility
  // react-reconciler accesses these via __toCommonJS(exports_react).__CLIENT_INTERNALS...
  ReactSharedInternals as __CLIENT_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_WARNED,
  ReactSharedInternals as __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
  ReactSharedInternals as __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
};

// Default export for `import React from 'react'`
export default React;

// Extend React object with namespace types for `React.ReactNode` style access
// biome-ignore lint/suspicious/noExplicitAny: Namespace type extensions
(React as any).ReactNode = undefined; // Type marker only
// biome-ignore lint/suspicious/noExplicitAny: Namespace type extensions
(React as any).ReactElement = undefined; // Type marker only
// biome-ignore lint/suspicious/noExplicitAny: Namespace type extensions
(React as any).FC = undefined; // Type marker only
// biome-ignore lint/suspicious/noExplicitAny: Namespace type extensions
(React as any).ElementType = undefined; // Type marker only
// biome-ignore lint/suspicious/noExplicitAny: Namespace type extensions
(React as any).Key = undefined; // Type marker only

// Declare React namespace for TypeScript
declare namespace React {
  // biome-ignore lint/suspicious/noExplicitAny: Namespace type
  type ReactNode = any;
  // biome-ignore lint/suspicious/noExplicitAny: Namespace type
  type ReactElement<P = any> = any;
  // biome-ignore lint/suspicious/noExplicitAny: Namespace type
  type FC<P = any> = (props: P) => ReactElement | null;
  // biome-ignore lint/suspicious/noExplicitAny: Namespace type
  type ElementType<P = any> = any;
  type Key = string | number | bigint;
}

// ============================================
// Type exports for TypeScript compatibility
// ============================================

// Use permissive types to avoid conflicts with internal Rill types
// These are used when counterapp imports from 'react' (mapped to this shim)

/** React element type (permissive for rill internal compatibility) */
// biome-ignore lint/suspicious/noExplicitAny: Permissive type for compatibility
export type ReactElement<P = any> = {
  // biome-ignore lint/suspicious/noExplicitAny: Permissive type for compatibility
  type: any;
  props: P;
  // biome-ignore lint/suspicious/noExplicitAny: Permissive type for compatibility
  key?: any;
  // biome-ignore lint/suspicious/noExplicitAny: Permissive type for compatibility
  [key: string]: any; // Allow any additional properties
};

/** React node type (anything renderable) */
// biome-ignore lint/suspicious/noExplicitAny: Permissive type for compatibility
export type ReactNode = any;

/** Function component type */
// biome-ignore lint/suspicious/noExplicitAny: Permissive type for compatibility
export type FC<P = any> = (props: P) => ReactElement | null;

/** Component type (function or class) */
// biome-ignore lint/suspicious/noExplicitAny: Permissive type for compatibility
export type ComponentType<P = any> = FC<P> | typeof Component;

/** Key type */
export type Key = string | number | bigint;

/** Element type */
// biome-ignore lint/suspicious/noExplicitAny: Permissive type for compatibility
export type ElementType<P = any> = string | FC<P> | ComponentType<P>;

/** Ref types */
export type Ref<T> = { current: T | null } | ((instance: T | null) => void) | null;
export type RefObject<T> = { current: T | null };
