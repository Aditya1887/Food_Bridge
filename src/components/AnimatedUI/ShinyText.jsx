import React from 'react';
import './ShinyText.css';

export default function ShinyText({
  text,
  disabled = false,
  speed = 4,
  className = '',
  shimmerColor = 'rgba(255, 255, 255, 0.85)',
  baseColor = 'inherit',
}) {
  const animationDuration = `${speed}s`;

  return (
    <span
      className={`shiny-text ${disabled ? 'disabled' : ''} ${className}`}
      style={{
        animationDuration,
        '--shimmer-color': shimmerColor,
        '--base-color': baseColor,
      }}
    >
      {text}
    </span>
  );
}
