import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import './TextReveal.css';

function Word({ children, progress, range }) {
  const opacity = useTransform(progress, range, [0.18, 1]);
  const y = useTransform(progress, range, [4, 0]);

  return (
    <span className="text-reveal-word-wrapper">
      <motion.span style={{ opacity, y }} className="text-reveal-word">
        {children}
      </motion.span>
    </span>
  );
}

export default function TextReveal({
  text = '',
  className = '',
}) {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.85', 'start 0.3'],
  });

  const words = text.split(' ');

  return (
    <div ref={containerRef} className={`text-reveal-container ${className}`}>
      <p className="text-reveal-paragraph">
        {words.map((word, i) => {
          const start = i / words.length;
          const end = start + 1 / words.length;
          return (
            <React.Fragment key={i}>
              <Word progress={scrollYProgress} range={[start, end]}>
                {word}
              </Word>
              {i < words.length - 1 && ' '}
            </React.Fragment>
          );
        })}
      </p>
    </div>
  );
}
