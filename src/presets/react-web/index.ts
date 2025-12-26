/**
 * @rill/preset-react-web
 *
 * React Web preset for rill - default components and EngineView for browsers
 */

// Re-export runtime types for convenience
export type {
  ComponentMap,
  ComponentRegistry,
  ComponentType,
  Engine,
  EngineOptions,
} from '../../host';
// Default components for React Web
// Individual component exports
export type {
  ActivityIndicatorProps,
  ButtonProps,
  DefaultComponentName,
  FlatListProps,
  ImageProps,
  ImageSource,
  ScrollEvent,
  ScrollViewProps,
  SwitchProps,
  TextInputProps,
  TextProps,
  TouchableOpacityProps,
  ViewProps,
} from './components';
export {
  ActivityIndicator,
  Button,
  DefaultComponents,
  FlatList,
  Image,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from './components';
// EngineView component
export type { EngineViewProps } from './EngineView';
export { EngineView } from './EngineView';
