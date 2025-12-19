# RillSandboxNative TurboModule

This document explains how the automatic initialization of Rill's native sandbox modules works.

## Overview

The `RillSandboxNative` package includes TurboModule implementations that automatically initialize the JSI (JavaScript Interface) bindings when your React Native app starts.

This means:
- `global.__JSCSandboxJSI` is automatically available on iOS/macOS
- `global.__QuickJSSandboxJSI` is automatically available on all platforms
- No manual initialization code needed

## How It Works

### React Native Old Architecture
- The Objective-C bridge automatically loads the native module
- When the JavaScript runtime is ready, `RillSandboxNative` module initializes
- JSI bindings are installed into the runtime

### React Native New Architecture (Fabric)
- TurboModule is registered with the new bridging system
- `RillSandboxNativeTurboModule` is instantiated automatically
- JSI bindings are installed during module initialization

## Usage

### Installation

```bash
npm install rill
# or
npm install @rill/sandbox-native
```

### iOS/macOS

```bash
cd ios && pod install
```

The `RillSandboxNative.podspec` declares the native module, so CocoaPods will automatically link it.

### Android

```bash
# Just rebuild your Android project
./gradlew build
```

The CMake build script includes the necessary QuickJS sources.

## Troubleshooting

### `__JSCSandboxJSI is undefined`

If you see this error on iOS:
1. Ensure `pod install` was run after `npm install`
2. Check that the RillSandboxNative pod is included in your Podfile
3. Try a clean build: `rm -rf ~/Library/Developer/Xcode/DerivedData/*`

### Module not loading

In Xcode's console, you should see:
```
[Rill] RillSandboxNative module initialized
[JSCSandbox] JSI bindings installed
```

If these messages don't appear:
1. Check the Xcode build log for linking errors
2. Ensure all dependencies are properly linked
3. Verify the podspec is correct

## Architecture Details

### Files

- `jsc/src/RillSandboxNativeTurboModule.h` - JSC TurboModule declaration
- `jsc/src/RillSandboxNativeTurboModule.mm` - JSC TurboModule implementation
- `quickjs/src/RillQuickJSNativeTurboModule.h` - QuickJS TurboModule declaration
- `quickjs/src/RillQuickJSNativeTurboModule.cpp` - QuickJS TurboModule implementation

### Initialization Flow

```
App Launch
  ↓
React Native Bridge Initialization
  ↓
RillSandboxNative Module Loaded
  ↓
JSI Runtime Ready
  ↓
install() functions called
  ↓
global.__JSCSandboxJSI available ✓
global.__QuickJSSandboxJSI available ✓
```

## Advanced: Manual Initialization

If you need manual control (e.g., for testing), you can import the modules directly:

```typescript
import { getJSCModule, getQuickJSModule } from '@rill/sandbox-native/jsc';
```

However, in production apps, the TurboModule automatic initialization is preferred.
