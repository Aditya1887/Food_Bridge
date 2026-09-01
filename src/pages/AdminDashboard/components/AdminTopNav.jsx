import '../AdminDashboard.css';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminTopNav({
  activeNav,
  displayName = 'Admin',
  avatarUrl,
  avatarInitials = 'AD',
  isDark,
  toggleTheme,
  onOpenSearch,
  onOpenSettings,
  onGoHome,
  onLogout,
  onNavigate,
  unreadNotifsCount = 0,
  notifications = [],
  onSelectNav,
  counts = {},
}) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifsDropdownOpen, setNotifsDropdownOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);

  const userMenuRef = useRef(null);
  const notifsRef = useRef(null);
  const mobileDrawerRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (notifsRef.current && !notifsRef.current.contains(event.target)) {
        setNotifsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Primary Operational Tabs in the Top Navigation Bar
  const PRIMARY_NAV_ITEMS = [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
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
          <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
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
  ];

  // Secondary Administration Tabs (for mobile drawer)
  const SIDE_NAV_ITEMS = [
    {
      id: 'messages',
      label: 'Messages',
      badge: counts.messages || null,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      id: 'admin_users',
      label: 'Admin Roles',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
    {
      id: 'notifications',
      label: 'Notifications',
      badge: counts.notifications || null,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
    },
    {
      id: 'activity_logs',
      label: 'Activity Logs',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
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
  ];

  const handleNavClick = (id) => {
    onSelectNav(id);
    setMobileDrawerOpen(false);
  };

  return (
    <>
      <header className="ad-top-nav-bar">
        {/* Left: Mobile Hamburger & Brand Logo */}
        <div className="ad-top-nav-left">
          <button
            type="button"
            className="ad-top-hamburger-btn"
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Open Navigation Menu"
            title="Open Navigation Menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>

          <div
            className="ad-top-brand"
            onClick={() => handleNavClick('overview')}
            role="button"
            tabIndex={0}
            title="FoodBridge Admin Dashboard"
          >
            <div className="ad-top-logo-icon">
              <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M24 6 C21 10 21 15 24 18 C27 15 27 10 24 6 Z" fill="#22c55e" stroke="none" />
                <path d="M17 10 C14 12 14 16 18 18 C19 15 18 12 17 10 Z" fill="#22c55e" stroke="none" />
                <path d="M31 10 C34 12 34 16 30 18 C29 15 30 12 31 10 Z" fill="#22c55e" stroke="none" />
                <path d="M12 28 Q 24 16 36 28" stroke="#16a34a" strokeWidth="2.8" fill="none" />
                <line x1="18" y1="21" x2="18" y2="28" stroke="#16a34a" strokeWidth="2.2" />
                <line x1="24" y1="19" x2="24" y2="28" stroke="#16a34a" strokeWidth="2.2" />
                <line x1="30" y1="21" x2="30" y2="28" stroke="#16a34a" strokeWidth="2.2" />
                <path d="M10 30 C14 42 34 42 38 30" stroke="#16a34a" strokeWidth="2.8" fill="none" />
              </svg>
            </div>
            <div className="ad-top-brand-text">
              <span className="ad-top-brand-title">
                <span className="ad-top-brand-green">Food</span>
                <span className="ad-top-brand-dark">Bridge</span>
              </span>
              <span className="ad-top-brand-tagline">Share Food. Share Hope.</span>
            </div>
          </div>
        </div>

        {/* Center: Horizontal Navigation Links */}
        <nav className="ad-top-nav-center" aria-label="Admin Primary Navigation">
          {PRIMARY_NAV_ITEMS.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`ad-top-nav-link ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <span className="ad-top-nav-icon">{item.icon}</span>
                <span className="ad-top-nav-label">{item.label}</span>
                {item.badge !== null && item.badge !== undefined && item.badge > 0 && (
                  <span className="ad-top-nav-badge">{item.badge}</span>
                )}
                {isActive && <motion.div layoutId="topNavIndicator" className="ad-top-nav-indicator" />}
              </button>
            );
          })}
        </nav>

        {/* Right: Search, Notifications, Theme, User Pill */}
        <div className="ad-top-nav-right">
          {/* Global Search Button */}
          <button
            type="button"
            className="ad-top-icon-btn"
            onClick={onOpenSearch}
            title="Search anything (⌘K)"
            aria-label="Global Search"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          {/* Notifications Dropdown */}
          <div className="ad-notif-dropdown-wrap" ref={notifsRef}>
            <button
              type="button"
              className="ad-top-icon-btn ad-notif-btn"
              onClick={() => {
                setNotifsDropdownOpen(!notifsDropdownOpen);
                setUserMenuOpen(false);
              }}
              aria-label="Notifications"
              title="System Notifications"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadNotifsCount > 0 && (
                <span className="ad-top-notif-badge">{unreadNotifsCount}</span>
              )}
            </button>

            <AnimatePresence>
              {notifsDropdownOpen && (
                <motion.div
                  className="ad-dropdown-card ad-notifs-menu"
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="ad-dropdown-header">
                    <span className="ad-dropdown-title">System Notifications</span>
                    <button
                      type="button"
                      className="ad-dropdown-link"
                      onClick={() => {
                        setNotifsDropdownOpen(false);
                        onSelectNav('notifications');
                      }}
                    >
                      View All
                    </button>
                  </div>
                  <div className="ad-dropdown-list">
                    {notifications.slice(0, 4).map((n, i) => (
                      <div key={n.id || i} className="ad-notif-item">
                        <div className="ad-notif-icon-circle">🔔</div>
                        <div className="ad-notif-content">
                          <p className="ad-notif-text">{n.title || n.message || 'System update received'}</p>
                          <span className="ad-notif-time">
                            {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <div className="ad-dropdown-empty">All caught up! No new notifications.</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            className="ad-top-icon-btn ad-theme-btn"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {/* Admin User Profile Pill & Dropdown */}
          <div className="ad-user-menu-wrap" ref={userMenuRef}>
            <button
              type="button"
              className="ad-top-user-pill"
              onClick={() => {
                setUserMenuOpen(!userMenuOpen);
                setNotifsDropdownOpen(false);
              }}
              aria-label="Admin User Menu"
            >
              {avatarUrl && !avatarImgError ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="ad-top-user-avatar"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={() => setAvatarImgError(true)}
                />
              ) : (
                <span className="ad-top-user-initials">{avatarInitials}</span>
              )}
              <div className="ad-top-user-info">
                <span className="ad-top-user-name">{displayName}</span>
                <span className="ad-top-user-role">Super Admin</span>
              </div>
              <svg
                className={`ad-user-chevron ${userMenuOpen ? 'open' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  className="ad-dropdown-card ad-user-dropdown"
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="ad-dropdown-profile-header">
                    <p className="ad-dropdown-name">{displayName}</p>
                    <p className="ad-dropdown-email">Super Administrator</p>
                  </div>
                  <div className="ad-dropdown-divider" />
                  <button
                    type="button"
                    className="ad-dropdown-item"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onOpenSettings();
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    Profile & Settings
                  </button>
                  <button
                    type="button"
                    className="ad-dropdown-item"
                    onClick={() => {
                      setUserMenuOpen(false);
                      if (onNavigate) onNavigate('donor-dashboard');
                      window.location.hash = '#donor-dashboard';
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    </svg>
                    Switch to Donor View
                  </button>
                  <button
                    type="button"
                    className="ad-dropdown-item"
                    onClick={() => {
                      setUserMenuOpen(false);
                      if (onNavigate) onNavigate('receiver-dashboard');
                      window.location.hash = '#receiver-dashboard';
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2" />
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                    </svg>
                    Switch to Receiver View
                  </button>
                  <div className="ad-dropdown-divider" />
                  <button
                    type="button"
                    className="ad-dropdown-item"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onGoHome();
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    </svg>
                    Back to Website
                  </button>
                  <button
                    type="button"
                    className="ad-dropdown-item ad-logout-item"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout();
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Log Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ── Mobile Slide-out Menu Drawer ── */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <>
            <motion.div
              className="ad-mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileDrawerOpen(false)}
            />
            <motion.div
              className="ad-mobile-nav-drawer"
              ref={mobileDrawerRef}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="ad-mobile-drawer-header">
                <div className="ad-top-brand">
                  <div className="ad-top-logo-icon">
                    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M24 6 C21 10 21 15 24 18 C27 15 27 10 24 6 Z" fill="#22c55e" stroke="none" />
                      <path d="M17 10 C14 12 14 16 18 18 C19 15 18 12 17 10 Z" fill="#22c55e" stroke="none" />
                      <path d="M31 10 C34 12 34 16 30 18 C29 15 30 12 31 10 Z" fill="#22c55e" stroke="none" />
                      <path d="M12 28 Q 24 16 36 28" stroke="#16a34a" strokeWidth="2.8" fill="none" />
                      <line x1="18" y1="21" x2="18" y2="28" stroke="#16a34a" strokeWidth="2.2" />
                      <line x1="24" y1="19" x2="24" y2="28" stroke="#16a34a" strokeWidth="2.2" />
                      <line x1="30" y1="21" x2="30" y2="28" stroke="#16a34a" strokeWidth="2.2" />
                      <path d="M10 30 C14 42 34 42 38 30" stroke="#16a34a" strokeWidth="2.8" fill="none" />
                    </svg>
                  </div>
                  <div className="ad-top-brand-text">
                    <span className="ad-top-brand-title">
                      <span className="ad-top-brand-green">Food</span>
                      <span className="ad-top-brand-dark">Bridge</span>
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="ad-mobile-close-btn"
                  onClick={() => setMobileDrawerOpen(false)}
                  aria-label="Close menu"
                >
                  ✕
                </button>
              </div>

              <div className="ad-mobile-drawer-body">
                <div className="ad-mobile-nav-group-title">Main Navigation</div>
                {PRIMARY_NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`ad-mobile-nav-btn ${activeNav === item.id ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                  >
                    <span className="ad-mobile-nav-icon">{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge && <span className="ad-nav-badge" style={{ background: '#22c55e', color: '#052e16' }}>{item.badge}</span>}
                  </button>
                ))}

                <div className="ad-mobile-nav-group-title" style={{ marginTop: '16px' }}>Administration</div>
                {SIDE_NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`ad-mobile-nav-btn ${activeNav === item.id ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                  >
                    <span className="ad-mobile-nav-icon">{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge && <span className="ad-nav-badge" style={{ background: '#22c55e', color: '#052e16' }}>{item.badge}</span>}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
