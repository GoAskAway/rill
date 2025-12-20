/**
 * EngineView (Web)
 *
 * React Web component for rendering Guest UI in sandbox
 */

import type { ReactElement, ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Engine } from '@rill/runtime';

/**
 * EngineView Props
 */
export interface EngineViewProps {
  /**
   * Engine instance
   */
  engine: Engine;

  /**
   * Bundle source (URL or code string)
   */
  source: string;

  /**
   * Initial props to pass to the Guest
   */
  initialProps?: Record<string, unknown>;

  /**
   * Load complete callback
   */
  onLoad?: () => void;

  /**
   * Error callback
   */
  onError?: (error: Error) => void;

  /**
   * Destroy callback
   */
  onDestroy?: () => void;

  /**
   * Custom loading indicator
   */
  fallback?: ReactNode;

  /**
   * Custom error display
   */
  renderError?: (error: Error) => ReactNode;

  /**
   * Container className
   */
  className?: string;

  /**
   * Container style
   */
  style?: React.CSSProperties;
}

/**
 * Loading state
 */
type LoadingState = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * EngineView component for React Web
 */
export function EngineView({
  engine,
  source,
  initialProps,
  onLoad,
  onError,
  onDestroy,
  fallback,
  renderError,
  className,
  style,
}: EngineViewProps): ReactElement {
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [content, setContent] = useState<ReactElement | string | null>(null);
  const mountedRef = useRef(true);

  // Update callback
  const handleUpdate = useCallback(() => {
    if (!mountedRef.current) return;

    const receiver = engine.getReceiver();
    if (receiver) {
      setContent(receiver.render());
    }
  }, [engine]);

  // Load Guest
  useEffect(() => {
    mountedRef.current = true;

    async function loadGuest() {
      if (engine.isLoaded || engine.isDestroyed) {
        return;
      }

      setLoadingState('loading');
      setError(null);

      try {
        // Create Receiver
        engine.createReceiver(handleUpdate);

        // Load and execute Guest
        await engine.loadBundle(source, initialProps);

        if (mountedRef.current) {
          setLoadingState('loaded');
          onLoad?.();
        }
      } catch (err) {
        console.error('[EngineView] loadGuest error:', err);
        if (mountedRef.current) {
          const loadError = err instanceof Error ? err : new Error(String(err));
          setError(loadError);
          setLoadingState('error');
          onError?.(loadError);
        }
      }
    }

    loadGuest();

    return () => {
      mountedRef.current = false;
    };
  }, [engine, source, initialProps, handleUpdate, onLoad, onError]);

  // Listen to engine events
  useEffect(() => {
    const unsubscribeError = engine.on('error', (err: Error) => {
      if (mountedRef.current) {
        setError(err);
        setLoadingState('error');
        onError?.(err);
      }
    });

    const unsubscribeDestroy = engine.on('destroy', () => {
      if (mountedRef.current) {
        setContent(null);
        onDestroy?.();
      }
    });

    return () => {
      unsubscribeError();
      unsubscribeDestroy();
    };
  }, [engine, onError, onDestroy]);

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    ...style,
  };

  // Render loading state
  if (loadingState === 'loading' || loadingState === 'idle') {
    return (
      <div style={containerStyle} className={className}>
        {fallback ?? (
          <div
            style={{
              display: 'flex',
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                border: '3px solid #007AFF33',
                borderTopColor: '#007AFF',
                borderRadius: '50%',
                animation: 'rill-spin 1s linear infinite',
              }}
            />
            <style>{`@keyframes rill-spin { to { transform: rotate(360deg); } }`}</style>
            <span style={{ marginTop: 12, fontSize: 14, color: '#666' }}>Loading bundle...</span>
          </div>
        )}
      </div>
    );
  }

  // Render error state
  if (loadingState === 'error' && error) {
    return (
      <div style={containerStyle} className={className}>
        {renderError?.(error) ?? (
          <div
            style={{
              display: 'flex',
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              padding: 20,
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 600, color: '#FF3B30', marginBottom: 8 }}>
              Bundle Error
            </span>
            <span style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
              {error.message}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Render Guest content
  return (
    <div style={containerStyle} className={className}>
      {content}
    </div>
  );
}

export default EngineView;
