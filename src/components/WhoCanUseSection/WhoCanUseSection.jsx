import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { SplitText, ShinyText, SpotlightCard } from '../AnimatedUI';
import './WhoCanUseSection.css';

const categoryDetails = {
  Hotels: {
    impact: 'Save 500+ meals per event',
    pickupTime: '15-30 Mins Express Pickups',
    stats: '500+ Meals/Event',
    tag: 'Hospitality Partner',
    highlights: [
      'Automated late-night banquet surplus scheduling',
      'Temperature-controlled rescue containers provided',
      'Tax donation receipts & sustainability ESG reports',
      'Zero-contact food handoff protocol with barcode tracking',
    ],
    ctaText: 'Partner Your Hotel',
  },
  Restaurants: {
    impact: 'Average 40kg food saved daily',
    pickupTime: 'Daily Evening Pickup Slots',
    stats: '40kg Daily Savings',
    tag: 'Culinary Network',
    highlights: [
      'End-of-day excess food dispatch in just 2 clicks',
      'Instant connection with nearby verified shelters',
      'Real-time waste reduction analytics dashboard',
      'Staff packaging training & insulated bag support',
    ],
    ctaText: 'List Your Restaurant',
  },
  Caterers: {
    impact: 'Direct event surplus rescue',
    pickupTime: 'On-Demand Event Dispatch',
    stats: '100% Event Rescue',
    tag: 'Event & Wedding',
    highlights: [
      'Wedding & convention surplus emergency rescue',
      'Volunteer rapid response network ready in 20 mins',
      'Compliant with food safety & hygiene standards',
      'Co-branded zero-waste sustainability badges',
    ],
    ctaText: 'Register Catering Firm',
  },
  Cafeterias: {
    impact: 'Bulk campus meal rescue',
    pickupTime: 'Scheduled Lunch Routes',
    stats: 'Bulk Recovery',
    tag: 'Campus & Institutional',
    highlights: [
      'University & school dining hall food recovery',
      'Batch food logs for recurring donation schedules',
      'Empower student volunteer groups & initiatives',
      'Zero-landfill campus certification & reports',
    ],
    ctaText: 'Connect Cafeteria',
  },
  Bakeries: {
    impact: 'Fresh daily baked goods saved',
    pickupTime: 'Closing Hour Collection',
    stats: 'Daily Fresh Loaves',
    tag: 'Artisanal Bakery',
    highlights: [
      'Artisanal breads, buns & pastries distribution',
      'Same-day delivery to night shelters & children homes',
      'Eliminate bakery organic waste disposal costs',
      'Community partner storefront verification badge',
    ],
    ctaText: 'Join as Bakery Partner',
  },
  'Event Venues': {
    impact: 'Large gathering impact',
    pickupTime: 'Flexible Venue Slots',
    stats: '1,000+ Guests Impact',
    tag: 'Convention Centers',
    highlights: [
      'Grand hall & convention food safety protocols',
      'Dedicated on-site food safety volunteer coordinator',
      'ESG environmental impact certs for corporate clients',
      'Seamless event host coordination & instant log',
    ],
    ctaText: 'Register Event Venue',
  },
  'Corporate Cafeterias': {
    impact: 'CSR & ESG Goal Fulfillment',
    pickupTime: 'Daily Pantry Cleanout',
    stats: 'Corporate CSR Metric',
    tag: 'Tech Parks & Offices',
    highlights: [
      'Fulfill corporate CSR sustainability metrics & ESG goals',
      'Employee volunteer participation drives & team building',
      'Monthly carbon footprint savings reports',
      'Custom corporate sustainability dashboard access',
    ],
    ctaText: 'Enroll Corporate Campus',
  },
  Individuals: {
    impact: 'Every home meal counts',
    pickupTime: 'Drop-off & Local Alert',
    stats: 'Neighborhood Impact',
    tag: 'Home Community',
    highlights: [
      'Share home party or family function excess effortlessly',
      'Locate nearest neighborhood food drop box on live map',
      'Connect directly with nearby community fridges',
      'Join local zero-waste food sharing groups',
    ],
    ctaText: 'Donate as Individual',
  },

  // Receivers
  NGOs: {
    impact: 'Feeds 1,000+ people daily',
    pickupTime: 'Priority Dispatch Alerts',
    stats: '1,000+ Daily Meals',
    tag: 'Verified Non-Profit',
    highlights: [
      'Verified non-profit partner food allocation system',
      'Real-time push notifications when fresh food is nearby',
      'Subsidized refrigerated delivery support options',
      'Transparent digital food safety inspection check sheets',
    ],
    ctaText: 'Apply as Verified NGO',
  },
  Shelters: {
    impact: 'Consistent warm meals',
    pickupTime: 'Evening & Night Delivery',
    stats: '24/7 Warm Food',
    tag: 'Care Homes & Shelters',
    highlights: [
      'Night shelters & care home meal fulfillment',
      'Nutritious fresh meal delivery guaranteed daily',
      'Direct volunteer drop-offs with scheduled time slots',
      '24/7 helpline for emergency food requirement surges',
    ],
    ctaText: 'Register Your Shelter',
  },
  'Community Orgs': {
    impact: 'Empowers local neighborhoods',
    pickupTime: 'Local Drive Slots',
    stats: 'Neighborhood Drives',
    tag: 'Community Action',
    highlights: [
      'Neighborhood food distribution drives & pop-ups',
      'Volunteer dispatch coordination map & group routing',
      'Community fridge management & hygiene tools',
      'Local hunger mapping & relief zone analytics',
    ],
    ctaText: 'Connect Community Group',
  },
  'Distribution Groups': {
    impact: 'Grassroot relief network',
    pickupTime: 'Real-Time Rescue Alerts',
    stats: 'Rapid Volunteer Team',
    tag: 'Grassroot Responders',
    highlights: [
      'Grassroot volunteer group coordination and routing',
      'Automated route optimization for food rescue runs',
      'Mobile app alerts for urgent short-notice pickups',
      'Volunteer impact recognition & certified badges',
    ],
    ctaText: 'Join Distribution Network',
  },
  'Old Age Homes': {
    impact: 'Tailored senior nutrition',
    pickupTime: 'Daily Scheduled Delivery',
    stats: 'Senior Care Meals',
    tag: 'Elderly Welfare',
    highlights: [
      'Dietary-conscious, soft & easily digestible hot meals',
      'Scheduled breakfast, lunch & dinner deliveries',
      'Dedicated volunteer caregiver assistance',
      'Healthcare partner nutritional compliance',
    ],
    ctaText: 'Register Care Home',
  },
  'Orphanages & Youth': {
    impact: 'Nourishing future generations',
    pickupTime: 'Afternoon & Evening Drop-off',
    stats: 'Youth Nutrition',
    tag: 'Children Support',
    highlights: [
      'Fresh fruits, dairy & protein-rich wholesome foods',
      'Nutritional meal plans for children & students',
      'Hygiene-inspected food transport packs',
      'Birthday & celebration surplus treat matching',
    ],
    ctaText: 'Support Youth Center',
  },
  'More Receivers': {
    impact: 'Unrestricted humanitarian relief',
    pickupTime: '24/7 Rapid Assistance',
    stats: 'All Relief Channels',
    tag: 'Community Network',
    highlights: [
      'Disaster relief camps & crisis kitchens',
      'Rural hunger mitigation routes',
      'Temporary labor & shelter food stations',
      'Universal food access network enrollment',
    ],
    ctaText: 'Explore All Receivers',
  },
  'More Donors': {
    impact: 'Infinite surplus recovery options',
    pickupTime: 'Custom Schedules',
    stats: 'All Surplus Sources',
    tag: 'Expanded Ecosystem',
    highlights: [
      'Supermarkets & grocery excess produce',
      'Food trucks & mobile festival vendors',
      'Farm cooperatives & harvest surplus',
      'Cloud kitchens & delivery hubs',
    ],
    ctaText: 'Explore All Donors',
  },
};

