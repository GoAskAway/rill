# Rill

轻量、无头、沙箱化的 React Native 动态 UI 渲染引擎。

> **rill** /rɪl/ n. 小溪、细流 - 寓意轻量、流畅的数据流动

## 特性

- **类 React 开发体验**：使用 JSX 和 Hooks 编写 Bundle
- **完全沙箱隔离**：多种沙箱模式（vm、worker）- Guest 崩溃不影响宿主
- **轻量高效**：无 WebView 开销，原生渲染性能
- **灵活扩展**：支持注册自定义业务组件
- **专用运行时**：每个 Engine 拥有独立的 JS 运行时/线程，最大化稳定性

## 快速开始

### 安装

兼容性与依赖

- React 和 react-reconciler 需要配套使用，避免安装/运行时问题
- 平台依赖二选一：react-dom（Web）或 react-native（RN）

推荐配对

- React 18.2.x ↔ react-reconciler 0.29–0.31
- React 19.0.x ↔ react-reconciler 0.32.x
- React 19.2.x+ ↔ react-reconciler 0.33.x

安装示例

在 monorepo 中，通过 package.json 添加依赖：

```json
{
  "dependencies": {
    "@rill/core": "workspace:*",
    "react": "^19.2.1",
    "react-native": "^0.82",
    "react-reconciler": "^0.33"
  }
}
```

或从 GitHub 安装：

```bash
bun add github:kookyleo/rill#packages/core
```

### 宿主端集成

```tsx
import { Engine, EngineView } from '@rill/core';
import { NativeStepList } from './components/NativeStepList';

// 1. 创建引擎实例
const engine = new Engine();

// 2. 注册自定义组件
engine.register({
  StepList: NativeStepList,
});

// 3. 渲染 Guest Bundle
function App() {
  return (
    <EngineView
      engine={engine}
      bundleUrl="https://cdn.example.com/bundle.js"
      initialProps={{ theme: 'dark' }}
      onLoad={() => console.log('Bundle loaded')}
      onError={(err) => console.error('Bundle error:', err)}
    />
  );
}
```

### Guest Bundle 开发

```tsx
import { View, Text, TouchableOpacity, useHostEvent, useConfig } from '@rill/core/sdk';

export default function MyBundle() {
  const config = useConfig<{ theme: string }>();

  useHostEvent('REFRESH', () => {
    console.log('Host requested refresh');
  });

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Hello from Guest!</Text>
      <Text>Theme: {config.theme}</Text>
      <TouchableOpacity onPress={() => console.log('Pressed!')}>
        <Text>Click Me</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### 构建 Bundle

```bash
# 使用 workspace 中的 CLI
bun run --filter @rill/cli build src/bundle.tsx -o dist/bundle.js

# 或者直接运行 CLI 脚本
bun packages/cli/src/index.ts build src/bundle.tsx -o dist/bundle.js

# 开发模式
bun packages/cli/src/index.ts build src/bundle.tsx --watch --no-minify --sourcemap
```

## 架构

### 高层概览

```
┌─────────────────────────────────────────────────────────────────┐
│                       宿主 App (React Native)                    │
├─────────────────────────────────────────────────────────────────┤
│  EngineView → Engine → JS Sandbox (vm/worker/none)              │
│                            │                                     │
│                            ▼                                     │
│                    ┌───────────────────┐                        │
│                    │   Guest Bundle.js  │                        │
│                    │   (React + SDK)    │                        │
│                    └───────────────────┘                        │
│                            │                                     │
│                            ▼                                     │
│                    Reconciler (JSON Ops)                        │
│                            │                                     │
│                            ▼                                     │
│                    Receiver → Registry → 原生组件树              │
└─────────────────────────────────────────────────────────────────┘
```

### 详细数据流

```
┌──────────────────────────────────────────────────────────────────┐
│                    宿主 (原生环境)                                 │
│  React Native App / Node.js / Browser                            │
│                                                                   │
│  ┌────────────────────────────────────────────┐                 │
│  │  Engine (runtime/engine.ts)                │                 │
│  │  ├─ 创建沙箱 (vm/worker/none)              │                 │
│  │  ├─ 注入 reconciler 到沙箱                 │                 │
│  │  └─ 接收来自 Guest 的操作                  │                 │
│  └────────────────┬───────────────────────────┘                 │
│                   │ ↑                                            │
│                   │ │ sendToHost(OperationBatch)                │
│                   │ │ { operations: [...] }                     │
└───────────────────┼─┼──────────────────────────────────────────┘
                    │ │
                    │ │ JSON 消息
                    │ │
