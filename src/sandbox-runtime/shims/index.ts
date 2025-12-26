/**
 * React Shims Entry Point
 *
 * Exports all React-related shims for the sandbox environment.
 */

// Main React API
export { React, ReactJSXDevRuntime, ReactJSXRuntime } from './react';

// React Native components
export { ReactNative } from './react-native';

// Core APIs (for direct import)
export {
  Children,
  cloneElement,
  createElement,
  Fragment,
  isValidElement,
} from './react-core';

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

// Context
export { createContext } from './context';

// Components
export { Component, ComponentClass, PureComponent, PureComponentClass } from './component';

// Registration
export { setRegisterComponentType } from './react-core';

// React Native individual components
export {
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
} from './react-native';