const donors = [
  {
    title: 'Hotels',
    desc: 'Surplus banquet & buffet meals ready for rapid dispatch.',
    color: '#16a34a',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
        <path d="M9 6h6M9 10h6M9 14h6M9 18h2" />
        <path d="M12 2v2" />
      </svg>
    ),
  },
  {
    title: 'Restaurants',
    desc: 'Daily end-of-day excess food shared with local shelters.',
    color: '#0284c7',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
      </svg>
    ),
  },
  {
    title: 'Caterers',
    desc: 'Wedding & large event surplus rescued in minutes.',
    color: '#9333ea',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4a9 9 0 0 0-9 9h18a9 9 0 0 0-9-9zM12 2v2M2 17h20M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
      </svg>
    ),
  },
  {
    title: 'Cafeterias',
    desc: 'University, hospital & school dining recovery schedules.',
    color: '#ea580c',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
        <line x1="8" y1="10" x2="8" y2="19" />
        <line x1="16" y1="10" x2="16" y2="19" />
      </svg>
    ),
  },
  {
    title: 'Bakeries',
    desc: 'Artisanal breads, buns & fresh baked goods saved daily.',
    color: '#d97706',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2A10 10 0 0 0 2 12c0 5.5 4.5 10 10 10s10-4.5 10-10A10 10 0 0 0 12 2z" />
        <path d="M8.5 8.5C9.5 10.5 10 12.5 10 15M15.5 8.5C14.5 10.5 14 12.5 14 15M6 12h12" />
      </svg>
    ),
  },
  {
    title: 'Event Venues',
    desc: 'Conventions, expos & banquet halls zero-waste ESG solutions.',
    color: '#e11d48',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" />
        <circle cx="12" cy="18" r="3" />
      </svg>
    ),
  },
  {
    title: 'Corporate Cafeterias',
    desc: 'Office campuses & tech parks fulfilling sustainability goals.',
    color: '#0d9488',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01" />
      </svg>
    ),
  },
  {
    title: 'Individuals',
    desc: 'Home cooks, party hosts & residential community donors.',
    color: '#4f46e5',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    title: 'More Donors',
    desc: 'Supermarkets, farm co-ops, food trucks & cloud kitchens.',
    color: '#0284c7',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
];

