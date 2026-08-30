import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../components/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { statsService } from '../../services/statsService';
import { getAvatarUrl } from '../../services/avatarService';
import {
  AnimatedMealBowl,
  AnimatedCommunityPeople,
  AnimatedCitySkyline,
  AnimatedNgoHeart,
  AnimatedCollectHands,
  AnimatedDeliverVan,
  AnimatedSupportCare,
  AnimatedSustainEarth,
  AnimatedBadgeLeaf,
  AnimatedHeartDoodle,
  AnimatedStepArrow,
  AnimatedBannerLeaves,
} from '../../components/AnimatedIcons/AnimatedIcons';
import { SplitText, BlurText, GradientText, ShinyText, AnimatedCounter } from '../../components/AnimatedUI';
import './Impact.css';

/* ── Floating leaf data ──────────────────────────────── */
const LEAVES = [
  { id: 1, x: '6%',  y: '16%', rot: -30, size: 38, delay: 0 },
  { id: 2, x: '3%',  y: '46%', rot:  20, size: 28, delay: 0.6 },
  { id: 3, x: '2%',  y: '75%', rot: -15, size: 44, delay: 1.1 },
  { id: 4, x: '94%', y: '12%', rot:  40, size: 32, delay: 0.3 },
  { id: 5, x: '96%', y: '38%', rot: -50, size: 26, delay: 0.9 },
  { id: 6, x: '92%', y: '68%', rot:  25, size: 40, delay: 1.5 },
  { id: 7, x: '38%', y: '18%', rot: -20, size: 30, delay: 0.4 },
  { id: 8, x: '82%', y: '88%', rot:  35, size: 34, delay: 0.8 },
  { id: 9, x: '58%', y: '6%',  rot: -10, size: 24, delay: 1.2 },
];

