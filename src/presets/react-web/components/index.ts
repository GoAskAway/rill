/**
 * Default component exports for React Web
 */

export type { ActivityIndicatorProps } from './ActivityIndicator';
export { ActivityIndicator } from './ActivityIndicator';
export type { ButtonProps } from './Button';
export { Button } from './Button';
export type { FlatListProps } from './FlatList';
export { FlatList } from './FlatList';
export type { ImageProps, ImageSource } from './Image';
export { Image } from './Image';
export type { ScrollEvent, ScrollViewProps } from './ScrollView';
export { ScrollView } from './ScrollView';
export type { SwitchProps } from './Switch';
export { Switch } from './Switch';
export type { TextProps } from './Text';
export { Text } from './Text';
export type { TextInputProps } from './TextInput';
export { TextInput } from './TextInput';
export type { TouchableOpacityProps } from './TouchableOpacity';
export { TouchableOpacity } from './TouchableOpacity';
export type { ViewProps } from './View';
export { View } from './View';

import { ActivityIndicator } from './ActivityIndicator';
import { Button } from './Button';
import { FlatList } from './FlatList';
import { Image } from './Image';
import { ScrollView } from './ScrollView';
import { Switch } from './Switch';
import { Text } from './Text';
import { TextInput } from './TextInput';
import { TouchableOpacity } from './TouchableOpacity';
import { View } from './View';

/**
 * Default component mapping for React Web
 */
export const DefaultComponents = {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  Button,
  Switch,
  ActivityIndicator,
} as const;

export type DefaultComponentName = keyof typeof DefaultComponents;
