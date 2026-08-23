import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { AnimatedCounter, AnimatedTooltip } from '../AnimatedUI';
import './ImpactBar.css';

import {
  AnimatedMealBowl,
  AnimatedCommunityPeople,
  AnimatedCitySkyline,
  AnimatedNgoHeart,
} from '../AnimatedIcons/AnimatedIcons';

/* ─── Stat Data with Animated Icons ─── */
const stats = [
  {
    icon: <AnimatedMealBowl size={26} color="#34db76" bg="rgba(52, 219, 118, 0.15)" />,
    display: '12.4K+',
    label: 'Meals Shared',
  },
  {
    icon: <AnimatedCommunityPeople size={26} color="#34db76" bg="rgba(52, 219, 118, 0.15)" />,
    display: '8.2K+',
    label: 'People Helped',
  },
  {
    icon: <AnimatedCitySkyline size={26} color="#34db76" bg="rgba(52, 219, 118, 0.15)" />,
    display: '540+',
    label: 'Communities',
  },
  {
    icon: <AnimatedNgoHeart size={26} color="#34db76" bg="rgba(52, 219, 118, 0.15)" />,
    display: '120+',
    label: 'NGO Partners',
  },
];

/* ─── StatItem with AnimatedCounter ─── */
function StatItem({ stat, inView, delay }) {
  return (
    <motion.div
      className="stat-item"
      initial={{ y: 20, opacity: 0 }}
      animate={inView ? { y: 0, opacity: 1 } : {}}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      <div className="stat-icon">{stat.icon}</div>
      <div className="stat-info">
        <span className="stat-value">
          <AnimatedCounter value={stat.display} delay={delay} />
        </span>
        <span className="stat-label">{stat.label}</span>
      </div>
    </motion.div>
  );
}

/* ─── Main ImpactBar Component ─── */
export default function ImpactBar() {
  const barRef = useRef(null);
  const isInView = useInView(barRef, { once: true, amount: 0.3 });

  return (
    <motion.div
      className="bottom-impact-bar"
      ref={barRef}
      initial={{ y: 60 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* SVG Wave */}
      <div className="impact-wave-wrapper">
        <svg className="impact-wave-svg" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path
            d="M0,60 C220,-20 440,-15 650,45 C860,105 1060,115 1240,55 C1350,20 1410,50 1440,65 L1440,120 L0,120 Z"
            className="wave-path"
          />
        </svg>
      </div>

      <div className="impact-bar-content">
        {/* Live Indicator */}
        <div className="live-impact-tag">
          <span className="pulse-dot" />
          Live Impact
        </div>

        {/* Floating Seed Pod */}
        <div className="floating-seed-pod">
          <svg className="seed-pod-svg" viewBox="0 0 36 54" fill="none">
            <path d="M18 3 C28 16 32 30 26 42 C21 49 14 51 9 46 C4 39 8 25 18 3 Z" fill="url(#seedPodGrad)" />
            <path d="M18 3 C14 18 12 32 16 46" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
            <defs>
              <linearGradient id="seedPodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#b6d498" />
                <stop offset="50%" stopColor="#729853" />
                <stop offset="100%" stopColor="#3c5729" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Stats */}
        <div className="stats-group">
          {stats.map((stat, i) => (
            <div key={stat.label} className="stat-with-divider">
              <StatItem stat={stat} inView={isInView} delay={0.8 + i * 0.15} />
              {i < stats.length - 1 && <div className="stat-divider" />}
            </div>
          ))}
        </div>

        {/* Video Callout */}
        <div className="video-callout">
          <AnimatedTooltip content="Watch 60s Impact Story" position="top">
            <motion.div
              className="play-btn-glow-container"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <button className="play-btn" aria-label="Play Video">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="8 5 19 12 8 19 8 5" />
                </svg>
              </button>
            </motion.div>
          </AnimatedTooltip>
          <div className="video-text-group">
            <span className="video-text">
              See how we<br />turn surplus into<br />smiles
            </span>
            <svg className="curved-arrow-icon" viewBox="0 0 60 25" fill="none" stroke="#34db76" strokeWidth="1.5">
              <path d="M5 5 Q 35 30 55 12" strokeLinecap="round" />
              <path d="M48 16 L 55 12 L 50 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
