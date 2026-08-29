import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../components/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { statsService } from '../../services/statsService';
import { getAvatarUrl } from '../../services/avatarService';
import { SplitText, BlurText, GradientText, ShinyText, SpotlightCard, AnimatedCounter, FloatingGradient } from '../../components/AnimatedUI';
import './AboutUs.css';

/* ─── Floating icon cards ─── */
const floatingCards = [
  {
    id: 'share',
    label: 'Share Food',
    pos: { top: '15%', left: '10%' },
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        <path d="m9 9 2 2 4-4" />
      </svg>
    ),
  },
  {
    id: 'planet',
    label: 'Save Planet',
    pos: { top: '15%', right: '10%' },
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    ),
  },
  {
    id: 'people',
    label: 'Help People',
    pos: { bottom: '20%', left: '8%' },
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: 'hope',
    label: 'Spread Hope',
    pos: { bottom: '20%', right: '8%' },
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

import {
  AnimatedMealBowl,
  AnimatedCommunityPeople,
  AnimatedCitySkyline,
  AnimatedNgoHeart,
} from '../../components/AnimatedIcons/AnimatedIcons';

/* ─── Impact stats with animated micro-icons ─── */
const impactStats = [
  {
    value: '12.4K+',
    label: 'Meals Shared',
    icon: <AnimatedMealBowl size={26} color="#22c55e" bg="rgba(34, 197, 94, 0.15)" />,
    color: '#22c55e',
  },
  {
    value: '8.2K+',
    label: 'People Helped',
    icon: <AnimatedCommunityPeople size={26} color="#3b82f6" bg="rgba(59, 130, 246, 0.15)" />,
    color: '#3b82f6',
  },
  {
    value: '540+',
    label: 'Communities',
    icon: <AnimatedCitySkyline size={26} color="#f59e0b" bg="rgba(245, 158, 11, 0.15)" />,
    color: '#f59e0b',
  },
  {
    value: '120+',
    label: 'NGO Partners',
    icon: <AnimatedNgoHeart size={26} color="#ef4444" bg="rgba(239, 68, 68, 0.15)" />,
    color: '#ef4444',
  },
];

/* ─── Team members ─── */
const team = [
  {
    name: 'Aditya Sharma',
    role: 'Project Lead & Full-Stack Developer',
    badge: 'Founder & CEO',
    image: '/assets/team_aditya.png',
    color: '#10b981',
    glow: 'rgba(16, 185, 129, 0.25)',
  },
  {
    name: 'Arvind Shukla',
    role: 'UI/UX & Frontend Designer',
    badge: 'Core Team',
    image: '/assets/team_arvind.jpg',
    color: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.25)',
  },
  {
    name: 'Anshuman',
    role: 'Database & System Analyst',
    badge: 'Core Team',
    image: '/assets/team_anshuman.jpg',
    color: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.25)',
  },
  {
    name: 'Devendra Kumar',
    role: 'Research, Testing & Documentation',
    badge: 'Core Team',
    image: '/assets/team_devendra.jpg',
    color: '#8b5cf6',
    glow: 'rgba(139, 92, 246, 0.25)',
  },
];

/* ─── Values ─── */
const values = [
  {
    id: '01',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    ),
    title: 'Sustainability',
    desc: 'Zero-waste conscious food lifecycle.',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)',
  },
  {
    id: '02',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Community',
    desc: 'Uniting donors, NGOs & local shelters.',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.1)',
  },
  {
    id: '03',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    title: 'Innovation',
    desc: 'Real-time smart matching technology.',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)',
  },
  {
    id: '04',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    title: 'Transparency',
    desc: '100% verified rescues with live audit.',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.1)',
  },
  {
    id: '05',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    ),
    title: 'Compassion',
    desc: 'Preserving dignity with every meal.',
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.1)',
  },
  {
    id: '06',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
    ),
    title: 'Real Impact',
    desc: 'Measurable change in lives touched.',
    color: '#14b8a6',
    bg: 'rgba(20, 184, 166, 0.1)',
  },
];

