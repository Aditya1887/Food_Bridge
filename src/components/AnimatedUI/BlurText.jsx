import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import './BlurText.css';

export default function BlurText({
  text = '',
  delay = 50,
  className = '',
  animateBy = 'words', // 'words' or 'letters'
  direction = 'top', // 'top' or 'bottom'
  threshold = 0.1,
  rootMargin = '-50px',
  onAnimationComplete,
}) {
  const elements = animateBy === 'words' ? text.split(' ') : text.split('');
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: rootMargin, amount: threshold });

  const defaultFrom = direction === 'top'
    ? { filter: 'blur(10px)', opacity: 0, transform: 'translate3d(0, -25px, 0)' }
    : { filter: 'blur(10px)', opacity: 0, transform: 'translate3d(0, 25px, 0)' };

  const defaultTo = {
    filter: 'blur(0px)',
    opacity: 1,
    transform: 'translate3d(0, 0, 0)',
  };

  return (
    <span ref={ref} className={`blur-text-wrapper ${className}`} style={{ display: 'inline' }}>
      {elements.map((element, index) => (
        <motion.span
          key={index}
          initial={defaultFrom}
          animate={isInView ? defaultTo : defaultFrom}
          transition={{
            duration: 0.6,
            delay: (index * delay) / 1000,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          onAnimationComplete={
            index === elements.length - 1 ? onAnimationComplete : undefined
          }
          className="blur-text-element"
          style={{ display: 'inline-block', willChange: 'transform, opacity, filter' }}
        >
          {element === ' ' ? '\u00A0' : element}
          {animateBy === 'words' && index < elements.length - 1 && '\u00A0'}
        </motion.span>
      ))}
    </span>
  );
}
