import React, { useEffect, useState, useRef } from 'react';
import { useInView } from 'framer-motion';

export default function CountUp({
  to = 0,
  from = 0,
  duration = 1.2,
  delay = 0,
  className = '',
  prefix = '',
  suffix = '',
  separator = ',',
  decimals = 0,
}) {
  const parseNum = (val) => {
    if (typeof val === 'number' && !isNaN(val)) return val;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  const targetTo = parseNum(to);
  const startFrom = parseNum(from);

  const [value, setValue] = useState(targetTo > 0 ? startFrom : 0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const prevTargetRef = useRef(targetTo);
  const frameRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // If not in view yet, record target and wait
    if (!isInView) {
      prevTargetRef.current = targetTo;
      return;
    }

    const startVal = value;
    const endVal = targetTo;

    // Clear previous animation
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    if (startVal === endVal) {
      setValue(endVal);
      return;
    }

    timeoutRef.current = setTimeout(() => {
      const startTime = performance.now();
      const durationMs = Math.max(300, (duration || 1.2) * 1000);

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / durationMs, 1);

        // Ease Out Quart: 1 - (1 - t)^4
        const ease = 1 - Math.pow(1 - progress, 4);
        const current = startVal + (endVal - startVal) * ease;

        setValue(current);

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(animate);
        } else {
          setValue(endVal);
          prevTargetRef.current = endVal;
        }
      };

      frameRef.current = requestAnimationFrame(animate);
    }, (delay || 0) * 1000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [isInView, targetTo, duration, delay]);

  const formatNumber = (num) => {
    const safeNum = parseNum(num);
    const fixed = safeNum.toFixed(decimals);
    if (!separator) return fixed;
    const parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    return parts.join('.');
  };

  return (
    <span ref={ref} className={`count-up-number ${className}`}>
      {prefix}
      {formatNumber(value)}
      {suffix}
    </span>
  );
}
