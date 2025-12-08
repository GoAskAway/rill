# Host Integration Example

This example demonstrates how to fully integrate the Rill plugin system into a React Native application, including:

- ✅ Engine instance creation and configuration
- ✅ EngineView lifecycle management
- ✅ Bidirectional host-plugin communication
- ✅ Error handling and recovery
- ✅ Custom component registration
- ✅ QuickJS Provider configuration

## Project Structure

```
host-integration/
├── src/
│   ├── plugin.tsx           # Plugin code (runs in sandbox)
│   ├── HostApp.tsx           # Host application example
│   └── QuickJSProvider.tsx   # QuickJS Provider configuration
├── dist/
│   └── plugin.js             # Built plugin bundle
├── package.json
└── README.md
```

## Quick Start

### 1. Build the Plugin

```bash
npm install
npm run build
```

### 2. Use in Host Application

Refer to the integration example in `src/HostApp.tsx`:

```tsx
import { Engine, EngineView } from 'rill';
import { createQuickJSProvider } from './QuickJSProvider';

// Create Engine instance
const engine = new Engine({
  quickjs: createQuickJSProvider(),
  timeout: 5000,
  debug: true,
});

// Register custom components (optional)
engine.register({
  CustomButton: NativeCustomButton,
});

// Use in component
<EngineView
  engine={engine}
  bundleUrl="./dist/plugin.js"  // or remote URL
  initialProps={{ userId: '123' }}
  onLoad={() => console.log('Plugin loaded')}
  onError={(err) => console.error('Plugin error:', err)}
/>
```

## Key Features

### 1. Engine Configuration

```tsx
const engine = new Engine({
  // QuickJS provider (required)
  quickjs: createQuickJSProvider(),

  // Execution timeout (milliseconds)
  timeout: 5000,

  // Debug mode
  debug: true,

  // Custom logger
  logger: {
    log: console.log,
    warn: console.warn,
    error: console.error,
  },

  // Allowed module whitelist
  requireWhitelist: ['lodash', 'date-fns'],

  // Performance metrics callback
  onMetric: (name, value) => {
    console.log(`Metric: ${name} = ${value}ms`);
  },
});
```

### 2. Bidirectional Communication

**Host sends events to plugin:**

```tsx
// In host code
engine.sendEvent('THEME_CHANGE', { theme: 'dark' });
```

**Plugin sends messages to host:**

```tsx
// In plugin code
import { useSendToHost } from 'rill/sdk';

const sendToHost = useSendToHost();
sendToHost('USER_ACTION', { action: 'click', target: 'button' });
```

**Host listens to plugin messages:**

```tsx
// In host code
engine.on('message', (message) => {
  console.log('From plugin:', message.event, message.payload);
});
```

### 3. Lifecycle Management

```tsx
<EngineView
  engine={engine}
  bundleUrl={pluginUrl}

  // Load complete
  onLoad={() => {
    console.log('Plugin ready');
    engine.sendEvent('INIT', { config });
  }}

  // Error handling
  onError={(error) => {
    console.error('Plugin error:', error);
    // Report error, show fallback UI, etc.
  }}

  // Destroy callback
  onDestroy={() => {
    console.log('Plugin destroyed');
    // Clean up resources
  }}

  // Custom loading UI
  fallback={<CustomLoader />}

  // Custom error UI
  renderError={(err) => <CustomError error={err} />}
/>
```

### 4. Custom Component Registration

Expose native components to plugins:

```tsx
import { requireNativeComponent } from 'react-native';

// Native component
const NativeMap = requireNativeComponent('RNMapView');

// Register with Engine
engine.register({
  MapView: NativeMap,
});
```

Use in plugin:

```tsx
import { View } from 'rill/sdk';

// Automatically get registered component
function Plugin() {
  return <MapView region={...} />;
}
```

### 5. Error Handling and Recovery

```tsx
// Listen for errors
engine.on('error', (error) => {
  console.error('Runtime error:', error);

  // Check health status
  const health = engine.getHealth();
  console.log('Error count:', health.errorCount);

  // If too many errors, consider reloading
  if (health.errorCount > 5) {
    engine.destroy();
    // Recreate engine and reload
  }
});
```

## Production Best Practices

### 1. Error Boundary

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

// Usage
<PluginErrorBoundary>
  <EngineView engine={engine} bundleUrl={url} />
</PluginErrorBoundary>
```

### 2. Dynamic Plugin Loading

```tsx
function DynamicPlugin({ pluginId }) {
  const [bundleUrl, setBundleUrl] = useState(null);

  useEffect(() => {
    // Fetch plugin URL from server
    fetchPluginUrl(pluginId).then(setBundleUrl);
  }, [pluginId]);

  if (!bundleUrl) return <Loader />;

  return (
    <EngineView
      engine={engine}
      bundleUrl={bundleUrl}
      onError={(err) => {
        // Report to monitoring system
        reportError(err);
      }}
    />
  );
}
```

### 3. Resource Cleanup

```tsx
useEffect(() => {
  const engine = new Engine({ quickjs });

  return () => {
    // Destroy engine when component unmounts
    engine.destroy();
  };
}, []);
```

## Debugging Tips

### 1. Enable Debug Mode

```tsx
const engine = new Engine({
  quickjs,
  debug: true,  // Output detailed logs
});
```

### 2. Monitor Performance Metrics

```tsx
const engine = new Engine({
  quickjs,
  onMetric: (name, value) => {
    // Report to APM system
    analytics.track('rill_metric', { name, value });
  },
});
```

### 3. Health Checks

```tsx
setInterval(() => {
  const health = engine.getHealth();
  console.log('Engine health:', health);
  // { loaded, destroyed, errorCount, lastErrorAt }
}, 10000);
```

## Related Documentation

- [Engine API](../../docs/api/engine.md)
- [EngineView API](../../docs/api/engine-view.md)
- [Plugin Development Guide](../../docs/guides/plugin-development.md)
