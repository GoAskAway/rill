/**
 * Runtime Helpers for Sandbox
 *
 * Event communication and callback management between Guest and Host.
 */

// ============================================
// Types
// ============================================

/**
 * Host event handler function
 */
export type HostEventHandler = (eventName: string, payload: unknown) => void;

/**
 * Event listener callback
 */
export type EventListenerCallback = (payload: unknown) => void;

/**
 * Event listener entry
 */
interface EventListenerEntry {
  readonly callback: EventListenerCallback;
  readonly once: boolean;
}

/**
 * Host event subscription
 */
export interface HostEventSubscription {
  readonly unsubscribe: () => void;
}

/**
 * Use host event hook return type
 */
export type UseHostEventReturn = (
  eventName: string,
  callback: EventListenerCallback
) => HostEventSubscription;

// ============================================
// Event Registry
// ============================================

/**
 * Event listeners registry
 */
const eventListeners = new Map<string, Set<EventListenerEntry>>();

/**
 * Register an event listener
 */
export function addEventListener(
  eventName: string,
  callback: EventListenerCallback,
  options?: { once?: boolean }
): HostEventSubscription {
  const entry: EventListenerEntry = {
    callback,
    once: options?.once ?? false,
  };

  let listeners = eventListeners.get(eventName);
  if (listeners === undefined) {
    listeners = new Set();
    eventListeners.set(eventName, listeners);
  }

  listeners.add(entry);

  return {
    unsubscribe(): void {
      listeners?.delete(entry);
      if (listeners?.size === 0) {
        eventListeners.delete(eventName);
      }
    },
  };
}

/**
 * Remove an event listener
 */
export function removeEventListener(
  eventName: string,
  callback: EventListenerCallback
): void {
  const listeners = eventListeners.get(eventName);
  if (listeners === undefined) return;

  for (const entry of listeners) {
    if (entry.callback === callback) {
      listeners.delete(entry);
      break;
    }
  }

  if (listeners.size === 0) {
    eventListeners.delete(eventName);
  }
}

/**
 * Dispatch an event to all listeners
 */
export function dispatchEvent(eventName: string, payload: unknown): void {
  const listeners = eventListeners.get(eventName);
  if (listeners === undefined) return;

  // Create a copy to avoid mutation during iteration
  const entries = Array.from(listeners);

  for (const entry of entries) {
    try {
      entry.callback(payload);

      // Remove if once
      if (entry.once) {
        listeners.delete(entry);
      }
    } catch (e: unknown) {
      console.error(`[rill] Event handler error for '${eventName}':`, e);
    }
  }

  if (listeners.size === 0) {
    eventListeners.delete(eventName);
  }
}

// ============================================
// Host Message Handler
// ============================================

/**
 * Handle incoming message from host
 */
export function handleHostMessage(message: {
  readonly type: string;
  readonly payload?: unknown;
}): void {
  const eventName = message.type;
  const payload = message.payload;

  dispatchEvent(eventName, payload);
}

// ============================================
// Host Event Hook
// ============================================

/**
 * External send event to host function - set by runtime
 */
let externalSendEventToHost: HostEventHandler | null = null;

/**
 * Set the external send event function
 */
export function setSendEventToHost(fn: HostEventHandler): void {
  externalSendEventToHost = fn;
}

/**
 * Send an event to the host
 */
export function sendEventToHost(eventName: string, payload?: unknown): void {
  if (externalSendEventToHost !== null) {
    externalSendEventToHost(eventName, payload);
  } else {
    console.warn('[rill] sendEventToHost: no handler set');
  }
}

/**
 * Create useHostEvent hook
 */
export function createUseHostEvent(): UseHostEventReturn {
  return (
    eventName: string,
    callback: EventListenerCallback
  ): HostEventSubscription => {
    return addEventListener(eventName, callback);
  };
}

// ============================================
// Config Access
// ============================================

/**
 * Config getter function type
 */
export type GetConfig = () => Readonly<Record<string, unknown>>;

/**
 * External config getter - set by runtime
 */
let externalGetConfig: GetConfig | null = null;

/**
 * Set the external config getter
 */
export function setGetConfig(fn: GetConfig): void {
  externalGetConfig = fn;
}

/**
 * Get current config
 */
export function getConfig(): Readonly<Record<string, unknown>> {
  if (externalGetConfig !== null) {
    return externalGetConfig();
  }
  return {};
}
