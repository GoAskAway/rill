# Rill API Documentation

## Overview

Rill is a lightweight React Native dynamic UI rendering engine that allows running React components in a sandbox environment and passing the render results to the host application.

## Package Exports

```
rill/
├── (default)        # Host runtime (Engine, EngineView, Receiver)
├── /let             # Guest SDK (components, hooks)
├── /devtools        # Development tools
├── /sandbox         # Sandbox providers (auto-detect)
├── /sandbox/native  # Native sandbox (JSC/QuickJS)
├── /sandbox/web     # Web sandbox (Worker)
└── /cli             # CLI build tools
```

---

## Guest SDK (rill/sdk)

SDK used by guest developers, runs in the sandbox environment.

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
| secureTextEntry | boolean | Password mode |
| multiline | boolean | Multi-line input |
| maxLength | number | Maximum length |

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
import { useConfig } from 'rill/sdk';

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
import { useSendToHost } from 'rill/sdk';

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

#### useRemoteRef

Create a remote ref for calling Host component instance methods.

```tsx
import { useRemoteRef, TextInput, TextInputRef } from 'rill/sdk';

function Guest() {
  const [inputRef, remoteInput] = useRemoteRef<TextInputRef>();

  const handleFocus = async () => {
    await remoteInput?.invoke('focus');
  };

  return (
    <View>
      <TextInput ref={inputRef} placeholder="Enter text" />
      <TouchableOpacity onPress={handleFocus}>
        <Text>Focus Input</Text>
      </TouchableOpacity>
    </View>
  );
}
```

| Return Value | Type | Description |
|--------------|------|-------------|
| refCallback | RemoteRefCallback | Callback to pass to component ref prop |
| remoteRef | RemoteRef\<T\> \| null | Remote ref object (available after mount) |

**RemoteRef Interface:**

| Property/Method | Type | Description |
|-----------------|------|-------------|
| nodeId | number | Node ID |
| invoke | (method: string, ...args: unknown[]) => Promise\<R\> | Call remote method |
| call | Proxy | Type-safe method proxy |

**Predefined Ref Types:**

- `TextInputRef`: `focus()`, `blur()`, `clear()`
- `ScrollViewRef`: `scrollTo()`, `scrollToEnd()`
- `FlatListRef`: `scrollToIndex()`, `scrollToOffset()`

---

### RillErrorBoundary

Guest-side error boundary component for catching render errors.

```tsx
import { RillErrorBoundary, View, Text } from 'rill/sdk';

function App() {
  return (
    <RillErrorBoundary
      fallback={<Text>An error occurred</Text>}
      onError={(error, info) => {
        console.error('Render error:', error, info.componentStack);
      }}
    >
      <MyComponent />
    </RillErrorBoundary>
  );
}
```

| Property | Type | Description |
|----------|------|-------------|
| children | ReactNode | Child components |
| fallback | ReactNode \| ((error, info) => ReactNode) | Content to show on error |
| onError | (error: Error, info: ErrorInfo) => void | Error callback |

---

## Host Runtime (rill)

Host-side runtime, responsible for sandbox execution and UI rendering.

### Engine

Sandbox engine, manages JS sandbox execution environment.

```tsx
import { Engine } from 'rill';

const engine = new Engine({
  timeout: 5000,
  debug: true,
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
engine.on('message', (msg) => console.log('Guest message:', msg));
engine.on('destroy', () => console.log('Guest destroyed'));

// Send events to sandbox
engine.sendEvent('REFRESH', { force: true });

// Health check
const health = engine.getHealth();

// Destroy engine
engine.destroy();
```

#### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
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
| on | event: keyof EngineEvents, handler: Function | () => void | Subscribe to engine event |
| getHealth | - | EngineHealth | Get engine health status |
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
import { Engine, EngineView } from 'rill';

