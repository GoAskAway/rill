# rill/let API Reference

rill/let 是 Guest 端 SDK，提供与 react-native 兼容的组件和 API。

## 设计原则

- **双模式运行**: Sandbox 内使用虚拟组件，Sandbox 外直接使用 react-native
- **与 react-native 兼容**: 代码可无缝切换 `import from 'rill/let'` ↔ `import from 'react-native'`
- **安全优先**: 不暴露可能造成安全风险的 native 能力

## 状态说明

| 标记 | 说明 |
|------|------|
| ✅ 已实现 | 当前版本可用 |
| 🔜 待实现 | 计划支持，尚未实现 |
| ⚠️ 跳过 | 平台特定或不适用于 Guest-Host 模式 |
| ❌ 禁止 | 安全原因不支持 |

---

## Components

### Core

| 组件 | 状态 | 说明 |
|------|------|------|
| `View` | ✅ 已实现 | 基础容器组件 |
| `Text` | ✅ 已实现 | 文本组件 |
| `Image` | ✅ 已实现 | 图片组件 |
| `ImageBackground` | ✅ 已实现 | 背景图组件 |

### Scrolling

| 组件 | 状态 | 说明 |
|------|------|------|
| `ScrollView` | ✅ 已实现 | 滚动容器 |
| `FlatList` | ✅ 已实现 | 高性能列表，renderItem 回调需序列化 |
| `SectionList` | ✅ 已实现 | 分组列表 |
| `VirtualizedList` | ✅ 已实现 | 虚拟化列表基类 |
| `RefreshControl` | ✅ 已实现 | 下拉刷新控件 |

### Input

| 组件 | 状态 | 说明 |
|------|------|------|
| `TextInput` | ✅ 已实现 | 文本输入框 |
| `Button` | ✅ 已实现 | 按钮 |
| `Switch` | ✅ 已实现 | 开关 |
| `Pressable` | ✅ 已实现 | 可按压容器 |

### Touchables

| 组件 | 状态 | 说明 |
|------|------|------|
| `TouchableOpacity` | ✅ 已实现 | 透明度反馈触摸 |
| `TouchableHighlight` | ✅ 已实现 | 高亮反馈触摸 |
| `TouchableWithoutFeedback` | ✅ 已实现 | 无反馈触摸 |
| `TouchableNativeFeedback` | ⚠️ 跳过 | Android 专属，涟漪效果 |

### Feedback

| 组件 | 状态 | 说明 |
|------|------|------|
| `ActivityIndicator` | ✅ 已实现 | 加载指示器 |
| `Modal` | ✅ 已实现 | 模态框 |
| `StatusBar` | ⚠️ 跳过 | 全局状态栏，Guest 不应控制 |

### Layout

| 组件 | 状态 | 说明 |
|------|------|------|
| `SafeAreaView` | ✅ 已实现 | 安全区域容器 |
| `KeyboardAvoidingView` | ✅ 已实现 | 键盘避让容器 |

### Platform Specific (跳过)

| 组件 | 状态 | 说明 |
|------|------|------|
| `DrawerLayoutAndroid` | ⚠️ 跳过 | Android 专属抽屉 |
| `InputAccessoryView` | ⚠️ 跳过 | iOS 专属键盘附件栏 |

---

## Hooks

### React Native Hooks

| Hook | 状态 | 说明 |
|------|------|------|
| `useColorScheme` | 🔜 待实现 | 获取当前颜色主题 (light/dark)，Host 注入 |
| `useWindowDimensions` | 🔜 待实现 | 获取窗口尺寸，Host 注入 |

### Rill 专有 Hooks

| Hook | 状态 | 说明 |
|------|------|------|
| `useHostEvent` | ✅ 已实现 | 订阅 Host 事件 |
| `useSendToHost` | ✅ 已实现 | 向 Host 发送消息 |
| `useConfig` | ✅ 已实现 | 获取 Host 配置 |
| `useRemoteRef` | ✅ 已实现 | 远程引用 Host 组件实例 |

---

## APIs

### Pure JS (无需 Host 交互)

| API | 状态 | 说明 |
|-----|------|------|
| `StyleSheet` | ✅ 已实现 | 样式表创建 |
| `Easing` | 🔜 待实现 | 动画缓动函数 |

### Platform Info (Host 注入)

| API | 状态 | 说明 |
|-----|------|------|
| `Platform` | ✅ 已实现 | 平台信息 (OS, Version, select) |
| `Dimensions` | ✅ 已实现 | 屏幕/窗口尺寸 |
| `PixelRatio` | 🔜 待实现 | 像素密度比 |
| `Appearance` | 🔜 待实现 | 外观设置 (colorScheme) |
| `I18nManager` | 🔜 待实现 | 国际化设置 (RTL) |

### Event Subscription (Host→Guest 推送)

