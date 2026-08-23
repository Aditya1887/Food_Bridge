import React, { useRef, useState } from 'react';
import './SpotlightCard.css';

export default function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(38, 186, 100, 0.18)',
  borderColor = 'rgba(38, 186, 100, 0.35)',
  style = {},
  onClick,
}) {
  const cardRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0, opacity: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      opacity: 1,
    });
  };

  const handleMouseLeave = () => {
    setPosition((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      className={`spotlight-card ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        '--spotlight-x': `${position.x}px`,
        '--spotlight-y': `${position.y}px`,
        '--spotlight-opacity': position.opacity,
        '--spotlight-color': spotlightColor,
        '--spotlight-border': borderColor,
        ...style,
      }}
    >
      <div className="spotlight-layer" />
      <div className="spotlight-content">{children}</div>
    </div>
  );
}
