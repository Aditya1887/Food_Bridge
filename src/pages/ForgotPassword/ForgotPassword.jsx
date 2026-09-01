import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../components/ThemeContext';
import { supabase } from '../../lib/supabase';
import SoftAurora from '../../components/SoftAurora/SoftAurora';
import './ForgotPassword.css';

/* ── Ambient floating leaves ── */
const LEAVES = [
  { id: 1, x: '4%',  y: '18%', rot: -20, size: 34, delay: 0 },
  { id: 2, x: '24%', y: '8%',  rot:  15, size: 28, delay: 0.8 },
  { id: 3, x: '86%', y: '68%', rot:  25, size: 36, delay: 1.2 },
  { id: 4, x: '92%', y: '22%', rot: -15, size: 40, delay: 0.6 },
];

function FloatingLeaf({ x, y, rot, size, delay }) {
  return (
    <motion.div
      className="fp-leaf"
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

export default function ForgotPassword({ onNavigate }) {
  const { isDark, toggleTheme } = useTheme();

  // Mode: 'request' (send email) | 'update' (set new password)
  const [mode, setMode] = useState('request');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [linkError, setLinkError] = useState('');

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success' | 'error'

  const showToast = (message, type = 'success', duration = 5000) => {
    setToastMessage(message);
    setToastType(type);
    if (duration > 0) {
      setTimeout(() => {
        setToastMessage('');
      }, duration);
    }
  };

  // Inspect URL parameters and Hash for Supabase Recovery tokens or Errors
  useEffect(() => {
    const rawHash = window.location.hash || '';
    const rawSearch = window.location.search || '';
    const fullParams = (rawHash.startsWith('#') ? rawHash.slice(1) : rawHash) + '&' + (rawSearch.startsWith('?') ? rawSearch.slice(1) : rawSearch);
    const params = new URLSearchParams(fullParams);

    const errorCode = params.get('error_code');
    const errorDesc = params.get('error_description');
    const error = params.get('error');
    const type = params.get('type');
    const accessToken = params.get('access_token');

    // 1. Check for expired or invalid OTP error from Supabase
    if (errorCode === 'otp_expired' || error === 'access_denied' || errorDesc) {
      const decodedDesc = errorDesc ? decodeURIComponent(errorDesc.replace(/\+/g, ' ')) : 'Email link is invalid or has expired.';
      setLinkError(decodedDesc);
      setMode('request');
      showToast('The reset link has expired or was already used. Request a new link below.', 'error', 7000);
      return;
    }

    // 2. Check for active recovery session in URL
    if (type === 'recovery' || accessToken || rawHash.includes('reset-password')) {
      setMode('update');
      setLinkError('');
    }
  }, []);

  // Listen to Supabase Auth state changes for PASSWORD_RECOVERY event
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('update');
        setLinkError('');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleNav = (route) => {
    if (onNavigate) {
      onNavigate(route);
    }
    window.location.hash = `#${route}`;
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  /* ── Send Password Reset Email ── */
  const handleRequestSubmit = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      showToast('Please enter your email address.', 'error', 4000);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      showToast('Please enter a valid email address.', 'error', 4000);
      return;
    }

    setLoading(true);
    setToastMessage('');
    setLinkError('');

    try {
      // Use clean origin URL for Supabase recovery redirect
      const redirectUrl = `${window.location.origin}/#reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      setSubmitted(true);
      setResendCooldown(60);
      showToast('Password reset link sent! Please check your email inbox.', 'success', 6000);
    } catch (err) {
      const errMsg = err.message || 'Failed to send password reset email.';
      showToast(errMsg, 'error', 5000);
    } finally {
      setLoading(false);
    }
  };

  /* ── Update New Password ── */
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!newPassword) {
      showToast('Please enter a new password.', 'error', 4000);
      return;
    }

    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error', 4000);
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match. Please verify again.', 'error', 4000);
      return;
    }

    setLoading(true);
    setToastMessage('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      showToast('Password updated successfully! Redirecting to login...', 'success', 4000);
      setTimeout(() => {
        handleNav('login');
      }, 1500);
    } catch (err) {
      showToast(err.message || 'Failed to update password.', 'error', 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fp-page ${isDark ? 'dark-mode' : ''}`}>
      {/* ── Dynamic WebGL Soft Aurora Background ── */}
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

      {/* ═══════════ TOP HEADER ═══════════ */}
      <header className="fp-header">
        <div className="fp-header-inner">
          {/* Brand Logo */}
          <button className="fp-brand" onClick={() => handleNav('home')}>
            <svg className="fp-logo-svg" viewBox="0 0 48 48" fill="none">
              <path d="M24 6 C21 10 21 15 24 18 C27 15 27 10 24 6 Z" fill="#16a34a" />
              <path d="M17 10 C14 12 14 16 18 18 C19 15 18 12 17 10 Z" fill="#16a34a" />
              <path d="M31 10 C34 12 34 16 30 18 C29 15 30 12 31 10 Z" fill="#16a34a" />
              <path d="M12 28 Q 24 16 36 28" stroke="#16a34a" strokeWidth="2.8" fill="none" />
              <line x1="18" y1="21" x2="18" y2="28" stroke="#16a34a" strokeWidth="2.2" />
              <line x1="24" y1="19" x2="24" y2="28" stroke="#16a34a" strokeWidth="2.2" />
              <line x1="30" y1="21" x2="30" y2="28" stroke="#16a34a" strokeWidth="2.2" />
              <path d="M10 30 C14 42 34 42 38 30" stroke="#16a34a" strokeWidth="2.8" fill="none" />
            </svg>
            <div className="fp-brand-text">
              <span className="fp-brand-name">FoodBridge</span>
              <span className="fp-brand-tag">Share Food. Share Hope.</span>
            </div>
          </button>

          {/* Header Actions */}
          <div className="fp-header-actions">
            <button className="fp-btn-link" onClick={() => handleNav('login')}>
              ← Back to Sign In
            </button>

            {/* Theme Toggle */}
            <motion.button
              className="fp-btn-theme"
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

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <main className="fp-main-wrapper">
        <motion.div
          className="fp-card"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Link Expired Alert Banner */}
          {linkError && (
            <div className="fp-error-banner">
              <div className="fp-error-banner-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="fp-error-banner-svg">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <strong>Reset Link Expired or Invalid</strong>
              </div>
              <p className="fp-error-banner-desc">
                {linkError}. Supabase recovery links are single-use and expire for security. Please request a fresh link below.
              </p>
            </div>
          )}

          {/* Top Badge Icon */}
          <div className="fp-badge-icon-wrap">
            {mode === 'update' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="fp-badge-svg">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            ) : submitted ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="fp-badge-svg fp-badge-success">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="fp-badge-svg">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            )}
          </div>

          {/* Mode 1: Request Email Reset */}
          {mode === 'request' && !submitted && (
            <>
              <h1 className="fp-card-title">Forgot Password?</h1>
              <p className="fp-card-subtitle">
                No worries! Enter the email associated with your FoodBridge account, and we&apos;ll send you a link to reset your password.
              </p>

              <form onSubmit={handleRequestSubmit} className="fp-form">
                <div className="fp-field-wrap">
                  <div className="fp-input-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    required
                    className="fp-input"
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="fp-btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Sending link...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}

          {/* Mode 1 Submitted: Check Email Screen */}
          {mode === 'request' && submitted && (
            <>
              <h1 className="fp-card-title">Check Your Email</h1>
              <p className="fp-card-subtitle">
                We have sent a secure password reset link to:
              </p>
              <div className="fp-email-badge">{email}</div>
              <p className="fp-instructions-text">
                Click the link in the email to set a new password. If you don&apos;t see it in a few minutes, please check your spam folder.
              </p>

              <div className="fp-resend-wrap">
                {resendCooldown > 0 ? (
                  <span className="fp-resend-countdown">
                    Resend link in <strong>{resendCooldown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="fp-btn-resend"
                    onClick={() => handleRequestSubmit()}
                    disabled={loading}
                  >
                    {loading ? 'Resending...' : 'Didn&apos;t receive email? Resend'}
                  </button>
                )}
              </div>
            </>
          )}

          {/* Mode 2: Set New Password */}
          {mode === 'update' && (
            <>
              <h1 className="fp-card-title">Set New Password</h1>
              <p className="fp-card-subtitle">
                Create a strong password for your FoodBridge account (at least 6 characters).
              </p>

              <form onSubmit={handleUpdateSubmit} className="fp-form">
                <div className="fp-field-wrap">
                  <div className="fp-input-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password (min. 6 chars)"
                    required
                    className="fp-input"
                    autoComplete="new-password"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="fp-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>

                <div className="fp-field-wrap">
                  <div className="fp-input-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm New Password"
                    required
                    className="fp-input"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="fp-eye-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>

                <button
                  type="submit"
                  className="fp-btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Updating Password...' : 'Save New Password'}
                </button>
              </form>
            </>
          )}

          {/* Card Footer Link */}
          <div className="fp-card-footer">
            <button
              type="button"
              className="fp-footer-link"
              onClick={() => handleNav('login')}
            >
              ← Back to Sign In
            </button>
          </div>
        </motion.div>

        {/* ─── Toast Notifications ─── */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              className={`fp-modern-toast ${toastType}`}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
            >
              {toastType === 'error' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="fp-toast-svg">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="fp-toast-svg">
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
