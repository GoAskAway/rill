# 宿主集成示例

本示例展示如何在 React Native 应用中完整集成 Rill 插件系统,包括:

- ✅ Engine 实例创建和配置
- ✅ EngineView 生命周期管理
- ✅ 宿主与插件双向通信
- ✅ 错误处理和恢复
- ✅ 自定义组件注册
- ✅ QuickJS Provider 配置

## 项目结构

```
host-integration/
├── src/
│   ├── plugin.tsx           # 插件代码 (在沙箱中运行)
│   ├── HostApp.tsx           # 宿主应用示例
│   └── QuickJSProvider.tsx   # QuickJS Provider 配置
├── dist/
│   └── plugin.js             # 构建后的插件包
├── package.json
└── README.md
```

## 快速开始

### 1. 构建插件

```bash
npm install
npm run build
```

### 2. 在宿主应用中使用

参考 `src/HostApp.tsx` 中的集成示例:

```tsx
import { Engine, EngineView } from 'rill';
import { createQuickJSProvider } from './QuickJSProvider';

// 创建 Engine 实例
const engine = new Engine({
  quickjs: createQuickJSProvider(),
  timeout: 5000,
  debug: true,
});

// 注册自定义组件 (可选)
engine.register({
  CustomButton: NativeCustomButton,
});

// 在组件中使用
<EngineView
  engine={engine}
  bundleUrl="./dist/plugin.js"  // 或远程 URL
  initialProps={{ userId: '123' }}
  onLoad={() => console.log('Plugin loaded')}
  onError={(err) => console.error('Plugin error:', err)}
/>
```

## 关键功能

### 1. Engine 配置

```tsx
const engine = new Engine({
  // QuickJS provider (必需)
  quickjs: createQuickJSProvider(),

  // 执行超时 (毫秒)
  timeout: 5000,

  // 调试模式
  debug: true,

  // 自定义日志
  logger: {
    log: console.log,
    warn: console.warn,
    error: console.error,
  },

  // 允许的模块白名单
  requireWhitelist: ['lodash', 'date-fns'],

  // 性能指标回调
  onMetric: (name, value) => {
    console.log(`Metric: ${name} = ${value}ms`);
  },
});
```

### 2. 双向通信

**宿主发送事件到插件:**

```tsx
// 在宿主代码中
engine.sendEvent('THEME_CHANGE', { theme: 'dark' });
```

**插件发送消息到宿主:**

```tsx
// 在插件代码中
import { useSendToHost } from 'rill/sdk';

const sendToHost = useSendToHost();
sendToHost('USER_ACTION', { action: 'click', target: 'button' });
```

**宿主监听插件消息:**

```tsx
// 在宿主代码中
engine.on('message', (message) => {
  console.log('From plugin:', message.event, message.payload);
});
```

### 3. 生命周期管理

```tsx
<EngineView
  engine={engine}
  bundleUrl={pluginUrl}

  // 加载完成
  onLoad={() => {
    console.log('Plugin ready');
    engine.sendEvent('INIT', { config });
  }}

  // 错误处理
  onError={(error) => {
    console.error('Plugin error:', error);
    // 上报错误、显示降级 UI 等
  }}

  // 销毁回调
  onDestroy={() => {
    console.log('Plugin destroyed');
    // 清理资源
  }}

  // 自定义加载 UI
  fallback={<CustomLoader />}

  // 自定义错误 UI
  renderError={(err) => <CustomError error={err} />}
/>
```

### 4. 自定义组件注册

将原生组件暴露给插件:

```tsx
import { requireNativeComponent } from 'react-native';

// 原生组件
const NativeMap = requireNativeComponent('RNMapView');

// 注册到 Engine
engine.register({
  MapView: NativeMap,
});
```

在插件中使用:

```tsx
import { View } from 'rill/sdk';

// 自动获取注册的组件
function Plugin() {
  return <MapView region={...} />;
}
```

### 5. 错误处理和恢复

```tsx
// 监听错误
engine.on('error', (error) => {
  console.error('Runtime error:', error);

  // 检查健康状态
  const health = engine.getHealth();
  console.log('Error count:', health.errorCount);

  // 如果错误过多,可以选择重新加载
  if (health.errorCount > 5) {
    engine.destroy();
    // 重新创建 engine 并加载
  }
});
```

## 生产环境最佳实践

### 1. 错误边界

```tsx
class PluginErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Plugin error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <FallbackUI />;
    }
    return this.props.children;
  }
}

// 使用
<PluginErrorBoundary>
  <EngineView engine={engine} bundleUrl={url} />
</PluginErrorBoundary>
```

### 2. 动态插件加载

```tsx
function DynamicPlugin({ pluginId }) {
  const [bundleUrl, setBundleUrl] = useState(null);

  useEffect(() => {
    // 从服务器获取插件 URL
    fetchPluginUrl(pluginId).then(setBundleUrl);
  }, [pluginId]);

  if (!bundleUrl) return <Loader />;

  return (
    <EngineView
      engine={engine}
      bundleUrl={bundleUrl}
      onError={(err) => {
        // 上报到监控系统
        reportError(err);
      }}
    />
  );
}
```

### 3. 资源清理

```tsx
useEffect(() => {
  const engine = new Engine({ quickjs });

  return () => {
    // 组件卸载时销毁 engine
    engine.destroy();
  };
}, []);
```

## 调试技巧

### 1. 启用调试模式

```tsx
const engine = new Engine({
  quickjs,
  debug: true,  // 输出详细日志
});
```

### 2. 监控性能指标

```tsx
const engine = new Engine({
  quickjs,
  onMetric: (name, value) => {
    // 上报到 APM 系统
    analytics.track('rill_metric', { name, value });
  },
});
```

### 3. 健康检查

```tsx
setInterval(() => {
  const health = engine.getHealth();
  console.log('Engine health:', health);
  // { loaded, destroyed, errorCount, lastErrorAt }
}, 10000);
```

## 相关文档

- [Engine API](../../docs/api/engine.md)
- [EngineView API](../../docs/api/engine-view.md)
- [插件开发指南](../../docs/guides/plugin-development.md)
