# Rill API Documentation

## Overview

Rill is a lightweight React Native dynamic UI rendering engine that allows running React components in a sandbox environment and passing the render results to the host application.

## Module Structure

```
rill/
├── sdk          # Plugin-side SDK (runs in sandbox)
├── runtime      # Host-side runtime
├── reconciler   # React reconciler
└── devtools     # Debugging tools
```

---

## SDK (rill/sdk)

SDK used by plugin developers, runs in the QuickJS sandbox.

### Virtual Components

Virtual components are string identifiers that are transformed into operation instructions during bundling.

```tsx
import { View, Text, Image, ScrollView, TouchableOpacity, TextInput, FlatList, Button, Switch, ActivityIndicator } from 'rill/sdk';
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
import { useHostEvent } from 'rill/sdk';

function Plugin() {
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
import { useConfig } from 'rill/sdk';

interface Config {
  theme: 'light' | 'dark';
  userId: string;
}

function Plugin() {
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
import { useSendToHost } from 'rill/sdk';

function Plugin() {
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

## Runtime (rill/runtime)

Host-side runtime, responsible for sandbox execution and UI rendering.

### Engine

Sandbox engine, manages QuickJS execution environment.

```tsx
import { Engine } from 'rill/runtime';

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

// Load and execute plugin
await engine.loadBundle('https://cdn.example.com/plugin.js', {
  theme: 'dark',
  userId: '12345',
});

// Listen to events
engine.on('load', () => console.log('Plugin loaded'));
engine.on('error', (error) => console.error('Plugin error:', error));
engine.on('operation', (batch) => console.log('Operations:', batch));
engine.on('destroy', () => console.log('Plugin destroyed'));

// Send events to sandbox
engine.sendEvent('REFRESH', { force: true });

// Update configuration
engine.updateConfig({ theme: 'light' });

// Destroy engine
engine.destroy();
```

#### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| timeout | number | 5000 | Execution timeout (ms) |
| debug | boolean | false | Debug mode |
| logger | Logger | console | Log handler |

#### Methods

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| register | components: ComponentMap | void | Register components |
| loadBundle | source: string, props?: object | Promise\<void\> | Load plugin |
| sendEvent | eventName: string, payload?: unknown | void | Send event |
| updateConfig | config: object | void | Update configuration |
| destroy | - | void | Destroy engine |

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| isLoaded | boolean | Whether loaded |
| isDestroyed | boolean | Whether destroyed |

### EngineView

React Native component for rendering engine output.

```tsx
import { EngineView } from 'rill/runtime';

function PluginContainer() {
  return (
    <EngineView
      source="https://cdn.example.com/plugin.js"
      initialProps={{ theme: 'dark' }}
      components={{ CustomButton: MyButton }}
      onLoad={() => console.log('Loaded')}
      onError={(error) => console.error(error)}
      fallback={<Text>Loading...</Text>}
      debug={true}
    />
  );
}
```

#### Props

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| source | string | Yes | Bundle URL or code |
| initialProps | object | No | Initial properties |
| components | ComponentMap | No | Custom components |
| onLoad | () => void | No | Load complete callback |
| onError | (error: Error) => void | No | Error callback |
| fallback | ReactElement | No | Loading placeholder |
| debug | boolean | No | Debug mode |

### ComponentRegistry

Component registry, manages component whitelist.

```tsx
import { ComponentRegistry, createRegistry } from 'rill/runtime';

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
import { Receiver } from 'rill/runtime';

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
import { ThrottledScheduler } from 'rill/runtime';

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
import { VirtualScrollCalculator } from 'rill/runtime';

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
import { PerformanceMonitor } from 'rill/runtime';

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

## DevTools (rill/devtools)

Debugging toolset.

### DevTools (Main Class)

Integrates all debugging features.

```tsx
import { createDevTools } from 'rill/devtools';

const devtools = createDevTools({
  inspector: { maxDepth: 10, showFunctions: true },
  maxLogs: 100,
  maxTimelineEvents: 500,
});

// Enable/Disable
devtools.enable();
devtools.disable();

// Record events
devtools.onBatch(batch, duration);
devtools.onCallback(fnId, args);
devtools.onHostEvent(eventName, payload);

// Get component tree
const tree = devtools.getComponentTree(nodeMap, rootChildren);
const treeText = devtools.getComponentTreeText(nodeMap, rootChildren);

// Export debug data
const data = devtools.exportAll();

// Reset
devtools.reset();
```

### ComponentInspector

Component tree inspector.

```tsx
import { ComponentInspector } from 'rill/devtools';

const inspector = new ComponentInspector({
  maxDepth: 10,
  filterProps: ['style'],
  showFunctions: false,
  highlightChanges: true,
});

const tree = inspector.buildTree(nodeMap, rootChildren);
const text = inspector.toText(tree);
const json = inspector.toJSON(tree);

inspector.recordChange(nodeId);
inspector.clearHighlights();
```

### OperationLogger

Operation log recorder.

```tsx
import { OperationLogger } from 'rill/devtools';

const logger = new OperationLogger(100);

logger.log(batch, duration);

const logs = logger.getLogs();
const recent = logger.getRecentLogs(10);
const creates = logger.filterByType('CREATE');
const nodeOps = logger.filterByNodeId(1);
const stats = logger.getStats();

logger.clear();
const exported = logger.export();
```

### TimelineRecorder

Timeline recorder.

```tsx
import { TimelineRecorder } from 'rill/devtools';

const timeline = new TimelineRecorder(500);

timeline.recordMount(nodeId, type);
timeline.recordUpdate(nodeId, changedProps);
timeline.recordUnmount(nodeId);
timeline.recordBatch(batchId, count, duration);
timeline.recordCallback(fnId, args);
timeline.recordHostEvent(eventName, payload);

const events = timeline.getEvents();
const rangeEvents = timeline.getEventsInRange(0, 1000);
const mounts = timeline.getEventsByType('mount');

timeline.reset();
const exported = timeline.export();
```

---

## CLI (rill/cli)

Command-line tool for building plugins.

### Build Command

```bash
# Build plugin
npx rill build src/plugin.tsx -o dist/bundle.js

# Watch mode
npx rill build src/plugin.tsx -o dist/bundle.js --watch

# Generate sourcemap
npx rill build src/plugin.tsx -o dist/bundle.js --sourcemap

# No minification
npx rill build src/plugin.tsx -o dist/bundle.js --no-minify

# Generate metafile
npx rill build src/plugin.tsx -o dist/bundle.js --metafile dist/meta.json
```

### Analyze Command

```bash
# Analyze bundle
npx rill analyze dist/bundle.js
```

### Programmatic Interface

```tsx
import { build, analyze } from 'rill/cli';

await build({
  entry: 'src/plugin.tsx',
  outfile: 'dist/bundle.js',
  minify: true,
  sourcemap: false,
  watch: false,
  metafile: 'dist/meta.json',
});

await analyze('dist/bundle.js');
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

Errors in plugins don't affect the host application:

```tsx
// Errors in plugin code are caught
function BuggyPlugin() {
  throw new Error('Plugin crashed!');
}

// Host-side handling
engine.on('error', (error) => {
  console.error('Plugin error:', error);
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
// Enable DevTools in development
if (__DEV__) {
  const devtools = createDevTools();
  devtools.enable();
}
```

### 4. Error Boundaries

```tsx
<EngineView
  source={bundleUrl}
  onError={(error) => {
    reportError(error);
  }}
  fallback={<ErrorFallback />}
/>
```
