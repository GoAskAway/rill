import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Minimal TurboModule spec for installing native JSI sandboxes.
 *
 * The primary integration surface is via global JSI bindings:
 * - global.__JSCSandboxJSI (Apple platforms)
 * - global.__QuickJSSandboxJSI (cross-platform)
 *
 * This spec exists to enable New Architecture codegen/autolinking pipelines.
 */
export interface Spec extends TurboModule {}

export default TurboModuleRegistry.getEnforcing<Spec>('RillSandboxNative');
