# 高级特性示例

本示例展示 Rill 的高级特性:

- ✅ **性能指标** - onMetric 回调追踪性能
- ✅ **执行超时** - timeout 配置防止无限循环
- ✅ **模块白名单** - requireWhitelist 控制可用模块
- ✅ **健康检查** - getHealth() 监控引擎状态
- ✅ **批处理优化** - receiverMaxBatchSize 限制
- ✅ **自定义日志** - logger 配置
- ✅ **调试模式** - debug 开关

## 核心特性

### 1. 性能指标追踪 (onMetric)

实时监控引擎性能,识别瓶颈:

```tsx
const engine = new Engine({
  provider: provider,
  onMetric: (name, value, extra) => {
    console.log(`[Metric] ${name}: ${value}ms`, extra);

    // 上报到 APM 系统
    if (value > 100) {
      analytics.track('slow_operation', { name, value });
    }

    // 触发性能告警
    if (name === 'receiver.render' && value > 16) {
      console.warn('Render exceeded 16ms, may cause frame drops');
    }
  },
});
```

**内置指标:**
- `engine.loadBundle` - guest加载时间
- `engine.sendToSandbox` - 消息传递到沙箱的时间
- `receiver.render` - 渲染操作时间
- `receiver.applyOperations` - 操作应用时间

### 2. 执行超时保护 (timeout)

防止guest中的无限循环或长时间运行:

```tsx
const engine = new Engine({
  provider: provider,
  timeout: 5000,  // 5秒超时
});
```

**最佳实践:**
- 开发环境: 10000ms (10秒)
- 生产环境: 5000ms (5秒)
- 复杂计算场景: 15000ms (15秒)

**注意:** 超时是尽力而为的保护机制,无法中断同步的无限循环。

### 3. 模块白名单 (requireWhitelist)

控制guest可以访问的模块,提高安全性:

```tsx
const engine = new Engine({
  provider: provider,
  requireWhitelist: [
    'lodash',           // 工具库
    'date-fns',         // 日期处理
    'validator',        // 数据验证
    // 不包含 'fs', 'child_process' 等危险模块
  ],
});
```

**安全建议:**
- ✅ 明确列出允许的模块
- ✅ 避免包含文件系统、网络、进程相关模块
- ✅ 定期审查白名单
- ❌ 不要使用通配符 `*`

### 4. 健康检查 (getHealth)

监控引擎运行状态:

```tsx
const health = engine.getHealth();

console.log(health);
// {
//   loaded: true,       // 是否已加载
//   destroyed: false,   // 是否已销毁
//   errorCount: 0,      // 错误计数
//   lastErrorAt: null   // 最后错误时间戳
// }
```

**监控策略:**

```tsx
// 定期健康检查
setInterval(() => {
  const health = engine.getHealth();

  // 错误过多,重新加载
  if (health.errorCount > 10) {
    console.error('Too many errors, reloading guest');
    engine.destroy();
    // 重新创建和加载
  }

  // 计算错误率
  const errorRate = health.errorCount / totalOperations;
  if (errorRate > 0.05) {
    console.warn('High error rate detected:', errorRate);
  }
}, 30000); // 每 30 秒检查一次
```

### 5. 批处理优化 (receiverMaxBatchSize)

限制单次操作批处理大小,保护宿主性能:

```tsx
const engine = new Engine({
  provider: provider,
  receiverMaxBatchSize: 5000,  // 默认值
});
```

**调优建议:**
- 低端设备: 1000-2000
- 中端设备: 3000-5000 (默认)
- 高端设备: 10000+

### 6. 自定义日志 (logger)

集成到应用日志系统:

```tsx
const engine = new Engine({
  provider: provider,
  logger: {
    log: (...args) => {
      myLogger.info('[Rill]', ...args);
    },
    warn: (...args) => {
      myLogger.warn('[Rill]', ...args);
    },
    error: (...args) => {
      myLogger.error('[Rill]', ...args);
      // 上报到 Sentry
      Sentry.captureMessage(args.join(' '));
    },
  },
});
```

### 7. 调试模式 (debug)

开发时启用详细日志:

```tsx
const engine = new Engine({
  provider: provider,
  debug: __DEV__,  // React Native 开发环境自动启用
});
```

## 性能监控示例

### 滑动窗口指标

收集最近 N 条指标,计算统计信息:

```tsx
class MetricsCollector {
  private window: Array<{ name: string; value: number }> = [];
  private maxSize = 100;

  onMetric(name: string, value: number) {
    this.window.push({ name, value });
    if (this.window.length > this.maxSize) {
      this.window.shift();
    }
  }

  getStats(metricName: string) {
    const values = this.window
      .filter(m => m.name === metricName)
      .map(m => m.value);

    if (values.length === 0) return null;

    return {
      count: values.length,
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      p95: this.percentile(values, 0.95),
    };
  }

  private percentile(values: number[], p: number) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index];
  }
}

const collector = new MetricsCollector();

const engine = new Engine({
  provider: provider,
  onMetric: (name, value) => collector.onMetric(name, value),
});

// 定期输出统计
setInterval(() => {
  console.log('Render stats:', collector.getStats('receiver.render'));
}, 10000);
```

### 性能告警

自动检测性能问题:

```tsx
const engine = new Engine({
  provider: provider,
  onMetric: (name, value) => {
    // 渲染超过 16ms (60fps)
    if (name === 'receiver.render' && value > 16) {
      console.warn('⚠️ Slow render detected:', value, 'ms');
    }

    // 加载超过 1 秒
    if (name === 'engine.loadBundle' && value > 1000) {
      console.warn('⚠️ Slow guest load:', value, 'ms');
    }

    // 消息传递超过 10ms
    if (name === 'engine.sendToSandbox' && value > 10) {
      console.warn('⚠️ Slow message passing:', value, 'ms');
    }
  },
});
```

## 生产环境配置

### 推荐配置

```tsx
const engine = new Engine({
  provider: provider,

  // 5秒超时
  timeout: 5000,

  // 生产环境关闭调试
  debug: false,

  // 集成日志系统
  logger: productionLogger,

  // 严格的模块白名单
  requireWhitelist: [
    'lodash',
    'date-fns',
  ],

  // 性能监控
  onMetric: (name, value, extra) => {
    // 上报到 APM
    apm.recordMetric('rill_' + name, value, extra);

    // 性能告警
    if (value > thresholds[name]) {
      alerting.warn(`Slow ${name}: ${value}ms`);
    }
  },

  // 根据设备性能调整
  receiverMaxBatchSize: getDevicePerformanceTier() === 'high' ? 10000 : 3000,
});
```

### 错误恢复策略

```tsx
let errorCount = 0;
const MAX_ERRORS = 5;

engine.on('error', (error) => {
  errorCount++;

  // 上报错误
  errorReporting.capture(error);

  // 超过阈值,重启引擎
  if (errorCount > MAX_ERRORS) {
    console.error('Too many errors, restarting engine');
    engine.destroy();

    setTimeout(() => {
      errorCount = 0;
      recreateEngine();
    }, 1000);
  }
});

// 定期重置计数
setInterval(() => {
  errorCount = Math.max(0, errorCount - 1);
}, 60000); // 每分钟衰减一次
```

## 运行示例

```bash
bun install
bun run build
```

然后参考 `src/host-demo.tsx` 中的集成示例。

## 相关文档

- [性能优化指南](../../docs/guides/performance.md)
- [安全最佳实践](../../docs/guides/security.md)
- [生产环境清单](../../docs/guides/production-checklist.md)
