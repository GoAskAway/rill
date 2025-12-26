/**
 * React Context Implementation for Sandbox
 *
 * createContext and Context Provider/Consumer support.
 */

import type {
  CreateContext,
  RillChildren,
  RillContext,
  RillContextConsumer,
  RillContextProvider,
  RillReactElement,
} from '../types';
import { hooksState, useContext } from './hooks';

// ============================================
// createContext
// ============================================

/**
 * Create a new React Context
 */
export const createContext: CreateContext = <T>(defaultValue: T): RillContext<T> => {
  const context: RillContext<T> = {
    _currentValue: defaultValue,
    Provider: createProvider<T>(),
    Consumer: createConsumer<T>(),
  };

  // Bind provider and consumer to this context
  (context.Provider as ContextProviderWithContext<T>).__context = context;
  (context.Consumer as ContextConsumerWithContext<T>).__context = context;

  return context;
};

// ============================================
// Provider Implementation
// ============================================

/**
 * Provider with context reference
 */
interface ContextProviderWithContext<T> extends RillContextProvider<T> {
  __context: RillContext<T>;
}

/**
 * Create a Provider component for a context
 */
function createProvider<T>(): RillContextProvider<T> {
  const Provider: ContextProviderWithContext<T> = ((props: {
    value: T;
    children?: RillChildren;
  }): RillChildren => {
    // Register context value in global registry
    const context = Provider.__context;
    hooksState.contexts.set(context as RillContext<unknown>, props.value as unknown);

    // Return children directly (Provider is transparent)
    return props.children;
  }) as ContextProviderWithContext<T>;

  // Will be set after context creation
  Provider.__context = undefined as unknown as RillContext<T>;

  return Provider;
}

// ============================================
// Consumer Implementation
// ============================================

/**
 * Consumer with context reference
 */
interface ContextConsumerWithContext<T> extends RillContextConsumer<T> {
  __context: RillContext<T>;
}

/**
 * Create a Consumer component for a context
 */
function createConsumer<T>(): RillContextConsumer<T> {
  const Consumer: ContextConsumerWithContext<T> = ((props: {
    children: (value: T) => RillReactElement;
  }): RillReactElement => {
    const context = Consumer.__context;
    const value = useContext(context);
    return props.children(value);
  }) as ContextConsumerWithContext<T>;

  // Will be set after context creation
  Consumer.__context = undefined as unknown as RillContext<T>;

  return Consumer;
}
