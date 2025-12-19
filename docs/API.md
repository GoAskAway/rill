# Rill API Documentation

## Overview

Rill is a lightweight React Native dynamic UI rendering engine that allows running React components in a sandbox environment and passing the render results to the host application.

## Module Structure

```
@rill/core/
├── (default export)  # Host-side runtime (Engine, EngineView, etc.)
├── sdk               # Guest-side SDK (runs in sandbox)
└── types             # TypeScript type definitions
```

**Package Exports**:
- `@rill/core` - Host runtime (Engine, EngineView, Receiver, Performance utils, etc.)
- `@rill/core/sdk` - Guest SDK (Virtual components, Hooks, Error boundary)
- `@rill/core/types` - Type definitions
- `@rill/cli` - CLI tools for building bundles

---

## SDK (@rill/core/sdk)

SDK used by guest developers, runs in the QuickJS sandbox.

### Virtual Components

Virtual components are string identifiers that are transformed into operation instructions during bundling.

```tsx
import { View, Text, Image, ScrollView, TouchableOpacity, TextInput, FlatList, Button, Switch, ActivityIndicator } from '@rill/core/sdk';
```

#### View

Container component.

```tsx
<View style={{ flex: 1, padding: 16 }}>
  {children}
</View>
```

| Property | Type | Description |
|----------|------|-------------|
| style | StyleProp | Style object |
| testID | string | Test identifier |
| onLayout | (event: LayoutEvent) => void | Layout callback |

#### Text

Text component.

```tsx
<Text numberOfLines={2} style={{ fontSize: 16 }}>
  Hello World
</Text>
```

| Property | Type | Description |
|----------|------|-------------|
| style | StyleProp | Style object |
| numberOfLines | number | Maximum number of lines |
| ellipsizeMode | 'head' \| 'middle' \| 'tail' \| 'clip' | Truncation mode |
| selectable | boolean | Whether text is selectable |
| onPress | () => void | Press callback |

#### Image

Image component.

```tsx
<Image
  source={{ uri: 'https://example.com/image.png' }}
  style={{ width: 100, height: 100 }}
  resizeMode="cover"
/>
```

| Property | Type | Description |
|----------|------|-------------|
| source | ImageSource | Image source |
| style | StyleProp | Style object |
| resizeMode | 'cover' \| 'contain' \| 'stretch' \| 'center' | Resize mode |
| onLoad | () => void | Load complete callback |
| onError | () => void | Load error callback |

#### TouchableOpacity

Touchable component.

```tsx
<TouchableOpacity onPress={() => console.log('pressed')} activeOpacity={0.7}>
  <Text>Click me</Text>
</TouchableOpacity>
```

| Property | Type | Description |
|----------|------|-------------|
| onPress | () => void | Press callback |
| onLongPress | () => void | Long press callback |
| activeOpacity | number | Opacity when pressed |
| disabled | boolean | Whether disabled |

#### ScrollView

Scrollable container.

```tsx
<ScrollView horizontal showsHorizontalScrollIndicator={false}>
  {items.map(item => <Item key={item.id} />)}
</ScrollView>
```

| Property | Type | Description |
|----------|------|-------------|
| horizontal | boolean | Whether to scroll horizontally |
| showsVerticalScrollIndicator | boolean | Show vertical scroll indicator |
| showsHorizontalScrollIndicator | boolean | Show horizontal scroll indicator |
| onScroll | (event: ScrollEvent) => void | Scroll callback |
| onScrollBeginDrag | () => void | Begin drag callback |
| onScrollEndDrag | () => void | End drag callback |

#### FlatList

High-performance list component.

```tsx
<FlatList
  data={items}
  renderItem={({ item }) => <Item data={item} />}
  keyExtractor={item => item.id}
/>
```

