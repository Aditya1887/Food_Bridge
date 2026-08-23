import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './AnimatedTooltip.css';

export default function AnimatedTooltip({
  children,
  content,
  position = 'top', // 'top', 'bottom', 'left', 'right'
  className = '',
}) {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionVariants = () => {
    switch (position) {
      case 'bottom':
        return {
          initial: { opacity: 0, y: -6, scale: 0.94 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: -6, scale: 0.94 },
        };
      case 'left':
        return {
          initial: { opacity: 0, x: 6, scale: 0.94 },
          animate: { opacity: 1, x: 0, scale: 1 },
          exit: { opacity: 0, x: 6, scale: 0.94 },
        };
      case 'right':
        return {
          initial: { opacity: 0, x: -6, scale: 0.94 },
          animate: { opacity: 1, x: 0, scale: 1 },
          exit: { opacity: 0, x: -6, scale: 0.94 },
        };
      default: // 'top'
        return {
          initial: { opacity: 0, y: 6, scale: 0.94 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: 6, scale: 0.94 },
        };
    }
  };

  const variants = getPositionVariants();

  return (
    <div
      className={`animated-tooltip-wrapper ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className={`animated-tooltip-box tooltip-${position}`}
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          >
            {content}
            <div className={`tooltip-arrow arrow-${position}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
