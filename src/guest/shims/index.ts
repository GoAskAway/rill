/**
 * React Shims Entry Point
 *
 * Exports all React-related shims for the sandbox environment.
 */

// Components
export { Component, ComponentClass, PureComponent, PureComponentClass } from './component';
// Context
export { createContext } from './context';
// Hooks (for direct import)
export {
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
} from './hooks';
// Main React API
export { React, ReactJSXDevRuntime, ReactJSXRuntime } from './react';
// Core APIs (for direct import)
// Registration
export {
  Children,
  cloneElement,
  createElement,
  Fragment,
  isValidElement,
  setRegisterComponentType,
} from './react-core';
// React Native components
// React Native individual components
export {
  ActivityIndicator,
  Button,
  FlatList,
  Image,
  ReactNative,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from './react-native';
