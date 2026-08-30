import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../components/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  AnimatedCollectHands,
  AnimatedPinMap,
  AnimatedCommunityPeople,
} from '../../components/AnimatedIcons/AnimatedIcons';
import { SplitText, BlurText, GradientText, ShinyText, CountUp } from '../../components/AnimatedUI';
import { BUILT_IN_AVATARS, svgToDataUri } from '../../services/avatarService';
import './Login.css';

/* ── Ambient floating leaves ── */
const LEAVES = [
  { id: 1, x: '2%',  y: '16%', rot: -20, size: 34, delay: 0 },
  { id: 2, x: '27%', y: '6%',  rot:  15, size: 28, delay: 0.8 },
  { id: 3, x: '33%', y: '36%', rot: -30, size: 32, delay: 0.4 },
  { id: 4, x: '28%', y: '72%', rot:  25, size: 36, delay: 1.2 },
  { id: 5, x: '94%', y: '20%', rot: -15, size: 40, delay: 0.6 },
  { id: 6, x: '96%', y: '75%', rot:  35, size: 30, delay: 1.0 },
];

function FloatingLeaf({ x, y, rot, size, delay }) {
  return (
    <motion.div
      className="lgn-leaf"
      style={{ left: x, top: y, width: size, height: size }}
      initial={{ opacity: 0, rotate: rot - 10 }}
      animate={{
        opacity: [0, 0.75, 0.5, 0.75],
        rotate: [rot - 10, rot + 10, rot - 5, rot + 8, rot],
        y: [0, -12, 6, -8, 0],
      }}
      transition={{
        delay,
        duration: 5.5,
        repeat: Infinity,
        repeatType: 'loop',
        ease: 'easeInOut',
      }}
    >
      <svg viewBox="0 0 60 60" fill="none">
        <path
          d="M30 55 C10 45 5 20 15 8 C25 -2 55 5 55 28 C55 45 40 60 30 55 Z"
          fill="#4caf50"
          fillOpacity="0.7"
        />
        <path
          d="M30 55 C30 40 18 22 15 8"
          stroke="#2e7d32"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </motion.div>
  );
}

