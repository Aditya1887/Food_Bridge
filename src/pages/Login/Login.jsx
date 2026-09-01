import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../components/ThemeContext';
import { useAuth, checkIsAdmin } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { BUILT_IN_AVATARS, svgToDataUri } from '../../services/avatarService';
import SoftAurora from '../../components/SoftAurora/SoftAurora';
import './Login.css';

/* ── Ambient floating leaves ── */
const LEAVES = [
  { id: 1, x: '2%',  y: '16%', rot: -20, size: 34, delay: 0 },
  { id: 2, x: '27%', y: '6%',  rot:  15, size: 28, delay: 0.8 },
  { id: 3, x: '33%', y: '36%', rot: -30, size: 32, delay: 0.4 },
  { id: 4, x: '88%', y: '68%', rot:  25, size: 36, delay: 1.2 },
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
  const { login, signup } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false); // false = Sign In (default), true = Sign Up
  const [role, setRole] = useState('donor'); // 'donor' | 'receiver'
  const [selectedAvatar, setSelectedAvatar] = useState('avatar_eco_hero');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const selectedAvatarObj = BUILT_IN_AVATARS.find((a) => a.id === selectedAvatar) || BUILT_IN_AVATARS[0];

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
      'admin-dashboard': '#admin-dashboard',
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

  /* ── Sign In Submission ── */
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

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
        const isAdminUser = checkIsAdmin(data.user, null, data.user?.user_metadata?.role);
        const resolvedRole = isAdminUser ? 'admin' : (data.user?.user_metadata?.role || 'donor');
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
  };

  /* ── Sign Up Submission ── */
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

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
        showToast('An account with this email already exists. Please switch to Sign In.', 'error', 6000);
      } else {
        showToast(err.message || 'An unexpected error occurred during signup.', 'error', 6000);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Social Login ── */
  const handleGoogleLogin = async (fromSignUp = false) => {
    try {
      if (fromSignUp || isSignUp) {
        sessionStorage.setItem('fb_oauth_signup_intent', 'true');
      } else {
        sessionStorage.removeItem('fb_oauth_signup_intent');
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (err) {
      showToast(err.message || 'Google login failed. Make sure Google OAuth is enabled in Supabase.', 'error', 5000);
    }
  };

  const handleForgotPassword = async () => {
    const email = formData.identifier.trim();
    if (!email) {
      showToast('Please enter your email in the email field first.', 'error', 4000);
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
  };

  return (
    <div className={`login-page ${isDark ? 'dark-mode' : ''}`}>
      {/* ── Dynamic WebGL Soft Aurora Background (React Bits) ── */}
      <SoftAurora
        key={isDark ? 'dark' : 'light'}
        speed={isDark ? 0.5 : 0.36}
        scale={isDark ? 1.4 : 1.35}
        brightness={isDark ? 1.25 : 0.85}
        color1={isDark ? '#16a34a' : '#16a34a'}
        color2={isDark ? '#4ade80' : '#0ea5e9'}
        noiseFrequency={isDark ? 2.4 : 2.2}
        noiseAmplitude={1.0}
        bandHeight={0.52}
        bandSpread={isDark ? 1.15 : 1.05}
        octaveDecay={0.1}
        layerOffset={0}
        colorSpeed={isDark ? 0.9 : 0.7}
        enableMouseInteraction={true}
        mouseInfluence={0.25}
        lightMode={!isDark}
      />

      {/* ── Ambient Floating Leaves ── */}
      {LEAVES.map((l) => (
        <FloatingLeaf key={l.id} {...l} />
      ))}

      {/* ── Organic Glow Background Elements ── */}
      <div className="lgn-bg-curve-bottom-left" aria-hidden="true" />
      <div className="lgn-bg-curve-bottom-right" aria-hidden="true" />

      {/* ═══════════ TOP HEADER ═══════════ */}
      <header className="lgn-header">
        <div className="lgn-header-inner">
          {/* Brand Logo */}
          <button className="lgn-brand" onClick={() => handleNav('home')}>
            <svg className="lgn-logo-svg" viewBox="0 0 48 48" fill="none">
              <path d="M24 6 C21 10 21 15 24 18 C27 15 27 10 24 6 Z" fill="#16a34a" />
              <path d="M17 10 C14 12 14 16 18 18 C19 15 18 12 17 10 Z" fill="#16a34a" />
              <path d="M31 10 C34 12 34 16 30 18 C29 15 30 12 31 10 Z" fill="#16a34a" />
              <path d="M12 28 Q 24 16 36 28" stroke="#16a34a" strokeWidth="2.8" fill="none" />
              <line x1="18" y1="21" x2="18" y2="28" stroke="#16a34a" strokeWidth="2.2" />
              <line x1="24" y1="19" x2="24" y2="28" stroke="#16a34a" strokeWidth="2.2" />
              <line x1="30" y1="21" x2="30" y2="28" stroke="#16a34a" strokeWidth="2.2" />
              <path d="M10 30 C14 42 34 42 38 30" stroke="#16a34a" strokeWidth="2.8" fill="none" />
            </svg>
            <div className="lgn-brand-text">
              <span className="lgn-brand-name">FoodBridge</span>
              <span className="lgn-brand-tag">Share Food. Share Hope.</span>
            </div>
          </button>

          {/* Header Actions */}
          <div className="lgn-header-actions">
            <button className="lgn-btn-home" onClick={() => handleNav('home')}>
              ← Back to Home
            </button>

            {/* Theme Toggle */}
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
        </div>
      </header>

      {/* ═══════════ MAIN CONTAINER ═══════════ */}
      <main className="lgn-main-wrapper">
        {/* Mobile Tab Switcher (Visible only on small screens) */}
        <div className="lgn-mobile-toggle-bar">
          <button
            type="button"
            className={`lgn-mobile-toggle-btn ${!isSignUp ? 'active' : ''}`}
            onClick={() => setIsSignUp(false)}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`lgn-mobile-toggle-btn ${isSignUp ? 'active' : ''}`}
            onClick={() => setIsSignUp(true)}
          >
            Sign Up
          </button>
        </div>

        {/* Rate Limit Notice Banner */}
        {rateLimitWarning && (
          <motion.div
            className="lgn-rate-limit-banner"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="lgn-rate-limit-header">
              <strong>⚠️ Supabase Email Rate Limit (Free Tier)</strong>
              <button
                type="button"
                onClick={() => setRateLimitWarning(false)}
                className="lgn-banner-close"
              >
                ✕
              </button>
            </div>
            <p>Supabase limits confirmation emails to 3-4 per hour on free tier.</p>
            <div className="lgn-rate-limit-box">
              <strong>💡 Instant Fix in 10 seconds:</strong>
              <ol>
                <li>Open <strong>Supabase Dashboard</strong></li>
                <li>Go to <strong>Authentication</strong> → <strong>Providers</strong> → <strong>Email</strong></li>
                <li>Toggle <strong>OFF</strong> <em>"Confirm email"</em> & click <strong>Save</strong></li>
              </ol>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setRateLimitWarning(false);
              }}
              className="lgn-rate-limit-btn"
            >
              Sign In With Existing Account →
            </button>
          </motion.div>
        )}

        {/* ═══════════ SLIDING DOUBLE CONTAINER ═══════════ */}
        <div className={`lgn-slider-container ${isSignUp ? 'active' : ''}`} id="lgn-container">
          
          {/* ─── Sign Up Form Panel (Left in DOM, animated on active) ─── */}
          <div className="lgn-form-container lgn-sign-up">
            <form onSubmit={handleSignUpSubmit} className="lgn-panel-form">
              <h1 className="lgn-form-title">Create Account</h1>

              {/* Social Login Icons */}
              <div className="lgn-social-icons">
                <button
                  type="button"
                  className="lgn-icon-circle"
                  onClick={() => handleGoogleLogin(true)}
                  title="Sign up with Google"
                >
                  <svg viewBox="0 0 24 24" className="lgn-icon-svg">
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
                </button>
                <button
                  type="button"
                  className="lgn-icon-circle"
                  onClick={() => showToast('Facebook signup coming soon! Use Google or email.', 'error', 3500)}
                  title="Sign up with Facebook"
                >
                  <svg viewBox="0 0 24 24" fill="#1877F2" className="lgn-icon-svg">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="lgn-icon-circle"
                  onClick={() => showToast('Apple signup coming soon! Use Google or email.', 'error', 3500)}
                  title="Sign up with Apple"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="lgn-icon-svg">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.66-.8 1.11-1.92.99-3.04-1 .04-2.16.67-2.82 1.44-.58.67-1.1 1.77-.96 2.87 1.12.09 2.13-.47 2.79-1.27z" />
                  </svg>
                </button>
              </div>

              <span className="lgn-subtext">or use your email for registration</span>

              {/* Role Selection Chips */}
              <div className="lgn-role-pill-group">
                <button
                  type="button"
                  className={`lgn-role-pill ${role === 'donor' ? 'active' : ''}`}
                  onClick={() => setRole('donor')}
                >
                  <span className="lgn-pill-icon">🍲</span>
                  <span>Food Donor</span>
                </button>
                <button
                  type="button"
                  className={`lgn-role-pill ${role === 'receiver' ? 'active' : ''}`}
                  onClick={() => setRole('receiver')}
                >
                  <span className="lgn-pill-icon">🤝</span>
                  <span>NGO / Receiver</span>
                </button>
              </div>

              {/* Inputs */}
              <div className="lgn-field-wrap">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Full Name"
                  required
                  className="lgn-slider-input"
                />
              </div>

              <div className="lgn-field-wrap">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email Address"
                  required
                  className="lgn-slider-input"
                />
              </div>

              <div className="lgn-field-wrap">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Phone Number (Optional)"
                  className="lgn-slider-input"
                />
              </div>

              <div className="lgn-field-wrap lgn-pwd-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Password (min. 6 chars)"
                  required
                  className="lgn-slider-input"
                />
                <button
                  type="button"
                  className="lgn-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>

              <div className="lgn-field-wrap lgn-pwd-field">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm Password"
                  required
                  className="lgn-slider-input"
                />
                <button
                  type="button"
                  className="lgn-eye-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>

              {/* Choose Avatar Section */}
              <div className="lgn-avatar-picker-wrap">
                <div className="lgn-avatar-header">
                  <span className="lgn-avatar-title">Choose Avatar:</span>
                  {selectedAvatarObj && (
                    <span className="lgn-avatar-active-tag">
                      <strong>{selectedAvatarObj.label}</strong> • {selectedAvatarObj.role}
                    </span>
                  )}
                </div>
                <div className="lgn-avatar-grid">
                  {BUILT_IN_AVATARS.map((avatar) => {
                    const isSelected = selectedAvatar === avatar.id;
                    return (
                      <button
                        key={avatar.id}
                        type="button"
                        className={`lgn-avatar-item ${isSelected ? 'active' : ''}`}
                        onClick={() => setSelectedAvatar(avatar.id)}
                        title={`${avatar.label} - ${avatar.role} (${avatar.desc})`}
                        aria-label={`Select avatar ${avatar.label}`}
                      >
                        <img
                          src={avatar.src}
                          alt={avatar.label}
                          className="lgn-avatar-thumb"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'flex';
                            }
                          }}
                        />
                        <div className="lgn-avatar-fallback" style={{ display: 'none', backgroundColor: avatar.bg, color: avatar.color }}>
                          {avatar.label.slice(0, 2).toUpperCase()}
                        </div>
                        {isSelected && (
                          <div className="lgn-avatar-check-badge">
                            <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Terms Checkbox */}
              <label className="lgn-terms-row">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="lgn-checkbox"
                />
                <span>
                  I agree to the{' '}
                  <button type="button" className="lgn-inline-link" onClick={() => handleNav('contact')}>
                    Terms
                  </button>{' '}
                  &{' '}
                  <button type="button" className="lgn-inline-link" onClick={() => handleNav('contact')}>
                    Privacy Policy
                  </button>
                </span>
              </label>

              {/* Sign Up Submit Button */}
              <button
                type="submit"
                className="lgn-btn-primary"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>

              {/* Mobile quick link to sign in */}
              <p className="lgn-mobile-switch-text">
                Already have an account?{' '}
                <button type="button" className="lgn-mobile-link" onClick={() => setIsSignUp(false)}>
                  Sign In
                </button>
              </p>
            </form>
          </div>

          {/* ─── Sign In Form Panel (Right in DOM, default active) ─── */}
          <div className="lgn-form-container lgn-sign-in">
            <form onSubmit={handleSignInSubmit} className="lgn-panel-form">
              <h1 className="lgn-form-title">Sign In</h1>

              {/* Social Login Icons */}
              <div className="lgn-social-icons">
                <button
                  type="button"
                  className="lgn-icon-circle"
                  onClick={() => handleGoogleLogin(false)}
                  title="Sign in with Google"
                >
                  <svg viewBox="0 0 24 24" className="lgn-icon-svg">
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
                </button>
                <button
                  type="button"
                  className="lgn-icon-circle"
                  onClick={() => showToast('Facebook login coming soon! Use Google or email.', 'error', 3500)}
                  title="Sign in with Facebook"
                >
                  <svg viewBox="0 0 24 24" fill="#1877F2" className="lgn-icon-svg">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="lgn-icon-circle"
                  onClick={() => showToast('Apple login coming soon! Use Google or email.', 'error', 3500)}
                  title="Sign in with Apple"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="lgn-icon-svg">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.66-.8 1.11-1.92.99-3.04-1 .04-2.16.67-2.82 1.44-.58.67-1.1 1.77-.96 2.87 1.12.09 2.13-.47 2.79-1.27z" />
                  </svg>
                </button>
              </div>

              <span className="lgn-subtext">or use your email password</span>

              {/* Inputs */}
              <div className="lgn-field-wrap">
                <input
                  type="email"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleInputChange}
                  placeholder="Email Address"
                  required
                  className="lgn-slider-input"
                  autoComplete="email"
                />
              </div>

              <div className="lgn-field-wrap lgn-pwd-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Password"
                  required
                  className="lgn-slider-input"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="lgn-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>

              {/* Forgot Password Link */}
              <button
                type="button"
                className="lgn-forgot-link"
                onClick={() => handleNav('forgot-password')}
              >
                Forgot Your Password?
              </button>

              {/* Sign In Submit Button */}
              <button
                type="submit"
                className="lgn-btn-primary"
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>

              {/* Mobile quick link to sign up */}
              <p className="lgn-mobile-switch-text">
                Don&apos;t have an account?{' '}
                <button type="button" className="lgn-mobile-link" onClick={() => setIsSignUp(true)}>
                  Sign Up
                </button>
              </p>
            </form>
          </div>

          {/* ═══════════ SLIDING TOGGLE OVERLAY ═══════════ */}
          <div className="lgn-toggle-container">
            <div className="lgn-toggle">
              {/* Left Panel (Shown when on Sign Up mode -> invites to Sign In) */}
              <div className="lgn-toggle-panel lgn-toggle-left">
                <div className="lgn-toggle-brand-icon">
                  <svg viewBox="0 0 48 48" fill="none">
                    <path d="M24 6 C21 10 21 15 24 18 C27 15 27 10 24 6 Z" fill="#ffffff" />
                    <path d="M17 10 C14 12 14 16 18 18 C19 15 18 12 17 10 Z" fill="#ffffff" />
                    <path d="M31 10 C34 12 34 16 30 18 C29 15 30 12 31 10 Z" fill="#ffffff" />
                    <path d="M12 28 Q 24 16 36 28" stroke="#ffffff" strokeWidth="2.8" fill="none" />
                    <line x1="18" y1="21" x2="18" y2="28" stroke="#ffffff" strokeWidth="2.2" />
                    <line x1="24" y1="19" x2="24" y2="28" stroke="#ffffff" strokeWidth="2.2" />
                    <line x1="30" y1="21" x2="30" y2="28" stroke="#ffffff" strokeWidth="2.2" />
                    <path d="M10 30 C14 42 34 42 38 30" stroke="#ffffff" strokeWidth="2.8" fill="none" />
                  </svg>
                </div>
                <h1 className="lgn-toggle-title">Welcome Back!</h1>
                <p className="lgn-toggle-desc">
                  Already have an account? Sign in to continue sharing food, tracking donations, and making an impact.
                </p>
                <button
                  type="button"
                  className="lgn-btn-ghost"
                  id="login"
                  onClick={() => setIsSignUp(false)}
                >
                  Sign In
                </button>
              </div>

              {/* Right Panel (Shown when on Sign In mode -> invites to Sign Up) */}
              <div className="lgn-toggle-panel lgn-toggle-right">
                <div className="lgn-toggle-brand-icon">
                  <svg viewBox="0 0 48 48" fill="none">
                    <path d="M24 6 C21 10 21 15 24 18 C27 15 27 10 24 6 Z" fill="#ffffff" />
                    <path d="M17 10 C14 12 14 16 18 18 C19 15 18 12 17 10 Z" fill="#ffffff" />
                    <path d="M31 10 C34 12 34 16 30 18 C29 15 30 12 31 10 Z" fill="#ffffff" />
                    <path d="M12 28 Q 24 16 36 28" stroke="#ffffff" strokeWidth="2.8" fill="none" />
                    <line x1="18" y1="21" x2="18" y2="28" stroke="#ffffff" strokeWidth="2.2" />
                    <line x1="24" y1="19" x2="24" y2="28" stroke="#ffffff" strokeWidth="2.2" />
                    <line x1="30" y1="21" x2="30" y2="28" stroke="#ffffff" strokeWidth="2.2" />
                    <path d="M10 30 C14 42 34 42 38 30" stroke="#ffffff" strokeWidth="2.8" fill="none" />
                  </svg>
                </div>
                <h1 className="lgn-toggle-title">Hello, Friend!</h1>
                <p className="lgn-toggle-desc">
                  Register your details to start donating surplus food or receive assistance for those in need.
                </p>
                <button
                  type="button"
                  className="lgn-btn-ghost"
                  id="register"
                  onClick={() => setIsSignUp(true)}
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Toast Notifications ─── */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              className={`lgn-modern-toast ${toastType}`}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
            >
              {toastType === 'error' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="lgn-toast-svg">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="lgn-toast-svg">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              )}
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