| API | 状态 | 说明 |
|-----|------|------|
| `AppState` | 🔜 待实现 | 应用前后台状态 |
| `Keyboard` | 🔜 待实现 | 键盘显示/隐藏事件 |
| `BackHandler` | ⚠️ 跳过 | Android 专属返回键 |
| `AccessibilityInfo` | ⚠️ 跳过 | 无障碍信息，复杂度高 |

### Host Capability (Guest→Host 请求)

| API | 状态 | 说明 |
|-----|------|------|
| `Alert` | ✅ 已实现 | 显示警告框 |
| `Linking` | ✅ 已实现 | 打开链接 |
| `Share` | 🔜 待实现 | 系统分享 |
| `Vibration` | 🔜 待实现 | 振动反馈 |

### Animation

| API | 状态 | 说明 |
|-----|------|------|
| `Animated` | ✅ 已实现 | 动画系统 (基础支持) |
| `LayoutAnimation` | ⚠️ 跳过 | 布局动画，需 native 深度支持 |

### Advanced

| API | 状态 | 说明 |
|-----|------|------|
| `PanResponder` | ⚠️ 跳过 | 复杂手势系统 |
| `InteractionManager` | ⚠️ 跳过 | 交互调度，Host 内部使用 |
| `NativeModules` | ❌ 禁止 | 安全风险，直接访问 native |
| `DevSettings` | ❌ 禁止 | 开发工具 |
| `Systrace` | ❌ 禁止 | 调试工具 |

---

## Types

所有 TypeScript 类型均可支持（纯编译时，无运行时开销）。

### Style Types

| 类型 | 状态 | 说明 |
|------|------|------|
| `ViewStyle` | ✅ 已实现 | View 样式类型 |
| `TextStyle` | ✅ 已实现 | Text 样式类型 |
| `ImageStyle` | ✅ 已实现 | Image 样式类型 |
| `FlexStyle` | ✅ 已实现 | Flex 布局样式 |
| `StyleProp<T>` | ✅ 已实现 | 样式属性类型 |

### Value Types

| 类型 | 状态 | 说明 |
|------|------|------|
| `ColorValue` | ✅ 已实现 | 颜色值类型 |
| `DimensionValue` | ✅ 已实现 | 尺寸值类型 |

### Event Types

| 类型 | 状态 | 说明 |
|------|------|------|
| `LayoutEvent` | ✅ 已实现 | 布局变化事件 |
| `ScrollEvent` | ✅ 已实现 | 滚动事件 |
| `GestureResponderEvent` | ✅ 已实现 | 手势事件 |
| `NativeSyntheticEvent<T>` | ✅ 已实现 | 原生合成事件 |

### Component Props Types

| 类型 | 状态 | 说明 |
|------|------|------|
| `ViewProps` | ✅ 已实现 | View 组件属性 |
| `TextProps` | ✅ 已实现 | Text 组件属性 |
| `ImageProps` | ✅ 已实现 | Image 组件属性 |
| `ScrollViewProps` | ✅ 已实现 | ScrollView 组件属性 |
| `FlatListProps<T>` | ✅ 已实现 | FlatList 组件属性 |
| `TextInputProps` | ✅ 已实现 | TextInput 组件属性 |
| `TouchableOpacityProps` | ✅ 已实现 | TouchableOpacity 组件属性 |
| `ButtonProps` | ✅ 已实现 | Button 组件属性 |
| `SwitchProps` | ✅ 已实现 | Switch 组件属性 |
| `ActivityIndicatorProps` | ✅ 已实现 | ActivityIndicator 组件属性 |
| `ModalProps` | 🔜 待实现 | Modal 组件属性 |
| `PressableProps` | 🔜 待实现 | Pressable 组件属性 |

---

## 统计

| 类别 | 已实现 | 待实现 | 跳过 | 禁止 |
|------|--------|--------|------|------|
| Components | 18 | 0 | 4 | 0 |
| Hooks | 4 | 2 | 0 | 0 |
| APIs | 6 | 8 | 5 | 3 |
| Types | 18 | 2 | 0 | 0 |

---

## 使用示例

```tsx
// Guest 代码 - 可以无缝切换到 react-native
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useHostEvent,
  useSendToHost,
} from 'rill/let';

export function Counter() {
  const [count, setCount] = React.useState(0);
  const sendToHost = useSendToHost();

  // 监听 Host 事件
  useHostEvent('RESET', () => setCount(0));

  const handlePress = () => {
    setCount(c => c + 1);
    sendToHost('COUNT_CHANGED', { count: count + 1 });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.count}>{count}</Text>
      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <Text style={styles.buttonText}>+1</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  count: { fontSize: 48, fontWeight: 'bold' },
  button: { padding: 16, backgroundColor: '#007AFF', borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 18 },
});
```
