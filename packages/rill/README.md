# Rill

Lightweight, headless, sandboxed React Native dynamic UI rendering engine.

> **rill** /rɪl/ n. a small stream - symbolizing lightweight, smooth data flow

## Features

- **React-like Development Experience**: Write bundles using JSX and Hooks
- **Complete Sandbox Isolation**: Multiple sandbox modes (vm, worker) - guest crashes don't affect the host
- **Lightweight and Efficient**: No WebView overhead, native rendering performance
- **Flexible Extension**: Supports registering custom business components
- **Multi-tenant Support**: `PooledEngine` for resource sharing and fault isolation

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
import { Engine, EngineView } from 'rill';
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

### Build Bundle

```bash
# Install CLI
bun add -g @anthropic/rill-cli

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
│  │  import { View, Text } from 'rill/sdk';                     │
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

Each engine has its own dedicated JS sandbox - suitable for single-tenant scenarios.

```typescript
const engine = new Engine({ sandbox: 'vm' });
```

### PooledEngine (Multi-tenant)

Multiple engines share a worker pool - suitable for multi-tenant scenarios with resource limits and fault isolation.

```typescript
import { PooledEngine, createWorkerPool } from 'rill';

// Simple usage - uses global pool
const engine = new PooledEngine();

// Custom pool with limits
const pool = createWorkerPool({ maxWorkers: 4 });
const engine = new PooledEngine({ pool });
```

## Module Description

| Module | Path | Description |
|--------|------|-------------|
| SDK | `rill/sdk` | Guest development kit, virtual components and Hooks |
| Runtime | `rill` | Host runtime, Engine/PooledEngine and EngineView |
| CLI | `@anthropic/rill-cli` | Bundle compiler tool |

## API

### Engine

```typescript
import { Engine, PooledEngine } from 'rill';

// Standalone engine
const engine = new Engine(options?: EngineOptions);

// Pooled engine (multi-tenant)
const pooledEngine = new PooledEngine(options?: PooledEngineOptions);

interface EngineOptions {
  sandbox?: 'vm' | 'worker' | 'none';  // Sandbox mode (auto-detected if not set)
  provider?: JSEngineProvider;          // Custom provider
  timeout?: number;                     // Execution timeout (default 5000ms)
  debug?: boolean;                      // Debug mode
  logger?: Logger;                      // Custom logger
}

// Register components
engine.register({ ComponentName: ReactComponent });

// Load bundle
await engine.loadBundle(bundleUrl, initialProps);

// Send event to guest
engine.sendEvent('EVENT_NAME', payload);

// Update configuration
engine.updateConfig({ key: value });

// Destroy
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

## Performance Optimization

Rill has built-in performance optimization mechanisms:

```tsx
import {
  ThrottledScheduler,
  VirtualScrollCalculator,
  PerformanceMonitor
} from 'rill/runtime';

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

## Debugging Tools

```tsx
import { createDevTools } from 'rill/devtools';

const devtools = createDevTools();
devtools.enable();

// View component tree
console.log(devtools.getComponentTreeText(nodeMap, rootChildren));

// Export debug data
const data = devtools.exportAll();
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
