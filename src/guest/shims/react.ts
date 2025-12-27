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
// React API Object
// ============================================

/**
 * Complete React API for sandbox environment
 */
export const React: RillReactAPI = {
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
