import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../components/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { statsService } from '../../services/statsService';
import { getAvatarUrl } from '../../services/avatarService';
import { SplitText, BlurText, GradientText, ShinyText, AnimatedCounter } from '../../components/AnimatedUI';
import './HowItWorks.css';

/* ── Floating leaf data ──────────────────────────────── */
const LEAVES = [
  { id: 1, x: '8%',  y: '12%', rot: -30, size: 38, delay: 0 },
  { id: 2, x: '5%',  y: '42%', rot:  20, size: 28, delay: 0.6 },
  { id: 3, x: '3%',  y: '68%', rot: -15, size: 44, delay: 1.1 },
  { id: 4, x: '88%', y: '8%',  rot:  40, size: 32, delay: 0.3 },
  { id: 5, x: '92%', y: '30%', rot: -50, size: 26, delay: 0.9 },
  { id: 6, x: '90%', y: '60%', rot:  25, size: 40, delay: 1.5 },
  { id: 7, x: '78%', y: '82%', rot: -20, size: 34, delay: 0.4 },
  { id: 8, x: '18%', y: '88%', rot:  35, size: 30, delay: 0.8 },
  { id: 9, x: '55%', y: '6%',  rot: -10, size: 22, delay: 1.2 },
];

function FloatingLeaf({ x, y, rot, size, delay }) {
  return (
    <motion.div
      className="hiw-leaf"
      style={{ left: x, top: y, width: size, height: size }}
      initial={{ opacity: 0, rotate: rot - 10, y: -20 }}
      animate={{
        opacity: [0, 0.7, 0.5, 0.7],
        rotate: [rot - 10, rot + 10, rot - 5, rot + 8, rot],
        y: [0, -14, 6, -10, 0],
      }}
      transition={{
        delay,
        duration: 6,
        repeat: Infinity,
        repeatType: 'loop',
        ease: 'easeInOut',
      }}
    >
      <svg viewBox="0 0 60 60" fill="none">
        <path
          d="M30 55 C10 45 5 20 15 8 C25 -2 55 5 55 28 C55 45 40 60 30 55 Z"
          fill="#4caf50"
          fillOpacity="0.65"
        />
        <path
          d="M30 55 C30 40 18 22 15 8"
          stroke="#2e7d32"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </motion.div>
  );
}

import {
  AnimatedDonateBox,
  AnimatedMatchNodes,
  AnimatedScheduleClock,
  AnimatedDeliverVan,
  AnimatedCollectHands,
} from '../../components/AnimatedIcons/AnimatedIcons';

/* ── Circular step cards with animated micro-icons ──── */
const STEPS = [
  {
    num: 1, label: 'Donate',   desc: 'Donors list surplus food with details.',           angle: -90,  // top (12 o'clock)
    icon: <AnimatedDonateBox size={40} />,
  },
  {
    num: 2, label: 'Match',    desc: 'We match it with verified NGOs or receivers.',   angle: -18,  // upper right (~1:30)
    icon: <AnimatedMatchNodes size={40} />,
  },
  {
    num: 3, label: 'Schedule', desc: 'Pickup is scheduled at a convenient time.',       angle: 54,   // lower right (~4:30)
    icon: <AnimatedScheduleClock size={40} />,
  },
  {
    num: 4, label: 'Deliver',  desc: 'Food is picked up and delivered safely.',         angle: 126,  // lower left (~7:30)
    icon: <AnimatedDeliverVan size={40} />,
  },
  {
    num: 5, label: 'Impact',   desc: 'Nutritious food reaches people, changing lives.', angle: 198,  // left (~10:30)
    icon: <AnimatedCollectHands size={40} />,
  },
];

/* ── Stats ───────────────────────────────────────────── */
const STATS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    ),
    value: '12.4K+',
    label: 'Meals Shared',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    value: '8.2K+',
    label: 'People Helped',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    value: '3.5T+',
    label: 'Food Waste Prevented',
  },
];

function StatItem({ icon, value, label }) {
  return (
    <motion.div
      className="hiw-stat-item"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="hiw-stat-icon">{icon}</div>
      <span className="hiw-stat-value">
        <AnimatedCounter value={value} />
      </span>
      <span className="hiw-stat-label">{label}</span>
    </motion.div>
  );
}

