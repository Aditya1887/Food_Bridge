import { motion } from 'framer-motion';
import { GradientText } from '../AnimatedUI';
import './Footer.css';

const navLinks = [
  { label: 'About', href: '#about-us' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Donate', href: '#login' },
  { label: 'Find Food', href: '#food-listings' },
  { label: 'Impact', href: '#impact' },
  { label: 'Contact', href: '#contact' },
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
];

export default function Footer({ onNavigate }) {
  const scrollToTop = (e) => {
    if (e) e.preventDefault();
    const hero = document.getElementById('heroSection');
    if (hero) {
      hero.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    document.body.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const handleLinkClick = (link, e) => {
    e.preventDefault();
    if (!onNavigate) return;
    if (link.label === 'How It Works') onNavigate('how-it-works');
    else if (link.label === 'About') onNavigate('about-us');
    else if (link.label === 'Impact') onNavigate('impact');
    else if (link.label === 'Contact') onNavigate('contact');
    else if (link.label === 'Home') onNavigate('home');
    else if (link.label === 'Donate') onNavigate('login');
    else if (link.label === 'Find Food') onNavigate('food-listings');
    else if (link.label === 'Privacy' || link.label === 'Terms') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="app-footer">
      <div className="footer-container">
        {/* Top Footer Row */}
        <div className="footer-main-row">
          {/* Brand Col */}
          <div className="footer-brand">
            <a
              href="#"
              className="footer-logo"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) onNavigate('home');
              }}
            >
              <span className="logo-dark">Food</span>
              <span className="logo-green">Bridge</span>
            </a>
            <p className="footer-tagline">
              Reduce Waste. Share Food. Create Impact.
            </p>
          </div>

          {/* Quick Links Nav */}
          <div className="footer-nav">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="footer-link"
                onClick={(e) => handleLinkClick(link, e)}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="footer-divider" />

        {/* Bottom Bar Row */}
        <div className="footer-bottom-row">
          <p className="copyright-text">
            © {new Date().getFullYear()} FoodBridge. All rights reserved. Building zero-waste communities.
          </p>

          <motion.button
            className="back-to-top-btn"
            onClick={scrollToTop}
            aria-label="Back to Top"
            whileHover={{ y: -4, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>Back to Top</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </motion.button>
        </div>
      </div>
    </footer>
  );
}
