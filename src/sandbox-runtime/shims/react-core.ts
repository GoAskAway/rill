/**
 * React Core Implementation for Sandbox
 *
 * Core React API: createElement, Fragment, isValidElement, cloneElement, Children
 */

import type {
  CloneElement,
  CreateElement,
  IsValidElement,
  RegisterComponentType,
  RillChildren,
  RillChildrenUtils,
  RillComponentTypeRef,
  RillElementType,
  RillFunctionComponent,
  RillProps,
  RillReactElement,
} from '../types';
import { RILL_ELEMENT_MARKER, RILL_FRAGMENT_MARKER } from '../types';

// ============================================
// Component Type Registration
// ============================================

/**
 * External component type registration function - set by runtime
 */
let externalRegisterComponentType: RegisterComponentType | null = null;

/**
 * Set the external registration function
 */
export function setRegisterComponentType(fn: RegisterComponentType): void {
  externalRegisterComponentType = fn;
}

// ============================================
// createElement
// ============================================

/**
 * Create a Rill React element
 *
 * Handles:
 * - String types (native components): 'View', 'Text', etc.
 * - Function types (user components): registers and converts to reference
 * - Fragment type: uses fragment marker
 */
export const createElement: CreateElement = <P extends RillProps>(
  type: string | RillFunctionComponent<P> | typeof RILL_FRAGMENT_MARKER,
  props: P | null,
  ...children: RillChildren[]
): RillReactElement<P> => {
  // Determine final children
  let finalChildren: RillChildren | undefined;

  if (children.length > 0) {
    // createElement(type, props, child1, child2, ...)
    finalChildren = children.length === 1 ? children[0] : children;
  } else if (props !== null && 'children' in props) {
    // jsx/jsxs(type, { children: [...], ...props })
    const propsChildren = props['children'];
    if (propsChildren !== undefined) {
      finalChildren = propsChildren as RillChildren;
    }
  }

  // Build props without the children property (we set it explicitly)
  const propsWithoutChildren: Record<string, unknown> = {};
  if (props !== null) {
    for (const key of Object.keys(props)) {
      if (key !== 'children') {
        propsWithoutChildren[key] = props[key as keyof P];
      }
    }
  }

  if (finalChildren !== undefined) {
    propsWithoutChildren['children'] = finalChildren;
  }

  // Handle function component types: register and convert to reference
  let finalType: RillElementType;

  if (typeof type === 'function') {
    // Register the function component with the Host-side registry
    let registerId: string | null = null;

    if (externalRegisterComponentType !== null) {
      registerId = externalRegisterComponentType(type as RillFunctionComponent);
    }

    if (registerId !== null) {
      // Replace function with a serializable reference
      const ref: RillComponentTypeRef = {
        __rillComponentId: registerId,
        displayName: type.displayName ?? type.name ?? 'Anonymous',
      };
      finalType = ref;
    } else {
      // If registration fails, keep the raw function (may work in NoSandbox mode)
      // This is a type assertion because we know this is a special case
      finalType = type as unknown as RillElementType;
    }
  } else {
    finalType = type;
  }

  const element: RillReactElement<P> = {
    __rillTypeMarker: RILL_ELEMENT_MARKER,
    type: finalType,
    props: propsWithoutChildren as P,
  };

  return element;
};

// ============================================
// Fragment
// ============================================

/**
 * Fragment component - rendered as fragment marker
 */
export const Fragment = RILL_FRAGMENT_MARKER;

// ============================================
// isValidElement
// ============================================

/**
 * Check if an object is a valid Rill React element
 */
export const isValidElement: IsValidElement = (
  object: unknown
): object is RillReactElement => {
  return (
    typeof object === 'object' &&
    object !== null &&
    '__rillTypeMarker' in object &&
    (object as RillReactElement).__rillTypeMarker === RILL_ELEMENT_MARKER
  );
};

// ============================================
// cloneElement
// ============================================

/**
 * Clone a React element with new props
 */
export const cloneElement: CloneElement = <P extends RillProps>(
  element: RillReactElement<P>,
  props?: Partial<P>,
  ...children: RillChildren[]
): RillReactElement<P> => {
  if (!isValidElement(element)) {
    return element;
  }

  // Merge props
  const newProps: Record<string, unknown> = { ...element.props };

  if (props !== undefined) {
    for (const key of Object.keys(props)) {
      newProps[key] = props[key as keyof P];
    }
  }

  // Handle children passed as additional arguments
  if (children.length > 0) {
    newProps['children'] = children.length === 1 ? children[0] : children;
  }

  return {
    __rillTypeMarker: RILL_ELEMENT_MARKER,
    type: element.type,
    props: newProps as P,
  };
};

// ============================================
// Children Utilities
// ============================================

/**
 * Normalize children to array
 */
function normalizeChildren(children: RillChildren): RillChildren[] {
  if (children === null || children === undefined) return [];
  if (Array.isArray(children)) return children;
  return [children];
}

/**
 * Children utilities object
 */
export const Children: RillChildrenUtils = {
  map<T>(
    children: RillChildren,
    fn: (child: RillChildren, index: number) => T
  ): T[] {
    return normalizeChildren(children).map(fn);
  },

  forEach(
    children: RillChildren,
    fn: (child: RillChildren, index: number) => void
  ): void {
    normalizeChildren(children).forEach(fn);
  },

  count(children: RillChildren): number {
    return normalizeChildren(children).length;
  },

  only(children: RillChildren): RillReactElement {
    const arr = normalizeChildren(children);
    if (arr.length !== 1) {
      throw new Error('React.Children.only expected one child');
    }
    const child = arr[0];
    if (!isValidElement(child)) {
      throw new Error('React.Children.only expected a React element');
    }
    return child;
  },

  toArray(children: RillChildren): RillChildren[] {
    return normalizeChildren(children);
  },
};
