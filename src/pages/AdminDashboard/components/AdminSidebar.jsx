import React from 'react';
import { motion } from 'framer-motion';

export default function AdminSidebar({
  activeNav,
  setActiveNav,
  mobileMenuOpen,
  setMobileMenuOpen,
  onGoHome,
  onLogout,
  counts = {},
}) {
  const NAV_GROUPS = [
    {
      group: null, // Top primary
      items: [
        {
          id: 'overview',
          label: 'Dashboard',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </svg>
          ),
        },
      ],
    },
    {
      group: 'MANAGEMENT',
      items: [
        {
          id: 'users',
          label: 'Users',
          badge: counts.users || null,
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          ),
        },
        {
          id: 'donors',
          label: 'Donors',
          badge: counts.donors || null,
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          ),
        },
        {
          id: 'receivers',
          label: 'NGOs / Receivers',
          badge: counts.receivers || null,
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2" />
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <circle cx="12" cy="10" r="2" />
              <line x1="8" y1="2" x2="8" y2="4" />
              <line x1="16" y1="2" x2="16" y2="4" />
            </svg>
          ),
        },
        {
          id: 'donations',
          label: 'Donations',
          badge: counts.donations || null,
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          ),
        },
        {
          id: 'pickups',
          label: 'Pickups',
          badge: counts.pickups || null,
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" rx="1.5" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          ),
        },
        {
          id: 'categories',
          label: 'Categories',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="6" r="3" />
              <circle cx="18" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="18" r="3" />
            </svg>
          ),
        },
      ],
    },
    {
      group: 'REPORTS & INSIGHTS',
      items: [
        {
          id: 'analytics',
          label: 'Analytics',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          ),
        },
        {
          id: 'reports',
          label: 'Reports',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          ),
        },
        {
          id: 'messages',
          label: 'Feedback',
          badge: counts.messages || null,
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          ),
        },
      ],
    },
    {
      group: 'SYSTEM',
      items: [
        {
          id: 'notifications',
          label: 'Notifications',
          badge: counts.notifications || null,
          badgeColor: '#22c55e',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          ),
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          ),
        },
        {
          id: 'admin_users',
          label: 'Admin Users',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          ),
        },
        {
          id: 'activity_logs',
          label: 'Activity Logs',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          ),
        },
      ],
    },
  ];

  return (
    <>
      <aside className={`ad-sidebar ${mobileMenuOpen ? 'ad-sidebar-open' : ''}`}>
        {/* Brand Header */}
        <div className="ad-sidebar-header">
          <div className="ad-brand" onClick={onGoHome} role="button" tabIndex={0}>
            <div className="ad-logo-icon">
              <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M24 6 C21 10 21 15 24 18 C27 15 27 10 24 6 Z" fill="#22c55e" stroke="none" />
                <path d="M17 10 C14 12 14 16 18 18 C19 15 18 12 17 10 Z" fill="#22c55e" stroke="none" />
                <path d="M31 10 C34 12 34 16 30 18 C29 15 30 12 31 10 Z" fill="#22c55e" stroke="none" />
                <path d="M12 28 Q 24 16 36 28" stroke="#4ade80" strokeWidth="2.8" fill="none" />
                <line x1="18" y1="21" x2="18" y2="28" stroke="#4ade80" strokeWidth="2.2" />
                <line x1="24" y1="19" x2="24" y2="28" stroke="#4ade80" strokeWidth="2.2" />
                <line x1="30" y1="21" x2="30" y2="28" stroke="#4ade80" strokeWidth="2.2" />
                <path d="M10 30 C14 42 34 42 38 30" stroke="#4ade80" strokeWidth="2.8" fill="none" />
              </svg>
            </div>
            <div>
              <span className="ad-brand-name">
                <span className="ad-brand-white">Food</span>
                <span className="ad-brand-green">Bridge</span>
              </span>
              <span className="ad-brand-tagline">Share Food. Share Hope.</span>
            </div>
          </div>
          <button
            type="button"
            className="ad-close-mobile-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close Navigation"
          >
            ✕
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="ad-nav" aria-label="Admin Navigation">
          {NAV_GROUPS.map((sec, idx) => (
            <div key={idx} className="ad-nav-group">
              {sec.group && <div className="ad-nav-group-title">{sec.group}</div>}
              {sec.items.map((item) => {
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`ad-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setActiveNav(item.id);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <span className="ad-nav-icon">{item.icon}</span>
                    <span className="ad-nav-label">{item.label}</span>
                    {item.badge !== null && item.badge !== undefined && item.badge > 0 && (
                      <span
                        className="ad-nav-badge"
                        style={{
                          backgroundColor: item.badgeColor || '#22c55e',
                          color: '#052e16',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Inspiration Card */}
        <div className="ad-sidebar-promo-card">
          <div className="ad-promo-deco-leaf">
            <svg viewBox="0 0 60 60" fill="none">
              <path
                d="M10 50 C20 20, 50 10, 55 5 C45 25, 35 45, 10 50 Z"
                fill="rgba(74, 222, 128, 0.15)"
                stroke="#4ade80"
                strokeWidth="1.5"
              />
              <path d="M10 50 Q 30 30 55 5" stroke="#4ade80" strokeWidth="1.2" strokeDasharray="3 3" />
            </svg>
          </div>
          <p className="ad-promo-title">Good food today, better tomorrow. 🌱</p>
          <span className="ad-promo-sub">Zero-Waste Community</span>
        </div>

        {/* Sidebar Footer Actions */}
        <div className="ad-sidebar-footer">
          <button type="button" className="ad-footer-link-btn" onClick={onGoHome}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>View Public Site</span>
          </button>
          <button type="button" className="ad-footer-link-btn ad-logout-btn" onClick={onLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="ad-sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
