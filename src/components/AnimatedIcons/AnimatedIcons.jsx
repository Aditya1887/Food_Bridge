import React from 'react';
import { motion } from 'framer-motion';

/* ── 1. Animated Steaming Meal Bowl ──────────────────── */
export function AnimatedMealBowl({ size = 32, color = '#2e7d32', bg = '#e8f5e9' }) {
  return (
    <motion.svg
      viewBox="0 0 32 32"
      fill="none"
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.15 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
    >
      {/* Bowl Base with gentle breathing motion */}
      <motion.path
        d="M7 16 C7 23 11 26 16 26 C21 26 25 23 25 16 H7 Z"
        fill={bg}
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        animate={{ y: [0, -1, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Bowl Rim */}
      <motion.line
        x1="5"
        y1="16"
        x2="27"
        y2="16"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        animate={{ y: [0, -1, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Steam Line 1 (Left) */}
      <motion.path
        d="M11 13 Q 12 10 11 7 Q 10 4 11 2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        animate={{
          y: [0, -4, -8],
          opacity: [0, 0.9, 0],
          pathLength: [0.3, 1, 0.4],
        }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0 }}
      />
      {/* Steam Line 2 (Center) */}
      <motion.path
        d="M16 13 Q 17 9 16 5 Q 15 2 16 0"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        animate={{
          y: [0, -5, -9],
          opacity: [0, 1, 0],
          pathLength: [0.4, 1, 0.5],
        }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
      />
      {/* Steam Line 3 (Right) */}
      <motion.path
        d="M21 13 Q 22 10 21 7 Q 20 4 21 2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        animate={{
          y: [0, -4, -8],
          opacity: [0, 0.85, 0],
          pathLength: [0.3, 1, 0.4],
        }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 1.3 }}
      />
    </motion.svg>
  );
}

