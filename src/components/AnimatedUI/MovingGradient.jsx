import React from 'react';
import './MovingGradient.css';

export default function MovingGradient({
  children,
  className = '',
  animated = true,
  gradientClassName = '',
  colors,
  ...props
}) {
  const customGradientStyle = colors
    ? {
        backgroundImage: `linear-gradient(135deg, ${colors.join(', ')})`,
      }
    : {};

  return (
    <div
      className={`moving-gradient-container ${className}`}
      {...props}
    >
      <div
        className={`moving-gradient-bg ${animated ? 'animate-bg-position' : ''} ${gradientClassName}`}
        style={customGradientStyle}
        aria-hidden="true"
      />
      <div className="moving-gradient-blur-layer" aria-hidden="true" />
      <div className="moving-gradient-content">
        {children}
      </div>
    </div>
  );
}