┌───────────────────┼─┼──────────────────────────────────────────┐
│         沙箱      │ │  (隔离的 JS 环境)                          │
│    QuickJS / Web Worker / Node VM                               │
│                   │ │                                            │
│  ┌────────────────┼─┼─────────────────┐                        │
│  │  Guest 代码    │ │                 │                        │
│  │  (用户的 React Bundle)             │                        │
│  │                ↓ │                 │                        │
│  │  import { View, Text } from '@rill/core/sdk';                     │
│  │                  │                 │                        │
│  │  <View>          │                 │                        │
│  │    <Text>你好</Text>               │                        │
│  │  </View>         │                 │                        │
│  └──────────────────┼─────────────────┘                        │
│                     │                                            │
│  ┌──────────────────┼─────────────────┐                        │
│  │  Reconciler      ↓                 │                        │
│  │  (reconciler/index.ts)             │                        │
│  │                                     │                        │
│  │  1. React 组件 → Fiber 节点        │                        │
│  │  2. 计算 diff (React Fiber)        │                        │
│  │  3. 生成 JSON 操作:                │                        │
│  │     { op: 'CREATE', type: 'View', props: {...} }            │
│  │     { op: 'APPEND', id: 2, parentId: 1 }                    │
│  │  4. 调用 sendToHost() ─────────────────┘                    │
│  │     将操作发送到宿主                                          │
│  └─────────────────────────────────────────────────────────────┘
└──────────────────────────────────────────────────────────────────┘
```

**关键要点：**

- **Reconciler 运行在沙箱中**：React reconciler 在隔离环境内执行，将 React 组件转换为 JSON 操作
- **sendToHost 方向**：沙箱 → 宿主（操作从 guest 流向 host）
- **完全隔离**：Guest 代码崩溃不会影响宿主应用
- **零 WebView 开销**：直接通过 React reconciliation 渲染原生组件

## Engine 类型

### Engine（独立模式）

每个 Engine 实例创建独立的 JS 沙箱。为每个需要隔离的上下文（如每个 Tab/View）创建新的 Engine。

```typescript
// 创建指定沙箱模式的引擎
const engine = new Engine({ sandbox: 'vm', debug: true });

// 注册组件并加载 Bundle
engine.register({ CustomComponent });
await engine.loadBundle(bundleCode);