export default function Login({ onNavigate }) {
  const { isDark, toggleTheme } = useTheme();
  const { login, signup, role: authRole } = useAuth();

  const [activeTab, setActiveTab] = useState('signup'); // 'login' | 'signup'
  const [role, setRole] = useState('donor'); // 'donor' | 'receiver'
  const [selectedAvatar, setSelectedAvatar] = useState('avatar_leaf');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    identifier: '', // email for login
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success' | 'error'
  const [rateLimitWarning, setRateLimitWarning] = useState(false);

  const showToast = (message, type = 'success', duration = 5000) => {
    setToastMessage(message);
    setToastType(type);
    if (duration > 0) {
      setTimeout(() => {
        setToastMessage('');
      }, duration);
    }
  };

  const handleNav = (route) => {
    const routeHashes = {
      'home': '',
      'how-it-works': '#how-it-works',
      'about-us': '#about-us',
      'impact': '#impact',
      'contact': '#contact',
      'login': '#login',
      'donor-dashboard': '#donor-dashboard',
      'receiver-dashboard': '#receiver-dashboard',
      'dashboard': '#dashboard',
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
    if (loading) return;

    if (activeTab === 'login') {
      const email = formData.identifier.trim();
      const password = formData.password;

      if (!email) {
        showToast('Please enter your email address.', 'error', 4000);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showToast('Please enter a valid email address.', 'error', 4000);
        return;
      }

      if (!password) {
        showToast('Please enter your password.', 'error', 4000);
        return;
      }

      setLoading(true);
      setToastMessage('');

      try {
        const data = await login({ email, password });

        if (data?.session) {
          const userEmail = (data.user?.email || email).toLowerCase().trim();
          const isAdmin = userEmail === 'adsharma1887@gmail.com' || (data.user?.user_metadata?.role === 'admin');
          const resolvedRole = isAdmin ? 'admin' : (data.user?.user_metadata?.role || 'donor');
          showToast('Welcome back! You have successfully logged in.', 'success', 3000);
          setTimeout(() => {
            if (resolvedRole === 'admin') {
              handleNav('admin-dashboard');
            } else if (resolvedRole === 'receiver') {
              handleNav('receiver-dashboard');
            } else {
              handleNav('donor-dashboard');
            }
          }, 1000);
        }
      } catch (err) {
        const errMsg = (err.message || '').toLowerCase();
        if (errMsg.includes('email not confirmed') || errMsg.includes('not confirmed')) {
          showToast('Please verify your email address before logging in. Check your inbox for the confirmation link.', 'error', 7000);
        } else if (errMsg.includes('invalid login credentials') || errMsg.includes('invalid credentials')) {
          showToast('Invalid email or password. Please try again.', 'error', 5000);
        } else {
          showToast(err.message || 'An unexpected error occurred during login.', 'error', 5000);
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    // ── Sign Up Validation ──
    const name = formData.name.trim();
    const email = formData.email.trim();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    if (!name) {
      showToast('Please enter your full name.', 'error', 4000);
      return;
    }

    if (!email) {
      showToast('Please enter your email address.', 'error', 4000);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast('Please enter a valid email address.', 'error', 4000);
      return;
    }

    if (!password) {
      showToast('Please create a password.', 'error', 4000);
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error', 4000);
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match. Please check again.', 'error', 4000);
      return;
    }

    if (!agreeTerms) {
      showToast('Please agree to the Terms of Service and Privacy Policy.', 'error', 4000);
      return;
    }

    // ── Real Supabase Sign Up ──
    setLoading(true);
    setToastMessage('');

    try {
      const data = await signup({
        email,
        password,
        fullName: name,
        phone: formData.phone || '',
        role: (role || 'donor').toLowerCase().trim(),
        avatarUrl: selectedAvatar || 'avatar_leaf',
      });

      if (data?.user) {
        if (data.session) {
          showToast('Account created successfully! Welcome to FoodBridge.', 'success', 6000);
          const resolvedRole = data.user?.user_metadata?.role || role || 'donor';
          setTimeout(() => {
            if (resolvedRole === 'receiver') {
              handleNav('receiver-dashboard');
            } else {
              handleNav('donor-dashboard');
            }
          }, 1500);
        } else {
          showToast('Account created! Please check your email to verify your account before logging in.', 'success', 8000);
        }

        setFormData((prev) => ({
          ...prev,
          password: '',
          confirmPassword: '',
        }));
      }
    } catch (err) {
      const errMsg = (err.message || '').toLowerCase();
      if (
        errMsg.includes('rate limit') ||
        errMsg.includes('over_email_send_rate_limit') ||
        errMsg.includes('email_rate_limit') ||
        err.status === 429
      ) {
        showToast(
          'Email rate limit exceeded: Supabase free tier limits confirmation emails to 3-4 per hour. Please turn OFF "Confirm email" in Supabase Dashboard for unlimited instant signups.',
          'error',
          10000
        );
        setRateLimitWarning(true);
      } else if (errMsg.includes('user already registered') || errMsg.includes('already registered')) {
        showToast('An account with this email already exists. Please switch to the Login tab.', 'error', 6000);
      } else {
        showToast(err.message || 'An unexpected error occurred during signup.', 'error', 6000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`login-page ${isDark ? 'dark-mode' : ''}`}>
      {/* ── Ambient Floating Leaves ── */}
      {LEAVES.map((l) => (
        <FloatingLeaf key={l.id} {...l} />
      ))}

      {/* ── Subtle Background Dot Matrix ── */}
      <div className="lgn-dot-matrix lgn-dot-left" aria-hidden="true" />
      <div className="lgn-dot-matrix lgn-dot-right" aria-hidden="true" />

      {/* ── Organic Bottom Wave Backgrounds ── */}
      <div className="lgn-bg-curve-bottom-left" aria-hidden="true" />
      <div className="lgn-bg-curve-bottom-right" aria-hidden="true" />

      {/* ═══════════ TOP HEADER ═══════════ */}
      <header className="lgn-header">
        <div className="lgn-header-inner">
          {/* Brand Logo */}
          <button className="lgn-brand" onClick={() => handleNav('home')}>
            <svg className="lgn-logo-svg" viewBox="0 0 48 48" fill="none">
              <path d="M24 6 C21 10 21 15 24 18 C27 15 27 10 24 6 Z" fill="#1b6b33" />
              <path d="M17 10 C14 12 14 16 18 18 C19 15 18 12 17 10 Z" fill="#1b6b33" />
              <path d="M31 10 C34 12 34 16 30 18 C29 15 30 12 31 10 Z" fill="#1b6b33" />
              <path d="M12 28 Q 24 16 36 28" stroke="#1b6b33" strokeWidth="2.8" fill="none" />
              <line x1="18" y1="21" x2="18" y2="28" stroke="#1b6b33" strokeWidth="2.2" />
              <line x1="24" y1="19" x2="24" y2="28" stroke="#1b6b33" strokeWidth="2.2" />
              <line x1="30" y1="21" x2="30" y2="28" stroke="#1b6b33" strokeWidth="2.2" />
              <path d="M10 30 C14 42 34 42 38 30" stroke="#1b6b33" strokeWidth="2.8" fill="none" />
            </svg>
            <div className="lgn-brand-text">
              <span className="lgn-brand-name">FoodBridge</span>
              <span className="lgn-brand-tag">Share Food. Share Hope.</span>
            </div>
          </button>

          {/* Theme Toggle Button */}
          <motion.button
            className="lgn-btn-theme"
            onClick={toggleTheme}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
                <span>Light</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
                <span>Dark</span>
              </>
            )}
          </motion.button>
        </div>
      </header>

      {/* ═══════════ MAIN HERO GRID ═══════════ */}
      <main className="lgn-main-container">
        <div className="lgn-layout-grid">
          {/* ─── Left Column: Hero & Benefits ─── */}
          <motion.div
            className="lgn-left-col"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="lgn-hero-title">
              <span className="lgn-title-line">
                <SplitText text="Good Food" delay={40} splitBy="words" />
              </span>
              <span className="lgn-title-line">
                <SplitText text="Can Create" delay={45} splitBy="words" />
              </span>
              <span className="lgn-title-highlight">
                <GradientText colors={['#16a34a', '#22c55e', '#10b981', '#34db76', '#16a34a']} animationSpeed={5}>
                  Great Change
                </GradientText>
                <svg className="lgn-title-underline-curve" viewBox="0 0 200 16" fill="none">
                  <path
                    d="M 4 10 C 50 3, 150 2, 196 11"
                    stroke="#16a34a"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <div className="lgn-hero-desc">
              <BlurText
                text="Join a community of kind hearts working together to reduce food waste and feed those in need."
                delay={20}
                animateBy="words"
              />
            </div>

            {/* 3 Benefit Feature Items */}
            <div className="lgn-benefits-list">
              {/* Item 1 */}
              <div className="lgn-benefit-item">
                <div className="lgn-benefit-icon-wrap">
                  <AnimatedCollectHands size={22} color="#1b6b33" />
                </div>
                <div className="lgn-benefit-body">
                  <h3 className="lgn-benefit-heading">Share Surplus Food</h3>
                  <p className="lgn-benefit-text">Donate extra food and help someone in need.</p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="lgn-benefit-item">
                <div className="lgn-benefit-icon-wrap">
                  <AnimatedPinMap size={22} color="#1b6b33" />
                </div>
                <div className="lgn-benefit-body">
                  <h3 className="lgn-benefit-heading">Find Food Nearby</h3>
                  <p className="lgn-benefit-text">Discover donations from donors near you.</p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="lgn-benefit-item">
                <div className="lgn-benefit-icon-wrap">
                  <AnimatedCommunityPeople size={22} color="#1b6b33" />
                </div>
                <div className="lgn-benefit-body">
                  <h3 className="lgn-benefit-heading">Build Stronger Communities</h3>
                  <p className="lgn-benefit-text">Together, we can create a zero-waste world.</p>
                </div>
              </div>
            </div>

            {/* Bottom Left Impact Card */}
            <motion.div
              className="lgn-impact-badge-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ y: -3 }}
            >
              <div className="lgn-avatar-stack">
                <img src="/assets/avatar1.jpg" alt="User 1" className="lgn-avatar-img" />
                <img src="/assets/avatar2.jpg" alt="User 2" className="lgn-avatar-img" />
                <img src="/assets/avatar3.jpg" alt="User 3" className="lgn-avatar-img" />
                <img src="/assets/avatar4.jpg" alt="User 4" className="lgn-avatar-img" />
                <div className="lgn-avatar-count">10K+</div>
              </div>
              <div className="lgn-impact-text">
                <span className="lgn-impact-stat">
                  <CountUp to={10000} from={1000} duration={2} suffix="+ lives impacted" />
                </span>
                <span className="lgn-impact-sub">Be a part of the change today!</span>
              </div>
            </motion.div>
          </motion.div>

          {/* ─── Center Visual: Food Box / Salad Bowl & Floating Cards ─── */}
          <div className="lgn-center-col">
            {/* Top Floating Pill Card */}
            <motion.div
              className="lgn-floating-share-card"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="lgn-share-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="lgn-share-body">
                <span className="lgn-share-title">Share today</span>
                <span className="lgn-share-sub">Brighten someone&apos;s tomorrow</span>
              </div>
              <div className="lgn-share-heart">
                <svg viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
            </motion.div>

            {/* Connecting Green Dashed Doodle Curve */}
            <div className="lgn-center-dashed-curve" aria-hidden="true">
              <svg viewBox="0 0 300 240" fill="none">
                <path
                  d="M 60 10 C 20 60, 10 140, 80 170 C 130 190, 200 180, 260 210"
                  stroke="#4ade80"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  opacity="0.85"
                />
                <path
                  d="M 252 202 L 262 212 L 250 218"
                  stroke="#4ade80"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Main Visual: Sign Up Donation Box or Login Salad Bowl */}
            <motion.div
              className="lgn-visual-wrapper"
              key={activeTab}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeTab === 'signup' ? (
                <div className="lgn-signup-box-frame">
                  <img
                    src="/assets/signup_food_box.jpg"
                    alt="Fresh organic donations food box"
                    className="lgn-signup-box-img"
                  />
                </div>
              ) : (
                <div className="lgn-bowl-inner-frame">
                  <img
                    src="/assets/Bowl_png_login_page.png"
                    alt="Fresh nutritious community salad bowl"
                    className="lgn-bowl-img"
                  />
                </div>
              )}
            </motion.div>
          </div>

          {/* ─── Right Column: Login / Sign Up Card ─── */}
          <motion.div
            className="lgn-right-col"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="lgn-card">
              {/* Card Top Header */}
              <div className="lgn-card-header">
                {activeTab === 'login' ? (
                  <>
                    <div className="lgn-box-illustration">
                      <svg viewBox="0 0 80 70" fill="none" className="lgn-box-svg">
                        <circle cx="28" cy="20" r="10" fill="#22c55e" />
                        <circle cx="48" cy="18" r="12" fill="#16a34a" />
                        <circle cx="38" cy="14" r="8" fill="#4ade80" />
                        <polygon points="56,12 66,2 62,18" fill="#f97316" />
                        <circle cx="22" cy="24" r="7" fill="#ef4444" />
                        <rect x="12" y="24" width="56" height="40" rx="6" fill="#f59e0b" />
                        <rect x="8" y="22" width="64" height="10" rx="3" fill="#d97706" />
                        <circle cx="40" cy="46" r="11" fill="#ffffff" />
                        <path
                          d="M40 52 C40 52 34 47 34 43 C34 40.5 36 39 38 40 C39 40.8 40 42 40 42 C40 42 41 40.8 42 40 C44 39 46 40.5 46 43 C46 47 40 52 40 52 Z"
                          fill="#f59e0b"
                        />
                      </svg>
                    </div>
                    <h2 className="lgn-card-title">
                      <SplitText text="Welcome Back! 👋" delay={30} splitBy="words" />
                    </h2>
                    <p className="lgn-card-subtitle">Login to continue your journey of kindness.</p>
                  </>
                ) : (
                  <>
                    <h2 className="lgn-card-title lgn-signup-title">
                      <SplitText text="Create Your Account" delay={30} splitBy="words" />
                      <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lgn-title-leaf-svg">
                        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                      </svg>
                    </h2>
                    <p className="lgn-card-subtitle">Sign up and start making a difference.</p>
                  </>
                )}
              </div>

              {/* Tab Switcher */}
              <div className="lgn-tabs">
                <button
                  type="button"
                  className={`lgn-tab ${activeTab === 'login' ? 'lgn-tab-active' : ''}`}
                  onClick={() => setActiveTab('login')}
                >
                  Login
                  {activeTab === 'login' && <motion.div layoutId="lgnTabUnderline" className="lgn-tab-underline" />}
                </button>
                <button
                  type="button"
                  className={`lgn-tab ${activeTab === 'signup' ? 'lgn-tab-active' : ''}`}
                  onClick={() => setActiveTab('signup')}
                >
                  Sign Up
                  {activeTab === 'signup' && <motion.div layoutId="lgnTabUnderline" className="lgn-tab-underline" />}
                </button>
              </div>

              {/* Rate Limit Notice Banner */}
              {rateLimitWarning && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: isDark ? 'rgba(234, 88, 12, 0.15)' : '#fff7ed',
                    border: '1.5px solid #fdba74',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    marginBottom: '16px',
                    fontSize: '12.5px',
                    lineHeight: '1.45',
                    color: isDark ? '#fdba74' : '#9a3412',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      ⚠️ Supabase Email Rate Limit (Free Tier)
                    </strong>
                    <button
                      type="button"
                      onClick={() => setRateLimitWarning(false)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '14px' }}
                      aria-label="Dismiss notice"
                    >
                      ✕
                    </button>
                  </div>
                  <p style={{ margin: '0 0 6px' }}>
                    Supabase allows a max of <strong>3-4 confirmation emails per hour</strong> on free tier.
                  </p>
                  <div style={{ background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)', padding: '8px 10px', borderRadius: '8px', marginBottom: '8px' }}>
                    <strong>💡 Instant Fix in 10 seconds:</strong>
                    <ol style={{ margin: '4px 0 0 16px', padding: 0 }}>
                      <li>Open your <strong>Supabase Dashboard</strong></li>
                      <li>Go to <strong>Authentication</strong> → <strong>Providers</strong> → <strong>Email</strong></li>
                      <li>Toggle <strong>OFF</strong> <em>"Confirm email"</em> and click <strong>Save</strong></li>
                    </ol>
                    <span style={{ fontSize: '11.5px', display: 'block', marginTop: '4px', opacity: 0.9 }}>
                      (This enables instant signups with zero email rate limits!)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('login');
                      setRateLimitWarning(false);
                    }}
                    style={{
                      background: '#ea580c',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '5px 12px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    Sign In With Existing Account →
                  </button>
                </motion.div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="lgn-form">
                {activeTab === 'signup' ? (
                  <>
                    {/* Row 1: Full Name + Email Address */}
                    <div className="lgn-form-two-col">
                      <div className="lgn-input-group">
                        <div className="lgn-input-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Full Name"
                          required
                          className="lgn-input"
                        />
                      </div>

                      <div className="lgn-input-group">
                        <div className="lgn-input-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                          </svg>
                        </div>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Email Address"
                          required
                          className="lgn-input"
                        />
                      </div>
                    </div>

                    {/* Row 2: Phone Number + Create Password */}
                    <div className="lgn-form-two-col">
                      <div className="lgn-input-group">
                        <div className="lgn-input-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="Phone Number"
                          className="lgn-input"
                        />
                      </div>

                      <div className="lgn-input-group">
                        <div className="lgn-input-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="Create Password"
                          required
                          className="lgn-input"
                        />
                        <button
                          type="button"
                          className="lgn-toggle-pwd"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Row 3: Confirm Password */}
                    <div className="lgn-input-group">
                      <div className="lgn-input-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm Password"
                        required
                        className="lgn-input"
                      />
                      <button
                        type="button"
                        className="lgn-toggle-pwd"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                    </div>

                    {/* "I am signing up as" Role Selector */}
                    <div className="lgn-role-section">
                      <span className="lgn-role-label">I am signing up as</span>
                      <div className="lgn-role-grid">
                        {/* Donor Card */}
                        <div
                          className={`lgn-role-card ${role === 'donor' ? 'lgn-role-active' : ''}`}
                          onClick={() => setRole('donor')}
                        >
                          <div className="lgn-role-icon-wrap">
                            <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="8" width="18" height="13" rx="2" />
                              <path d="M12 8v13" />
                              <path d="M19 12H5" />
                              <path d="M12 8a3 3 0 0 0-3-3c-1.5 0-2 1-2 2s1.5 1 5 1z" />
                              <path d="M12 8a3 3 0 0 1 3-3c1.5 0 2 1 2 2s-1.5 1-5 1z" />
                            </svg>
                          </div>
                          <div className="lgn-role-text">
                            <span className="lgn-role-title">Donor</span>
                            <span className="lgn-role-sub">I want to donate food</span>
                          </div>
                        </div>

                        {/* Receiver Card */}
                        <div
                          className={`lgn-role-card ${role === 'receiver' ? 'lgn-role-active' : ''}`}
                          onClick={() => setRole('receiver')}
                        >
                          <div className="lgn-role-icon-wrap">
                            <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                              <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
                              <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
                              <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                            </svg>
                          </div>
                          <div className="lgn-role-text">
                            <span className="lgn-role-title">Receiver</span>
                            <span className="lgn-role-sub">I need food assistance</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Agree to Terms Checkbox */}
                    <label className="lgn-checkbox-row">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="lgn-checkbox-input"
                      />
                      <span className="lgn-checkbox-custom">
                        {agreeTerms && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>
                      <span className="lgn-checkbox-label">
                        I agree to the <button type="button" className="lgn-text-link" onClick={() => handleNav('contact')}>Terms of Service</button> and <button type="button" className="lgn-text-link" onClick={() => handleNav('contact')}>Privacy Policy</button>
                      </span>
                    </label>

                    {/* Avatar Selection */}
                    <div className="lgn-avatar-section">
                      <span className="lgn-role-label">Choose your avatar</span>
                      <div className="lgn-avatar-grid">
                        {BUILT_IN_AVATARS.map((avatar) => (
                          <button
                            key={avatar.id}
                            type="button"
                            className={`lgn-avatar-option ${selectedAvatar === avatar.id ? 'lgn-avatar-active' : ''}`}
                            onClick={() => setSelectedAvatar(avatar.id)}
                            title={avatar.label}
                          >
                            <img src={svgToDataUri(avatar.svg)} alt={avatar.label} />
                            {selectedAvatar === avatar.id && (
                              <span className="lgn-avatar-check">
                                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Login Form Fields */}
                    <div className="lgn-input-group">
                      <div className="lgn-input-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="identifier"
                        value={formData.identifier}
                        onChange={handleInputChange}
                        placeholder="Email or Phone Number"
                        required
                        className="lgn-input"
                      />
                    </div>

                    <div className="lgn-input-group">
                      <div className="lgn-input-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Password"
                        required
                        className="lgn-input"
                      />
                      <button
                        type="button"
                        className="lgn-toggle-pwd"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                    </div>

                    <div className="lgn-forgot-wrap">
                      <button
                        type="button"
                        className="lgn-btn-forgot"
                        onClick={async () => {
                          const email = formData.identifier.trim();
                          if (!email) {
                            showToast('Please enter your email address first.', 'error', 4000);
                            return;
                          }
                          try {
                            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                              redirectTo: `${window.location.origin}/#login`,
                            });
                            if (error) throw error;
                            showToast('Password reset link sent to your email. Please check your inbox.', 'success', 7000);
                          } catch (err) {
                            showToast(err.message || 'Failed to send reset email.', 'error', 5000);
                          }
                        }}
                      >
                        Forgot Password?
                      </button>
                    </div>
                  </>
                )}

                {/* Primary Submit Button */}
                <motion.button
                  type="submit"
                  className="lgn-btn-submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(22, 163, 74, 0.35)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>{loading ? 'Please wait...' : activeTab === 'login' ? 'Login' : 'Create Account'}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </motion.button>
              </form>

              {/* Social Login Section */}
              <div className="lgn-divider">
                <span>or continue with</span>
              </div>

              <div className="lgn-social-grid">
                {/* Google */}
                <motion.button
                  type="button"
                  className="lgn-btn-social"
                  whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                  whileTap={{ scale: 0.96 }}
                  onClick={async () => {
                    try {
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: { redirectTo: window.location.origin + '/#dashboard' },
                      });
                      if (error) throw error;
                    } catch (err) {
                      showToast(err.message || 'Google login failed. Make sure Google OAuth is enabled.', 'error', 5000);
                    }
                  }}
                >
                  <svg viewBox="0 0 24 24" className="lgn-social-icon">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google</span>
                </motion.button>

                {/* Facebook */}
                <motion.button
                  type="button"
                  className="lgn-btn-social"
                  whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => showToast('Facebook login coming soon! Use Google or email for now.', 'error', 4000)}
                >
                  <svg viewBox="0 0 24 24" fill="#1877F2" className="lgn-social-icon">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Facebook</span>
                </motion.button>

                {/* Apple */}
                <motion.button
                  type="button"
                  className="lgn-btn-social"
                  whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => showToast('Apple login coming soon! Use Google or email for now.', 'error', 4000)}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="lgn-social-icon">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.66-.8 1.11-1.92.99-3.04-1 .04-2.16.67-2.82 1.44-.58.67-1.1 1.77-.96 2.87 1.12.09 2.13-.47 2.79-1.27z" />
                  </svg>
                  <span>Apple</span>
                </motion.button>
              </div>

              {/* Card Footer Switcher */}
              <div className="lgn-card-footer">
                {activeTab === 'login' ? (
                  <p>
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      className="lgn-link-switch"
                      onClick={() => setActiveTab('signup')}
                    >
                      Sign up →
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{' '}
                    <button
                      type="button"
                      className="lgn-link-switch"
                      onClick={() => setActiveTab('login')}
                    >
                      Login →
                    </button>
                  </p>
                )}
              </div>

              {/* Toast Message */}
              <AnimatePresence>
                {toastMessage && (
                  <motion.div
                    className="lgn-toast"
                    style={
                      toastType === 'error'
                        ? {
                            background: isDark ? '#3b1212' : '#fef2f2',
                            borderColor: isDark ? '#7f1d1d' : '#fecaca',
                            color: isDark ? '#fca5a5' : '#991b1b',
                          }
                        : undefined
                    }
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {toastType === 'error' ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    )}
                    <span>{toastMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
