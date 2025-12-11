# Host Integration Example

This example demonstrates how to fully integrate the Rill guest system into a React Native application, including:

- ✅ Engine instance creation and configuration
- ✅ EngineView lifecycle management
- ✅ Bidirectional host-guest communication
- ✅ Error handling and recovery
- ✅ Custom component registration
- ✅ QuickJS Provider configuration

## Project Structure

```
host-integration/
├── src/
│   ├── guest.tsx           # Guest code (runs in sandbox)
│   ├── HostApp.tsx           # Host application example
│   └── QuickJSProvider.tsx   # QuickJS Provider configuration
├── dist/
│   └── guest.js             # Built guest bundle
├── package.json
└── README.md
```

## Quick Start

### 1. Build the Guest

```bash
bun install
bun run build
```

### 2. Use in Host Application

Refer to the integration example in `src/HostApp.tsx`:

```tsx
import { Engine, EngineView } from 'rill';
import { createQuickJSProvider } from './QuickJSProvider';

// Create Engine instance
const engine = new Engine({
  provider: createQuickJSProvider(),
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
  bundleUrl="./dist/guest.js"  // or remote URL
  initialProps={{ userId: '123' }}
  onLoad={() => console.log('Guest loaded')}
  onError={(err) => console.error('Guest error:', err)}
/>
```

## Key Features

### 1. Engine Configuration

```tsx
const engine = new Engine({
  // QuickJS provider (required)
  provider: createQuickJSProvider(),

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

**Host sends events to guest:**

```tsx
// In host code
engine.sendEvent('THEME_CHANGE', { theme: 'dark' });
```

**Guest sends messages to host:**

```tsx
// In guest code
import { useSendToHost } from 'rill/sdk';

const sendToHost = useSendToHost();
sendToHost('USER_ACTION', { action: 'click', target: 'button' });
```

**Host listens to guest messages:**

```tsx
// In host code
engine.on('message', (message) => {
  console.log('From guest:', message.event, message.payload);
});
```

### 3. Lifecycle Management

```tsx
<EngineView
  engine={engine}
  bundleUrl={guestUrl}

  // Load complete
  onLoad={() => {
    console.log('Guest ready');
    engine.sendEvent('INIT', { config });
  }}

  // Error handling
  onError={(error) => {
    console.error('Guest error:', error);
    // Report error, show fallback UI, etc.
  }}

  // Destroy callback
  onDestroy={() => {
    console.log('Guest destroyed');
    // Clean up resources
  }}

  // Custom loading UI
  fallback={<CustomLoader />}

  // Custom error UI
  renderError={(err) => <CustomError error={err} />}
/>
```

### 4. Custom Component Registration

Expose native components to guests:

```tsx
import { requireNativeComponent } from 'react-native';

// Native component
const NativeMap = requireNativeComponent('RNMapView');

// Register with Engine
engine.register({
  MapView: NativeMap,
});
```

Use in guest:

```tsx
import { View } from 'rill/sdk';

// Automatically get registered component
function Guest() {
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
class GuestErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Guest error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <FallbackUI />;
    }
    return this.props.children;
  }
}

// Usage
<GuestErrorBoundary>
  <EngineView engine={engine} bundleUrl={url} />
</GuestErrorBoundary>
```

### 2. Dynamic Guest Loading

```tsx
function DynamicGuest({ guestId }) {
  const [bundleUrl, setBundleUrl] = useState(null);

  useEffect(() => {
    // Fetch guest URL from server
    fetchGuestUrl(guestId).then(setBundleUrl);
  }, [guestId]);

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
  const engine = new Engine({ provider });

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
- [Guest Development Guide](../../docs/guides/guest-development.md)
