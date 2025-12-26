/**
 * View Component (Web)
 *
 * Maps to div element with flexbox layout
 */

import type React from 'react';

export interface ViewProps {
  style?: React.CSSProperties;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function View({ style, children, className, onClick }: ViewProps): React.ReactElement {
  const baseStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    ...style,
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: View is a container component with optional click handler
    // biome-ignore lint/a11y/useKeyWithClickEvents: Generic container, keyboard interaction handled by parent when needed
    <div style={baseStyle} className={className} onClick={onClick}>
      {children}
    </div>
  );
}

export default View;
