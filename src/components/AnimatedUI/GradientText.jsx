import React from 'react';
import './GradientText.css';

export default function GradientText({
  children,
  className = '',
  colors = ['#126b2b', '#26ba64', '#10b981', '#34db76', '#126b2b'],
  animationSpeed = 6,
  showBorder = false,
}) {
  const gradientStyle = {
    backgroundImage: `linear-gradient(to right, ${colors.join(', ')})`,
    animationDuration: `${animationSpeed}s`,
  };

  return (
    <span className={`gradient-text-container ${showBorder ? 'with-border' : ''} ${className}`}>
      <span className="gradient-text-content" style={gradientStyle}>
        {children}
      </span>
    </span>
  );
}
