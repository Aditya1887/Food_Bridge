import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { SplitText, GradientText, BlurText } from '../AnimatedUI';
import './HeroContent.css';

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const buttonContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.8,
    },
  },
};

const buttonVariants = {
  hidden: { scale: 0.85, opacity: 0, y: 15 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 22 },
  },
};

export default function HeroContent({ onNavigate }) {
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
    <motion.div
      className="hero-content"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <h1 className="hero-title">
        <span className="title-line">
          <SplitText
            text="Small actions."
            className="title-black"
            delay={40}
            animationFrom={{ opacity: 0, transform: 'translate3d(0, 30px, 0)' }}
            animationTo={{ opacity: 1, transform: 'translate3d(0, 0, 0)' }}
            easing="easeOutCubic"
            threshold={0.1}
            rootMargin="-50px"
          />
        </span>
        <span className="title-line">
          <SplitText
            text="Big change."
            className="title-black"
            delay={45}
            animationFrom={{ opacity: 0, transform: 'translate3d(0, 30px, 0)' }}
            animationTo={{ opacity: 1, transform: 'translate3d(0, 0, 0)' }}
            easing="easeOutCubic"
            threshold={0.1}
            rootMargin="-50px"
          />
        </span>
        <span className="title-line">
          <span className="title-green">
            <GradientText
              colors={['#126b2b', '#26ba64', '#10b981', '#34db76', '#126b2b']}
              animationSpeed={5}
              showBorder={false}
            >
              Zero waste.
            </GradientText>
            <motion.svg
              className="title-heart-icon"
              viewBox="0 0 48 48"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.6, type: 'spring', stiffness: 400, damping: 15 }}
            >
              <path
                d="M24 38 C15 30 6 22 6 13.5 C6 7.5 10.5 3 16.5 3 C20 3 23 5 24 7 C25 5 28 3 31.5 3 C37.5 3 42 7.5 42 13.5 C42 22 33 30 24 38 Z"
                fill="none"
              />
              <path d="M19 38 C21 41 26 43 30 40" strokeWidth="2.2" />
            </motion.svg>
          </span>
        </span>
      </h1>

      <div className="hero-subtitle">
        <BlurText
          text="Connecting surplus food with people in need for a better tomorrow."
          delay={25}
          animateBy="words"
          direction="bottom"
        />
      </div>

      <motion.div
        className="hero-cta-group"
        variants={buttonContainerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="cta-row top-row">
          <motion.a
            href="#donate"
            className="cta-btn btn-donate"
            variants={buttonVariants}
            whileHover={{ y: -3, boxShadow: '0 14px 30px rgba(8,46,26,0.3)' }}
            whileTap={{ scale: 0.97 }}
            onClick={(e) => handleClick('donate', e)}
          >
            <span className="btn-icon-wrapper badge-dark">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </span>
            <span className="btn-label">Donate Food</span>
            <svg className="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </motion.a>

          <motion.a
            href="#food-listings"
            className="cta-btn btn-find"
            variants={buttonVariants}
            whileHover={{ y: -3, boxShadow: '0 14px 30px rgba(0,0,0,0.1)' }}
            whileTap={{ scale: 0.97 }}
            onClick={(e) => handleClick('food-listings', e)}
          >
            <span className="btn-icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 21S4 14.5 4 9.5a8 8 0 1 1 16 0C20 14.5 12 21 12 21z" />
                <circle cx="12" cy="9.5" r="2.5" />
              </svg>
            </span>
            <span className="btn-label">Find Food Nearby</span>
            <svg className="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </motion.a>
        </div>

        <div className="cta-row bottom-row">
          <motion.a
            href="#about-us"
            className="cta-btn btn-involved"
            variants={buttonVariants}
            whileHover={{ y: -3, boxShadow: '0 14px 30px rgba(0,0,0,0.1)' }}
            whileTap={{ scale: 0.97 }}
            onClick={(e) => handleClick('about-us', e)}
          >
            <span className="btn-icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <span className="btn-label">Get Involved</span>
            <svg className="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </motion.a>
        </div>
      </motion.div>
    </motion.div>
  );
}
