# Rill

轻量、无头、沙箱化的 React Native 动态 UI 渲染引擎。

> **rill** /rɪl/ n. 小溪、细流 - 寓意轻量、流畅的数据流动

## 特性

- **类 React 开发体验**：使用 JSX 和 Hooks 编写 Bundle
- **完全沙箱隔离**：多种沙箱模式（vm、worker）- Guest 崩溃不影响宿主
- **轻量高效**：无 WebView 开销，原生渲染性能
- **灵活扩展**：支持注册自定义业务组件
- **多租户支持**：`PooledEngine` 实现资源共享与故障隔离

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

```bash
# React Native (RN 0.82 + React 19.2)
bun add rill react@^19.2.1 react-native@^0.82 react-reconciler@^0.33

# Web (React 19.2)
bun add rill react@^19.2.1 react-dom@^19.2.1 react-reconciler@^0.33
```

### 宿主端集成

```tsx
import { Engine, EngineView } from 'rill';
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
import { View, Text, TouchableOpacity, useHostEvent, useConfig } from 'rill/sdk';

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
# 安装 CLI
bun add -g @anthropic/rill-cli

# 构建
rill build src/bundle.tsx -o dist/bundle.js

# 开发模式
rill build src/bundle.tsx --watch --no-minify --sourcemap
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
│  │  ├─ 创建沙箱 (QuickJS/Worker/VM)           │                 │
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
│  │  import { render } from 'rill/reconciler';                  │
│  │  import { View, Text } from 'rill/sdk';                     │
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

每个 Engine 拥有独立的 JS 沙箱 - 适用于单租户场景。

```typescript
const engine = new Engine({ sandbox: 'vm' });
```

### PooledEngine（多租户模式）

多个 Engine 共享 Worker 池 - 适用于多租户场景，具备资源限制和故障隔离能力。

```typescript
import { PooledEngine, createWorkerPool } from 'rill';

// 简单用法 - 使用全局池
const engine = new PooledEngine();

// 自定义池（含限制）
const pool = createWorkerPool({ maxWorkers: 4 });
const engine = new PooledEngine({ pool });
```

## 模块说明

| 模块 | 路径 | 说明 |
|------|------|------|
| SDK | `rill/sdk` | Guest 开发套件，虚组件和 Hooks |
| Runtime | `rill` | 宿主运行时，Engine/PooledEngine 和 EngineView |
| CLI | `@anthropic/rill-cli` | Bundle 打包工具 |

## API

### Engine

```typescript
import { Engine, PooledEngine } from 'rill';

// 独立引擎
const engine = new Engine(options?: EngineOptions);

// 池化引擎（多租户）
const pooledEngine = new PooledEngine(options?: PooledEngineOptions);

interface EngineOptions {
  sandbox?: 'vm' | 'worker' | 'none';  // 沙箱模式（不设置则自动检测）
  provider?: JSEngineProvider;          // 自定义 Provider
  timeout?: number;                     // 执行超时（默认 5000ms）
  debug?: boolean;                      // 调试模式
  logger?: Logger;                      // 自定义日志
}

// 注册组件
engine.register({ ComponentName: ReactComponent });

// 加载 Bundle
await engine.loadBundle(bundleUrl, initialProps);

// 发送事件到 Guest
engine.sendEvent('EVENT_NAME', payload);

// 更新配置
engine.updateConfig({ key: value });

// 销毁
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

## 性能优化

Rill 内置多种性能优化机制：

```tsx
import {
  ThrottledScheduler,
  VirtualScrollCalculator,
  PerformanceMonitor
} from 'rill/runtime';

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

## 调试工具

```tsx
import { createDevTools } from 'rill/devtools';

const devtools = createDevTools();
devtools.enable();

// 查看组件树
console.log(devtools.getComponentTreeText(nodeMap, rootChildren));

// 导出调试数据
const data = devtools.exportAll();
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
