import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminTopNav({
  activeNav,
  displayName,
  avatarUrl,
  avatarInitials,
  isDark,
  toggleTheme,
  setMobileMenuOpen,
  onOpenSearch,
  onOpenSettings,
  onGoHome,
  onLogout,
  onNavigate,
  unreadNotifsCount = 0,
  notifications = [],
  onSelectNav,
}) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifsDropdownOpen, setNotifsDropdownOpen] = useState(false);

  const getPageTitle = (nav) => {
    switch (nav) {
      case 'overview':
        return 'Dashboard';
      case 'users':
        return 'User Management';
      case 'donors':
        return 'Donor Directory';
      case 'receivers':
        return 'NGO & Shelter Directory';
      case 'donations':
        return 'Food Donation Listings';
      case 'pickups':
        return 'Pickups & Logistics';
      case 'categories':
        return 'Meal Categories';
      case 'analytics':
        return 'Analytics & Environmental Impact';
      case 'reports':
        return 'Platform Reports';
      case 'messages':
        return 'Community Feedback';
      case 'notifications':
        return 'Notification Center';
      case 'settings':
        return 'System Settings';
      case 'admin_users':
        return 'Admin Access & Roles';
      case 'activity_logs':
        return 'Realtime Activity Logs';
      default:
        return 'Admin Dashboard';
    }
  };

  return (
    <header className="ad-top-header">
      {/* Left: Hamburger & Current View Title */}
      <div className="ad-header-left">
        <button
          type="button"
          className="ad-hamburger-btn"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Toggle Mobile Menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="ad-breadcrumb-wrap">
          <span className="ad-breadcrumb-root">Admin</span>
          <span className="ad-breadcrumb-sep">/</span>
          <h1 className="ad-header-title">{getPageTitle(activeNav)}</h1>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="ad-header-center">
        <button
          type="button"
          className="ad-search-bar-btn"
          onClick={onOpenSearch}
          aria-label="Global Search"
        >
          <svg className="ad-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="ad-search-placeholder">Search users, donations, NGOs, pickups...</span>
          <kbd className="ad-search-kbd">⌘K</kbd>
        </button>
      </div>

      {/* Right: Actions, Notifications, Theme, Profile */}
      <div className="ad-header-right">
        {/* Live Supabase Pulse Indicator */}
        <div className="ad-live-indicator" title="Connected to Supabase Realtime">
          <span className="ad-live-ping" />
          <span className="ad-live-dot" />
          <span className="ad-live-label">Live</span>
        </div>

        {/* Notifications Button & Dropdown */}
        <div className="ad-notif-dropdown-wrap">
          <button
            type="button"
            className="ad-icon-btn ad-notif-btn"
            onClick={() => {
              setNotifsDropdownOpen(!notifsDropdownOpen);
              setUserMenuOpen(false);
            }}
            aria-label="Notifications"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadNotifsCount > 0 && (
              <span className="ad-notif-badge">{unreadNotifsCount}</span>
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
                        <span className="ad-notif-time">{n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
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
          className="ad-icon-btn ad-theme-btn"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
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

        {/* Profile Pill & Dropdown */}
        <div className="ad-user-menu-wrap">
          <button
            type="button"
            className="ad-user-profile-btn"
            onClick={() => {
              setUserMenuOpen(!userMenuOpen);
              setNotifsDropdownOpen(false);
            }}
            aria-label="User Menu"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="ad-user-avatar-img" />
            ) : (
              <span className="ad-user-avatar-initials">{avatarInitials}</span>
            )}
            <div className="ad-user-meta">
              <span className="ad-user-name">{displayName}</span>
              <span className="ad-user-role-badge">Super Admin</span>
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
                  <p className="ad-dropdown-email">Platform Administrator</p>
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
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
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
  );
}
