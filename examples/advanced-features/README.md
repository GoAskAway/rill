# Advanced Features Example

This example demonstrates advanced Rill features:

- ✅ **Performance Metrics** - Track performance with onMetric callback
- ✅ **Execution Timeout** - Prevent infinite loops with timeout configuration
- ✅ **Module Whitelist** - Control available modules with requireWhitelist
- ✅ **Health Checks** - Monitor engine status with getHealth()
- ✅ **Batch Processing Optimization** - receiverMaxBatchSize limits
- ✅ **Custom Logging** - logger configuration
- ✅ **Debug Mode** - debug toggle

## Core Features

### 1. Performance Metrics Tracking (onMetric)

Monitor engine performance in real-time and identify bottlenecks:

```tsx
const engine = new Engine({
  provider: provider,
  onMetric: (name, value, extra) => {
    console.log(`[Metric] ${name}: ${value}ms`, extra);

    // Report to APM system
    if (value > 100) {
      analytics.track('slow_operation', { name, value });
    }

    // Trigger performance alerts
    if (name === 'receiver.render' && value > 16) {
      console.warn('Render exceeded 16ms, may cause frame drops');
    }
  },
});
```

**Built-in Metrics:**
- `engine.loadBundle` - Guest load time
- `engine.sendToSandbox` - Message passing to sandbox time
- `receiver.render` - Render operation time
- `receiver.applyOperations` - Operation application time

### 2. Execution Timeout Protection (timeout)

Prevent infinite loops or long-running operations in guests:

```tsx
const engine = new Engine({
  provider: provider,
  timeout: 5000,  // 5 second timeout
});
```

**Best Practices:**
- Development environment: 10000ms (10 seconds)
- Production environment: 5000ms (5 seconds)
- Complex computation scenarios: 15000ms (15 seconds)

**Note:** Timeout is a best-effort protection mechanism and cannot interrupt synchronous infinite loops.

### 3. Module Whitelist (requireWhitelist)

Control which modules guests can access to improve security:

```tsx
const engine = new Engine({
  provider: provider,
  requireWhitelist: [
    'lodash',           // Utility library
    'date-fns',         // Date handling
    'validator',        // Data validation
    // Don't include 'fs', 'child_process', etc.
  ],
});
```

**Security Recommendations:**
- ✅ Explicitly list allowed modules
- ✅ Avoid including file system, network, or process-related modules
- ✅ Regularly review the whitelist
- ❌ Don't use wildcards like `*`

### 4. Health Checks (getHealth)

Monitor engine runtime status:

```tsx
const health = engine.getHealth();

console.log(health);
// {
//   loaded: true,       // Whether loaded
//   destroyed: false,   // Whether destroyed
//   errorCount: 0,      // Error count
//   lastErrorAt: null   // Last error timestamp
// }
```

**Monitoring Strategy:**

```tsx
// Regular health checks
setInterval(() => {
  const health = engine.getHealth();

  // Too many errors, reload
  if (health.errorCount > 10) {
    console.error('Too many errors, reloading guest');
    engine.destroy();
    // Recreate and reload
  }

  // Calculate error rate
  const errorRate = health.errorCount / totalOperations;
  if (errorRate > 0.05) {
    console.warn('High error rate detected:', errorRate);
  }
}, 30000); // Check every 30 seconds
```

### 5. Batch Processing Optimization (receiverMaxBatchSize)

Limit single operation batch size to protect host performance:

```tsx
const engine = new Engine({
  provider: provider,
  receiverMaxBatchSize: 5000,  // Default value
});
```

**Tuning Recommendations:**
- Low-end devices: 1000-2000
- Mid-range devices: 3000-5000 (default)
- High-end devices: 10000+

### 6. Custom Logging (logger)

Integrate with your application's logging system:

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
      // Report to Sentry
      Sentry.captureMessage(args.join(' '));
    },
  },
});
```

### 7. Debug Mode (debug)

Enable detailed logging during development:

```tsx
const engine = new Engine({
  provider: provider,
  debug: __DEV__,  // Auto-enable in React Native dev environment
});
```

## Performance Monitoring Examples

### Sliding Window Metrics

Collect the most recent N metrics and calculate statistics:

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

// Output statistics periodically
setInterval(() => {
  console.log('Render stats:', collector.getStats('receiver.render'));
}, 10000);
```

### Performance Alerts

Automatically detect performance issues:

```tsx
const engine = new Engine({
  provider: provider,
  onMetric: (name, value) => {
    // Render exceeds 16ms (60fps)
    if (name === 'receiver.render' && value > 16) {
      console.warn('⚠️ Slow render detected:', value, 'ms');
    }

    // Load exceeds 1 second
    if (name === 'engine.loadBundle' && value > 1000) {
      console.warn('⚠️ Slow guest load:', value, 'ms');
    }

    // Message passing exceeds 10ms
    if (name === 'engine.sendToSandbox' && value > 10) {
      console.warn('⚠️ Slow message passing:', value, 'ms');
    }
  },
});
```

## Production Configuration

### Recommended Configuration

```tsx
const engine = new Engine({
  provider: provider,

  // 5 second timeout
  timeout: 5000,

  // Disable debug in production
  debug: false,

  // Integrate logging system
  logger: productionLogger,

  // Strict module whitelist
  requireWhitelist: [
    'lodash',
    'date-fns',
  ],

  // Performance monitoring
  onMetric: (name, value, extra) => {
    // Report to APM
    apm.recordMetric('rill_' + name, value, extra);

    // Performance alerts
    if (value > thresholds[name]) {
      alerting.warn(`Slow ${name}: ${value}ms`);
    }
  },

  // Adjust based on device performance
  receiverMaxBatchSize: getDevicePerformanceTier() === 'high' ? 10000 : 3000,
});
```

### Error Recovery Strategy

```tsx
let errorCount = 0;
const MAX_ERRORS = 5;

engine.on('error', (error) => {
  errorCount++;

  // Report error
  errorReporting.capture(error);

  // Exceed threshold, restart engine
  if (errorCount > MAX_ERRORS) {
    console.error('Too many errors, restarting engine');
    engine.destroy();

    setTimeout(() => {
      errorCount = 0;
      recreateEngine();
    }, 1000);
  }
});

// Periodically reset count
setInterval(() => {
  errorCount = Math.max(0, errorCount - 1);
}, 60000); // Decay once per minute
```

## Running the Example

```bash
npm install
npm run build
```

Then refer to the integration example in `src/host-demo.tsx`.

## Related Documentation

- [Performance Optimization Guide](../../docs/guides/performance.md)
- [Security Best Practices](../../docs/guides/security.md)
- [Production Environment Checklist](../../docs/guides/production-checklist.md)
