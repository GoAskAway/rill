/**
 * Switch Component (Web)
 *
 * Maps to checkbox input styled as toggle
 */

import React from 'react';

export interface SwitchProps {
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Switch({
  value = false,
  onValueChange,
  disabled = false,
  className,
}: SwitchProps): React.ReactElement {
  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    width: 50,
    height: 28,
    backgroundColor: value ? '#34C759' : '#ccc',
    borderRadius: 14,
    padding: 2,
    cursor: disabled ? 'default' : 'pointer',
    transition: 'background-color 0.2s',
    opacity: disabled ? 0.5 : 1,
  };

  const thumbStyle: React.CSSProperties = {
    width: 24,
    height: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    transform: value ? 'translateX(22px)' : 'translateX(0)',
    transition: 'transform 0.2s',
  };

  return (
    <div
      style={containerStyle}
      className={className}
      onClick={() => !disabled && onValueChange?.(!value)}
    >
      <div style={thumbStyle} />
    </div>
  );
}

export default Switch;