const receivers = [
  {
    title: 'NGOs',
    desc: 'Verified non-profit partners distributing meals directly.',
    color: '#16a34a',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    title: 'Shelters',
    desc: 'Night shelters, care centers & orphanages receiving daily meals.',
    color: '#2563eb',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M9 22V12h6v10" />
      </svg>
    ),
  },
  {
    title: 'Community Orgs',
    desc: 'Neighborhood groups & local food drives fighting food insecurity.',
    color: '#9333ea',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: 'Distribution Groups',
    desc: 'Dedicated grassroot volunteer fleets with real-time pickup alerts.',
    color: '#059669',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a4 4 0 0 0-4 4v4a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4z" />
        <path d="M12 14v8" />
        <path d="M8 18h8" />
        <path d="M18 8a6 6 0 0 1-12 0" />
      </svg>
    ),
  },
  {
    title: 'Old Age Homes',
    desc: 'Nutritious & dietary-conscious hot meals for elderly care homes.',
    color: '#ec4899',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    ),
  },
  {
    title: 'Orphanages & Youth',
    desc: 'Wholesome nutrition & daily fresh meals for children centers.',
    color: '#f59e0b',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>
    ),
  },
  {
    title: 'More Receivers',
    desc: 'Disaster relief camps, rural kitchens & local hunger relief drives.',
    color: '#8b5cf6',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
];

