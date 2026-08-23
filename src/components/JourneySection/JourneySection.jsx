import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  AnimatedDonateBox,
  AnimatedCollectHands,
  AnimatedDeliverVan,
  AnimatedSmileyFace,
} from '../AnimatedIcons/AnimatedIcons';
import { SplitText, ScrollReveal } from '../AnimatedUI';
import './JourneySection.css';

const steps = [
  {
    num: '01',
    title: 'You Donate',
    desc: 'Share surplus food\nin just a few clicks.',
    theme: 'green',
    icon: <AnimatedDonateBox size={44} color="#164e27" />,
  },
  {
    num: '02',
    title: 'We Collect',
    desc: 'Our volunteers\npick it up safely.',
    theme: 'green',
    icon: <AnimatedCollectHands size={44} color="#164e27" />,
  },
  {
    num: '03',
    title: 'We Deliver',
    desc: 'We reach NGOs\n& trusted shelters.',
    theme: 'green',
    icon: <AnimatedDeliverVan size={44} color="#164e27" />,
  },
  {
    num: '04',
    title: 'Lives Change',
    desc: 'Food reaches those\nwho need it most.',
    theme: 'yellow',
    icon: <AnimatedSmileyFace size={44} color="#78350f" bg="#fef08a" />,
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.2, delayChildren: 0.3 },
  },
};

const stepVariants = {
  hidden: { y: 35, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

const leftVariants = {
  hidden: { x: -40, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const pathVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 1.8, delay: 0.4, ease: 'easeInOut' },
  },
};

export default function JourneySection({ onNavigate }) {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  return (
    <section className="journey-section" ref={sectionRef}>
      <div className="journey-inner">
        {/* ─── Left Copy Block ─── */}
        <motion.div
          className="journey-left"
          variants={leftVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          <div className="journey-title-row">
            <h2 className="journey-title">
              <SplitText text="Our Journey" splitBy="chars" delay={40} />
            </h2>
            <svg className="journey-leaf-icon" viewBox="0 0 32 32" fill="none">
              <path d="M6 26C6 26 4 14 18 6c0 0-2 14-12 20z" fill="#22c55e" />
              <path d="M6 26C9 20 13 12 18 6" stroke="#15803d" strokeWidth="1.5" fill="none" />
              <path d="M9 22c2.5-2 5-3.5 7.5-4" stroke="#15803d" strokeWidth="1.2" fill="none" />
            </svg>
          </div>
          <p className="journey-subtitle">
            From you to someone<br />who needs it most.
          </p>
          <motion.a
            href="#how-it-works"
            className="journey-explore-btn"
            whileHover={{ x: 4, boxShadow: '0 8px 22px rgba(22,91,39,0.3)' }}
            whileTap={{ scale: 0.96 }}
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) onNavigate('how-it-works');
            }}
          >
            <span>Explore How</span>
            <svg className="btn-arrow-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </motion.a>
        </motion.div>

        {/* ─── 4 Steps Timeline Container ─── */}
        <motion.div
          className="journey-steps-container"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {/* Animated Connecting Wave Path */}
          <svg className="connecting-wave-svg" viewBox="0 0 900 120" preserveAspectRatio="none" fill="none">
            <motion.path
              d="M 110,50 Q 200,90 320,50 T 540,50 T 760,50"
              stroke="#86efac"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              variants={pathVariants}
            />
          </svg>

          {/* Node Badges between steps */}
          <div className="node-badge node-1">
            <svg viewBox="0 0 16 16" fill="none" stroke="#ffffff" strokeWidth="2">
              <path d="M8 3v10M3 8h10" />
            </svg>
          </div>
          <div className="node-badge node-2">
            <svg viewBox="0 0 16 16" fill="none" stroke="#ffffff" strokeWidth="2">
              <path d="M8 3v10M3 8h10" />
            </svg>
          </div>
          <div className="node-badge node-3">
            <svg viewBox="0 0 16 16" fill="none" stroke="#ffffff" strokeWidth="2">
              <path d="M8 3v10M3 8h10" />
            </svg>
          </div>

          {/* Steps */}
          {steps.map((step) => (
            <motion.div
              className={`journey-step-column ${step.theme === 'yellow' ? 'step-yellow' : ''}`}
              key={step.num}
              variants={stepVariants}
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {/* 3D Sphere + Pedestal Podium */}
              <div className="podium-wrapper">
                <motion.div
                  className="sphere-orb"
                  whileHover={{ y: -6, scale: 1.08 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                >
                  {step.icon}
                </motion.div>
                <div className="podium-pedestal" />
              </div>

              {/* Step Info Text */}
              <div className="step-text-content">
                <span className="step-num">{step.num}</span>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ─── Dotted Heart Sparkle Trail (Right) ─── */}
        <div className="sparkle-heart-trail">
          <svg viewBox="0 0 200 200" fill="none" className="heart-trail-svg">
            <motion.path
              d="M 30,160 Q 60,160 90,140 C 130,110 170,60 140,25 C 115,-5 75,20 90,55 C 105,90 160,110 180,140"
              stroke="#4ade80"
              strokeWidth="2.5"
              strokeDasharray="4 6"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={isInView ? { pathLength: 1, opacity: 0.6 } : {}}
              transition={{ duration: 2.2, delay: 0.8, ease: 'easeInOut' }}
            />
            {/* Sparkle leaves around heart */}
            <circle cx="45" cy="40" r="3" fill="#4ade80" />
            <circle cx="165" cy="85" r="2.5" fill="#22c55e" />
            <circle cx="140" cy="165" r="2" fill="#86efac" />
            <path d="M175 25 c2 -3 5 -3 7 0 c-3 2 -3 5 0 7 c-2 -3 -5 -3 -7 0" fill="#22c55e" />
          </svg>
        </div>
      </div>
    </section>
  );
}
