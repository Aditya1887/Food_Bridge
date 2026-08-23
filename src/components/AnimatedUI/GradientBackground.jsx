import React from 'react';
import './GradientBackground.css';

/**
 * Lightswind Gradient Background Component
 * Provides a fluid animated gradient background with customizable colors,
 * wave motion, soft backdrop blur, and subtle vignette.
 */
export default function GradientBackground({
  children,
  className = '',
  animated = true,
  blur = 'blur-2xl',
  vignette = true,
  colors,
  ...props
}) {
  const customGradientStyle = colors
    ? {
        backgroundImage: `linear-gradient(135deg, ${colors.join(', ')})`,
      }
    : {};

  return (
    <div className={`lightswind-gradient-wrapper ${className}`} {...props}>
      {/* ── Animated Gradient Wave Canvas ── */}
      <div
        className={`lightswind-gradient-mesh ${animated ? 'animate-gradient-wave' : ''}`}
        style={customGradientStyle}
        aria-hidden="true"
      />

      {/* ── Soft Diffusion Blur Layer ── */}
      <div className="lightswind-gradient-blur" aria-hidden="true" />

      {/* ── Optional Radial Vignette ── */}
      {vignette && <div className="lightswind-gradient-vignette" aria-hidden="true" />}

      {/* ── Content ── */}
      <div className="lightswind-gradient-content">
        {children}
      </div>
    </div>
  );
}