function GuestContainer() {
  const engine = useMemo(() => new Engine({ debug: __DEV__ }), []);

  useEffect(() => {
    engine.register({ StepList: NativeStepList });
  }, [engine]);

  return (
    <EngineView
      engine={engine}
      source="https://cdn.example.com/bundle.js"
      initialProps={{ theme: 'dark' }}
      onLoad={() => console.log('Bundle loaded')}
      onError={(err) => console.error('Bundle error:', err)}
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
| source | string | Yes | Bundle source (URL or code string) |
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
import { ComponentRegistry, createRegistry } from 'rill';

const registry = new ComponentRegistry();
registry.register('CustomCard', MyCard);
registry.registerAll({ Header, Footer });

// Query components
const Component = registry.get('View');
const hasComponent = registry.has('CustomCard');
```

### Receiver

Operation receiver, parses operations and builds component tree.

```tsx
import { Receiver } from 'rill';

const receiver = new Receiver(
  registry,
  (message) => engine.sendToSandbox(message),
  () => forceUpdate()
);

// Apply operation batch
receiver.applyBatch(batch);

// Render component tree
const tree = receiver.render();
```

---

## DevTools (rill/devtools)

Development and debugging tools for Rill applications.

### createDevTools

Create a DevTools instance.

```tsx
import { createDevTools } from 'rill/devtools';

const devtools = createDevTools({
  runtime: {
    maxLogs: 100,
    maxTimelineEvents: 500,
  },
});

// Enable/disable
devtools.enable();
devtools.disable();

// Connect to engine
devtools.connectEngine(engine);

// Get component tree
const tree = devtools.getHostTree();

// Export debug data
const data = devtools.export();

// Reset all data
devtools.reset();
```

---

## CLI (rill/cli)

Command-line tool for building guest bundles.

### Build Command

```bash
# Build guest bundle
bunx rill build src/guest.tsx -o dist/bundle.js

# Watch mode for development
bunx rill build src/guest.tsx --watch --no-minify --sourcemap

# Analyze bundle
bunx rill analyze dist/bundle.js
```

### Programmatic Interface

```tsx
import { build, analyze } from 'rill/cli';

await build({
  entry: 'src/guest.tsx',
  outfile: 'dist/bundle.js',
  minify: true,
  sourcemap: false,
  watch: false,
  strict: true,  // Enable strict dependency guard (default)
});

await analyze('dist/bundle.js', {
  whitelist: ['react', 'react-native', 'react/jsx-runtime', 'rill/sdk'],
  failOnViolation: true,
});
```

---

## Type Definitions

### EngineOptions

```typescript
interface EngineOptions {
  provider?: JSEngineProvider;          // Custom provider
  timeout?: number;                     // Execution timeout (default 5000ms)
  debug?: boolean;                      // Debug mode
  logger?: {
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
  | 'CREATE'    // Create new node
  | 'UPDATE'    // Update node props
  | 'DELETE'    // Delete node
  | 'APPEND'    // Append child
  | 'INSERT'    // Insert child at index
  | 'REMOVE'    // Remove child
  | 'REORDER'   // Reorder children
  | 'TEXT'      // Update text content
  | 'REF_CALL'; // Remote method call (Remote Ref)

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

// ... other operation types
```

### HostMessage Types

```typescript
type HostMessageType =
  | 'CALL_FUNCTION'      // Call callback function
  | 'HOST_EVENT'         // Host event broadcast
  | 'CONFIG_UPDATE'      // Configuration update
  | 'DESTROY'            // Destroy signal
  | 'REF_METHOD_RESULT'; // Remote Ref method call result
```

### JSEngineProvider

```typescript
interface JSEngineProvider {
  createRuntime(): Promise<JSEngineRuntime>;
}

interface JSEngineRuntime {
  createContext(): Promise<JSEngineContext>;
}

interface JSEngineContext {
  eval(code: string): Promise<unknown>;
  evalBytecode?(bytecode: ArrayBuffer): unknown;  // Hermes only
  set(name: string, value: unknown): void;
  get(name: string): unknown;
  dispose(): void;
}
```

### Hermes Bytecode Precompilation

Hermes sandbox supports AOT (Ahead-of-Time) bytecode compilation for improved startup performance.

**Compile JS to Hermes Bytecode:**

```bash
# Using hermesc (from React Native's Hermes)
hermesc -emit-binary -O -out guest.hbc guest.js
```

**Execute Bytecode in Sandbox:**

```typescript
// Load precompiled bytecode
const bytecode = await fetch('guest.hbc').then(r => r.arrayBuffer());

// Create Hermes sandbox context
const runtime = provider.createRuntime();
const context = runtime.createContext();

// Execute bytecode (skips parsing/compilation)
if (context.evalBytecode) {
  context.evalBytecode(bytecode);
} else {
  // Fallback to source code for non-Hermes providers
  context.eval(sourceCode);
}
```

**Benefits:**
- Skip parsing and compilation phases
- Faster startup for static guest code
- Suitable for pre-known guest bundles and server-delivered updates

**Limitations:**
- Only available with Hermes sandbox (JSC/QuickJS not supported)
- Bytecode must match Hermes engine version
- Cannot use source maps for debugging

| Scenario | Recommended Method |
|----------|-------------------|
| Static guest modules (build-time known) | `evalBytecode` + precompilation |
| Dynamic guest code (runtime generated) | `eval` |
| Server-delivered update packages | `evalBytecode` + deliver .hbc |

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
  Card: MyCard,
  Badge: MyBadge,
});
```

### 2. Debugging

```tsx
engine.on('error', (error) => {
  console.error('[Guest Error]', error);
  reportError(error);
});

engine.on('operation', (batch) => {
  console.log(`Operations: ${batch.operations.length}`);
});
```

### 3. Error Boundaries

```tsx
<EngineView
  engine={engine}
  source={bundleUrl}
  onError={(error) => {
    reportError(error);
  }}
  renderError={(error) => <ErrorFallback error={error} />}
/>
```
