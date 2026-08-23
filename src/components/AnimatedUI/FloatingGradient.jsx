import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import './FloatingGradient.css';

export default function FloatingGradient({
  children,
  className = '',
  interactive = true,
  blobCount = 4,
  colors = {
    blob1: 'rgba(34, 197, 94, 0.45)',    // Emerald green
    blob2: 'rgba(16, 185, 129, 0.35)',   // Mint green
    blob3: 'rgba(52, 219, 118, 0.30)',   // Bright lime
    blob4: 'rgba(245, 158, 11, 0.22)',   // Warm golden sunlight
    blob5: 'rgba(20, 184, 166, 0.28)',   // Teal radiance
    glow: 'rgba(34, 197, 94, 0.2)',
  },
  ...props
}) {
  const containerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse tracking with smooth spring damping
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { stiffness: 80, damping: 25 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Parallax shifts for floating layers
  const layer1X = useTransform(smoothX, [-300, 300], [-30, 30]);
  const layer1Y = useTransform(smoothY, [-300, 300], [-25, 25]);
  const layer2X = useTransform(smoothX, [-300, 300], [25, -25]);
  const layer2Y = useTransform(smoothY, [-300, 300], [20, -20]);

  const handleMouseMove = (e) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={containerRef}
      className={`floating-gradient-container ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {/* ── Outer subtle glow rim ── */}
      <div className="fg-glow-rim" aria-hidden="true" />

      {/* ── Soft Blurred Floating Color Blobs Layer ── */}
      <div className="fg-blobs-canvas" aria-hidden="true">
        {/* Blob 1: Top-Left Drifting Emerald */}
        <motion.div
          className="fg-blob blob-one"
          style={{
            background: `radial-gradient(circle, ${colors.blob1} 0%, rgba(34, 197, 94, 0) 70%)`,
            x: layer1X,
            y: layer1Y,
          }}
          animate={{
            x: [-35, 40, -25, -35],
            y: [-30, 25, 45, -30],
            scale: [1, 1.15, 0.92, 1],
            rotate: [0, 90, 180, 360],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Blob 2: Bottom-Right Orbiting Mint */}
        <motion.div
          className="fg-blob blob-two"
          style={{
            background: `radial-gradient(circle, ${colors.blob2} 0%, rgba(16, 185, 129, 0) 70%)`,
            x: layer2X,
            y: layer2Y,
          }}
          animate={{
            x: [40, -35, 30, 40],
            y: [30, -40, -15, 30],
            scale: [1.1, 0.88, 1.2, 1.1],
            rotate: [360, 240, 120, 0],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Blob 3: Center-Right Fresh Lime Glow */}
        <motion.div
          className="fg-blob blob-three"
          style={{
            background: `radial-gradient(circle, ${colors.blob3} 0%, rgba(52, 219, 118, 0) 70%)`,
          }}
          animate={{
            x: [0, 50, -40, 0],
            y: [20, -35, 30, 20],
            scale: [0.95, 1.25, 0.9, 0.95],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Blob 4: Warm Golden Amber Pulse */}
        <motion.div
          className="fg-blob blob-four"
          style={{
            background: `radial-gradient(circle, ${colors.blob4} 0%, rgba(245, 158, 11, 0) 70%)`,
          }}
          animate={{
            x: [-20, 30, -15, -20],
            y: [40, -20, -40, 40],
            scale: [1, 1.3, 0.85, 1],
            opacity: [0.6, 0.95, 0.5, 0.6],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Blob 5: Center Ambient Core */}
        <motion.div
          className="fg-blob blob-five"
          style={{
            background: `radial-gradient(circle, ${colors.blob5} 0%, rgba(20, 184, 166, 0) 75%)`,
          }}
          animate={{
            scale: [1, 1.18, 0.95, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Interactive Dynamic Mouse Follower Blob */}
        {interactive && (
          <motion.div
            className="fg-blob blob-interactive"
            style={{
              x: smoothX,
              y: smoothY,
              background: `radial-gradient(circle, rgba(74, 222, 128, 0.4) 0%, rgba(74, 222, 128, 0) 65%)`,
              opacity: isHovered ? 0.9 : 0.4,
            }}
            transition={{ opacity: { duration: 0.3 } }}
          />
        )}
      </div>

      {/* ── Micro-grid overlay texture for depth ── */}
      <div className="fg-grid-overlay" aria-hidden="true" />

      {/* ── Foreground Content ── */}
      <div className="fg-content">
        {children}
      </div>
    </div>
  );
}
