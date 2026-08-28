import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { SplitText, ShinyText, FloatingGradient } from '../AnimatedUI';
import './CtaSection.css';

export default function CtaSection({ onNavigate }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const { user, role } = useAuth();

  const handleClick = (page, e) => {
    if (e) e.preventDefault();
    if (!onNavigate) return;

    if (page === 'donate') {
      if (user) {
        onNavigate(role === 'receiver' ? 'receiver-dashboard' : 'donor-dashboard');
      } else {
        onNavigate('login');
      }
    } else {
      onNavigate(page);
    }
  };

  return (
    <section className="cta-section" ref={ref}>
      <motion.div
        className="cta-card"
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Floating Gradient Background with Soft Blurred Color Blobs */}
        <FloatingGradient
          className="cta-floating-gradient"
          interactive={true}
          colors={{
            blob1: 'rgba(34, 197, 94, 0.45)',    // Emerald green
            blob2: 'rgba(16, 185, 129, 0.40)',   // Mint green
            blob3: 'rgba(52, 219, 118, 0.35)',   // Fresh spring green
            blob4: 'rgba(245, 158, 11, 0.22)',   // Warm sunlight
            blob5: 'rgba(20, 184, 166, 0.30)',   // Teal radiance
          }}
        >
          {/* Content */}
          <div className="cta-content">
            <motion.span
              className="cta-tag"
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <ShinyText text="TAKE ACTION TODAY" speed={4} shimmerColor="rgba(255,255,255,0.9)" />
            </motion.span>

            <h2 className="cta-title">
              <SplitText
                text="Have food to share? Need food to distribute?"
                delay={35}
                splitBy="words"
              />
            </h2>

            <motion.p
              className="cta-subtitle"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              FoodBridge connects both sides to eliminate hunger and zero waste.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              className="cta-buttons"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <motion.a
                href="#donate"
                className="cta-btn-primary"
                whileHover={{ y: -3, scale: 1.03, boxShadow: '0 16px 36px rgba(34,197,94,0.4)' }}
                whileTap={{ scale: 0.97 }}
                onClick={(e) => handleClick('donate', e)}
              >
                <span>Donate Food</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </motion.a>

              <motion.a
                href="#food-listings"
                className="cta-btn-secondary"
                whileHover={{ y: -3, scale: 1.03, boxShadow: '0 16px 36px rgba(0,0,0,0.12)' }}
                whileTap={{ scale: 0.97 }}
                onClick={(e) => handleClick('food-listings', e)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21S4 14.5 4 9.5a8 8 0 1 1 16 0C20 14.5 12 21 12 21z" />
                  <circle cx="12" cy="9.5" r="2.5" />
                </svg>
                <span>Find Food</span>
              </motion.a>
            </motion.div>
          </div>
        </FloatingGradient>
      </motion.div>
    </section>
  );
}
