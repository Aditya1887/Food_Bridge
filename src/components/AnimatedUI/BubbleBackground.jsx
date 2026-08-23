import React, { useRef, useLayoutEffect, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import './BubbleBackground.css';

export default function BubbleBackground({
  children,
  className = '',
  interactive = true,
  transition = { stiffness: 100, damping: 20 },
  colors = {
    first: '18, 107, 43',     // Deep emerald
    second: '38, 186, 100',   // Vibrant leaf green
    third: '16, 185, 129',    // Mint emerald
    fourth: '52, 219, 118',   // Bright fresh green
    fifth: '245, 158, 11',    // Warm sunshine amber
    sixth: '74, 222, 128',    // Light sprout green
  },
  ...props
}) {
  const containerRef = useRef(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, transition);
  const springY = useSpring(mouseY, transition);

  const rectRef = useRef(null);
  const rafIdRef = useRef(null);

  useLayoutEffect(() => {
    const updateRect = () => {
      if (containerRef.current) {
        rectRef.current = containerRef.current.getBoundingClientRect();
      }
    };

    updateRect();

    const el = containerRef.current;
    const ro = new ResizeObserver(updateRect);
    if (el) ro.observe(el);

    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, []);

  useEffect(() => {
    if (!interactive) return;

    const el = containerRef.current;
    if (!el) return;

    const handleMouseMove = (e) => {
      const rect = rectRef.current;
      if (!rect) return;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        mouseX.set(e.clientX - centerX);
        mouseY.set(e.clientY - centerY);
      });
    };

    el.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
    };
  }, [interactive, mouseX, mouseY]);

  return (
    <div
      ref={containerRef}
      className={`bubble-bg-container ${className}`}
      style={{
        '--first-color': colors.first,
        '--second-color': colors.second,
        '--third-color': colors.third,
        '--fourth-color': colors.fourth,
        '--fifth-color': colors.fifth,
        '--sixth-color': colors.sixth,
      }}
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="bubble-bg-svg-defs"
        aria-hidden="true"
      >
        <defs>
          <filter id="bubble-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      <div className="bubble-bg-blobs-layer">
        {/* Blob 1 */}
        <motion.div
          className="bubble-blob blob-1"
          animate={{ y: [-40, 40, -40] }}
          transition={{ duration: 25, ease: 'easeInOut', repeat: Infinity }}
        />

        {/* Blob 2 — Revolving */}
        <motion.div
          className="bubble-revolving-wrapper rev-1"
          animate={{ rotate: 360 }}
          transition={{
            duration: 22,
            ease: 'linear',
            repeat: Infinity,
            repeatType: 'loop',
          }}
        >
          <div className="bubble-blob blob-2" />
        </motion.div>

        {/* Blob 3 — Orbiting opposite */}
        <motion.div
          className="bubble-revolving-wrapper rev-2"
          animate={{ rotate: 360 }}
          transition={{ duration: 35, ease: 'linear', repeat: Infinity }}
        >
          <div className="bubble-blob blob-3" />
        </motion.div>

        {/* Blob 4 — Drifting */}
        <motion.div
          className="bubble-blob blob-4"
          animate={{ x: [-40, 40, -40] }}
          transition={{ duration: 30, ease: 'easeInOut', repeat: Infinity }}
        />

        {/* Blob 5 — Giant background glow */}
        <motion.div
          className="bubble-revolving-wrapper rev-3"
          animate={{ rotate: 360 }}
          transition={{ duration: 24, ease: 'linear', repeat: Infinity }}
        >
          <div className="bubble-blob blob-5" />
        </motion.div>

        {/* Interactive Pointer Follower */}
        {interactive && (
          <motion.div
            className="bubble-blob blob-interactive"
            style={{
              x: springX,
              y: springY,
            }}
          />
        )}
      </div>

      {children && <div className="bubble-bg-content">{children}</div>}
    </div>
  );
}