/* ── 2. Animated People & Community Icon ──────────────── */
export function AnimatedCommunityPeople({ size = 32, color = '#2e7d32', bg = '#e8f5e9' }) {
  return (
    <motion.svg
      viewBox="0 0 32 32"
      fill="none"
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.15 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
    >
      {/* Connection Pulse Ring */}
      <motion.circle
        cx="16"
        cy="11"
        r="7"
        stroke={color}
        strokeWidth="0.8"
        strokeDasharray="2 2"
        animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.4, 0.1] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Center Person Head */}
      <motion.circle
        cx="16"
        cy="11"
        r="3.5"
        fill={bg}
        stroke={color}
        strokeWidth="1.8"
        animate={{ y: [0, -1.2, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Center Person Body */}
      <motion.path
        d="M10.5 24 C10.5 19.5 13 17.5 16 17.5 C19 17.5 21.5 19.5 21.5 24"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        animate={{ scaleY: [1, 1.04, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Left Person Head */}
      <motion.circle
        cx="9"
        cy="14"
        r="2.5"
        fill={bg}
        stroke={color}
        strokeWidth="1.6"
        animate={{ y: [0, -1, 0], x: [0, 0.5, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      />
      {/* Left Person Body */}
      <path
        d="M5 24 C5 21 7 19.5 9 19.5"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Right Person Head */}
      <motion.circle
        cx="23"
        cy="14"
        r="2.5"
        fill={bg}
        stroke={color}
        strokeWidth="1.6"
        animate={{ y: [0, -1, 0], x: [0, -0.5, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      />
      {/* Right Person Body */}
      <path
        d="M27 24 C27 21 25 19.5 23 19.5"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </motion.svg>
  );
}

/* ── 3. Animated City Skyline & Communities ───────────── */
export function AnimatedCitySkyline({ size = 32, color = '#2e7d32', bg = '#e8f5e9' }) {
  return (
    <motion.svg
      viewBox="0 0 32 32"
      fill="none"
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.15 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
    >
      {/* Building 1 (Left) */}
      <rect x="6" y="10" width="9" height="16" rx="1.5" fill={bg} stroke={color} strokeWidth="1.8" />
      {/* Building 2 (Right - taller) */}
      <rect x="17" y="6" width="9" height="20" rx="1.5" fill={bg} stroke={color} strokeWidth="1.8" />
      
      {/* Animated Glowing Windows (Left building) */}
      <motion.line
        x1="9"
        y1="14"
        x2="12"
        y2="14"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0 }}
      />
      <motion.line
        x1="9"
        y1="18"
        x2="12"
        y2="18"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
      />

      {/* Animated Glowing Windows (Right building) */}
      <motion.line
        x1="20"
        y1="10"
        x2="23"
        y2="10"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
      />
      <motion.line
        x1="20"
        y1="14"
        x2="23"
        y2="14"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}
      />
      <motion.line
        x1="20"
        y1="18"
        x2="23"
        y2="18"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
      />

      {/* Little floating eco particle / sunshine ray */}
      <motion.circle
        cx="21.5"
        cy="3.5"
        r="1.2"
        fill="#f59e0b"
        animate={{ scale: [0.8, 1.3, 0.8], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.svg>
  );
}

/* ── 4. Animated NGO Partners Beating Heart ───────────── */
export function AnimatedNgoHeart({ size = 32, color = '#2e7d32', bg = '#e8f5e9' }) {
  return (
    <motion.svg
      viewBox="0 0 32 32"
      fill="none"
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
    >
      {/* Outer subtle glowing pulse ripple */}
      <motion.path
        d="M16 24 C16 24 7 18.5 7 12.5 C7 9 10 6.5 13.5 6.5 C15.2 6.5 16 7.5 16 7.5 C16 7.5 16.8 6.5 18.5 6.5 C22 6.5 25 9 25 12.5 C25 18.5 16 24 16 24 Z"
        stroke={color}
        strokeWidth="1"
        strokeDasharray="2 2"
        animate={{ scale: [1, 1.25, 1], opacity: [0.1, 0.4, 0.1] }}
        style={{ transformOrigin: '16px 14px' }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Main Heart with Realistic Heartbeat Pulse */}
      <motion.path
        d="M16 23 C16 23 8 18 8 12.5 C8 9.5 10.5 7.5 13.5 7.5 C15 7.5 16 8.5 16 8.5 C16 8.5 17 7.5 18.5 7.5 C21.5 7.5 24 9.5 24 12.5 C24 18 16 23 16 23 Z"
        fill={bg}
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{
          scale: [1, 1.14, 1, 1.2, 1],
        }}
        style={{ transformOrigin: '16px 14px' }}
        transition={{
          duration: 1.4,
          repeat: Infinity,
          ease: 'easeInOut',
          times: [0, 0.15, 0.3, 0.45, 1],
        }}
      />
      {/* Twinkle sparkle on heart */}
      <motion.path
        d="M13 11 L14 11 M13.5 10.5 L13.5 11.5"
        stroke="#ffffff"
        strokeWidth="1.2"
        strokeLinecap="round"
        animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.svg>
  );
}

/* ── 5. Process Step 01: Animated We Collect (Hands & Heart) */
export function AnimatedCollectHands({ size = 40, color = '#2e7d32' }) {
  return (
    <motion.svg
      viewBox="0 0 40 40"
      fill="none"
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.12 }}
    >
      {/* Floating Beating Heart */}
      <motion.path
        d="M20 18 C18.5 16 15.5 13.5 15.5 11.2 C15.5 9.4 17 8 18.8 8 C19.6 8 20 8.5 20 8.5 C20 8.5 20.4 8 21.2 8 C23 8 24.5 9.4 24.5 11.2 C24.5 13.5 21.5 16 20 18 Z"
        fill="#c8e6c9"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{
          y: [0, -3, 0],
          scale: [1, 1.12, 1, 1.18, 1],
        }}
        style={{ transformOrigin: '20px 13px' }}
        transition={{
          duration: 1.6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      {/* Sparkle sparkles floating up */}
      <motion.circle
        cx="20"
        cy="5"
        r="1"
        fill="#4ade80"
        animate={{ y: [0, -3, -6], opacity: [0, 1, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: 0.2 }}
      />
      <motion.circle
        cx="25"
        cy="7"
        r="0.8"
        fill="#4ade80"
        animate={{ y: [0, -2, -5], opacity: [0, 1, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: 0.7 }}
      />
      {/* Left Hand with gentle cupping cradle */}
      <motion.path
        d="M8 24 C8 21.8 10 20 13 20 C15.5 20 17.5 21.5 18.5 23.5 L16.5 26 C14.5 25 12.5 25 9.5 26.5"
        fill="#e8f5e9"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{ rotate: [-2, 2, -2] }}
        style={{ transformOrigin: '8px 24px' }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.path
        d="M8 24 V30 C8 31.5 9.5 32.5 11 32.5 H17 C19.5 32.5 20.5 31 21 29"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right Hand with gentle cupping cradle */}
      <motion.path
        d="M32 24 C32 21.8 30 20 27 20 C24.5 20 22.5 21.5 21.5 23.5 L23.5 26 C25.5 25 27.5 25 30.5 26.5"
        fill="#e8f5e9"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{ rotate: [2, -2, 2] }}
        style={{ transformOrigin: '32px 24px' }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.path
        d="M32 24 V30 C32 31.5 30.5 32.5 29 32.5 H23 C20.5 32.5 19.5 31 19 29"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.svg>
  );
}

/* ── 6. Process Step 02: Animated We Deliver (Bouncing Van & Wheels) */
export function AnimatedDeliverVan({ size = 40, color = '#2e7d32' }) {
  return (
    <motion.svg
      viewBox="0 0 40 40"
      fill="none"
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.12 }}
    >
      {/* Van Body with Road Suspension Bounce */}
      <motion.g
        animate={{ y: [0, -1.5, 0, 0.8, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Main Box Cargo */}
        <rect x="4" y="14" width="20" height="15" rx="3" fill="#e8f5e9" stroke={color} strokeWidth="1.8" />
        {/* Driver Cab */}
        <path
          d="M24 18 H31 L36 24 V29 H24 V18 Z"
          fill="#e8f5e9"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Window */}
        <path d="M26 20 H30 L33 24 H26 V20 Z" fill="#c8e6c9" />
        {/* Heart logo on van side */}
        <path
          d="M14 20 C14 20 11 18 11 16 C11 15 12 14 13 14 C13.8 14 14 14.5 14 14.5 C14 14.5 14.2 14 15 14 C16 14 17 15 17 16 C17 18 14 20 14 20 Z"
          fill={color}
        />
      </motion.g>

      {/* Speed Wind Lines (behind the van) */}
      <motion.line
        x1="2"
        y1="16"
        x2="0"
        y2="16"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={{ x: [4, -4], opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      />
      <motion.line
        x1="3"
        y1="22"
        x2="0"
        y2="22"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={{ x: [4, -4], opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear', delay: 0.3 }}
      />

      {/* Front & Back Wheels Spinning */}
      <motion.g
        style={{ transformOrigin: '10px 30px' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      >
        <circle cx="10" cy="30" r="3.5" fill="#c8e6c9" stroke={color} strokeWidth="1.8" />
        <line x1="8" y1="30" x2="12" y2="30" stroke={color} strokeWidth="1.2" />
        <line x1="10" y1="28" x2="10" y2="32" stroke={color} strokeWidth="1.2" />
      </motion.g>

      <motion.g
        style={{ transformOrigin: '29px 30px' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      >
        <circle cx="29" cy="30" r="3.5" fill="#c8e6c9" stroke={color} strokeWidth="1.8" />
        <line x1="27" y1="30" x2="31" y2="30" stroke={color} strokeWidth="1.2" />
        <line x1="29" y1="28" x2="29" y2="32" stroke={color} strokeWidth="1.2" />
      </motion.g>
    </motion.svg>
  );
}

/* ── 7. Process Step 03: Animated We Support (Community Care) */
export function AnimatedSupportCare({ size = 40, color = '#2e7d32' }) {
  return (
    <motion.svg
      viewBox="0 0 40 40"
      fill="none"
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.12 }}
    >
      {/* Floating Warmth Heart overhead */}
      <motion.path
        d="M20 10 C20 10 17 7.5 17 5.5 C17 4.2 18 3.5 19 3.5 C19.6 3.5 20 4 20 4 C20 4 20.4 3.5 21 3.5 C22 3.5 23 4.2 23 5.5 C23 7.5 20 10 20 10 Z"
        fill="#f87171"
        animate={{ y: [0, -3, 0], scale: [1, 1.2, 1] }}
        style={{ transformOrigin: '20px 6px' }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Center Figure Head */}
      <motion.circle
        cx="20"
        cy="15"
        r="4.5"
        fill="#e8f5e9"
        stroke={color}
        strokeWidth="1.8"
        animate={{ y: [0, -1, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Center Figure Body */}
      <motion.path
        d="M13 29 C13 23.5 16 21 20 21 C24 21 27 23.5 27 29"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Left Figure */}
      <motion.circle
        cx="11"
        cy="18"
        r="3"
        fill="#e8f5e9"
        stroke={color}
        strokeWidth="1.5"
        animate={{ y: [0, -0.8, 0], rotate: [-4, 4, -4] }}
        style={{ transformOrigin: '11px 18px' }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
      />
      <path
        d="M6 29 C6 25.5 8 23.5 11 23.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Right Figure */}
      <motion.circle
        cx="29"
        cy="18"
        r="3"
        fill="#e8f5e9"
        stroke={color}
        strokeWidth="1.5"
        animate={{ y: [0, -0.8, 0], rotate: [4, -4, 4] }}
        style={{ transformOrigin: '29px 18px' }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
      />
      <path
        d="M34 29 C34 25.5 32 23.5 29 23.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </motion.svg>
  );
}

/* ── 8. Process Step 04: Animated We Sustain (Globe & Orbiting Leaf) */
export function AnimatedSustainEarth({ size = 40, color = '#2e7d32' }) {
  return (
    <motion.svg
      viewBox="0 0 40 40"
      fill="none"
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.12 }}
    >
      {/* Outer Globe Circle */}
      <circle cx="20" cy="20" r="13" fill="#e8f5e9" stroke={color} strokeWidth="1.8" />
      {/* Equator & Meridians with subtle rotation shimmer */}
      <motion.path
        d="M14 20 Q 20 12 26 20 Q 20 28 14 20 Z"
        fill="#c8e6c9"
        stroke={color}
        strokeWidth="1.5"
        animate={{ scaleX: [1, 0.8, 1, 1.1, 1] }}
        style={{ transformOrigin: '20px 20px' }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <line x1="20" y1="7" x2="20" y2="33" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      
      {/* Orbiting Eco Leaf */}
      <motion.g
        style={{ transformOrigin: '20px 20px' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      >
        <path
          d="M31 16 C34 13 36 15 36 15 C36 15 34 18 31 19 Z"
          fill="#4ade80"
          stroke={color}
          strokeWidth="1"
        />
      </motion.g>

      {/* Base Sprout Leaf */}
      <motion.path
        d="M24 24 C28 20 32 22 32 22 C32 22 30 26 26 28 Z"
        fill={color}
        opacity="0.85"
        animate={{ rotate: [0, 6, 0, -4, 0] }}
        style={{ transformOrigin: '24px 24px' }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.svg>
  );
}

/* ── 9. Animated Badge Leaf (Wind flutter) ─────────────── */
export function AnimatedBadgeLeaf({ size = 15, color = 'currentColor' }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      style={{ width: size, height: size, display: 'inline-block' }}
      animate={{
        rotate: [0, -12, 10, -6, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 3.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </motion.svg>
  );
}

/* ── 10. Animated Radiant Smiling Heart Doodle ─────────── */
export function AnimatedHeartDoodle({ size = 28, color = '#2e7d32' }) {
  return (
    <motion.svg
      viewBox="0 0 32 32"
      fill="none"
      style={{ width: size, height: size, display: 'inline-block' }}
      whileHover={{ scale: 1.25 }}
    >
      {/* Heart */}
      <motion.path
        d="M16 23 C16 23 8 18 8 13 C8 10 10.5 8 13.5 8 C15 8 16 9 16 9 C16 9 17 8 18.5 8 C21.5 8 24 10 24 13 C24 18 16 23 16 23 Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#e8f5e9"
        animate={{ scale: [1, 1.14, 1, 1.2, 1] }}
        style={{ transformOrigin: '16px 14px' }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Sunburst Radiant Rays */}
      <motion.g
        animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] }}
        style={{ transformOrigin: '16px 14px' }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <line x1="16" y1="3" x2="16" y2="5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        <line x1="22" y1="5" x2="20.5" y2="6.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        <line x1="10" y1="5" x2="11.5" y2="6.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        <line x1="26" y1="10" x2="24" y2="11" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        <line x1="6" y1="10" x2="8" y2="11" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      </motion.g>
    </motion.svg>
  );
}

/* ── 11. Animated Process Step Flow Arrow ─────────────── */
export function AnimatedStepArrow() {
  return (
    <motion.div
      className="imp-step-arrow-dot"
      animate={{ x: [0, 4, 0] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg viewBox="0 0 16 16" fill="currentColor" width="10" height="10">
        <polygon points="6,3 12,8 6,13" />
      </svg>
    </motion.div>
  );
}

/* ── 12. Animated Power Banner Leaf Badge ──────────────── */
export function AnimatedBannerLeaves({ size = 20, color = '#1b6b33' }) {
  return (
    <motion.div
      className="imp-banner-leaf-badge"
      whileHover={{ scale: 1.15, rotate: 15 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
    >
      <motion.svg
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: size, height: size }}
        animate={{ rotate: [0, -8, 8, -4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </motion.svg>
    </motion.div>
  );
}

/* ── 13. Animated Step 1 Donate Box (For HowItWorks) ───── */
export function AnimatedDonateBox({ size = 40, color = '#2e7d32' }) {
  return (
    <motion.svg
      viewBox="0 0 40 40"
      fill="none"
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.12 }}
    >
      <rect x="6" y="14" width="28" height="18" rx="3" fill="#e8f5e9" stroke={color} strokeWidth="1.8" />
      {/* Box flaps */}
      <motion.path
        d="M6 14 L12 9"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        animate={{ rotate: [-3, 3, -3] }}
        style={{ transformOrigin: '6px 14px' }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.path
        d="M34 14 L28 9"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        animate={{ rotate: [3, -3, 3] }}
        style={{ transformOrigin: '34px 14px' }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Floating Heart emerging from box */}
      <motion.path
        d="M20 26 C20 26 14 22 14 18.5 C14 16.8 15.3 15.5 17 15.5 C18.2 15.5 19 16.2 20 17 C21 16.2 21.8 15.5 23 15.5 C24.7 15.5 26 16.8 26 18.5 C26 22 20 26 20 26 Z"
        fill={color}
        animate={{ y: [0, -3, 0], scale: [1, 1.15, 1] }}
        style={{ transformOrigin: '20px 20px' }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.svg>
  );
}

/* ── 14. Animated Step 2 Match Nodes (For HowItWorks) ──── */
export function AnimatedMatchNodes({ size = 40, color = '#2e7d32' }) {
  return (
    <motion.svg
      viewBox="0 0 40 40"
      fill="none"
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.12 }}
    >
      <circle cx="14" cy="15" r="5" fill="#e8f5e9" stroke={color} strokeWidth="1.8" />
      <path d="M6 32 C6 26 9 23 14 23" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <circle cx="28" cy="15" r="5" fill="#e8f5e9" stroke={color} strokeWidth="1.8" />
      <path d="M36 32 C36 26 33 23 28 23" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      
      {/* Center matching beacon with pulsing connection */}
      <motion.path
        d="M14 32 C14 26 17 23 21 23 C25 23 28 26 28 32"
        fill="#c8e6c9"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        animate={{ scale: [1, 1.05, 1] }}
        style={{ transformOrigin: '21px 28px' }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.circle
        cx="21"
        cy="15"
        r="4"
        fill="#c8e6c9"
        stroke={color}
        strokeWidth="1.5"
        animate={{ scale: [1, 1.25, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Signal wave connecting left and right */}
      <motion.line
        x1="18"
        y1="15"
        x2="24"
        y2="15"
        stroke={color}
        strokeWidth="1.5"
        strokeDasharray="2 2"
        animate={{ opacity: [0.2, 1, 0.2] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.svg>
  );
}

/* ── 15. Animated Step 3 Schedule Calendar (HowItWorks) ── */
export function AnimatedScheduleClock({ size = 40, color = '#2e7d32' }) {
  return (
    <motion.svg
      viewBox="0 0 40 40"
      fill="none"
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.12 }}
    >
      <rect x="6" y="10" width="28" height="24" rx="4" fill="#e8f5e9" stroke={color} strokeWidth="1.8" />
      <line x1="6" y1="18" x2="34" y2="18" stroke={color} strokeWidth="1.5" />
      <rect x="14" y="7" width="4" height="6" rx="2" fill={color} />
      <rect x="22" y="7" width="4" height="6" rx="2" fill={color} />
      
      {/* Clock Face */}
      <circle cx="20" cy="27" r="6" fill="#c8e6c9" stroke={color} strokeWidth="1.5" />
      {/* Clock Hands Rotating */}
      <motion.line
        x1="20"
        y1="27"
        x2="20"
        y2="23"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ transformOrigin: '20px 27px' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      />
      <motion.line
        x1="20"
        y1="27"
        x2="23"
        y2="29"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ transformOrigin: '20px 27px' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
    </motion.svg>
  );
}

/* ── 16. Animated Value Leaf (For AboutUs) ─────────────── */
export function AnimatedEcoSprout({ size = 24, color = '#10b981' }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: size, height: size }}
      animate={{ rotate: [-5, 5, -5] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </motion.svg>
  );
}

/* ── 17. Animated Pin Map (WhyFoodBridge) ───────────────── */
export function AnimatedPinMap({ size = 24, color = '#3b82f6' }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.15 }}
    >
      <motion.path
        d="M12 21S4 14.5 4 9.5a8 8 0 1 1 16 0C20 14.5 12 21 12 21z"
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.circle
        cx="12"
        cy="9.5"
        r="2.5"
        fill={color}
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.svg>
  );
}

/* ── 18. Animated Bar Chart (WhyFoodBridge) ─────────────── */
export function AnimatedBarChart({ size = 24, color = '#a855f7' }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.15 }}
    >
      <motion.line
        x1="6"
        y1="20"
        x2="6"
        y2="14"
        animate={{ y2: [14, 11, 14] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0 }}
      />
      <motion.line
        x1="12"
        y1="20"
        x2="12"
        y2="4"
        animate={{ y2: [4, 7, 4] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      />
      <motion.line
        x1="18"
        y1="20"
        x2="18"
        y2="10"
        animate={{ y2: [10, 6, 10] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      />
    </motion.svg>
  );
}

/* ── 19. Animated Shield Check (WhyFoodBridge) ──────────── */
export function AnimatedShieldCheck({ size = 24, color = '#eab308' }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.15 }}
    >
      <motion.path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        animate={{ scale: [1, 1.04, 1] }}
        style={{ transformOrigin: '12px 12px' }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.path
        d="M9 12l2 2 4-4"
        animate={{ pathLength: [0.6, 1, 0.6], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.svg>
  );
}

/* ── 20. Animated Smiling Face (JourneySection) ────────── */
export function AnimatedSmileyFace({ size = 54, color = '#78350f', bg = '#fef08a' }) {
  return (
    <motion.svg
      viewBox="0 0 54 54"
      fill="none"
      stroke={color}
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.15, rotate: 10 }}
    >
      <circle cx="27" cy="27" r="18" fill={bg} fillOpacity="0.35" />
      <motion.circle
        cx="20"
        cy="23"
        r="2.5"
        fill={color}
        stroke="none"
        animate={{ scaleY: [1, 0.2, 1] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
      />
      <motion.circle
        cx="34"
        cy="23"
        r="2.5"
        fill={color}
        stroke="none"
        animate={{ scaleY: [1, 0.2, 1] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
      />
      <motion.path
        d="M18 31c2.5 4.5 7.5 7 10 7s7.5-2.5 10-7"
        animate={{ scale: [1, 1.06, 1] }}
        style={{ transformOrigin: '28px 34px' }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.svg>
  );
}

