/**
 * JSX Runtime for react-jsx transform
 *
 * Modern React JSX transform imports from 'react/jsx-runtime'.
 * This module provides the required exports: jsx, jsxs, Fragment.
 */

import { createElement, Fragment } from './react-core';

// jsx and jsxs are the same in our shim (no static children optimization needed)
export const jsx = createElement;
export const jsxs = createElement;

export { Fragment };