| Property | Type | Description |
|----------|------|-------------|
| data | T[] | Data array |
| renderItem | (info: { item: T; index: number }) => ReactElement | Render function |
| keyExtractor | (item: T, index: number) => string | Key extractor function |
| horizontal | boolean | Whether horizontal layout |
| ItemSeparatorComponent | ComponentType | Separator component |
| ListHeaderComponent | ReactElement | Header component |
| ListFooterComponent | ReactElement | Footer component |
| ListEmptyComponent | ReactElement | Empty list component |
| onEndReached | () => void | End reached callback |
| onEndReachedThreshold | number | Trigger threshold |

#### TextInput

Text input component.

```tsx
<TextInput
  value={text}
  onChangeText={setText}
  placeholder="Enter text"
  keyboardType="default"
/>
```

| Property | Type | Description |
|----------|------|-------------|
| value | string | Text value |
| onChangeText | (text: string) => void | Text change callback |
| placeholder | string | Placeholder text |
| keyboardType | 'default' \| 'numeric' \| 'email-address' \| 'phone-pad' | Keyboard type |
| secureTextEntry | boolean | Password mode |
| multiline | boolean | Multi-line input |
| maxLength | number | Maximum length |
| autoFocus | boolean | Auto focus |
| editable | boolean | Whether editable |
| onFocus | () => void | Focus callback |
| onBlur | () => void | Blur callback |
| onSubmitEditing | () => void | Submit callback |

#### Button

Button component.

```tsx
<Button title="Submit" onPress={handleSubmit} disabled={loading} />
```

| Property | Type | Description |
|----------|------|-------------|
| title | string | Button text |
| onPress | () => void | Press callback |
| disabled | boolean | Whether disabled |
| color | string | Button color |

#### Switch

Switch component.

```tsx
<Switch value={enabled} onValueChange={setEnabled} />
```

| Property | Type | Description |
|----------|------|-------------|
| value | boolean | Current value |
| onValueChange | (value: boolean) => void | Value change callback |
| disabled | boolean | Whether disabled |
| trackColor | { false: string; true: string } | Track color |
| thumbColor | string | Thumb color |

#### ActivityIndicator

Loading indicator.

```tsx
<ActivityIndicator size="large" color="#0066cc" />
```

| Property | Type | Description |
|----------|------|-------------|
| size | 'small' \| 'large' | Size |
| color | string | Color |
| animating | boolean | Whether animating |

---

### Hooks

#### useHostEvent

Listen to host events.

```tsx
import { useHostEvent } from '@rill/core/sdk';

function Guest() {
  useHostEvent<{ force: boolean }>('REFRESH', (payload) => {
    console.log('Refreshing...', payload.force);
  });

  return <View />;
}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| eventName | string | Event name |
| callback | (payload: T) => void | Event callback |

#### useConfig

Get initial configuration.

```tsx
import { useConfig } from '@rill/core/sdk';

interface Config {
  theme: 'light' | 'dark';
  userId: string;
}

function Guest() {
  const config = useConfig<Config>();

  return <Text>Theme: {config.theme}</Text>;
}
```

| Return Value | Type | Description |
|--------------|------|-------------|
| config | T | Configuration object |

#### useSendToHost

Send events to host.

```tsx
import { useSendToHost } from '@rill/core/sdk';

function Guest() {
  const sendToHost = useSendToHost();

  const handleComplete = () => {
    sendToHost('TASK_COMPLETE', { taskId: '123', result: 'success' });
  };

  return <Button title="Complete" onPress={handleComplete} />;
}
```

| Return Value | Type | Description |
|--------------|------|-------------|
| sendToHost | (eventName: string, payload?: unknown) => void | Send function |

---

## Runtime (@rill/core)

Host-side runtime, responsible for sandbox execution and UI rendering.

### Engine

Sandbox engine, manages JS sandbox execution environment.

```tsx
import { Engine } from '@rill/core';

const engine = new Engine({
  timeout: 5000,
  debug: true,
  logger: customLogger,
});

// Register custom components
engine.register({
  StepList: NativeStepList,
  CustomButton: MyButton,
});

// Load and execute guest
await engine.loadBundle('https://cdn.example.com/guest.js', {
  theme: 'dark',
  userId: '12345',
});