function FloatingLeaf({ x, y, rot, size, delay }) {
  return (
    <motion.div
      className="imp-leaf"
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

/* ── 4 Hero Stat Cards with Animated Micro-Icons ───── */
const IMPACT_STATS = [
  {
    id: 'meals',
    value: '12.4K+',
    title: 'Meals Shared',
    desc: 'Nutritious meals rescued & delivered',
    icon: <AnimatedMealBowl size={32} />,
  },
  {
    id: 'people',
    value: '8.2K+',
    title: 'People Helped',
    desc: 'Individuals & families supported with care',
    icon: <AnimatedCommunityPeople size={32} />,
  },
  {
    id: 'communities',
    value: '540+',
    title: 'Communities',
    desc: 'Local communities positively impacted',
    icon: <AnimatedCitySkyline size={32} />,
  },
  {
    id: 'partners',
    value: '120+',
    title: 'NGO Partners',
    desc: 'Working together for a better tomorrow',
    icon: <AnimatedNgoHeart size={32} />,
  },
];

/* ── 4 Process Steps ("How We Create Impact") ────────── */
const PROCESS_STEPS = [
  {
    num: '01',
    title: 'We Collect',
    desc: 'We collect surplus food from donors with care and responsibility.',
    icon: <AnimatedCollectHands size={40} />,
  },
  {
    num: '02',
    title: 'We Deliver',
    desc: 'Our volunteers ensure safe and timely delivery to those in need.',
    icon: <AnimatedDeliverVan size={40} />,
  },
  {
    num: '03',
    title: 'We Support',
    desc: 'Nutritious meals reach people and bring relief when it matters most.',
    icon: <AnimatedSupportCare size={40} />,
  },
  {
    num: '04',
    title: 'We Sustain',
    desc: 'Together we reduce waste and build a greener, kinder tomorrow.',
    icon: <AnimatedSustainEarth size={40} />,
  },
];

function StatCard({ stat }) {
  return (
    <motion.div
      className="imp-stat-card"
      whileHover={{ y: -6, boxShadow: '0 18px 40px rgba(0, 0, 0, 0.08)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="imp-stat-icon-wrap">{stat.icon}</div>
      <span className="imp-stat-value">
        <AnimatedCounter value={stat.value} />
      </span>
      <h3 className="imp-stat-title">{stat.title}</h3>
      <p className="imp-stat-desc">{stat.desc}</p>
    </motion.div>
  );
}

export default function Impact({ onNavigate }) {
  const { isDark, toggleTheme } = useTheme();
  const { user, role, profile, isAdmin } = useAuth();
  const isUserAdmin = isAdmin || role === 'admin';
  const avatarUrl = getAvatarUrl(profile, user);
  const [hoveredNav, setHoveredNav] = useState(null);
  const [platformStats, setPlatformStats] = useState(null);

  useEffect(() => {
    const fetchStats = () => {
      statsService
        .getPlatformStats()
        .then((s) => {
          if (s && (s.totalMeals > 0 || s.totalUsers > 0)) {
            setPlatformStats(s);
          }
        })
        .catch(() => {});
    };

    fetchStats();

    // Real-time statistics subscriptions
    const foodChannel = supabase
      .channel('impact_food_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'food_items' }, () => {
        fetchStats();
      })
      .subscribe();

    const requestChannel = supabase
      .channel('impact_requests_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'food_requests' }, () => {
        fetchStats();
      })
      .subscribe();

    const userChannel = supabase
      .channel('impact_users_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(foodChannel);
      supabase.removeChannel(requestChannel);
      supabase.removeChannel(userChannel);
    };
  }, []);

  const dynamicImpactStats = platformStats ? [
    {
      ...IMPACT_STATS[0],
      value: platformStats.totalMeals >= 1000 ? `${(platformStats.totalMeals / 1000).toFixed(1)}K+` : `${platformStats.totalMeals}+`,
    },
    {
      ...IMPACT_STATS[1],
      value: platformStats.totalUsers >= 1000 ? `${(platformStats.totalUsers / 1000).toFixed(1)}K+` : `${platformStats.totalUsers}+`,
    },
    {
      ...IMPACT_STATS[2],
      value: `${platformStats.donorCount + platformStats.receiverCount}+`,
    },
    {
      ...IMPACT_STATS[3],
      value: `${platformStats.completedRequests || 12}+`,
    },
  ] : IMPACT_STATS;

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

  return (
    <div className={`imp-page ${isDark ? 'dark-mode' : ''}`}>
      {/* ── Floating leaves (background) ── */}
      {LEAVES.map((l) => <FloatingLeaf key={l.id} {...l} />)}

      {/* ── Top right subtle dot matrix pattern ── */}
      <div className="imp-dot-matrix" aria-hidden="true" />

      {/* ═══════════ NAVBAR ═══════════ */}
      <header className="imp-navbar">
        <div className="imp-nav-inner">
          <button className="imp-brand" onClick={() => handleNav('home')}>
            <svg className="imp-logo-svg" viewBox="0 0 48 48" fill="none">
              <path d="M24 6 C21 10 21 15 24 18 C27 15 27 10 24 6 Z" fill="#1b6b33" />
              <path d="M17 10 C14 12 14 16 18 18 C19 15 18 12 17 10 Z" fill="#1b6b33" />
              <path d="M31 10 C34 12 34 16 30 18 C29 15 30 12 31 10 Z" fill="#1b6b33" />
              <path d="M12 28 Q 24 16 36 28" stroke="#1b6b33" strokeWidth="2.8" fill="none" />
              <line x1="18" y1="21" x2="18" y2="28" stroke="#1b6b33" strokeWidth="2.2" />
              <line x1="24" y1="19" x2="24" y2="28" stroke="#1b6b33" strokeWidth="2.2" />
              <line x1="30" y1="21" x2="30" y2="28" stroke="#1b6b33" strokeWidth="2.2" />
              <path d="M10 30 C14 42 34 42 38 30" stroke="#1b6b33" strokeWidth="2.8" fill="none" />
            </svg>
            <div className="imp-brand-text">
              <span className="imp-brand-name">FoodBridge</span>
              <span className="imp-brand-tag">Share Food. Share Hope.</span>
            </div>
          </button>

          <nav className="imp-nav-links" onMouseLeave={() => setHoveredNav(null)}>
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
                className={`imp-nav-link ${label === 'Impact' ? 'imp-nav-active' : ''}`}
                onClick={() => handleNav(route)}
                onMouseEnter={() => setHoveredNav(label)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              >
                {hoveredNav === label && (
                  <motion.span
                    className="imp-nav-hover-pill"
                    layoutId="impNavHoverPill"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                  />
                )}
                <span className="imp-nav-label-text">{label}</span>
                {label === 'Impact' && (
                  <motion.span
                    className="imp-nav-active-dot"
                    layoutId="impNavActiveDot"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </nav>

          <div className="imp-nav-actions">
            {/* Theme toggle */}
            <motion.button
              className="imp-btn-theme"
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
                className="imp-btn-join imp-btn-dashboard-stylish"
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
              <button className="imp-btn-join" onClick={() => handleNav('login')}>
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

      {/* ═══════════ SECTION 1: HERO & IMPACT STATS ═══════════ */}
      <section className="imp-hero-section">
        <div className="imp-container">
          <div className="imp-hero-grid">
            {/* Left Content */}
            <motion.div
              className="imp-hero-left"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="imp-tag-badge">
                <ShinyText text="OUR IMPACT" speed={4} shimmerColor="rgba(34,197,94,0.9)" />
                <AnimatedBadgeLeaf size={15} />
              </span>

              <h1 className="imp-hero-title">
                <span className="imp-title-dark">
                  <SplitText text="Real change." delay={40} splitBy="words" />
                </span>
                <span className="imp-title-green">
                  <GradientText colors={['#1b6b33', '#22c55e', '#10b981', '#34db76', '#1b6b33']} animationSpeed={5}>
                    Real people.
                  </GradientText>
                </span>
              </h1>

              <div className="imp-hero-desc">
                <BlurText
                  text="Every meal shared creates a ripple of hope. Together, we're building a healthier, kinder and more sustainable world."
                  delay={25}
                  animateBy="words"
                />
              </div>

              <motion.button
                className="imp-btn-cta"
                whileHover={{ scale: 1.03, boxShadow: '0 8px 24px rgba(27, 107, 51, 0.25)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleNav('home')}
              >
                <span className="imp-cta-play-circle">
                  <motion.svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    animate={{ x: [0, 2, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <polygon points="9,6 18,12 9,18" />
                  </motion.svg>
                </span>
                See Impact in Action
              </motion.button>
            </motion.div>

            {/* Right: 4 Stat Cards + Power Banner */}
            <motion.div
              className="imp-hero-right"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="imp-stats-row">
                {dynamicImpactStats.map((stat) => (
                  <StatCard key={stat.id} stat={stat} />
                ))}
              </div>

              {/* Sage Green Power Banner nested underneath stat cards */}
              <motion.div
                className="imp-power-banner"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="imp-banner-left">
                  <AnimatedBannerLeaves size={20} color="#1b6b33" />
                  <div className="imp-banner-text">
                    <strong className="imp-banner-heading">That&apos;s the power of sharing.</strong>
                    <span className="imp-banner-sub">Small actions. Big impact.</span>
                  </div>
                </div>
                <div className="imp-banner-thankyou">
                  Thank you! <span className="imp-thankyou-heart">♡</span>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Decorative curved dashed background path */}
          <svg className="imp-dashed-curve-bg" viewBox="0 0 1200 400" fill="none" aria-hidden="true">
            <path
              d="M 260 380 C 420 340, 390 120, 520 90 C 650 60, 680 180, 850 200"
              stroke="#86efac"
              strokeWidth="1.6"
              strokeDasharray="5 5"
              opacity="0.45"
            />
          </svg>
        </div>
      </section>

      {/* ═══════════ SECTION 2: HOW WE CREATE IMPACT ═══════════ */}
      <section className="imp-create-section">
        <div className="imp-container">
          {/* Section Header */}
          <motion.div
            className="imp-create-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="imp-tag-badge">
              HOW WE CREATE IMPACT
              <AnimatedBadgeLeaf size={15} />
            </span>
            <h2 className="imp-create-title">
              From surplus to <span className="imp-smiles-text">smiles</span>
              <span className="imp-smile-heart-doodle">
                <AnimatedHeartDoodle size={28} />
              </span>
            </h2>
          </motion.div>

          {/* Grid: 4 Process Steps Rail (Left) + Volunteer Photo & Quote (Right) */}
          <div className="imp-create-grid">
            {/* Left: 4 Process Steps Rail */}
            <div className="imp-process-col">
              <div className="imp-process-rail">
                {PROCESS_STEPS.map((step, idx) => (
                  <motion.div
                    key={step.num}
                    className="imp-process-item"
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.12 }}
                  >
                    <div className="imp-step-node">
                      <div className="imp-step-circle-icon">{step.icon}</div>
                      {idx < PROCESS_STEPS.length - 1 && <AnimatedStepArrow />}
                    </div>
                    <div className="imp-step-text-content">
                      <span className="imp-step-num">{step.num}</span>
                      <h4 className="imp-step-title">{step.title}</h4>
                      <p className="imp-step-desc">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right: Fluid Organic Photo Frame + Floating Testimonial */}
            <div className="imp-photo-col">
              <motion.div
                className="imp-photo-wrapper"
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                {/* Outer decorative echoing green wave lines */}
                <svg className="imp-photo-outer-echo-curve" viewBox="0 0 600 440" fill="none" aria-hidden="true">
                  <path
                    d="M 40 180 C 80 80, 220 20, 380 30 C 500 40, 560 90, 590 140"
                    stroke="#86efac"
                    strokeWidth="1.8"
                    strokeDasharray="4 4"
                    opacity="0.85"
                  />
                  <path
                    d="M 15 260 C 35 350, 130 420, 270 415 C 410 410, 520 365, 580 290"
                    stroke="#86efac"
                    strokeWidth="1.8"
                    opacity="0.8"
                  />
                </svg>

                {/* Organic curved frame with border */}
                <div className="imp-organic-photo-frame">
                  <img
                    src="/assets/impact_volunteer_box.jpg"
                    alt="FoodBridge volunteers sharing food boxes"
                    className="imp-volunteer-img"
                  />
                  <div className="imp-photo-green-accent-curve" />
                </div>

                {/* Floating Testimonial Quote Badge */}
                <motion.div
                  className="imp-quote-badge"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  whileHover={{ y: -4 }}
                >
                  <motion.div
                    className="imp-quote-icon"
                    animate={{ rotate: [-4, 4, -4] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    ❝
                  </motion.div>
                  <p className="imp-quote-text">No act of kindness is ever wasted.</p>
                  <motion.div
                    className="imp-quote-heart"
                    animate={{ scale: [1, 1.2, 1, 1.25, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
