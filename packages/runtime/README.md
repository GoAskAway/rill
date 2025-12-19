# Rill

Lightweight, headless, sandboxed React Native dynamic UI rendering engine.

> **rill** /rɪl/ n. a small stream - symbolizing lightweight, smooth data flow

## Features

- **React-like Development Experience**: Write bundles using JSX and Hooks
- **Complete Sandbox Isolation**: Multiple sandbox modes (vm, worker) - guest crashes don't affect the host
- **Lightweight and Efficient**: No WebView overhead, native rendering performance
- **Flexible Extension**: Supports registering custom business components
- **Dedicated Runtime**: Each Engine owns an isolated JS runtime/thread for maximum stability

## Quick Start

### Installation

Compatibility and peer dependencies

- Keep React and react-reconciler in compatible pairs to avoid install/runtime issues.
- Choose only one platform peer: react-dom (Web) or react-native (RN).

Recommended pairings

- React 18.2.x ↔ react-reconciler 0.29–0.31
- React 19.0.x ↔ react-reconciler 0.32.x
- React 19.2.x+ ↔ react-reconciler 0.33.x

Install examples

```bash
# React Native (RN 0.82 + React 19.2)
bun add rill react@^19.2.1 react-native@^0.82 react-reconciler@^0.33

# Web (React 19.2)
bun add rill react@^19.2.1 react-dom@^19.2.1 react-reconciler@^0.33
```

### Host Integration

```tsx
import { Engine, EngineView } from '@rill/core';
import { NativeStepList } from './components/NativeStepList';

// 1. Create engine instance
const engine = new Engine();

// 2. Register custom components
engine.register({
  StepList: NativeStepList,
});

// 3. Render guest bundle
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

### Guest Bundle Development

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

### Build Bundle

```bash
# Install CLI
bun add -g @rill/cli

# Build
rill build src/bundle.tsx -o dist/bundle.js

# Development mode
rill build src/bundle.tsx --watch --no-minify --sourcemap
```

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       Host App (React Native)                    │
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
│                    Receiver → Registry → Native Component Tree  │
└─────────────────────────────────────────────────────────────────┘
```

### Detailed Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    Host (Native Environment)                      │
│  React Native App / Node.js / Browser                            │
│                                                                   │
│  ┌────────────────────────────────────────────┐                 │
│  │  Engine (runtime/engine.ts)                │                 │
│  │  ├─ Create sandbox (QuickJS/Worker/VM)     │                 │
│  │  ├─ Inject reconciler into sandbox         │                 │
│  │  └─ Receive operations from Guest          │                 │
│  └────────────────┬───────────────────────────┘                 │
│                   │ ↑                                            │
│                   │ │ sendToHost(OperationBatch)                │
│                   │ │ { operations: [...] }                     │
└───────────────────┼─┼──────────────────────────────────────────┘
                    │ │
                    │ │ JSON Messages
                    │ │