/* ─── Shared Navbar Logo SVG ─── */
function BrandLogo({ onNavigate, isDark }) {
  return (
    <a
      href="#"
      className="au-brand-logo"
      onClick={(e) => { e.preventDefault(); onNavigate('home'); }}
    >
      <div className={`au-logo-icon ${isDark ? 'dark' : ''}`}>
        <svg viewBox="0 0 48 48" fill="none">
          <path d="M24 6 C21 10 21 15 24 18 C27 15 27 10 24 6 Z" fill="currentColor" />
          <path d="M17 10 C14 12 14 16 18 18 C19 15 18 12 17 10 Z" fill="currentColor" />
          <path d="M31 10 C34 12 34 16 30 18 C29 15 30 12 31 10 Z" fill="currentColor" />
          <path d="M12 28 Q 24 16 36 28" stroke="currentColor" strokeWidth="2.8" fill="none" />
          <line x1="18" y1="21" x2="18" y2="28" stroke="currentColor" strokeWidth="2.2" />
          <line x1="24" y1="19" x2="24" y2="28" stroke="currentColor" strokeWidth="2.2" />
          <line x1="30" y1="21" x2="30" y2="28" stroke="currentColor" strokeWidth="2.2" />
          <path d="M10 30 C14 42 34 42 38 30" stroke="currentColor" strokeWidth="2.8" fill="none" />
        </svg>
      </div>
      <div className="au-logo-text">
        <span className="au-logo-title">FoodBridge</span>
        <span className="au-logo-tagline">Share Food. Share Hope.</span>
      </div>
    </a>
  );
}

