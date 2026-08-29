import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../components/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import './PickupDrop.css';

export default function PickupDrop({ onNavigate }) {
  const { isDark } = useTheme();
  const { user } = useAuth();

  const [waitlistEmail, setWaitlistEmail] = useState(user?.email || '');
  const [waitlistRole, setWaitlistRole] = useState('donor');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;

    setLoading(true);
    try {
      // Save notification interest to contact_messages
      await supabase.from('contact_messages').insert([
        {
          name: user?.user_metadata?.full_name || 'Pickup & Drop Waitlist User',
          email: waitlistEmail.trim(),
          subject: `Waitlist: FoodBridge Pickup & Drop (${waitlistRole})`,
          message: `User signed up for early access notifications for FoodBridge Pickup & Drop logistics. Role: ${waitlistRole}`,
          user_id: user?.id || null,
        },
      ]);
    } catch (err) {
      console.warn('Waitlist submission notice:', err.message);
    } finally {
      setLoading(false);
      setSubmitted(true);
      setToastMessage('🎉 You are on the early access list! We will notify you when Pickup & Drop launches.');
      setTimeout(() => setToastMessage(''), 6000);
    }
  };

  const handleNav = (route) => {
    if (onNavigate) onNavigate(route);
    window.location.hash = `#${route}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`pickup-drop-page ${isDark ? 'dark-mode' : ''}`}>
      <Navbar onNavigate={onNavigate} />

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            className="pd-floating-toast"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pd-main-container">
        {/* ═══════════ HERO SECTION ═══════════ */}
        <section className="pd-hero-section">
          <motion.div
            className="pd-coming-soon-pill"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <span className="pd-pulse-dot" />
            <span>🚚 NEXT-GEN LOGISTICS • COMING SOON</span>
          </motion.div>

          <motion.h1
            className="pd-hero-headline"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            We Pick It Up. <br />
            <span className="pd-highlight-text">We Get It There.</span>
          </motion.h1>

          <motion.p
            className="pd-hero-subhead"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            FoodBridge is engineering a dedicated middleman delivery network. Soon, donors won't need to leave their kitchen and receivers won't need private transportation. Our verified delivery fleet will collect, secure, and deliver surplus meals door-to-door.
          </motion.p>

          {/* Waitlist Box */}
          <motion.div
            className="pd-waitlist-box"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {!submitted ? (
              <form onSubmit={handleWaitlistSubmit} className="pd-waitlist-form">
                <div className="pd-form-inputs-row">
                  <input
                    type="email"
                    placeholder="Enter your email for early access..."
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    required
                    className="pd-email-input"
                  />
                  <select
                    value={waitlistRole}
                    onChange={(e) => setWaitlistRole(e.target.value)}
                    className="pd-role-select"
                  >
                    <option value="donor">I am a Donor</option>
                    <option value="receiver">I am a Receiver / Shelter</option>
                    <option value="driver">I want to Drive / Volunteer</option>
                  </select>
                  <button type="submit" className="pd-btn-notify" disabled={loading}>
                    {loading ? 'Registering...' : 'Notify Me When Available'}
                  </button>
                </div>
                <p className="pd-waitlist-note">
                  🔒 Zero spam. Be the first to pilot automated pickup & drop routes in your city.
                </p>
              </form>
            ) : (
              <div className="pd-waitlist-success">
                <div className="pd-success-icon">✓</div>
                <h3>You're on the Priority Access List!</h3>
                <p>We'll send you an invitation when the pilot begins in your area.</p>
              </div>
            )}
          </motion.div>
        </section>

        {/* ═══════════ 3-PILLAR CONCEPT CARDS ═══════════ */}
        <section className="pd-pillars-section">
          <div className="pd-section-header">
            <h2 className="pd-section-title">The FoodBridge Delivery Network</h2>
            <p className="pd-section-desc">Solving the last-mile challenge in surplus food rescue</p>
          </div>

          <div className="pd-pillars-grid">
            <motion.div
              className="pd-pillar-card"
              whileHover={{ y: -6, boxShadow: '0 16px 32px rgba(22, 163, 74, 0.12)' }}
            >
              <div className="pd-pillar-icon-box">⚡</div>
              <h3 className="pd-pillar-title">Smart Route Dispatch</h3>
              <p className="pd-pillar-text">
                Intelligent algorithm matches surplus food batches with the nearest available volunteer driver or electric delivery vehicle, cutting transit time to under 45 minutes.
              </p>
              <ul className="pd-pillar-bullets">
                <li>✓ Live GPS navigation & tracking</li>
                <li>✓ Automated neighborhood clustering</li>
              </ul>
            </motion.div>

            <motion.div
              className="pd-pillar-card"
              whileHover={{ y: -6, boxShadow: '0 16px 32px rgba(22, 163, 74, 0.12)' }}
            >
              <div className="pd-pillar-icon-box">🌡️</div>
              <h3 className="pd-pillar-title">Temperature & Hygiene Shield</h3>
              <p className="pd-pillar-text">
                Certified thermal transport containers ensure hot meals remain piping hot and fresh produce or dairy products remain safely chilled until reaching the recipient.
              </p>
              <ul className="pd-pillar-bullets">
                <li>✓ Food-grade insulated storage</li>
                <li>✓ Seal integrity inspection on pickup</li>
              </ul>
            </motion.div>

            <motion.div
              className="pd-pillar-card"
              whileHover={{ y: -6, boxShadow: '0 16px 32px rgba(22, 163, 74, 0.12)' }}
            >
              <div className="pd-pillar-icon-box">🔐</div>
              <h3 className="pd-pillar-title">Secure Dual-OTP Handoff</h3>
              <p className="pd-pillar-text">
                End-to-end verification ensures food safety and transparency. Drivers verify food at pickup and recipients confirm delivery via dynamic digital OTPs.
              </p>
              <ul className="pd-pillar-bullets">
                <li>✓ Zero-loss delivery verification</li>
                <li>✓ Instant automated impact receipts</li>
              </ul>
            </motion.div>
          </div>
        </section>

        {/* ═══════════ HOW IT WILL WORK (3 STEPS) ═══════════ */}
        <section className="pd-how-it-works-section">
          <div className="pd-section-header">
            <h2 className="pd-section-title">How Pickup & Drop Will Work</h2>
            <p className="pd-section-desc">From donor prep to receiver delivery in three seamless steps</p>
          </div>

          <div className="pd-steps-row">
            <div className="pd-step-tile">
              <div className="pd-step-badge">1</div>
              <div className="pd-step-visual">🍲 ➔ 📦</div>
              <h4>Donor Selects Pickup & Drop</h4>
              <p>When posting surplus meals, simply choose the FoodBridge Pickup & Drop method and set your preferred pickup window.</p>
            </div>

            <div className="pd-step-arrow">➔</div>

            <div className="pd-step-tile">
              <div className="pd-step-badge">2</div>
              <div className="pd-step-visual">🚚 ➔ 📍</div>
              <h4>Driver Collects & Secures</h4>
              <p>A verified FoodBridge driver collects the sealed package from your kitchen door and validates safety standards.</p>
            </div>

            <div className="pd-step-arrow">➔</div>

            <div className="pd-step-tile">
              <div className="pd-step-badge">3</div>
              <div className="pd-step-visual">🤝 ➔ 💚</div>
              <h4>Direct Destination Drop</h4>
              <p>Food is transported directly to the community shelter or family, confirmed via OTP, and recorded in your Impact Certificate.</p>
            </div>
          </div>
        </section>

        {/* ═══════════ CURRENT FULFILLMENT CTA ═══════════ */}
        <section className="pd-current-cta-section">
          <div className="pd-current-cta-card">
            <div className="pd-cta-text">
              <h3>Start Sharing Food Today!</h3>
              <p>While our delivery fleet is being prepared, you can immediately use <strong>Receiver Pickup</strong> and <strong>Donor Delivery</strong> to rescue food right now.</p>
            </div>
            <div className="pd-cta-buttons">
              <button
                type="button"
                className="pd-btn-cta-primary"
                onClick={() => handleNav('donor-dashboard')}
              >
                Post Food Listing 🍲
              </button>
              <button
                type="button"
                className="pd-btn-cta-secondary"
                onClick={() => handleNav('food-listings')}
              >
                Browse Available Food 🔍
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