┌───────────────────┼─┼──────────────────────────────────────────┐
│         Sandbox   │ │  (Isolated JS Environment)                │
│    QuickJS / Web Worker / Node VM                               │
│                   │ │                                            │
│  ┌────────────────┼─┼─────────────────┐                        │
│  │  Guest Code    │ │                 │                        │
│  │  (User's React Bundle)             │                        │
│  │                ↓ │                 │                        │
│  │  import { render } from 'rill/reconciler';                  │
│  │  import { View, Text } from '@rill/core/sdk';                     │
│  │                  │                 │                        │
│  │  <View>          │                 │                        │
│  │    <Text>Hello</Text>              │                        │
│  │  </View>         │                 │                        │
│  └──────────────────┼─────────────────┘                        │
│                     │                                            │
│  ┌──────────────────┼─────────────────┐                        │
│  │  Reconciler      ↓                 │                        │
│  │  (reconciler/index.ts)             │                        │
│  │                                     │                        │
│  │  1. React components → Fiber nodes │                        │
│  │  2. Calculate diffs (React Fiber)  │                        │
│  │  3. Generate JSON operations:      │                        │
│  │     { op: 'CREATE', type: 'View', props: {...} }            │
│  │     { op: 'APPEND', id: 2, parentId: 1 }                    │
│  │  4. Call sendToHost() ─────────────────┘                    │
│  │     Send operations to Host                                 │
│  └─────────────────────────────────────────────────────────────┘
└──────────────────────────────────────────────────────────────────┘
```

**Key Points:**

- **Reconciler runs in Sandbox**: The React reconciler executes inside the isolated environment, converting React components to JSON operations
- **sendToHost direction**: Sandbox → Host (operations flow from guest to host)
- **Complete isolation**: Guest code crashes don't affect the host app
- **Zero WebView overhead**: Direct React reconciliation to native components

## Engine Types

### Engine (Standalone)

Each Engine instance creates its own dedicated JS sandbox. Create a new Engine for each isolated context needed (e.g., each tab/view).

```typescript
// Create engine with specific sandbox mode
const engine = new Engine({ sandbox: 'vm', debug: true });

// Register components and load bundle
engine.register({ CustomComponent });
await engine.loadBundle(bundleCode);

// When done, destroy to release resources
engine.destroy();
```

**Resource Management** (Critical in Dedicated Engine Architecture):
- Each Engine owns an isolated JS runtime/thread - forgotten `destroy()` calls = permanent memory/thread leaks
- **Always** call `engine.destroy()` when the Tab/View is closed
- In React: Use `useEffect` cleanup to ensure destroy is called
- Monitor with `engine.getResourceStats()`: `{ timers, nodes, callbacks }`

**Lifecycle Best Practices**:
```typescript
// React component example
function MyTabContent({ tabId, bundleUrl }) {
  const engineRef = useRef<Engine | null>(null);

  useEffect(() => {
    // Create engine when tab mounts
    const engine = new Engine({ debug: true });
    engine.register(DefaultComponents);
    engine.loadBundle(bundleUrl);
    engineRef.current = engine;

    // CRITICAL: Cleanup when tab unmounts
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [bundleUrl]);

  return <EngineView engine={engineRef.current} />;
}
```

## Module Description

| Module | Path | Description |
|--------|------|-------------|
| SDK | `@rill/core/sdk` | Guest development kit, virtual components and Hooks |
| Runtime | `@rill/core` | Host runtime, Engine and EngineView |
| CLI | `@rill/cli` | Bundle compiler tool |

## API

### Engine

```typescript
import { Engine } from '@rill/core';

const engine = new Engine(options?: EngineOptions);

interface EngineOptions {
  sandbox?: 'vm' | 'worker' | 'none';  // Sandbox mode (auto-detected if not set)
  provider?: JSEngineProvider;          // Custom provider
  timeout?: number;                     // Execution timeout (default 5000ms)
  debug?: boolean;                      // Debug mode
  logger?: {                            // Custom logger
    log: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
  };
  onMetric?: (name: string, value: number, extra?: Record<string, unknown>) => void;  // Performance metrics callback
  requireWhitelist?: string[];          // Allowed require() modules
  receiverMaxBatchSize?: number;        // Max operations per batch (default 5000) - Critical for Host UI protection
}

// Register components
engine.register({ ComponentName: ReactComponent });

// Load bundle
await engine.loadBundle(bundleUrl, initialProps);

// Send event to guest
engine.sendEvent('EVENT_NAME', payload);

// Update configuration
engine.updateConfig({ key: value });

// Monitor resources
const stats = engine.getResourceStats();
console.log(`Timers: ${stats.timers}, Nodes: ${stats.nodes}, Callbacks: ${stats.callbacks}`);

// Get unique engine ID
console.log(`Engine ID: ${engine.id}`);

// Health check
const health = engine.getHealth();

// Subscribe to engine events
engine.on('load', () => console.log('Bundle loaded'));
engine.on('error', (error: Error) => console.error('Guest error:', error));
engine.on('fatalError', (error: Error) => console.error('Fatal error:', error)); // Engine auto-destroyed after this
engine.on('destroy', () => console.log('Engine destroyed'));
engine.on('operation', (batch: OperationBatch) => { /* ... */ });
engine.on('message', (message: GuestMessage) => { /* ... */ });

// Memory leak detection (for Host event listeners)
engine.setMaxListeners(20);  // Increase listener threshold
const limit = engine.getMaxListeners();

// Destroy (releases all resources: timers, nodes, callbacks, runtime)
engine.destroy();
```

### SDK Hooks

```typescript
// Subscribe to host events
useHostEvent('EVENT_NAME', (payload) => {
  // Handle event
});

// Get initial configuration
const config = useConfig<ConfigType>();

// Send message to host
const send = useSendToHost();
send('EVENT_NAME', payload);
```

### Default Components

- `View` - Container component
- `Text` - Text component
- `Image` - Image component
- `ScrollView` - Scroll container
- `TouchableOpacity` - Touchable component
- `TextInput` - Text input with state management
- `FlatList` - Virtualized list for performance
- `Button` - Button component
- `Switch` - Toggle switch
- `ActivityIndicator` - Loading spinner

### Error Boundary

```typescript
import { RillErrorBoundary } from '@rill/core/sdk';

function App() {
  return (
    <RillErrorBoundary
      fallback={<Text>Something went wrong</Text>}
      onError={(error, info) => {
        // Error info includes componentStack
        sendToHost('RENDER_ERROR', { message: error.message });
      }}
    >
      <MyComponent />
    </RillErrorBoundary>
  );
}
```

## Performance Optimization

Rill has built-in performance optimization mechanisms:

```tsx
import {
  ThrottledScheduler,
  VirtualScrollCalculator,
  PerformanceMonitor
} from '@rill/core';

// Batch update throttling
const scheduler = new ThrottledScheduler(onBatch, {
  maxBatchSize: 100,
  throttleMs: 16,
  enableMerge: true,
});

// Virtual scrolling
const calculator = new VirtualScrollCalculator({
  estimatedItemHeight: 60,
  overscan: 5,
});

// Performance monitoring
const monitor = new PerformanceMonitor();
```

## Debugging

Use the built-in resource monitoring and event tracking:

```tsx
// Monitor resource usage
const stats = engine.getResourceStats();
console.log('Resources:', stats);

// Track errors
engine.on('error', (error: Error) => {
  console.error('[Guest Error]', error);
});

engine.on('fatalError', (error: Error) => {
  console.error('[Fatal Error - Engine destroyed]', error);
});

// Monitor operations
engine.on('operation', (batch) => {
  console.log(`Operations: ${batch.operations.length}`);
});
```

## Documentation

- [API Documentation](../../docs/API.md) - Complete API reference
- [User Guide](../../docs/GUIDE.md) - Getting started tutorial and best practices
- [Architecture Design](../../docs/ARCHITECTURE.md) - System architecture details
- [Production Guide](../../docs/PRODUCTION_GUIDE.md) - Production deployment checklist
- [Examples](../../examples/) - Working examples with complete source code

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Development mode
bun run build:watch

# Type check
bun run typecheck

# Test
bun test

# Test coverage
bun test --coverage
```

## Testing

The project includes a complete test suite:

- Unit tests: Module functionality tests
- Integration tests: End-to-end scenario tests
- Coverage target: 80%+ code coverage

```bash
bun test           # Run all tests
bun test --watch   # Watch mode
bun test --coverage  # Generate coverage report
```

## License

Apache-2.0
