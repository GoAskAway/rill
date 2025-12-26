/**
 * React Class Component Implementation for Sandbox
 *
 * Component and PureComponent base classes.
 */

import type {
  ComponentState,
  RillComponent,
  RillComponentClass,
  RillProps,
  RillReactElement,
} from '../types';
import { scheduleRender } from './hooks';

// ============================================
// Component Base Class
// ============================================

/**
 * React Component base class
 */
export class Component<
  P extends RillProps = RillProps,
  S extends ComponentState = ComponentState,
> implements RillComponent<P, S>
{
  props: Readonly<P>;
  state: S;

  /**
   * Static method for getDerivedStateFromError
   */
  static getDerivedStateFromError: ((error: Error) => ComponentState | null) | null = null;

  constructor(props: P) {
    this.props = props;
    this.state = {} as S;
  }

  /**
   * Update component state
   */
  setState(
    partialState: Partial<S> | ((prevState: S, props: P) => Partial<S>),
    callback?: () => void
  ): void {
    // Compute new state
    const newPartialState =
      typeof partialState === 'function'
        ? partialState(this.state, this.props)
        : partialState;

    // Merge state
    this.state = { ...this.state, ...newPartialState };

    // Trigger re-render
    scheduleRender();

    // Callback after state update (async)
    if (callback !== undefined) {
      Promise.resolve()
        .then(callback)
        .catch((e: unknown) => {
          console.error('[rill] setState callback error:', e);
        });
    }
  }

  /**
   * Force a re-render
   */
  forceUpdate(callback?: () => void): void {
    scheduleRender();

    if (callback !== undefined) {
      Promise.resolve()
        .then(callback)
        .catch((e: unknown) => {
          console.error('[rill] forceUpdate callback error:', e);
        });
    }
  }

  /**
   * Render method - must be overridden by subclass
   */
  render(): RillReactElement | null {
    return null;
  }
}

// ============================================
// PureComponent
// ============================================

/**
 * React PureComponent - Component with shallow props/state comparison
 */
export class PureComponent<
  P extends RillProps = RillProps,
  S extends ComponentState = ComponentState,
> extends Component<P, S> {
  /**
   * Marker for pure component
   */
  readonly isPureReactComponent: true = true;
}

// ============================================
// Type-safe exports
// ============================================

/**
 * Export as RillComponentClass for type compatibility
 */
export const ComponentClass: RillComponentClass = Component as RillComponentClass;
export const PureComponentClass: RillComponentClass = PureComponent as RillComponentClass;