// Listen to events
engine.on('load', () => console.log('Guest loaded'));
engine.on('error', (error) => console.error('Guest error:', error));
engine.on('fatalError', (error) => console.error('Fatal error - engine destroyed:', error));
engine.on('operation', (batch) => console.log('Operations:', batch));
engine.on('message', (msg) => console.log('Guest message:', msg));
engine.on('destroy', () => console.log('Guest destroyed'));

// Send events to sandbox
engine.sendEvent('REFRESH', { force: true });

// Update configuration
engine.updateConfig({ theme: 'light' });

// Monitor resources
const stats = engine.getResourceStats();
console.log(`Resources: ${stats.timers} timers, ${stats.nodes} nodes, ${stats.callbacks} callbacks`);

// Health check
const health = engine.getHealth();

// Memory leak detection
engine.setMaxListeners(20);

// Destroy engine
engine.destroy();
```

#### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| sandbox | 'vm' \| 'worker' \| 'none' | auto-detect | Sandbox mode |
| provider | JSEngineProvider | auto | Custom JS engine provider |
| timeout | number | 5000 | Execution timeout (ms) |
| debug | boolean | false | Debug mode |
| logger | { log, warn, error } | console | Custom logger |
| requireWhitelist | string[] | ['react', 'react-native', ...] | Allowed require() modules |
| onMetric | (name, value, extra?) => void | undefined | Performance metrics callback |
| receiverMaxBatchSize | number | 5000 | Max operations per batch |

#### Methods

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| register | components: ComponentMap | void | Register custom components |
| loadBundle | source: string, props?: object | Promise\<void\> | Load and execute guest bundle |
| sendEvent | eventName: string, payload?: unknown | void | Send event to guest |
| updateConfig | config: object | void | Update guest configuration |
| on | event: keyof EngineEvents, handler: Function | () => void | Subscribe to engine event, returns unsubscribe function |
| getResourceStats | - | ResourceStats | Get resource usage statistics |
| getHealth | - | EngineHealth | Get engine health status |
| setMaxListeners | n: number | void | Set max event listeners threshold |
| getMaxListeners | - | number | Get max event listeners threshold |
| createReceiver | registry: ComponentRegistry | Receiver | Create operation receiver |
| getReceiver | - | Receiver \| null | Get current receiver |
| getRegistry | - | ComponentRegistry | Get component registry |
| destroy | - | void | Destroy engine and release all resources |

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| id | string (readonly) | Unique engine identifier |
| loaded | boolean | Whether bundle is loaded |
| destroyed | boolean | Whether engine is destroyed |

### EngineView

React Native component for rendering engine output.

```tsx
import { EngineView } from '@rill/core';

function GuestContainer() {
  const engine = new Engine();
  engine.register({ StepList: NativeStepList });

  return (
    <EngineView
      engine={engine}
      bundleUrl="https://cdn.example.com/bundle.js"
      initialProps={{ theme: 'dark' }}
      onLoad={() => console.log('Bundle loaded')}
      onError={(err) => console.error('Bundle error:', err)}
      onDestroy={() => console.log('Engine destroyed')}
      fallback={<ActivityIndicator />}
      renderError={(error) => <Text>Error: {error.message}</Text>}
      style={{ flex: 1 }}
    />
  );
}
```

#### Props

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| engine | Engine | Yes | Engine instance |
| bundleUrl | string | Yes | Bundle source (URL or code string) |
| initialProps | Record<string, unknown> | No | Initial props to pass to the Guest |
| onLoad | () => void | No | Load complete callback |
| onError | (error: Error) => void | No | Error callback |
| onDestroy | () => void | No | Destroy callback |
| fallback | ReactNode | No | Custom loading indicator |
| renderError | (error: Error) => ReactNode | No | Custom error display |
| style | object | No | Container style |

### ComponentRegistry

Component registry, manages component whitelist.

```tsx
import { ComponentRegistry, createRegistry } from '@rill/core';

// Use factory function
const registry = createRegistry({
  View: RNView,
  Text: RNText,
  Image: RNImage,
});

