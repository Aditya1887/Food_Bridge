import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { SpotlightCard, CountUp } from '../AnimatedUI';
import './GlassWidgets.css';

export default function GlassWidgets() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="glass-overlays-container">
      {/* Lower Right — Impact Badge with SpotlightCard */}
      <motion.div
        className="glass-impact-widget-motion"
        initial={{ x: 80, opacity: 0, scale: 0.85 }}
        animate={{ x: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
        style={{
          transform: `translate(${mousePos.x * -8}px, ${mousePos.y * -6}px)`,
        }}
      >
        <SpotlightCard
          className="glass-impact-widget"
          spotlightColor="rgba(38, 186, 100, 0.22)"
          borderColor="rgba(38, 186, 100, 0.5)"
        >
          <div className="avatars-row">
            <img src="/assets/avatar1.jpg" alt="User 1" className="avatar-img" />
            <img src="/assets/avatar2.jpg" alt="User 2" className="avatar-img" />
            <img src="/assets/avatar3.jpg" alt="User 3" className="avatar-img" />
            <img src="/assets/avatar4.jpg" alt="User 4" className="avatar-img" />
            <span className="impact-count-badge">
              <CountUp to={10} from={1} duration={2} suffix="K+" />
            </span>
          </div>
          <p className="impact-widget-text">
            People already<br />making an impact
          </p>
        </SpotlightCard>
      </motion.div>
    </div>
  );
}
