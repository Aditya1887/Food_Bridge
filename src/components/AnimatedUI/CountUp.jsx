import React, { useEffect, useState, useRef } from 'react';
import { useInView } from 'framer-motion';

export default function CountUp({
  to = 0,
  from = 0,
  duration = 2,
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

  const [value, setValue] = useState(startFrom);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!isInView || hasStartedRef.current) return;
    hasStartedRef.current = true;

    let timeoutId;
    let frameId;

    timeoutId = setTimeout(() => {
      const startTime = performance.now();
      const durationMs = (duration || 2) * 1000;

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / durationMs, 1);

        // Ease Out Quart
        const ease = 1 - Math.pow(1 - progress, 4);
        const current = startFrom + (targetTo - startFrom) * ease;

        setValue(current);

        if (progress < 1) {
          frameId = requestAnimationFrame(animate);
        } else {
          setValue(targetTo);
        }
      };

      frameId = requestAnimationFrame(animate);
    }, (delay || 0) * 1000);

    return () => {
      clearTimeout(timeoutId);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [isInView, startFrom, targetTo, duration, delay]);

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