/* ── Dashed arc between steps ────────────────────────── */
function DashedArc({ from, to, radius }) {
  const toRad = d => (d * Math.PI) / 180;
  const cx = 50, cy = 50;
  const x1 = cx + radius * Math.cos(toRad(from));
  const y1 = cy + radius * Math.sin(toRad(from));
  const x2 = cx + radius * Math.cos(toRad(to));
  const y2 = cy + radius * Math.sin(toRad(to));
  const large = Math.abs(to - from) > 180 ? 1 : 0;
  const d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
  return (
    <path d={d} stroke="#4caf50" strokeWidth="0.7" strokeDasharray="2.5 2" fill="none" opacity="0.5" markerEnd="url(#arrowhead)" />
  );
}

/* ── Main component ──────────────────────────────────── */
export default function HowItWorks({ onNavigate }) {
  const { isDark, toggleTheme } = useTheme();
  const { user, role, profile, isAdmin } = useAuth();
  const isUserAdmin = isAdmin || role === 'admin';
  const avatarUrl = getAvatarUrl(profile, user);
  const [hoveredNav, setHoveredNav] = useState(null);
  const [platformStats, setPlatformStats] = useState(null);
  // RADIUS: % of the 0-100 SVG viewBox — must match the CSS --orbit-r proportion
  const RADIUS = 38;

  useEffect(() => {
    statsService.getPlatformStats().then(s => {
      if (s && (s.totalMeals > 0 || s.totalUsers > 0)) setPlatformStats(s);
    }).catch(() => {});
  }, []);

  // Dynamic stats: use real data if available, else fallback to hardcoded
  const dynamicStats = platformStats ? [
    { ...STATS[0], value: `${platformStats.totalMeals > 1000 ? (platformStats.totalMeals / 1000).toFixed(1) + 'K+' : platformStats.totalMeals + '+'}` },
    { ...STATS[1], value: `${platformStats.totalUsers > 1000 ? (platformStats.totalUsers / 1000).toFixed(1) + 'K+' : platformStats.totalUsers + '+'}` },
    { ...STATS[2], value: `${platformStats.totalKg > 1000 ? (platformStats.totalKg / 1000).toFixed(1) + 'T+' : platformStats.totalKg + 'kg+'}` },
  ] : STATS;

  const handleNav = (route) => {
    const routeHashes = {
      'home': '',
      'how-it-works': '#how-it-works',
      'about-us': '#about-us',
      'impact': '#impact',
      'contact': '#contact',
    };
    if (onNavigate) {
      onNavigate(route);
    }
    window.location.hash = routeHashes[route] !== undefined ? routeHashes[route] : `#${route}`;
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  // build arcs between consecutive steps
  const arcs = STEPS.map((s, i) => ({
    from: s.angle,
    to: STEPS[(i + 1) % STEPS.length].angle,
  }));

  return (
    <div className={`hiw-page ${isDark ? 'dark-mode' : ''}`}>
      {/* ─── Floating leaves (background) ─── */}
      {LEAVES.map(l => <FloatingLeaf key={l.id} {...l} />)}

      {/* ─── Navbar ─── */}
      <header className="hiw-navbar">
        <div className="hiw-nav-inner">
          <button className="hiw-brand" onClick={() => handleNav('home')}>
            <svg className="hiw-logo-svg" viewBox="0 0 48 48" fill="none">
              <path d="M24 6 C21 10 21 15 24 18 C27 15 27 10 24 6 Z" fill="#1b6b33" />
              <path d="M17 10 C14 12 14 16 18 18 C19 15 18 12 17 10 Z" fill="#1b6b33" />
              <path d="M31 10 C34 12 34 16 30 18 C29 15 30 12 31 10 Z" fill="#1b6b33" />
              <path d="M12 28 Q 24 16 36 28" stroke="#1b6b33" strokeWidth="2.8" fill="none" />
              <line x1="18" y1="21" x2="18" y2="28" stroke="#1b6b33" strokeWidth="2.2" />
              <line x1="24" y1="19" x2="24" y2="28" stroke="#1b6b33" strokeWidth="2.2" />
              <line x1="30" y1="21" x2="30" y2="28" stroke="#1b6b33" strokeWidth="2.2" />
              <path d="M10 30 C14 42 34 42 38 30" stroke="#1b6b33" strokeWidth="2.8" fill="none" />
            </svg>
            <div className="hiw-brand-text">
              <span className="hiw-brand-name">FoodBridge</span>
              <span className="hiw-brand-tag">Share Food. Share Hope.</span>
            </div>
          </button>

          <nav className="hiw-nav-links" onMouseLeave={() => setHoveredNav(null)}>
            {[
              { label: 'Home', route: 'home' },
              { label: 'Donate', route: 'home' },
              { label: 'Find Food', route: 'food-listings' },
              { label: 'Impact', route: 'impact' },
              { label: 'How It Works', route: 'how-it-works' },
              { label: 'About', route: 'about-us' },
            ].map(({ label, route }) => (
              <motion.button
                key={label}
                className={`hiw-nav-link ${label === 'How It Works' ? 'hiw-nav-active' : ''}`}
                onClick={() => handleNav(route)}
                onMouseEnter={() => setHoveredNav(label)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              >
                {hoveredNav === label && (
                  <motion.span
                    className="hiw-nav-hover-pill"
                    layoutId="hiwNavHoverPill"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                  />
                )}
                <span className="hiw-nav-label-text">{label}</span>
                {label === 'How It Works' && (
                  <motion.span
                    className="hiw-nav-active-dot"
                    layoutId="hiwNavActiveDot"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </nav>

          <div className="hiw-nav-actions">
            {/* Theme toggle — wired to global ThemeContext */}
            <motion.button
              className="hiw-btn-theme"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.9, rotate: 20 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isDark ? (
                  <motion.svg
                    key="moon"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.22 }}
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </motion.svg>
                ) : (
                  <motion.svg
                    key="sun"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.22 }}
                  >
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M18.36 5.64l1.41-1.41" />
                  </motion.svg>
                )}
              </AnimatePresence>
            </motion.button>
            {user ? (
              <button
                className="hiw-btn-join hiw-btn-dashboard-stylish"
                onClick={() => {
                  const target = isUserAdmin ? 'admin-dashboard' : role === 'receiver' ? 'receiver-dashboard' : 'donor-dashboard';
                  handleNav(target);
                }}
              >
                <div className="btn-dashboard-icon-wrap">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Dashboard" className="btn-dashboard-avatar-img" />
                  ) : (
                    <svg className="btn-dashboard-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="14" width="7" height="7" rx="1.5" />
                      <rect x="3" y="14" width="7" height="7" rx="1.5" />
                    </svg>
                  )}
                </div>
                <span className="btn-dashboard-text">
                  {isUserAdmin ? 'Admin Panel' : 'Dashboard'}
                  <span className="btn-dashboard-live-dot" />
                </span>
                <svg className="btn-dashboard-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            ) : (
              <button className="hiw-btn-join" onClick={() => handleNav('login')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Join Us
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero Section ─── */}
      <main className="hiw-hero">
        {/* World map faint background */}
        <div className="hiw-world-map-bg" aria-hidden="true">
          <svg viewBox="0 0 900 450" className="hiw-world-svg" preserveAspectRatio="xMidYMid meet">
            <ellipse cx="450" cy="225" rx="430" ry="210" fill="none" stroke="#4caf50" strokeWidth="0.5" opacity="0.15" />
            <ellipse cx="450" cy="225" rx="300" ry="210" fill="none" stroke="#4caf50" strokeWidth="0.5" opacity="0.1" />
            <ellipse cx="450" cy="225" rx="150" ry="210" fill="none" stroke="#4caf50" strokeWidth="0.5" opacity="0.1" />
            <line x1="20" y1="225" x2="880" y2="225" stroke="#4caf50" strokeWidth="0.5" opacity="0.1" />
            <line x1="450" y1="15" x2="450" y2="435" stroke="#4caf50" strokeWidth="0.5" opacity="0.1" />
            <ellipse cx="450" cy="225" rx="430" ry="80" fill="none" stroke="#4caf50" strokeWidth="0.5" opacity="0.08" />
            <ellipse cx="450" cy="225" rx="430" ry="150" fill="none" stroke="#4caf50" strokeWidth="0.5" opacity="0.08" />
            {/* Faint continent blobs */}
            <path d="M180,140 Q200,100 260,110 Q300,115 310,150 Q320,190 290,210 Q250,230 210,200 Q170,180 180,140 Z" fill="#4caf50" opacity="0.05" />
            <path d="M340,100 Q400,70 470,90 Q530,110 550,160 Q560,210 520,240 Q480,260 430,240 Q380,220 360,180 Q340,150 340,100 Z" fill="#4caf50" opacity="0.06" />
            <path d="M560,130 Q600,100 650,120 Q700,140 710,180 Q720,220 690,240 Q650,260 610,240 Q570,220 560,180 Q550,155 560,130 Z" fill="#4caf50" opacity="0.05" />
            <path d="M250,250 Q280,230 320,250 Q360,270 370,310 Q380,350 340,370 Q300,385 265,360 Q230,340 240,300 Q245,270 250,250 Z" fill="#4caf50" opacity="0.05" />
            <path d="M640,240 Q680,210 730,230 Q780,250 790,290 Q800,330 770,350 Q730,370 690,350 Q650,330 640,290 Q630,265 640,240 Z" fill="#4caf50" opacity="0.04" />
            <path d="M380,290 Q420,270 460,290 Q490,310 495,350 Q500,385 470,400 Q440,415 410,395 Q380,375 380,340 Q378,315 380,290 Z" fill="#4caf50" opacity="0.04" />
          </svg>
        </div>

        {/* Left: Headline + desc + CTAs + Stats */}
        <div className="hiw-hero-left">
          {/* Tag */}
          <motion.span
            className="hiw-tag-label"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ShinyText text="HOW IT WORKS" speed={4} shimmerColor="rgba(46,125,50,0.8)" />
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="15" height="15">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          </motion.span>

          {/* Headline: dark top line + green accent bottom */}
          <h1 className="hiw-hero-title">
            <span className="hiw-title-dark">
              <SplitText text="Good Food Shouldn't Go to Waste." delay={30} splitBy="words" />
            </span>
            <span className="hiw-title-accent">
              <GradientText colors={['#1b6b33', '#2e7d32', '#4caf50', '#81c784', '#1b6b33']} animationSpeed={6}>
                Here&apos;s How We Make It Count.{' '}
              </GradientText>
              <svg className="hiw-inline-heart" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </span>
          </h1>

          {/* Description — natural wrap, no forced breaks */}
          <div className="hiw-hero-desc">
            <BlurText
              text="FoodBridge connects donors with verified receivers to ensure surplus food reaches those who need it, safely and efficiently."
              delay={25}
              animateBy="words"
            />
          </div>

          {/* Buttons */}
          <div className="hiw-hero-btns">
            <motion.button
              className="hiw-btn-primary"
              whileHover={{ scale: 1.04, boxShadow: '0 10px 28px rgba(46,125,50,0.35)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleNav('home')}
            >
              <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                <circle cx="12" cy="12" r="10" fillOpacity="0.25" />
                <polygon points="10,8 17,12 10,16" />
              </svg>
              See How It Works
            </motion.button>

            <motion.button
              className="hiw-btn-secondary"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleNav('impact')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="17" height="17">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Explore Impact
            </motion.button>
          </div>

          {/* Stats strip */}
          <motion.div
            className="hiw-stats-strip"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.48 }}
          >
            {dynamicStats.map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <div className="hiw-stat-sep" />}
                <StatItem {...s} />
              </React.Fragment>
            ))}
          </motion.div>
        </div>

        {/* Right: Circular diagram */}
        <div className="hiw-hero-right">
          <div className="hiw-diagram-wrapper">
            {/* Orbit SVG — dashed arcs */}
            <svg className="hiw-orbit-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
              <defs>
                <marker id="arrowhead" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
                  <path d="M0,0 L4,2 L0,4 Z" fill="#4caf50" opacity="0.5" />
                </marker>
              </defs>
              {/* Large circle track */}
              <circle cx="50" cy="50" r={RADIUS} stroke="#4caf50" strokeWidth="0.5" strokeDasharray="2 2" fill="none" opacity="0.3" />
              {/* Arcs with arrows */}
              {arcs.map((a, i) => (
                <DashedArc key={i} from={a.from} to={a.to} radius={RADIUS} />
              ))}
            </svg>

            {/* Centre hub — static wrapper owns the centering transform, motion.div only animates scale/opacity */}
            <div className="hiw-center-hub-anchor">
              <motion.div
                className="hiw-center-hub"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.5 }}
              >
                <div className="hiw-hub-glow" />
                <svg viewBox="0 0 48 48" fill="none" width="44" height="44">
                  <path d="M24 6 C21 10 21 15 24 18 C27 15 27 10 24 6 Z" fill="#1b6b33" />
                  <path d="M17 10 C14 12 14 16 18 18 C19 15 18 12 17 10 Z" fill="#1b6b33" />
                  <path d="M31 10 C34 12 34 16 30 18 C29 15 30 12 31 10 Z" fill="#1b6b33" />
                  <path d="M12 28 Q 24 16 36 28" stroke="#1b6b33" strokeWidth="2.8" fill="none" />
                  <line x1="18" y1="21" x2="18" y2="28" stroke="#1b6b33" strokeWidth="2.2" />
                  <line x1="24" y1="19" x2="24" y2="28" stroke="#1b6b33" strokeWidth="2.2" />
                  <line x1="30" y1="21" x2="30" y2="28" stroke="#1b6b33" strokeWidth="2.2" />
                  <path d="M10 30 C14 42 34 42 38 30" stroke="#1b6b33" strokeWidth="2.8" fill="none" />
                </svg>
                <span className="hiw-hub-name">FoodBridge</span>
                <span className="hiw-hub-tag">Share Food. Share Hope.</span>
              </motion.div>
            </div>

            {/* Step cards — wrapper handles positioning, motion.div handles animation only */}
            {STEPS.map((step, i) => {
              const rad = (step.angle * Math.PI) / 180;
              const cx = 50 + RADIUS * Math.cos(rad);
              const cy = 50 + RADIUS * Math.sin(rad);
              return (
                // Static wrapper: owns left/top + the centering translate
                // This is NOT a motion element, so framer-motion never overwrites the translate
                <div
                  key={step.num}
                  className="hiw-step-card-anchor"
                  style={{ left: `${cx}%`, top: `${cy}%` }}
                >
                  {/* Animated card: only scale/opacity animations, no position transform */}
                  <motion.div
                    className="hiw-step-card"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.55, delay: 0.3 + i * 0.12 }}
                    whileHover={{ scale: 1.08 }}
                  >
                    <div className="hiw-step-icon-wrap">{step.icon}</div>
                    <div className="hiw-step-info">
                      <span className="hiw-step-num">{step.num}. {step.label}</span>
                      <span className="hiw-step-desc">{step.desc}</span>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* ─── Green wave + plant footer ─── */}
      <div className="hiw-wave-footer" aria-hidden="true">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="hiw-wave-svg">
          <path d="M0,60 C200,110 400,20 600,70 C800,120 1000,30 1200,75 C1320,100 1400,50 1440,60 L1440,120 L0,120 Z" fill="#c8e6c9" opacity="0.55" />
          <path d="M0,80 C250,50 500,110 750,70 C1000,30 1200,90 1440,60 L1440,120 L0,120 Z" fill="#a5d6a7" opacity="0.4" />
        </svg>
        {/* Plant decorations */}
        <svg className="hiw-plant-right" viewBox="0 0 180 200" fill="none">
          <path d="M90 200 L90 100" stroke="#4caf50" strokeWidth="3" strokeLinecap="round" />
          <path d="M90 150 C90 150 110 120 140 125 C120 140 95 155 90 150 Z" fill="#4caf50" opacity="0.7" />
          <path d="M90 130 C90 130 65 100 35 108 C60 120 88 135 90 130 Z" fill="#66bb6a" opacity="0.6" />
          <path d="M90 110 C90 110 108 85 130 90 C115 102 92 115 90 110 Z" fill="#81c784" opacity="0.5" />
          <path d="M90 160 C90 160 72 145 55 150 C68 162 88 165 90 160 Z" fill="#a5d6a7" opacity="0.5" />
        </svg>
        <svg className="hiw-plant-left" viewBox="0 0 120 160" fill="none">
          <path d="M60 160 L60 80" stroke="#4caf50" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M60 120 C60 120 80 95 105 100 C88 115 63 128 60 120 Z" fill="#4caf50" opacity="0.6" />
          <path d="M60 100 C60 100 38 78 15 85 C38 96 58 108 60 100 Z" fill="#66bb6a" opacity="0.5" />
        </svg>
      </div>
    </div>
  );
}
