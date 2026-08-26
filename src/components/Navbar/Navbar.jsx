import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getAvatarUrl, getUserInitials } from '../../services/avatarService';
import { ShinyText } from '../AnimatedUI';
import './Navbar.css';

const navLinks = [
  { label: 'Home', href: '#' },
  { label: 'Donate', href: '#' },
  { label: 'Find Food', href: '#' },
  { label: 'Impact', href: '#impact' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About', href: '#about-us' },
];

export default function Navbar({ onNavigate }) {
  const { isDark, toggleTheme } = useTheme();
  const { user, role, profile } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const avatarUrl = getAvatarUrl(profile, user);
  const initials = getUserInitials(profile, user);
  const displayName = profile?.full_name || user?.user_metadata?.full_name || '';

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (link, i, e) => {
    e.preventDefault();
    setActiveIndex(i);
    if (!onNavigate) return;
    if (link.label === 'How It Works') onNavigate('how-it-works');
    else if (link.label === 'About' || link.label === 'About Us') onNavigate('about-us');
    else if (link.label === 'Impact') onNavigate('impact');
    else if (link.label === 'Contact') onNavigate('contact');
    else if (link.label === 'Find Food' || link.label === 'Food Listings') onNavigate('food-listings');
    else if (link.label === 'Donate') {
      if (user) {
        onNavigate(role === 'receiver' ? 'receiver-dashboard' : 'donor-dashboard');
      } else {
        onNavigate('login');
      }
    }
    else if (link.label === 'Home') onNavigate('home');
  };

  return (
    <motion.header
      className={`navbar-header ${isScrolled ? 'scrolled' : ''}`}
      initial={{ y: -90, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="nav-container">
        {/* ─── Brand Logo ─── */}
        <a
          href="#"
          className="brand-logo"
          onClick={(e) => {
            e.preventDefault();
            if (onNavigate) onNavigate('home');
          }}
        >
          <motion.div
            className="logo-icon"
            whileHover={{ rotate: 15, scale: 1.12 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <svg className="logo-svg" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M24 6 C21 10 21 15 24 18 C27 15 27 10 24 6 Z" fill="currentColor" stroke="none"/>
              <path d="M17 10 C14 12 14 16 18 18 C19 15 18 12 17 10 Z" fill="currentColor" stroke="none"/>
              <path d="M31 10 C34 12 34 16 30 18 C29 15 30 12 31 10 Z" fill="currentColor" stroke="none"/>
              <path d="M12 28 Q 24 16 36 28" strokeWidth="2.8" fill="none"/>
              <line x1="18" y1="21" x2="18" y2="28" strokeWidth="2.2"/>
              <line x1="24" y1="19" x2="24" y2="28" strokeWidth="2.2"/>
              <line x1="30" y1="21" x2="30" y2="28" strokeWidth="2.2"/>
              <path d="M10 30 C14 42 34 42 38 30" strokeWidth="2.8" fill="none"/>
              <path d="M24 37 L22.5 35.5 C20.5 33.5 20.5 31.5 22.5 30 C23.5 29 25.5 29 26.5 30 L24 32.5 L22.5 30" fill="currentColor" stroke="none"/>
            </svg>
          </motion.div>
          <div className="logo-text">
            <span className="logo-title">
              <span className="logo-dark">Food</span>
              <span className="logo-green">Bridge</span>
            </span>
            <span className="logo-tagline">
              <ShinyText text="Share Food. Share Hope." speed={5} shimmerColor="rgba(38,186,100,0.9)" />
            </span>
          </div>
        </a>

        {/* ─── Nav Links ─── */}
        <nav
          className="nav-links"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {navLinks.map((link, i) => (
            <motion.a
              key={link.label}
              href={link.href}
              className={`nav-item ${i === activeIndex ? 'active' : ''}`}
              onClick={(e) => handleLinkClick(link, i, e)}
              onMouseEnter={() => setHoveredIndex(i)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
            >
              {/* Sliding Pill on Hover */}
              {hoveredIndex === i && (
                <motion.span
                  className="nav-hover-pill"
                  layoutId="navHoverPill"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                />
              )}
              <span className="nav-label-text">{link.label}</span>
              {i === activeIndex && (
                <motion.span
                  className="active-dot"
                  layoutId="navActiveDot"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </motion.a>
          ))}
        </nav>

        {/* ─── Right Actions ─── */}
        <div className="nav-actions">
          {/* Theme Toggle */}
          <motion.button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            whileHover={{ scale: 1.12, rotate: 15 }}
            whileTap={{ scale: 0.9, rotate: 180 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isDark ? (
                <motion.svg
                  key="moon"
                  className="theme-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.25 }}
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </motion.svg>
              ) : (
                <motion.svg
                  key="sun"
                  className="theme-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.25 }}
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M18.36 5.64l1.41-1.41" />
                </motion.svg>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Login or Dashboard Button */}
          {user ? (
            <motion.a
              href="#dashboard"
              className="btn-login"
              onClick={(e) => {
                e.preventDefault();
                const targetPage = role === 'receiver' ? 'receiver-dashboard' : 'donor-dashboard';
                if (onNavigate) onNavigate(targetPage);
                window.location.hash = `#${targetPage}`;
                window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
              }}
              whileHover={{ y: -2, boxShadow: '0 12px 25px rgba(13,50,29,0.25)' }}
              whileTap={{ scale: 0.97 }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1.5px solid rgba(255,255,255,0.3)',
                    marginRight: 4,
                  }}
                />
              ) : (
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#fff',
                    marginRight: 4,
                    letterSpacing: '0.02em',
                  }}
                >
                  {initials}
                </span>
              )}
              {displayName ? displayName.split(' ')[0] : 'Dashboard'}
            </motion.a>
          ) : (
            <motion.a
              href="#login"
              className="btn-login"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) onNavigate('login');
                window.location.hash = '#login';
                window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
              }}
              whileHover={{ y: -2, boxShadow: '0 12px 25px rgba(13,50,29,0.25)' }}
              whileTap={{ scale: 0.97 }}
            >
              <svg className="user-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Login / Sign Up
            </motion.a>
          )}
        </div>
      </div>
    </motion.header>
  );
}
