import '../AdminDashboard.css';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminSearchModal({
  isOpen,
  onClose,
  users = [],
  foodItems = [],
  onSelectNav,
  onSelectUser,
  onSelectDonation,
}) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return { pages: [], users: [], donations: [] };
    const q = query.toLowerCase().trim();

    const pages = [
      { id: 'overview', title: 'Dashboard Overview', icon: '📊' },
      { id: 'users', title: 'User Management', icon: '👥' },
      { id: 'donors', title: 'Donor Directory', icon: '🌱' },
      { id: 'receivers', title: 'NGO & Shelters', icon: '🤝' },
      { id: 'donations', title: 'Food Donation Listings', icon: '🍲' },
      { id: 'pickups', title: 'Pickups & Logistics', icon: '🚚' },
      { id: 'categories', title: 'Meal Categories', icon: '📦' },
      { id: 'analytics', title: 'Analytics & Carbon Offsets', icon: '🌍' },
      { id: 'messages', title: 'Community Feedback', icon: '✉️' },
      { id: 'settings', title: 'Profile & Settings', icon: '⚙️' },
    ].filter((p) => p.title.toLowerCase().includes(q));

    const matchedUsers = users
      .filter((u) => {
        const name = (u.full_name || '').toLowerCase();
        const org = (u.organization_name || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        return name.includes(q) || org.includes(q) || email.includes(q);
      })
      .slice(0, 4);

    const matchedDonations = foodItems
      .filter((f) => {
        const name = (f.food_name || '').toLowerCase();
        const cat = (f.category || '').toLowerCase();
        return name.includes(q) || cat.includes(q);
      })
      .slice(0, 4);

    return { pages, users: matchedUsers, donations: matchedDonations };
  }, [query, users, foodItems]);

  if (!isOpen) return null;

  return (
    <div className="ad-modal-backdrop" onClick={onClose}>
      <motion.div
        className="ad-search-palette-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ duration: 0.15 }}
      >
        {/* Search input box */}
        <div className="ad-palette-input-wrap">
          <svg className="ad-palette-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="ad-palette-input"
            placeholder="Search commands, users, listings, or views..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <span className="ad-palette-esc-badge">ESC</span>
        </div>

        {/* Results List */}
        <div className="ad-palette-results-list">
          {/* Quick Views */}
          {results.pages.length > 0 && (
            <div className="ad-palette-group">
              <div className="ad-palette-group-title">Navigation Views</div>
              {results.pages.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="ad-palette-item"
                  onClick={() => {
                    onSelectNav(p.id);
                    onClose();
                  }}
                >
                  <span className="ad-palette-icon">{p.icon}</span>
                  <span className="ad-palette-label">{p.title}</span>
                </button>
              ))}
            </div>
          )}

          {/* Users */}
          {results.users.length > 0 && (
            <div className="ad-palette-group">
              <div className="ad-palette-group-title">Users & Organizations</div>
              {results.users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  className="ad-palette-item"
                  onClick={() => {
                    onSelectNav(u.role === 'receiver' ? 'receivers' : 'users');
                    onClose();
                  }}
                >
                  <span className="ad-palette-icon">{u.role === 'receiver' ? '🏢' : '👤'}</span>
                  <div className="ad-palette-col">
                    <span className="ad-palette-label">{u.full_name || 'Community Member'}</span>
                    <span className="ad-palette-sub">{u.organization_name || u.email} ({u.role})</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Donations */}
          {results.donations.length > 0 && (
            <div className="ad-palette-group">
              <div className="ad-palette-group-title">Food Donation Listings</div>
              {results.donations.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className="ad-palette-item"
                  onClick={() => {
                    onSelectNav('donations');
                    onClose();
                  }}
                >
                  <span className="ad-palette-icon">🍲</span>
                  <div className="ad-palette-col">
                    <span className="ad-palette-label">{f.food_name}</span>
                    <span className="ad-palette-sub">{f.category} · {f.servings || 1} servings · #{String(f.id).slice(0, 4)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {query.trim() &&
            results.pages.length === 0 &&
            results.users.length === 0 &&
            results.donations.length === 0 && (
              <div className="ad-palette-empty">
                No matching results found for "{query}".
              </div>
            )}

          {!query.trim() && (
            <div className="ad-palette-hints">
              <span className="ad-palette-hint-title">Quick Shortcuts:</span>
              <div className="ad-palette-hint-chips">
                <span onClick={() => setQuery('users')}>👥 Users</span>
                <span onClick={() => setQuery('donations')}>🍲 Donations</span>
                <span onClick={() => setQuery('analytics')}>🌍 Analytics</span>
                <span onClick={() => setQuery('messages')}>✉️ Inquiries</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