// Or use class
const registry = new ComponentRegistry();
registry.register('CustomCard', MyCard);
registry.registerAll({ Header, Footer });

// Query components
const Component = registry.get('View');
const hasComponent = registry.has('CustomCard');
const allNames = registry.getAll();
```

### Receiver

Operation receiver, parses operations and builds component tree.

```tsx
import { Receiver } from '@rill/core';

const receiver = new Receiver(
  registry,
  (message) => engine.sendToSandbox(message),
  () => forceUpdate()
);

// Apply operation batch
receiver.applyBatch(batch);

// Render component tree
const tree = receiver.render();

// Get debug info
const debugInfo = receiver.getDebugInfo();
```

---

## Performance (rill/runtime)

Performance optimization tools.

### ThrottledScheduler

Throttled scheduler, controls update frequency.

```tsx
import { ThrottledScheduler } from '@rill/core';

const scheduler = new ThrottledScheduler(
  (batch) => receiver.applyBatch(batch),
  {
    maxBatchSize: 100,
    throttleMs: 16,
    enableMerge: true,
  }
);

// Add operations
scheduler.enqueue(operation);
scheduler.enqueueAll(operations);

// Flush immediately
scheduler.flush();

// Cleanup
scheduler.dispose();
```

### VirtualScrollCalculator

Virtual scroll calculator, optimizes long list rendering.

```tsx
import { VirtualScrollCalculator } from '@rill/core';

const calculator = new VirtualScrollCalculator({
  estimatedItemHeight: 50,
  overscan: 5,
  scrollThrottleMs: 16,
});

calculator.setTotalItems(1000);
calculator.setItemHeight(0, 100); // Record actual height

const state = calculator.calculate(scrollTop, viewportHeight);
// state: { startIndex, endIndex, offsetTop, offsetBottom, visibleItems }
```

### PerformanceMonitor

Performance monitor.

```tsx
import { PerformanceMonitor } from '@rill/core';

const monitor = new PerformanceMonitor();

monitor.recordBatch(batch, originalCount);

const metrics = monitor.getMetrics();
// metrics: {
//   totalOperations, totalBatches, avgBatchSize,
//   mergedOperations, createCount, updateCount, deleteCount
// }

monitor.reset();
```

---

## DevTools (@rill/devtools)

Development and debugging tools for Rill applications. Provides operation logging, performance profiling, and error tracking.

Guest-side data is automatically collected by:
- **DEVTOOLS_SHIM** - Console/error interception (injected by Engine when `devtools: true`)
- **Reconciler** - Render timing (integrated in @rill/let)

### createDevTools

Create a DevTools instance.

```tsx
import { createDevTools } from '@rill/devtools';

const devtools = createDevTools({
  runtime: {
    maxLogs: 100,           // Max operation logs to keep
    maxTimelineEvents: 500, // Max timeline events
  },
});

// Enable/disable
devtools.enable();
devtools.disable();

// Connect to engine (auto-subscribes to events)
devtools.connectEngine(engine);

// Get component tree
const tree = devtools.getHostTree();
const treeText = devtools.getHostTreeText();

// Export debug data
const data = devtools.export();

// Reset all data
devtools.reset();
```

### Event Subscription

Subscribe to devtools events.

```tsx
// Available events: 'console', 'error', 'render', 'operation'
devtools.subscribe('error', (event) => {
  console.log('Guest error:', event.data);
});

devtools.subscribe('operation', (event) => {
  console.log('Operations:', event.data);
});
```

### Profiling

Record and analyze performance.

```tsx
// Start profiling
devtools.startProfiling();

// ... user interactions ...

// Stop and get report
const report = devtools.stopProfiling();

console.log(report.summary);
// {
//   totalOperations: 150,
//   totalRenders: 25,
//   avgOperationTime: 2.5,
//   avgRenderTime: 8.3,
//   slowestNodes: [...],
//   errorCount: 0,
// }
```

### Data Access

Access collected debug data.

```tsx
// Host data
const tree = devtools.getHostTree();        // Component tree
const metrics = devtools.getHostMetrics();  // Performance metrics
const status = devtools.getSandboxStatus(); // Sandbox state
const logs = devtools.getOperationLogs();   // Operation history