// 使用完毕后销毁以释放资源
engine.destroy();
```

**资源管理**（专用引擎架构中的关键点）：
- 每个 Engine 拥有独立的 JS 运行时/线程 - 忘记调用 `destroy()` = 永久性内存/线程泄漏
- **务必**在 Tab/View 关闭时调用 `engine.destroy()`
- React 中：使用 `useEffect` 清理函数确保 destroy 被调用
- 使用 `engine.getResourceStats()` 监控：`{ timers, nodes, callbacks }`

**生命周期最佳实践**：
```typescript
// React 组件示例
function MyTabContent({ tabId, bundleUrl }) {
  const engineRef = useRef<Engine | null>(null);

  useEffect(() => {
    // Tab 挂载时创建引擎
    const engine = new Engine({ debug: true });
    engine.register(DefaultComponents);
    engine.loadBundle(bundleUrl);
    engineRef.current = engine;

    // 关键：Tab 卸载时清理
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [bundleUrl]);

  return <EngineView engine={engineRef.current} />;
}
```

## 模块说明

| 模块 | 路径 | 说明 |
|------|------|------|
| SDK | `@rill/core/sdk` | Guest 开发套件，虚组件和 Hooks |
| Runtime | `@rill/core` | 宿主运行时，Engine 和 EngineView |
| CLI | `@rill/cli` | Bundle 打包工具 (Vite-based) |

## API

### Engine

```typescript
import { Engine } from '@rill/core';

const engine = new Engine(options?: EngineOptions);

interface EngineOptions {
  sandbox?: 'vm' | 'worker' | 'none';  // 沙箱模式（不设置则自动检测）
  provider?: JSEngineProvider;          // 自定义 Provider
  timeout?: number;                     // 执行超时（默认 5000ms）
  debug?: boolean;                      // 调试模式
  logger?: {                            // 自定义日志
    log: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
  };
  onMetric?: (name: string, value: number, extra?: Record<string, unknown>) => void;  // 性能指标回调
  requireWhitelist?: string[];          // 允许的 require() 模块
  receiverMaxBatchSize?: number;        // 每批次最大操作数（默认 5000）- 关键：保护 Host UI 响应性
}

// 注册组件
engine.register({ ComponentName: ReactComponent });

// 加载 Bundle
await engine.loadBundle(bundleUrl, initialProps);

// 发送事件到 Guest
engine.sendEvent('EVENT_NAME', payload);

// 更新配置
engine.updateConfig({ key: value });

// 监控资源
const stats = engine.getResourceStats();
console.log(`定时器: ${stats.timers}, 节点: ${stats.nodes}, 回调: ${stats.callbacks}`);

// 获取唯一引擎 ID
console.log(`引擎 ID: ${engine.id}`);

// 健康检查
const health = engine.getHealth();

// 订阅引擎事件
engine.on('load', () => console.log('Bundle 已加载'));
engine.on('error', (error: Error) => console.error('Guest 错误:', error));
engine.on('fatalError', (error: Error) => console.error('致命错误:', error)); // 触发后引擎自动销毁
engine.on('destroy', () => console.log('引擎已销毁'));
engine.on('operation', (batch: OperationBatch) => { /* ... */ });
engine.on('message', (message: GuestMessage) => { /* ... */ });

// 内存泄漏检测（用于 Host 事件监听器）
engine.setMaxListeners(20);  // 提高监听器阈值
const limit = engine.getMaxListeners();

// 销毁（释放所有资源：定时器、节点、回调、运行时）
engine.destroy();
```

### SDK Hooks

```typescript
// 订阅宿主事件
useHostEvent('EVENT_NAME', (payload) => {
  // 处理事件
});

// 获取初始配置
const config = useConfig<ConfigType>();

// 发送消息到宿主
const send = useSendToHost();
send('EVENT_NAME', payload);
```

### 默认组件

- `View` - 容器组件
- `Text` - 文本组件
- `Image` - 图片组件
- `ScrollView` - 滚动容器
- `TouchableOpacity` - 可触摸组件
- `TextInput` - 文本输入框（带状态管理）
- `FlatList` - 虚拟化列表（高性能）
- `Button` - 按钮组件
- `Switch` - 开关组件
- `ActivityIndicator` - 加载指示器

### 错误边界

```typescript
import { RillErrorBoundary } from '@rill/core/sdk';

function App() {
  return (
    <RillErrorBoundary
      fallback={<Text>出错了</Text>}
      onError={(error, info) => {
        // info 包含 componentStack
        sendToHost('RENDER_ERROR', { message: error.message });
      }}
    >
      <MyComponent />
    </RillErrorBoundary>
  );
}
```

## 性能优化

Rill 内置多种性能优化机制：

```tsx
import {
  ThrottledScheduler,
  VirtualScrollCalculator,
  PerformanceMonitor
} from '@rill/core';

// 批量更新节流
const scheduler = new ThrottledScheduler(onBatch, {
  maxBatchSize: 100,
  throttleMs: 16,
  enableMerge: true,
});

// 虚拟滚动
const calculator = new VirtualScrollCalculator({
  estimatedItemHeight: 60,
  overscan: 5,
});

// 性能监控
const monitor = new PerformanceMonitor();
```

## 调试

使用内置的资源监控和事件跟踪：

```tsx
// 监控资源使用情况
const stats = engine.getResourceStats();
console.log('资源:', stats);

// 追踪错误
engine.on('error', (error: Error) => {
  console.error('[Guest 错误]', error);
});

engine.on('fatalError', (error: Error) => {
  console.error('[致命错误 - 引擎已销毁]', error);
});

// 监控操作
engine.on('operation', (batch) => {
  console.log(`操作数量: ${batch.operations.length}`);
});
```

## 文档

- [API 文档](../../docs/API.zh.md) - 完整 API 参考
- [使用指南](../../docs/GUIDE.zh.md) - 入门教程和最佳实践
- [架构设计](../../docs/ARCHITECTURE.zh.md) - 系统架构详解
- [生产环境指南](../../docs/PRODUCTION_GUIDE.zh.md) - 生产部署检查清单
- [示例](../../examples/) - 完整源码示例

## 开发

```bash
# 安装依赖
bun install

# 构建
bun run build

# 开发模式
bun run build:watch

# 类型检查
bun run typecheck

# 测试
bun test

# 测试覆盖率
bun test --coverage
```

## 测试

项目包含完整的测试套件：

- 单元测试：各模块功能测试
- 集成测试：端到端场景测试
- 覆盖率目标：80%+ 代码覆盖

```bash
bun test           # 运行所有测试
bun test --watch   # 监听模式
bun test --coverage  # 生成覆盖率报告
```

## 许可证

Apache-2.0
