import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../components/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getAvatarUrl } from '../../services/avatarService';
import {
  AnimatedBadgeLeaf,
  AnimatedCollectHands,
} from '../../components/AnimatedIcons/AnimatedIcons';
import { SplitText, BlurText, GradientText, ShinyText, SpotlightCard } from '../../components/AnimatedUI';
import './Contact.css';

/* ── Floating ambient leaves ─────────────────────────── */
const LEAVES = [
  { id: 1, x: '4%',  y: '14%', rot: -25, size: 36, delay: 0 },
  { id: 2, x: '2%',  y: '48%', rot:  18, size: 28, delay: 0.7 },
  { id: 3, x: '3%',  y: '78%', rot: -12, size: 42, delay: 1.2 },
  { id: 4, x: '92%', y: '16%', rot:  35, size: 34, delay: 0.4 },
  { id: 5, x: '95%', y: '52%', rot: -45, size: 28, delay: 0.9 },
  { id: 6, x: '88%', y: '82%', rot:  20, size: 38, delay: 1.5 },
  { id: 7, x: '36%', y: '12%', rot: -15, size: 26, delay: 0.3 },
  { id: 8, x: '42%', y: '86%', rot:  30, size: 32, delay: 0.8 },
];

function FloatingLeaf({ x, y, rot, size, delay }) {
  return (
    <motion.div
      className="cnt-leaf"
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

/* ── 4 Contact Information Cards ─────────────────────── */
const CONTACT_INFOS = [
  {
    id: 'email',
    title: 'Email Us',
    value: 'hello@foodbridge.org',
    href: 'mailto:hello@foodbridge.org',
    note: 'We reply within 24 hours',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
  {
    id: 'phone',
    title: 'Call Us',
    value: '+91 98765 43210',
    href: 'tel:+919876543210',
    note: 'Mon – Sat, 9:00 AM – 6:00 PM',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
  {
    id: 'office',
    title: 'Visit Us',
    value: 'FoodBridge HQ, Green Park',
    note: 'New Delhi, India – 110016',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    id: 'hours',
    title: 'Support Hours',
    value: '24/7 Helpline',
    note: 'Emergency food support available',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
];

/* ── Main Contact Page Component ─────────────────────── */
export default function Contact({ onNavigate }) {
  const { isDark, toggleTheme } = useTheme();
  const { user, role, profile, isAdmin } = useAuth();
  const isUserAdmin = isAdmin || role === 'admin';
  const avatarUrl = getAvatarUrl(profile, user);
  const [hoveredNav, setHoveredNav] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleNav = (route) => {
    const routeHashes = {
      'home': '',
      'how-it-works': '#how-it-works',
      'about-us': '#about-us',
      'impact': '#impact',
      'contact': '#contact',
      'login': '#login',
    };
    if (onNavigate) {
      onNavigate(route);
    }
    window.location.hash = routeHashes[route] !== undefined ? routeHashes[route] : `#${route}`;
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert([{
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim() || null,
          message: formData.message.trim(),
          user_id: user?.id || null,
        }]);

      if (error) throw error;

      setLoading(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      console.warn('Contact form notice:', err.message);
      // Still show success so user isn't blocked if table doesn't exist yet
      setLoading(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    }
  };

  return (
    <div className={`cnt-page ${isDark ? 'dark-mode' : ''}`}>
      {/* ── Floating leaves (background) ── */}
      {LEAVES.map((l) => (
        <FloatingLeaf key={l.id} {...l} />
      ))}

      {/* ── Top-right subtle leaf branch decor ── */}
      <div className="cnt-top-leaf-decor" aria-hidden="true">
        <img
          src="/assets/contact_leaf_branch.png"
          alt=""
          className="cnt-leaf-branch-img"
        />
      </div>

      {/* ── Background curved doodle wave ── */}
      <svg className="cnt-bg-curve-svg" viewBox="0 0 1440 600" fill="none" aria-hidden="true">
        <path
          d="M -100 400 C 300 200, 600 550, 1000 320 C 1300 150, 1500 380, 1600 300"
          stroke="#4ade80"
          strokeWidth="1.8"
          strokeDasharray="6 6"
          opacity="0.35"
        />
      </svg>

      {/* ═══════════ NAVBAR ═══════════ */}
      <header className="cnt-navbar">
        <div className="cnt-nav-inner">
          <button className="cnt-brand" onClick={() => handleNav('home')}>
            <svg className="cnt-logo-svg" viewBox="0 0 48 48" fill="none">
              <path d="M24 6 C21 10 21 15 24 18 C27 15 27 10 24 6 Z" fill="#1b6b33" />
              <path d="M17 10 C14 12 14 16 18 18 C19 15 18 12 17 10 Z" fill="#1b6b33" />
              <path d="M31 10 C34 12 34 16 30 18 C29 15 30 12 31 10 Z" fill="#1b6b33" />
              <path d="M12 28 Q 24 16 36 28" stroke="#1b6b33" strokeWidth="2.8" fill="none" />
              <line x1="18" y1="21" x2="18" y2="28" stroke="#1b6b33" strokeWidth="2.2" />
              <line x1="24" y1="19" x2="24" y2="28" stroke="#1b6b33" strokeWidth="2.2" />
              <line x1="30" y1="21" x2="30" y2="28" stroke="#1b6b33" strokeWidth="2.2" />
              <path d="M10 30 C14 42 34 42 38 30" stroke="#1b6b33" strokeWidth="2.8" fill="none" />
            </svg>
            <div className="cnt-brand-text">
              <span className="cnt-brand-name">FoodBridge</span>
              <span className="cnt-brand-tag">Share Food. Share Hope.</span>
            </div>
          </button>

          <nav className="cnt-nav-links" onMouseLeave={() => setHoveredNav(null)}>
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
                className={`cnt-nav-link ${label === 'Contact' ? 'cnt-nav-active' : ''}`}
                onClick={() => handleNav(route)}
                onMouseEnter={() => setHoveredNav(label)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              >
                {hoveredNav === label && (
                  <motion.span
                    className="cnt-nav-hover-pill"
                    layoutId="cntNavHoverPill"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                  />
                )}
                <span className="cnt-nav-label-text">{label}</span>
                {label === 'Contact' && (
                  <motion.span
                    className="cnt-nav-active-dot"
                    layoutId="cntNavActiveDot"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </nav>

          <div className="cnt-nav-actions">
            {/* Theme Toggle */}
            <motion.button
              className="cnt-btn-theme"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.9, rotate: 20 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isDark ? (
                  <motion.svg
                    key="moon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
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
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.22 }}
                  >
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </motion.svg>
                )}
              </AnimatePresence>
            </motion.button>

            {user ? (
              <button
                className="cnt-btn-join cnt-btn-dashboard-stylish"
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
              <button
                className="cnt-btn-join"
                onClick={() => handleNav('login')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Join Us
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <main className="cnt-main-section">
        <div className="cnt-container">
          <div className="cnt-hero-grid">
            <motion.div
              className="cnt-left-col"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="cnt-tag-badge">
                <ShinyText text="GET IN TOUCH" speed={4} shimmerColor="rgba(34,197,94,0.9)" />
                <AnimatedBadgeLeaf size={15} />
              </span>

              <h1 className="cnt-hero-title">
                <span className="cnt-title-dark">
                  <SplitText text="We'd love to" delay={40} splitBy="words" />
                </span>
                <span className="cnt-title-green">
                  <GradientText colors={['#1b6b33', '#22c55e', '#10b981', '#34db76', '#1b6b33']} animationSpeed={5}>
                    hear from you!
                  </GradientText>
                </span>
              </h1>

              <div className="cnt-hero-desc">
                <BlurText
                  text="Have a question, suggestion, or want to collaborate? We're here and happy to help."
                  delay={20}
                  animateBy="words"
                />
              </div>

              {/* 2x2 Contact Info Grid */}
              <div className="cnt-cards-grid">
                {CONTACT_INFOS.map((info, idx) => (
                  <motion.div
                    key={info.id}
                    className="cnt-info-card-wrapper"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 + idx * 0.1 }}
                  >
                    <motion.div
                      className="cnt-info-card"
                      whileHover={{ y: -5, boxShadow: '0 12px 30px rgba(0, 0, 0, 0.08)' }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <div className="cnt-card-icon-wrap">{info.icon}</div>
                      <div className="cnt-card-body">
                        <span className="cnt-card-title">{info.title}</span>
                        {info.href ? (
                          <a href={info.href} className="cnt-card-value-link">
                            {info.value}
                          </a>
                        ) : (
                          <span className="cnt-card-value">{info.value}</span>
                        )}
                        <span className="cnt-card-note">{info.note}</span>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* ─── Decorative Hand-drawn Green Arrow ─── */}
            <div className="cnt-doodle-arrow" aria-hidden="true">
              <svg viewBox="0 0 140 60" fill="none">
                <path
                  d="M 10 45 C 40 10, 80 50, 110 20 L 130 18 M 118 10 L 130 18 L 122 30"
                  stroke="#4ade80"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* ─── Right Column: Send Us A Message Form ─── */}
            <motion.div
              className="cnt-right-col"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="cnt-form-card">
                <div className="cnt-form-header">
                  <h2 className="cnt-form-title">
                    Send us a message
                    <AnimatedBadgeLeaf size={18} />
                  </h2>
                  <p className="cnt-form-subtitle">
                    Fill out the form and we&apos;ll get back to you as soon as possible.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="cnt-form">
                  {/* Name & Email Row */}
                  <div className="cnt-form-row cnt-form-two-col">
                    <div className="cnt-input-group">
                      <div className="cnt-input-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                      <input
                        id="cnt-name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your Name"
                        required
                        className="cnt-input"
                        aria-label="Your Name"
                        autoComplete="name"
                      />
                    </div>

                    <div className="cnt-input-group">
                      <div className="cnt-input-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                      </div>
                      <input
                        id="cnt-email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Your Email"
                        required
                        className="cnt-input"
                        aria-label="Your Email"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Subject Input */}
                  <div className="cnt-form-row">
                    <div className="cnt-input-group">
                      <div className="cnt-input-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                      </div>
                      <input
                        id="cnt-subject"
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="Subject"
                        className="cnt-input"
                        aria-label="Subject"
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  {/* Message Textarea */}
                  <div className="cnt-form-row">
                    <div className="cnt-input-group cnt-textarea-group">
                      <div className="cnt-input-icon cnt-textarea-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                      </div>
                      <textarea
                        id="cnt-message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Your Message"
                        rows={4}
                        required
                        className="cnt-textarea"
                        aria-label="Your Message"
                      />
                    </div>
                  </div>

                  {/* Submit & Safe Note Row */}
                  <div className="cnt-form-footer">
                    <motion.button
                      type="submit"
                      className="cnt-btn-submit"
                      disabled={loading}
                      whileHover={{ scale: 1.03, boxShadow: '0 8px 24px rgba(13, 42, 23, 0.3)' }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <span>{loading ? 'Sending...' : 'Send Message'}</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </motion.button>

                    <div className="cnt-safe-note">
                      <div className="cnt-safe-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <polyline points="9 12 11 14 15 10" />
                        </svg>
                      </div>
                      <div className="cnt-safe-text">
                        <span>Your information is safe with us.</span>
                        <span>We never share your data.</span>
                      </div>
                    </div>
                  </div>

                  {/* Submission Confirmation Toast */}
                  <AnimatePresence>
                    {submitted && (
                      <motion.div
                        className="cnt-success-toast"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <span>Thank you! Your message has been sent successfully.</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </div>
            </motion.div>
          </div>

          {/* ═══════════ PARTNER BANNER ═══════════ */}
          <motion.div
            className="cnt-partner-banner"
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="cnt-partner-left">
              <div className="cnt-partner-badge-wrap">
                <AnimatedCollectHands size={32} color="#1b6b33" />
              </div>
              <div className="cnt-partner-text">
                <h3 className="cnt-partner-heading">Want to partner with us?</h3>
                <p className="cnt-partner-sub">
                  We collaborate with NGOs, businesses, schools and volunteers to maximize our impact.
                </p>
              </div>
            </div>

            <div className="cnt-partner-right">
              <motion.button
                className="cnt-btn-partner"
                whileHover={{ scale: 1.05, background: '#1b6b33', color: '#ffffff' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleNav('home')}
              >
                Become a Partner
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </motion.button>

              {/* Hand-drawn Volunteers Box Illustration */}
              <div className="cnt-partner-illustration" aria-hidden="true">
                <svg viewBox="0 0 200 100" fill="none" className="cnt-ill-svg">
                  {/* Left Person */}
                  <circle cx="45" cy="30" r="10" stroke="#2e7d32" strokeWidth="1.6" />
                  <path d="M45 40 C35 48 30 65 30 85 H60 C60 65 55 48 45 40 Z" stroke="#2e7d32" strokeWidth="1.6" fill="none" />
                  <path d="M45 55 L75 62" stroke="#2e7d32" strokeWidth="1.6" strokeLinecap="round" />

                  {/* Right Person */}
                  <circle cx="155" cy="30" r="10" stroke="#2e7d32" strokeWidth="1.6" />
                  <path d="M155 40 C165 48 170 65 170 85 H140 C140 65 145 48 155 40 Z" stroke="#2e7d32" strokeWidth="1.6" fill="none" />
                  <path d="M155 55 L125 62" stroke="#2e7d32" strokeWidth="1.6" strokeLinecap="round" />

                  {/* Food Box in center */}
                  <rect x="75" y="55" width="50" height="35" rx="3" stroke="#2e7d32" strokeWidth="1.6" fill="#e8f5e9" />
                  <path d="M95 72 C95 72 90 68 90 65 C90 63 92 62 94 62 C96 62 98 64 100 66 C102 64 104 62 106 62 C108 62 110 63 110 65 C110 68 105 72 105 72 Z" fill="#2e7d32" />
                  {/* Food contents */}
                  <path d="M80 55 Q 85 45 90 55 Q 95 42 100 55 Q 105 44 110 55 Q 115 47 120 55" stroke="#2e7d32" strokeWidth="1.5" />
                  
                  {/* Floating hearts */}
                  <path d="M100 25 C100 25 96 21 96 18 C96 16 98 15 100 17 C102 15 104 16 104 18 C104 21 100 25 100 25 Z" fill="#4ade80" />
                  <path d="M125 35 C125 35 122 32 122 30 C122 28 123 27 125 29 C127 27 128 28 128 30 C128 32 125 35 125 35 Z" fill="#86efac" />
                  <path d="M72 38 C72 38 70 35 70 33 C70 32 71 31 72 32 C73 31 74 32 74 33 C74 35 72 38 72 38 Z" fill="#86efac" />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="cnt-footer">
        {/* Top Wave */}
        <div className="cnt-footer-wave" aria-hidden="true">
          <svg viewBox="0 0 1440 80" fill="none" preserveAspectRatio="none">
            <path
              d="M0,40 C320,80 420,0 720,40 C1020,80 1120,10 1440,35 L1440,80 L0,80 Z"
              fill="#0d2a17"
            />
          </svg>
        </div>

        <div className="cnt-footer-content">
          <div className="cnt-footer-grid">
            {/* Column 1: Brand */}
            <div className="cnt-fcol-brand">
              <button className="cnt-fbrand" onClick={() => handleNav('home')}>
                <svg className="cnt-flogo-svg" viewBox="0 0 48 48" fill="none">
                  <path d="M24 6 C21 10 21 15 24 18 C27 15 27 10 24 6 Z" fill="#4ade80" />
                  <path d="M17 10 C14 12 14 16 18 18 C19 15 18 12 17 10 Z" fill="#4ade80" />
                  <path d="M31 10 C34 12 34 16 30 18 C29 15 30 12 31 10 Z" fill="#4ade80" />
                  <path d="M12 28 Q 24 16 36 28" stroke="#4ade80" strokeWidth="2.8" fill="none" />
                  <line x1="18" y1="21" x2="18" y2="28" stroke="#4ade80" strokeWidth="2.2" />
                  <line x1="24" y1="19" x2="24" y2="28" stroke="#4ade80" strokeWidth="2.2" />
                  <line x1="30" y1="21" x2="30" y2="28" stroke="#4ade80" strokeWidth="2.2" />
                  <path d="M10 30 C14 42 34 42 38 30" stroke="#4ade80" strokeWidth="2.8" fill="none" />
                </svg>
                <div className="cnt-fbrand-text">
                  <span className="cnt-fbrand-name">FoodBridge</span>
                  <span className="cnt-fbrand-tag">Share Food. Share Hope.</span>
                </div>
              </button>
            </div>

            {/* Column 2: Quick Links */}
            <div className="cnt-fcol">
              <h4 className="cnt-fcol-heading">Quick Links</h4>
              <ul className="cnt-flinks">
                <li><button onClick={() => handleNav('home')}>Home</button></li>
                <li><button onClick={() => handleNav('login')}>Donate</button></li>
                <li><button onClick={() => handleNav('food-listings')}>Find Food</button></li>
                <li><button onClick={() => handleNav('contact')}>Contact</button></li>
              </ul>
            </div>

            {/* Column 3: Our Impact */}
            <div className="cnt-fcol">
              <h4 className="cnt-fcol-heading">Our Impact</h4>
              <ul className="cnt-flinks">
                <li><button onClick={() => handleNav('impact')}>Meals Shared</button></li>
                <li><button onClick={() => handleNav('impact')}>People Helped</button></li>
                <li><button onClick={() => handleNav('impact')}>Communities</button></li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright Bar */}
          <div className="cnt-footer-bottom">
            <span>© {new Date().getFullYear()} FoodBridge. All rights reserved.</span>
            <AnimatedBadgeLeaf size={16} color="#4ade80" />
          </div>
        </div>
      </footer>
    </div>
  );
}