// Guest data
const consoleLogs = devtools.getConsoleLogs(); // Console output
const errors = devtools.getErrors();           // Errors
const ready = devtools.isGuestReady();         // Guest ready state
```

### RuntimeCollector (Low-level)

For direct integration without Engine connection.

```tsx
import { createRuntimeCollector } from '@rill/devtools';

const collector = createRuntimeCollector({ maxLogs: 100 });
collector.enable();

// Log operations
collector.logBatch(batch, duration);

// Record events
collector.recordCallback(fnId, args);
collector.recordHostEvent(eventName, payload);

// Build tree from node map
const tree = collector.buildTree(nodeMap, rootChildren);

// Get stats
const stats = collector.getOperationStats();
const timeline = collector.getTimeline();
```

---

## CLI (@rill/cli)

Command-line tool for building guest bundles.

### Installation

```bash
# Install globally
bun add -g @rill/cli

# Or use in monorepo workspace
bun add @rill/cli --dev
```

### Build Command

```bash
# Build guest bundle
rill build src/guest.tsx -o dist/bundle.js

# Watch mode for development
rill build src/guest.tsx --watch --no-minify --sourcemap

# Production build
rill build src/guest.tsx -o dist/bundle.js --minify

# Generate metafile for analysis
rill build src/guest.tsx -o dist/bundle.js --metafile dist/meta.json
```

### Programmatic Interface

```tsx
import { build } from '@rill/cli';

await build({
  entry: 'src/guest.tsx',
  outfile: 'dist/bundle.js',
  minify: true,
  sourcemap: false,
  watch: false,
  metafile: 'dist/meta.json',
});
```

---

## Type Definitions

### Operation

Operation instruction types.

```typescript
type OperationType =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'APPEND'
  | 'INSERT'
  | 'REMOVE'
  | 'REORDER'
  | 'TEXT';

interface CreateOperation {
  op: 'CREATE';
  id: number;
  type: string;
  props: SerializedProps;
  timestamp?: number;
}

interface UpdateOperation {
  op: 'UPDATE';
  id: number;
  props: SerializedProps;
  removedProps?: string[];
  timestamp?: number;
}

interface DeleteOperation {
  op: 'DELETE';
  id: number;
  timestamp?: number;
}

// ... more operation types
```

### OperationBatch

Operation batch.

```typescript
interface OperationBatch {
  version: number;
  batchId: number;
  operations: Operation[];
}
```

### HostMessage

Host message types.

```typescript
type HostMessageType =
  | 'CALL_FUNCTION'
  | 'HOST_EVENT'
  | 'CONFIG_UPDATE'
  | 'DESTROY';

interface CallFunctionMessage {
  type: 'CALL_FUNCTION';
  fnId: string;
  args: unknown[];
}

interface HostEventMessage {
  type: 'HOST_EVENT';
  eventName: string;
  payload: unknown;
}

// ... more message types
```

### StyleProp

Style types.

```typescript
interface StyleObject {
  // Layout
  flex?: number;
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';

  // Size
  width?: number | string;
  height?: number | string;
  minWidth?: number | string;
  maxWidth?: number | string;

  // Spacing
  margin?: number;
  padding?: number;

  // Border
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: number;

  // Background
  backgroundColor?: string;

  // Text
  color?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | ... | '900';
  textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify';

  // ... more style properties
}

type StyleProp = StyleObject | StyleObject[] | null | undefined;
```

---

## Error Handling

### Sandbox Error Isolation

Errors in guests don't affect the host application:

```tsx
// Errors in guest code are caught
function BuggyGuest() {
  throw new Error('Guest crashed!');
}

// Host-side handling
engine.on('error', (error) => {
  console.error('Guest error:', error);
  // Show fallback UI
});
```

### Timeout Protection

```tsx
const engine = new Engine({ timeout: 5000 });

