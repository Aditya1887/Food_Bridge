import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import './AnimatedCounter.css';

function Digit({ digit, isInView, delay }) {
  const isNumber = !isNaN(parseInt(digit, 10));

  if (!isNumber) {
    return <span className="counter-symbol">{digit}</span>;
  }

  const num = parseInt(digit, 10);

  return (
    <span className="counter-digit-container">
      <motion.span
        className="counter-digit-reel"
        initial={{ y: '0%' }}
        animate={isInView ? { y: `-${num * 10}%` } : { y: '0%' }}
        transition={{
          duration: 1.8,
          delay,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span key={n} className="counter-single-number">
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

export default function AnimatedCounter({
  value = '10,000+',
  className = '',
  delay = 0,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const characters = String(value).split('');

  return (
    <span ref={ref} className={`animated-counter ${className}`}>
      {characters.map((char, index) => (
        <Digit
          key={index}
          digit={char}
          isInView={isInView}
          delay={delay + index * 0.06}
        />
      ))}
    </span>
  );
}
