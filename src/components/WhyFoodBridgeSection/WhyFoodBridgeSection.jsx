import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  AnimatedEcoSprout,
  AnimatedPinMap,
  AnimatedBarChart,
  AnimatedShieldCheck,
} from '../AnimatedIcons/AnimatedIcons';
import { SplitText, ScrollReveal } from '../AnimatedUI';
import './WhyFoodBridgeSection.css';

const points = [
  {
    num: '01',
    title: 'Reduce Waste',
    desc: 'Prevent usable food from becoming unnecessary waste.',
    icon: <AnimatedEcoSprout size={24} color="#22c55e" />,
    accent: '#22c55e',
  },
  {
    num: '02',
    title: 'Connect Nearby',
    desc: 'Match surplus food with organizations that can collect it.',
    icon: <AnimatedPinMap size={24} color="#3b82f6" />,
    accent: '#3b82f6',
  },
  {
    num: '03',
    title: 'Track Every Donation',
    desc: 'Record donations and measure real impact in real time.',
    icon: <AnimatedBarChart size={24} color="#a855f7" />,
    accent: '#a855f7',
  },
  {
    num: '04',
    title: 'Build Trust',
    desc: 'Verification, ratings and pickup confirmation improve reliability.',
    icon: <AnimatedShieldCheck size={24} color="#eab308" />,
    accent: '#eab308',
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function WhyFoodBridgeSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section className="why-section" ref={ref}>
      <div className="why-container">
        {/* Section Header */}
        <motion.div
          className="why-header"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="why-badge">CORE MISSION</span>
          <h2 className="why-title">
            <SplitText text="Why FoodBridge?" delay={40} splitBy="chars" />
          </h2>
          <p className="why-subtitle">
            A simple, reliable, and transparent platform transforming how communities manage food surplus.
          </p>
        </motion.div>

        {/* 4 Feature Cards */}
        <motion.div
          className="why-grid"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {points.map((pt) => (
            <motion.div
              key={pt.title}
              variants={cardVariants}
              className="why-card-wrapper"
              whileHover={{ y: -6, boxShadow: '0 16px 36px rgba(0, 0, 0, 0.08)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <div className="why-card">
                <div className="why-card-top">
                  <span className="why-card-num">{pt.num}</span>
                  <div
                    className="why-icon-badge"
                    style={{ color: pt.accent, backgroundColor: `${pt.accent}15` }}
                  >
                    {pt.icon}
                  </div>
                </div>
                <h3 className="why-card-title">{pt.title}</h3>
                <p className="why-card-desc">{pt.desc}</p>
                <div className="why-card-line" style={{ background: pt.accent }} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
