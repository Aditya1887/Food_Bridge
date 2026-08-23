import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import './SplitText.css';

export default function SplitText({
  text = '',
  className = '',
  delay = 50,
  animationFrom = { opacity: 0, transform: 'translate3d(0, 35px, 0)' },
  animationTo = { opacity: 1, transform: 'translate3d(0, 0, 0)' },
  threshold = 0.1,
  rootMargin = '-50px',
  textAlign = 'left',
  onAnimationComplete,
  splitBy = 'words', // 'words' or 'chars'
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: rootMargin, amount: threshold });

  const items = splitBy === 'chars'
    ? text.split('')
    : text.split(' ');

  return (
    <span
      ref={ref}
      className={`split-text-wrapper ${className}`}
      style={{ textAlign, display: 'inline' }}
    >
      {items.map((item, index) => (
        <motion.span
          key={index}
          initial={animationFrom}
          animate={isInView ? animationTo : animationFrom}
          transition={{
            duration: 0.55,
            delay: (index * delay) / 1000,
            ease: [0.22, 1, 0.36, 1],
          }}
          onAnimationComplete={
            index === items.length - 1 ? onAnimationComplete : undefined
          }
          className="split-text-item"
          style={{ display: 'inline-block', willChange: 'transform, opacity' }}
        >
          {item === ' ' ? '\u00A0' : item}
          {splitBy === 'words' && index < items.length - 1 && '\u00A0'}
        </motion.span>
      ))}
    </span>
  );
}
