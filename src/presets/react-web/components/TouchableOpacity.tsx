/**
 * TouchableOpacity Component (Web)
 *
 * Maps to button-like div with hover opacity
 */

import type React from 'react';
import { useState } from 'react';

export interface TouchableOpacityProps {
  style?: React.CSSProperties;
  children?: React.ReactNode;
  className?: string;
  onPress?: () => void;
  activeOpacity?: number;
  disabled?: boolean;
}

export function TouchableOpacity({
  style,
  children,
  className,
  onPress,
  activeOpacity = 0.7,
  disabled = false,
}: TouchableOpacityProps): React.ReactElement {
  const [isPressed, setIsPressed] = useState(false);

  const baseStyle: React.CSSProperties = {
    display: 'flex',
    cursor: disabled ? 'default' : 'pointer',
    opacity: isPressed ? activeOpacity : 1,
    transition: 'opacity 0.1s',
    ...style,
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: TouchableOpacity is a pressable container component
    // biome-ignore lint/a11y/useKeyWithClickEvents: Touchable component for mobile-like interactions, keyboard handled by parent
    <div
      style={baseStyle}
      className={className}
      onClick={disabled ? undefined : onPress}
      onMouseDown={() => !disabled && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
    >
      {children}
    </div>
  );
}

export default TouchableOpacity;
