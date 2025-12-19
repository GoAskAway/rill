# Rill Integration Guide

Quick start guide for integrating Rill into your React Native app.

## Installation

### 1. Add Rill to your project

```json
{
  "dependencies": {
    "rill": "file:/path/to/rill"
  }
}
```

Or npm-published version:
```bash
npm install rill
```

### 2. Install dependencies

```bash
npm install
```

### 3. Link native modules (iOS/macOS)

```bash
cd ios && pod install
```

### 4. Link native modules (Android)

Just rebuild your project:
```bash
./gradlew build
```

## Usage

### Basic Example

```typescript
import { Engine } from 'rill';
import { View, Text } from 'rill/let';
import { DefaultProvider } from 'rill/sandbox';

// Create engine
const engine = new Engine({
  provider: DefaultProvider(),
  debug: true,
});

// Register components
engine.register({
  View: MyViewComponent,
  Text: MyTextComponent,
});

// Load bundle
await engine.loadBundle(bundleCode);

// Create receiver to apply updates
const receiver = engine.createReceiver(() => {
  // Re-render on updates
  setNodes(receiver.root);
});
```

### Advanced: DevTools

```typescript
import { connectEngine } from 'rill/devtools';

// Enable devtools in development
if (__DEV__) {
  connectEngine(engine, {
    wsUrl: 'ws://localhost:8081/rill-devtools',
  });
}
```

### Platform-Specific Sandboxes

```typescript
import { VMProvider } from 'rill/sandbox';
import { JSCProvider } from 'rill/sandbox';
import { QuickJSProvider } from 'rill/sandbox';

// Node.js/Bun (development)
const engine = new Engine({ provider: new VMProvider() });

// iOS/macOS native
const engine = new Engine({ provider: new JSCProvider() });

// All platforms (native when available)
import { DefaultProvider } from 'rill/sandbox';
const engine = new Engine({ provider: DefaultProvider() });
```

## Automatic Native Initialization

When you install Rill with `npm install + pod install`:

1. ✅ Native modules are automatically compiled
2. ✅ JSI bindings are automatically initialized
3. ✅ `global.__JSCSandboxJSI` is available
4. ✅ No additional code needed

The TurboModule system handles everything automatically.

## Troubleshooting

### `__JSCSandboxJSI is undefined` on iOS

```bash
# Try clean build
cd ios
rm -rf Pods/ Podfile.lock
pod install
```

### `Cannot find module 'rill/let'`

Make sure `npm install` completed successfully and all dependencies are resolved.

## API Reference

### Engine

```typescript
const engine = new Engine({
  provider: DefaultProvider(),
  debug?: boolean,
  onMetric?: (name: string, duration: number, meta?: any) => void,
});

await engine.loadBundle(code: string);
engine.register(components: Record<string, any>);
const receiver = engine.createReceiver(onUpdate: () => void);
engine.destroy();
```

### Guest Components

```typescript
import { View, Text, FlatList, ScrollView } from 'rill/let';
```

### DevTools

```typescript
import { connectEngine, RuntimeCollector } from 'rill/devtools';
```

## More Information

- [Rill Documentation](https://github.com/anthropics/rill)
- [TurboModule Details](./packages/sandbox-native/TURBO_MODULE.md)
