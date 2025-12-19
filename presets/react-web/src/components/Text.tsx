/**
 * Text Component (Web)
 *
 * Maps to span element
 */

import React from 'react';

export interface TextProps {
  style?: React.CSSProperties;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Text({ style, children, className, onClick }: TextProps): React.ReactElement {
  return (
    <span style={style} className={className} onClick={onClick}>
      {children}
    </span>
  );
}

export default Text;
