import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import './ScrollReveal.css';

export default function ScrollReveal({
  children,
  animation = 'fade-up', // 'fade-up', 'fade-down', 'fade-left', 'fade-right', 'zoom-in', 'blur-in'
  duration = 0.65,
  delay = 0,
  distance = 35,
  amount = 0.15,
  once = true,
  className = '',
  style = {},
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount });

  const getVariants = () => {
    switch (animation) {
      case 'fade-up':
        return {
          hidden: { opacity: 0, y: distance },
          visible: { opacity: 1, y: 0 },
        };
      case 'fade-down':
        return {
          hidden: { opacity: 0, y: -distance },
          visible: { opacity: 1, y: 0 },
        };
      case 'fade-left':
        return {
          hidden: { opacity: 0, x: distance },
          visible: { opacity: 1, x: 0 },
        };
      case 'fade-right':
        return {
          hidden: { opacity: 0, x: -distance },
          visible: { opacity: 1, x: 0 },
        };
      case 'zoom-in':
        return {
          hidden: { opacity: 0, scale: 0.88 },
          visible: { opacity: 1, scale: 1 },
        };
      case 'blur-in':
        return {
          hidden: { opacity: 0, filter: 'blur(12px)', y: 20 },
          visible: { opacity: 1, filter: 'blur(0px)', y: 0 },
        };
      default:
        return {
          hidden: { opacity: 0, y: distance },
          visible: { opacity: 1, y: 0 },
        };
    }
  };

  const variants = getVariants();

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`scroll-reveal-box ${className}`}
      style={style}
    >
      {children}
    </motion.div>
  );
}