// Automatically terminates unresponsive scripts after 5 seconds
```

---

## Best Practices

### 1. Component Whitelist

Only register necessary components:

```tsx
engine.register({
  // Only register needed components
  Card: MyCard,
  Badge: MyBadge,
});
```

### 2. Performance Optimization

```tsx
// Use throttled scheduler
const scheduler = new ThrottledScheduler(onBatch, {
  maxBatchSize: 50,
  throttleMs: 16,
  enableMerge: true,
});

// Use virtual scrolling for long lists
const calculator = new VirtualScrollCalculator({
  estimatedItemHeight: 60,
  overscan: 3,
});
```

### 3. Debugging

```tsx
// Monitor engine events
engine.on('error', (error) => {
  console.error('[Guest Error]', error);
  reportError(error);
});

engine.on('operation', (batch) => {
  console.log(`Operations: ${batch.operations.length}`);
});

// Check resource usage
const stats = engine.getResourceStats();
if (stats.callbacks > 1000) {
  console.warn('High callback count detected:', stats);
}
```

### 4. Error Boundaries

```tsx
<EngineView
  engine={engine}
  bundleUrl={bundleUrl}
  onError={(error) => {
    reportError(error);
  }}
  renderError={(error) => <ErrorFallback error={error} />}
/>
```

---

## Type Definitions

### EngineOptions

```typescript
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
  onMetric?: (name: string, value: number, extra?: Record<string, unknown>) => void;
  requireWhitelist?: string[];          // Allowed require() modules
  receiverMaxBatchSize?: number;        // Max operations per batch (default 5000)
}
```

### EngineEvents

```typescript
interface EngineEvents {
  load: () => void;                      // Bundle loaded successfully
  error: (error: Error) => void;         // Guest runtime error
  fatalError: (error: Error) => void;    // Fatal error - engine auto-destroyed
  destroy: () => void;                   // Engine destroyed
  operation: (batch: OperationBatch) => void;  // Operation batch received
  message: (message: GuestMessage) => void;    // Guest message received
}
```

### ResourceStats

```typescript
interface ResourceStats {
  timers: number;     // Active setTimeout/setInterval count
  nodes: number;      // VNode count in component tree
  callbacks: number;  // Registered callback functions count
}
```

### EngineHealth

```typescript
interface EngineHealth {
  loaded: boolean;         // Whether bundle is loaded
  destroyed: boolean;      // Whether engine is destroyed
  errorCount: number;      // Total error count
  lastErrorAt: number | null;  // Last error timestamp
  receiverNodes: number;   // Node count in receiver
  batching: boolean;       // Whether batching is active
}
```

### GuestMessage

```typescript
interface GuestMessage {
  event: string;    // Event name
  payload: unknown; // Event payload
}
```

### OperationBatch

```typescript
interface OperationBatch {
  version: number;          // Protocol version
  batchId: number;          // Batch identifier
  operations: Operation[];  // Array of operations
}
```

### Operation Types

```typescript
type OperationType =
  | 'CREATE'   // Create new node
  | 'UPDATE'   // Update node props
  | 'DELETE'   // Delete node
  | 'APPEND'   // Append child
  | 'INSERT'   // Insert child at index
  | 'REMOVE'   // Remove child
  | 'REORDER'  // Reorder children
  | 'TEXT';    // Update text content

interface CreateOperation {
  op: 'CREATE';
  id: number;
  type: string;
  props: SerializedProps;
}

interface UpdateOperation {
  op: 'UPDATE';
  id: number;
  props: SerializedProps;
  removedProps?: string[];
}

interface AppendOperation {
  op: 'APPEND';
  id: number;
  parentId: number;
  childId: number;
}

// ... other operation types
```

### ComponentMap

```typescript
type ComponentMap = Record<string, React.ComponentType<any>>;
```

### JSEngineProvider

```typescript
interface JSEngineProvider {
  createEngine(): JSEngine;
  supportsWorker?: boolean;
}

interface JSEngine {
  evaluate(code: string): unknown;
  set(name: string, value: unknown): void;
  get(name: string): unknown;
  dispose(): void;
}
```
