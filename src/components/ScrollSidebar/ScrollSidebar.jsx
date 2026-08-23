import { motion } from 'framer-motion';
import './ScrollSidebar.css';

export default function ScrollSidebar() {
  const handleScroll = () => {
    window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
  };

  return (
    <motion.div
      className="scroll-sidebar"
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="scroll-text">SCROLL</span>
      <div className="scroll-line" />
      <motion.button
        className="scroll-arrow-btn"
        onClick={handleScroll}
        aria-label="Scroll down"
        whileHover={{ scale: 1.1, borderColor: '#34db76' }}
        whileTap={{ scale: 0.92 }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" />
        </svg>
      </motion.button>
    </motion.div>
  );
}