export default function AboutUs({ onNavigate }) {
  const { isDark, toggleTheme } = useTheme();
  const { user, role, profile } = useAuth();
  const avatarUrl = getAvatarUrl(profile, user);
  const [hoveredNav, setHoveredNav] = useState(null);
  const [platformStats, setPlatformStats] = useState(null);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const smoothY = useSpring(heroY, { stiffness: 60, damping: 20 });

  useEffect(() => {
    statsService.getPlatformStats().then((s) => {
      if (s && (s.totalMeals > 0 || s.totalUsers > 0)) {
        setPlatformStats(s);
      }
    }).catch(() => {});
  }, []);

  const dynamicImpactStats = platformStats ? [
    {
      ...impactStats[0],
      value: platformStats.totalMeals >= 1000 ? `${(platformStats.totalMeals / 1000).toFixed(1)}K+` : `${platformStats.totalMeals}+`,
    },
    {
      ...impactStats[1],
      value: platformStats.totalUsers >= 1000 ? `${(platformStats.totalUsers / 1000).toFixed(1)}K+` : `${platformStats.totalUsers}+`,
    },
    {
      ...impactStats[2],
      value: `${platformStats.donorCount + platformStats.receiverCount}+`,
    },
    {
      ...impactStats[3],
      value: `${platformStats.completedRequests || 12}+`,
    },
  ] : impactStats;

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

  const floatAnim = (delay = 0) => ({
    animate: {
      y: [0, -12, 0],
      transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay },
    },
  });

  return (
    <div className={`about-page ${isDark ? 'dark-mode' : ''}`}>

      {/* ═══════════ NAVBAR ═══════════ */}
      <header className="au-navbar">
        <div className="au-nav-inner">
          <button className="au-brand" onClick={() => handleNav('home')}>
            <svg className="au-logo-svg" viewBox="0 0 48 48" fill="none">
              <path d="M24 6 C21 10 21 15 24 18 C27 15 27 10 24 6 Z" fill="#1b6b33" />
              <path d="M17 10 C14 12 14 16 18 18 C19 15 18 12 17 10 Z" fill="#1b6b33" />
              <path d="M31 10 C34 12 34 16 30 18 C29 15 30 12 31 10 Z" fill="#1b6b33" />
              <path d="M12 28 Q 24 16 36 28" stroke="#1b6b33" strokeWidth="2.8" fill="none" />
              <line x1="18" y1="21" x2="18" y2="28" stroke="#1b6b33" strokeWidth="2.2" />
              <line x1="24" y1="19" x2="24" y2="28" stroke="#1b6b33" strokeWidth="2.2" />
              <line x1="30" y1="21" x2="30" y2="28" stroke="#1b6b33" strokeWidth="2.2" />
              <path d="M10 30 C14 42 34 42 38 30" stroke="#1b6b33" strokeWidth="2.8" fill="none" />
            </svg>
            <div className="au-brand-text">
              <span className="au-brand-name">FoodBridge</span>
              <span className="au-brand-tag">Share Food. Share Hope.</span>
            </div>
          </button>

          <nav className="au-nav-links" onMouseLeave={() => setHoveredNav(null)}>
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
                className={`au-nav-link ${label === 'About' ? 'au-nav-active' : ''}`}
                onClick={() => handleNav(route)}
                onMouseEnter={() => setHoveredNav(label)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              >
                {hoveredNav === label && (
                  <motion.span
                    className="au-nav-hover-pill"
                    layoutId="auNavHoverPill"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                  />
                )}
                <span className="au-nav-label-text">{label}</span>
                {label === 'About' && (
                  <motion.span
                    className="au-nav-active-dot"
                    layoutId="auNavActiveDot"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </nav>

          <div className="au-nav-actions">
            {/* Theme toggle */}
            <motion.button
              className="au-btn-theme"
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
                className="au-btn-join au-btn-dashboard-stylish"
                onClick={() => {
                  const target = role === 'admin' ? 'admin-dashboard' : role === 'receiver' ? 'receiver-dashboard' : 'donor-dashboard';
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
                  Dashboard
                  <span className="btn-dashboard-live-dot" />
                </span>
                <svg className="btn-dashboard-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            ) : (
              <button className="au-btn-join" onClick={() => handleNav('login')}>
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

      {/* ═══════════ HERO SECTION ═══════════ */}
      <section className="au-hero-section" ref={heroRef}>
        <div className="au-hero-container">
          {/* Left Text */}
          <div className="au-hero-left">
            <motion.div
              className="au-hero-badge"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="au-badge-leaf">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
              <ShinyText text="ABOUT US" speed={4} shimmerColor="rgba(34,197,94,0.9)" />
            </motion.div>

            <h1 className="au-hero-title">
              <SplitText text="Building a world" delay={35} splitBy="words" /><br />
              <SplitText text="where no good food" delay={40} splitBy="words" /><br />
              <span className="au-title-green">
                <GradientText colors={['#1b6b33', '#22c55e', '#10b981', '#34db76', '#1b6b33']} animationSpeed={5}>
                  goes to waste.
                </GradientText>
                <motion.svg
                  className="au-title-heart"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 12 }}
                  transition={{ duration: 0.5, delay: 0.7, type: 'spring', stiffness: 260 }}
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </motion.svg>
              </span>
            </h1>

            <div className="au-hero-sub">
              <BlurText
                text="FoodBridge connects surplus food with people in need. We bridge the gap between abundance and hunger to create a healthier, kinder and more sustainable world."
                delay={20}
                animateBy="words"
              />
            </div>

            <motion.button
              className="au-watch-btn"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              whileHover={{ scale: 1.04, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="au-play-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </span>
              Watch Our Story
            </motion.button>
          </div>

          {/* Right Bowl + Floating Cards */}
          <div className="au-hero-right">
            {/* Glowing Aura behind bowl */}
            <motion.div
              className="au-bowl-glow"
              animate={{ scale: [1, 1.06, 1], opacity: [0.45, 0.65, 0.45] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />

            <motion.div
              className="au-bowl-wrapper"
              style={{ y: smoothY, opacity: heroOpacity }}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.85, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.img
                src="/assets/Bowl_png.png"
                alt="FoodBridge salad bowl"
                className="au-bowl-img"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>

            {/* Floating Cards */}
            {floatingCards.map((card, i) => (
              <motion.div
                key={card.id}
                className="au-float-card"
                style={{ ...card.pos }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
                transition={{
                  opacity: { duration: 0.5, delay: 0.4 + i * 0.12 },
                  scale: { duration: 0.5, delay: 0.4 + i * 0.12, type: 'spring' },
                  y: { duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 },
                }}
                whileHover={{ scale: 1.08, y: -6, boxShadow: '0 16px 36px rgba(0,0,0,0.12)' }}
              >
                <div className="au-float-icon">{card.icon}</div>
                <span className="au-float-label">{card.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom wave */}
        <div className="au-hero-wave">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path d="M0,50 C360,10 720,70 1080,30 C1260,10 1380,50 1440,40 L1440,80 L0,80 Z" fill="var(--au-alt-bg)" />
          </svg>
        </div>
      </section>

      {/* ═══════════ IMPACT + STORY SIDE BY SIDE ═══════════ */}
      <section className="au-impact-story-section">
        <div className="au-section-container au-impact-story-row">

          {/* LEFT — Impact */}
          <motion.div
            className="au-impact-col"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="au-section-title">
              Our Impact So Far
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="au-title-leaf">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
            </h2>

            {/* Single row of 4 stat cards */}
            <div className="au-impact-row">
              {dynamicImpactStats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  className="au-impact-stat-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.45, delay: i * 0.09 }}
                  whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.08)' }}
                >
                  <div className="au-stat-icon" style={{ color: stat.color }}>{stat.icon}</div>
                  <span className="au-stat-value">
                    <AnimatedCounter value={stat.value} delay={i * 0.1} />
                  </span>
                  <span className="au-stat-label">{stat.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Divider */}
          <div className="au-impact-story-divider" />

          {/* RIGHT — Story + Illustration */}
          <motion.div
            className="au-story-col"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="au-story-inner-row">
              {/* Text block */}
              <div className="au-story-text-block">
                <h2 className="au-section-title">
                  Our Story
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="au-title-leaf">
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                  </svg>
                </h2>
                <p className="au-story-para">
                  FoodBridge was born from a simple belief — that no one should sleep hungry while good food is being wasted.
                </p>
                <p className="au-story-para">
                  We started as a small initiative with a big heart, and today, we are a growing community of volunteers, donors and organizations working together for a better tomorrow.
                </p>
                <motion.button
                  className="au-learn-btn"
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Learn More About Us
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="au-arrow-icon">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </motion.button>
              </div>

              {/* Circular illustration */}
              <div className="au-story-circle-frame">
                <motion.div
                  className="au-circle-glow"
                  animate={{ scale: [1, 1.07, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.img
                  src="/assets/about_story_illustration.jpg"
                  alt="FoodBridge story illustration"
                  className="au-circle-img"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ═══════════ OUR VALUES (Compact Connected 1-Row Rail) ═══════════ */}
      <section className="au-values-section">
        <div className="au-section-container">
          <motion.div
            className="au-values-header"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5 }}
          >
            <div className="au-values-pill-tag">OUR CORE PILLARS</div>
            <h2 className="au-section-title centered">What We Stand For</h2>
            <p className="au-section-subtitle">Six core values connecting compassion to real-world action.</p>
          </motion.div>

          <div className="au-values-rail-container">
            {/* Background connection line */}
            <div className="au-values-connect-line" />

            <div className="au-values-rail">
              {values.map((val, i) => (
                <motion.div
                  key={val.title}
                  className="au-value-capsule"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: i * 0.07 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                >
                  <div className="au-value-top-row">
                    <span className="au-value-id" style={{ color: val.color }}>{val.id}</span>
                    <span className="au-value-dot" style={{ backgroundColor: val.color, boxShadow: `0 0 8px ${val.color}` }} />
                  </div>

                  <div className="au-value-icon-box" style={{ background: val.bg, color: val.color }}>
                    {val.icon}
                  </div>

                  <h3 className="au-value-title">{val.title}</h3>
                  <p className="au-value-desc">{val.desc}</p>

                  <div className="au-value-bottom-bar" style={{ background: `linear-gradient(90deg, ${val.color}, transparent)` }} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TEAM SECTION ═══════════ */}
      <section className="au-team-section">
        <div className="au-section-container">
          <motion.div
            className="au-team-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6 }}
          >
            <div className="au-values-pill-tag">BUILDERS & MINDS</div>
            <h2 className="au-section-title centered">Meet the Team</h2>
            <p className="au-section-subtitle">The dedicated minds driving the FoodBridge mission forward.</p>
          </motion.div>

          <div className="au-team-grid">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                className="au-team-card-wrapper"
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -6, boxShadow: '0 16px 36px rgba(0, 0, 0, 0.08)' }}
              >
                <div className="au-team-card">
                  {member.badge === 'Founder & CEO' && (
                    <span className="au-team-founder-badge">Founder & CEO</span>
                  )}

                  <div className="au-team-avatar-frame" style={{ borderColor: member.color, boxShadow: `0 8px 24px ${member.glow}` }}>
                    <img
                      src={member.image}
                      alt={member.name}
                      className="au-team-photo"
                    />
                  </div>

                  <h3 className="au-team-name">{member.name}</h3>
                  <p className="au-team-role">{member.role}</p>

                  <div className="au-team-bottom-indicator" style={{ backgroundColor: member.color }} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ BOTTOM CTA ═══════════ */}
      <section className="au-cta-section">
        <div className="au-section-container">
          <motion.div
            className="au-cta-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
          >
            <FloatingGradient
              className="au-cta-floating-gradient"
              interactive={true}
              colors={{
                blob1: 'rgba(34, 197, 94, 0.45)',    // Emerald green
                blob2: 'rgba(16, 185, 129, 0.40)',   // Mint green
                blob3: 'rgba(52, 219, 118, 0.35)',   // Fresh spring green
                blob4: 'rgba(245, 158, 11, 0.22)',   // Warm sunlight
                blob5: 'rgba(20, 184, 166, 0.30)',   // Teal radiance
              }}
            >
              <div className="au-cta-content-center">
                <div className="au-cta-badge">
                  <span className="au-cta-pulse-dot" />
                  <ShinyText text="JOIN THE KINDNESS REVOLUTION" speed={4} shimmerColor="rgba(255,255,255,0.9)" />
                </div>

                <h2 className="au-cta-title">
                  <SplitText text="Have Food to Share? Need Food to Distribute?" delay={35} splitBy="words" />
                </h2>

                <p className="au-cta-sub">
                  FoodBridge seamlessly connects donors and verified community receivers in real-time. Join our growing network today and turn everyday surplus into lasting hope.
                </p>

                <div className="au-cta-actions">
                  <motion.button
                    className="au-cta-btn-primary"
                    whileHover={{ scale: 1.03, y: -2, boxShadow: '0 12px 32px rgba(34, 197, 94, 0.4)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={(e) => { e.preventDefault(); handleNav('login'); }}
                  >
                    <span className="au-btn-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </span>
                    Donate Food
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="au-btn-arrow">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </motion.button>

                  <motion.button
                    className="au-cta-btn-glass"
                    whileHover={{ scale: 1.03, y: -2, background: 'rgba(255, 255, 255, 0.15)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={(e) => { e.preventDefault(); handleNav('food-listings'); }}
                  >
                    <span className="au-btn-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </span>
                    Find Food
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="au-btn-arrow">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </motion.button>
                </div>
              </div>
            </FloatingGradient>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="au-footer">
        <div className="au-section-container au-footer-inner">
          <BrandLogo onNavigate={handleNav} isDark={isDark} />
          <div className="au-footer-links">
            {['Home', 'How It Works', 'Donate', 'Find Food', 'Impact', 'Contact'].map((label) => (
              <a
                key={label}
                href="#"
                className="au-footer-link"
                onClick={(e) => {
                  e.preventDefault();
                  if (label === 'Home') handleNav('home');
                  else if (label === 'How It Works') handleNav('how-it-works');
                  else if (label === 'Impact') handleNav('impact');
                  else if (label === 'Contact') handleNav('contact');
                  else if (label === 'Find Food') handleNav('food-listings');
                  else if (label === 'Donate') handleNav('login');
                  else handleNav('home');
                }}
              >
                {label}
              </a>
            ))}
          </div>
          <p className="au-footer-copy">© {new Date().getFullYear()} FoodBridge. Reduce Waste. Share Food. Create Impact.</p>
          <motion.button
            className="au-back-top"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            whileHover={{ y: -4, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ↑ Back to Top
          </motion.button>
        </div>
      </footer>
    </div>
  );
}
