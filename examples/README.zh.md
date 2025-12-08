# Rill 插件示例

本目录包含 Rill 插件开发和宿主集成示例，覆盖从基础到高级的全部特性。

## 示例列表

### 1. simple-plugin - 基础插件开发

**适合人群**: 初次接触 Rill 的开发者

**展示内容**:
- 基础组件: View, Text, TouchableOpacity, ScrollView
- 状态管理: useState, useEffect
- 宿主通信:
  - `useHostEvent` - 监听宿主事件
  - `useSendToHost` - 向宿主发送消息
  - `useConfig` - 获取插件配置
- 主题支持: 明暗主题切换

[查看示例 →](./simple-plugin)

---

### 2. host-integration - 宿主集成完整示例

**适合人群**: 需要在 React Native 应用中集成 Rill 的开发者

**展示内容**:
- ✅ Engine 实例创建和配置
- ✅ EngineView 生命周期管理
- ✅ 宿主与插件双向通信
- ✅ 错误处理和恢复
- ✅ 自定义组件注册
- ✅ QuickJS Provider 配置
- ✅ 动态插件加载
- ✅ 资源清理和内存管理

[查看示例 →](./host-integration)

---

### 3. advanced-features - 高级特性示例

**适合人群**: 需要优化性能和生产环境部署的开发者

**展示内容**:
- ✅ 性能指标追踪 (onMetric)
- ✅ 执行超时保护 (timeout)
- ✅ 模块白名单 (requireWhitelist)
- ✅ 健康检查 (getHealth)
- ✅ 批处理优化 (receiverMaxBatchSize)
- ✅ 自定义日志系统
- ✅ 调试模式配置
- ✅ 性能监控和告警

[查看示例 →](./advanced-features)

---

## 快速开始

### 构建插件

所有示例插件都遵循相同的构建流程:

```bash
# 进入任意示例目录
cd examples/simple-plugin  # 或 host-integration, advanced-features

# 安装依赖
npm install

# 构建插件
npm run build

# 开发模式 (不压缩 + sourcemap)
npm run build:dev

# 监听文件变化 (如果支持)
npm run watch
```

构建输出: `dist/bundle.js` 或 `dist/plugin.js`

## 项目结构

### 插件示例结构

```
simple-plugin/
├── package.json      # 项目配置
├── README.md         # 详细说明
├── src/
│   └── index.tsx     # 插件主入口
└── dist/
    └── bundle.js     # 构建输出
```

### 宿主集成示例结构

```
host-integration/
├── package.json
├── README.md         # 完整集成指南
├── src/
│   ├── plugin.tsx            # 插件代码
│   ├── HostApp.tsx           # 宿主应用示例
│   └── QuickJSProvider.tsx   # Provider 配置
└── dist/
    └── plugin.js
```

## 创建新插件

1. 复制 `simple-plugin` 目录
2. 修改 `package.json` 中的名称
3. 编辑 `src/index.tsx` 实现插件逻辑
4. 运行 `npm run build` 构建

## SDK 导入

```tsx
import {
  // 基础组件
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Button,

  // Hooks
  useHostEvent,      // 监听宿主事件
  useSendToHost,     // 发送消息到宿主
  useConfig,         // 获取插件配置

  // 类型
  StyleProp,
  LayoutEvent,
  ScrollEvent,
} from 'rill/sdk';
```

## 学习路径

推荐按以下顺序学习示例:

### 1️⃣ 新手入门

从 **simple-plugin** 开始，学习:
- 如何编写基础插件
- SDK 组件和 Hooks 的使用
- 插件构建流程

### 2️⃣ 宿主集成

阅读 **host-integration** 示例，理解:
- 如何在应用中集成 Rill
- Engine 和 EngineView 的使用
- 生命周期管理和错误处理
- 宿主与插件通信机制

### 3️⃣ 生产优化

研究 **advanced-features** 示例，掌握:
- 性能监控和优化
- 安全配置 (白名单、超时)
- 健康检查和错误恢复
- 生产环境最佳实践

---

## 核心概念

### 插件端 API

```tsx
import {
  // 基础组件
  View, Text, TouchableOpacity, ScrollView,
  Image, ActivityIndicator, Button,

  // Hooks
  useHostEvent,      // 监听宿主事件
  useSendToHost,     // 发送消息到宿主
  useConfig,         // 获取插件配置
} from 'rill/sdk';

// 发送消息到宿主
const sendToHost = useSendToHost();
sendToHost('MY_EVENT', { data: 'value' });

// 监听宿主事件
useHostEvent('REFRESH', () => {
  console.log('Host requested refresh');
});

// 带类型的事件处理
useHostEvent<{ theme: 'light' | 'dark' }>('THEME_CHANGE', (payload) => {
  console.log('Theme:', payload.theme);
});

// 获取配置
const config = useConfig<{ title: string }>();
console.log('Title:', config.title);
```

### 宿主端 API

```tsx
import { Engine, EngineView } from 'rill';

// 创建 Engine
const engine = new Engine({
  quickjs: provider,
  timeout: 5000,
  debug: true,
  onMetric: (name, value) => console.log(`${name}: ${value}ms`),
});

// 注册自定义组件
engine.register({ MapView: NativeMapView });

// 发送事件到插件
engine.sendEvent('THEME_CHANGE', { theme: 'dark' });

// 监听插件消息
engine.on('message', (msg) => console.log(msg));

// 渲染插件 UI
<EngineView
  engine={engine}
  bundleUrl="https://cdn.example.com/plugin.js"
  initialProps={{ userId: '123' }}
  onLoad={() => console.log('Loaded')}
  onError={(err) => console.error(err)}
/>
```

---

## 常见问题

### Q: 如何在插件中使用第三方库?

A: 需要在宿主端通过 `requireWhitelist` 配置允许的模块列表。参考 [advanced-features](./advanced-features) 示例。

### Q: 如何调试插件?

A:
1. 使用 `npm run build:dev` 构建带 sourcemap 的版本
2. 在 Engine 配置中启用 `debug: true`
3. 使用 console.log 输出日志 (宿主端可见)

### Q: 插件性能如何优化?

A: 参考 [advanced-features](./advanced-features) 示例中的性能监控和优化指南。

### Q: 如何处理插件错误?

A: 使用 EngineView 的 `onError` 回调和 `renderError` 自定义错误 UI。详见 [host-integration](./host-integration) 示例。

---

## 相关资源

- [Rill 文档](../README.zh.md)
- [API 参考](../docs/API.zh.md)
- [使用指南](../docs/GUIDE.zh.md)
- [架构设计](../docs/ARCHITECTURE.zh.md)
- [生产环境指南](../docs/PRODUCTION_GUIDE.zh.md)
