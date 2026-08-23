import React from 'react';
import './Marquee.css';

export default function Marquee({
  children,
  speed = 30,
  direction = 'left',
  pauseOnHover = true,
  className = '',
  fadeEdges = true,
}) {
  return (
    <div
      className={`marquee-container ${fadeEdges ? 'fade-edges' : ''} ${className}`}
      style={{
        '--speed': `${speed}s`,
        '--direction': direction === 'left' ? 'marquee-left' : 'marquee-right',
      }}
    >
      <div className={`marquee-track ${pauseOnHover ? 'pause-hover' : ''}`}>
        <div className="marquee-content">{children}</div>
        <div className="marquee-content" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
