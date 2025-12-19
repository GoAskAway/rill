/**
 * ActivityIndicator Component (Web)
 *
 * CSS spinner animation
 */

import React from 'react';

export interface ActivityIndicatorProps {
  size?: 'small' | 'large' | number;
  color?: string;
  animating?: boolean;
  className?: string;
}

export function ActivityIndicator({
  size = 'small',
  color = '#007AFF',
  animating = true,
  className,
}: ActivityIndicatorProps): React.ReactElement | null {
  if (!animating) return null;

  const sizeValue = typeof size === 'number' ? size : size === 'large' ? 36 : 20;

  const style: React.CSSProperties = {
    width: sizeValue,
    height: sizeValue,
    border: `3px solid ${color}33`,
    borderTopColor: color,
    borderRadius: '50%',
    animation: 'rill-spin 1s linear infinite',
  };

  return (
    <>
      <style>{`@keyframes rill-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={style} className={className} />
    </>
  );
}

export default ActivityIndicator;
