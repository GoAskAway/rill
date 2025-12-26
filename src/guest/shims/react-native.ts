/**
 * React Native Components Registry for Sandbox
 *
 * Maps component names to string identifiers for the Host renderer.
 */

import type { RillReactNativeComponents } from '../types';

// ============================================
// React Native Component Registry
// ============================================

/**
 * React Native components - string identifiers for Host-side rendering
 */
export const ReactNative: RillReactNativeComponents = {
  View: 'View',
  Text: 'Text',
  Image: 'Image',
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
  Button: 'Button',
  ActivityIndicator: 'ActivityIndicator',
  FlatList: 'FlatList',
  TextInput: 'TextInput',
  Switch: 'Switch',
} as const;

// ============================================
// Individual Component Exports
// ============================================

export const View = ReactNative.View;
export const Text = ReactNative.Text;
export const Image = ReactNative.Image;
export const ScrollView = ReactNative.ScrollView;
export const TouchableOpacity = ReactNative.TouchableOpacity;
export const Button = ReactNative.Button;
export const ActivityIndicator = ReactNative.ActivityIndicator;
export const FlatList = ReactNative.FlatList;
export const TextInput = ReactNative.TextInput;
export const Switch = ReactNative.Switch;
