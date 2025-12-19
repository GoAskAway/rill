/**
 * View Component (Web)
 *
 * Maps to div element with flexbox layout
 */

import React from 'react';

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
    <div style={baseStyle} className={className} onClick={onClick}>
      {children}
    </div>
  );
}

export default View;
