/**
 * Text Component (Web)
 *
 * Maps to span element
 */

import type React from 'react';

export interface TextProps {
  style?: React.CSSProperties;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Text({ style, children, className, onClick }: TextProps): React.ReactElement {
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Text component with optional click handler for interactive text
    // biome-ignore lint/a11y/useKeyWithClickEvents: Semantic text element, keyboard interaction handled by parent when needed
    <span style={style} className={className} onClick={onClick}>
      {children}
    </span>
  );
}

export default Text;