export default function WhoCanUseSection({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('donors');
  const scrollTrackRef = useRef(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  const activeList = activeTab === 'donors' ? donors : receivers;

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    if (scrollTrackRef.current) {
      scrollTrackRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const scrollRow = (direction) => {
    if (scrollTrackRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollTrackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleActionClick = (route = 'login') => {
    if (onNavigate) {
      onNavigate(route);
    }
  };

  return (
    <section className="who-section" ref={ref}>
      <div className="who-container">
        {/* ── Header ── */}
        <motion.div
          className="who-header"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="who-badge">
            <ShinyText text="COMMUNITY NETWORK" speed={4} shimmerColor="rgba(34,197,94,0.9)" />
          </span>
          <h2 className="who-title">
            <SplitText
              text="Who Can Use FoodBridge?"
              delay={35}
              splitBy="words"
            />
          </h2>
          <p className="who-subtitle">
            Whether you have surplus food to share or a mission to distribute it, FoodBridge connects you with live coordination.
          </p>

          {/* ── Segmented Tab Switcher (Without Count Numbers) ── */}
          <div className="tab-switcher">
            <button
              className={`tab-btn ${activeTab === 'donors' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('donors')}
            >
              {activeTab === 'donors' && (
                <motion.span
                  className="tab-pill-bg"
                  layoutId="whoTabPill"
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                />
              )}
              <span className="tab-label-inner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="tab-icon">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" />
                </svg>
                <span>Food Donors</span>
              </span>
            </button>

            <button
              className={`tab-btn ${activeTab === 'receivers' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('receivers')}
            >
              {activeTab === 'receivers' && (
                <motion.span
                  className="tab-pill-bg"
                  layoutId="whoTabPill"
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                />
              )}
              <span className="tab-label-inner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="tab-icon">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span>Receivers & NGOs</span>
              </span>
            </button>
          </div>
        </motion.div>

        {/* ── Single Horizontal Row with Side Scroll Buttons ── */}
        <div className="who-single-row-container">
          {/* Left Floating Scroll Arrow Button */}
          <motion.button
            className="who-nav-scroll-btn btn-left"
            onClick={() => scrollRow('left')}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Scroll left"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </motion.button>

          {/* Horizontal Track */}
          <div className="who-single-row-track" ref={scrollTrackRef}>
            <AnimatePresence mode="popLayout">
              {activeList.map((item, idx) => {
                const detail = categoryDetails[item.title];

                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.4, delay: idx * 0.04 }}
                    className="who-row-card-wrap"
                    whileHover={{ y: -6 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleActionClick('login')}
                  >
                    <SpotlightCard
                      spotlightColor={`${item.color}35`}
                      className="who-row-card"
                    >
                      {/* Top Row: Icon + Mini Stat Badge */}
                      <div className="row-card-top">
                        <div
                          className="row-icon-box"
                          style={{
                            background: `${item.color}18`,
                            color: item.color,
                            borderColor: `${item.color}35`,
                          }}
                        >
                          {item.icon}
                        </div>

                        {detail?.stats && (
                          <span
                            className="row-stat-badge"
                            style={{
                              background: `${item.color}14`,
                              color: item.color,
                              borderColor: `${item.color}25`,
                            }}
                          >
                            {detail.stats}
                          </span>
                        )}
                      </div>

                      {/* Card Content */}
                      <div className="row-card-body">
                        <h3 className="row-card-title">{item.title}</h3>
                        <p className="row-card-desc">{item.desc}</p>
                      </div>

                      {/* Bottom Action Footer */}
                      <div className="row-card-footer">
                        <span className="row-action-link" style={{ color: item.color }}>
                          {detail?.ctaText || 'Get Started'}
                        </span>
                        <div
                          className="row-arrow-btn"
                          style={{
                            borderColor: `${item.color}40`,
                            color: item.color,
                          }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </div>
                      </div>
                    </SpotlightCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Right Floating Scroll Arrow Button */}
          <motion.button
            className="who-nav-scroll-btn btn-right"
            onClick={() => scrollRow('right')}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Scroll right"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </motion.button>
        </div>
      </div>
    </section>
  );
}
