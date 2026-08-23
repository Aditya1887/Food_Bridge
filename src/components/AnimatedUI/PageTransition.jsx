import React from 'react';
import { motion } from 'framer-motion';
import './PageTransition.css';

export default function PageTransition({
  children,
  pageKey,
  mode = 'fade', // 'fade', 'slide', 'scale'
}) {
  const getVariants = () => {
    switch (mode) {
      case 'slide':
        return {
          initial: { opacity: 0, x: 20, filter: 'blur(4px)' },
          animate: { opacity: 1, x: 0, filter: 'blur(0px)' },
        };
      case 'scale':
        return {
          initial: { opacity: 0, scale: 0.96, filter: 'blur(6px)' },
          animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
        };
      default: // 'fade'
        return {
          initial: { opacity: 0, y: 14, filter: 'blur(4px)' },
          animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
        };
    }
  };

  const variants = getVariants();

  return (
    <motion.div
      key={pageKey}
      initial={variants.initial}
      animate={variants.animate}
      transition={{
        duration: 0.38,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="page-transition-wrapper"
    >
      {children}
    </motion.div>
  );
}
