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
