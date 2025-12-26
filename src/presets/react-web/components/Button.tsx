/**
 * Button Component (Web)
 *
 * Maps to button element
 */

import type React from 'react';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
  className?: string;
}

export function Button({
  title,
  onPress,
  color = '#007AFF',
  disabled = false,
  className,
}: ButtonProps): React.ReactElement {
  const style: React.CSSProperties = {
    backgroundColor: disabled ? '#ccc' : color,
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: 4,
    cursor: disabled ? 'default' : 'pointer',
    fontSize: 16,
  };

  return (
    <button type="button" style={style} className={className} onClick={onPress} disabled={disabled}>
      {title}
    </button>
  );
}

export default Button;
