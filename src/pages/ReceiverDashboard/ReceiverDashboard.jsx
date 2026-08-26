import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../components/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { foodService } from '../../services/foodService';
import { getAvatarUrl, getUserInitials } from '../../services/avatarService';
import AvatarPicker from '../../components/AvatarPicker/AvatarPicker';
import './ReceiverDashboard.css';

const FOOD_CATEGORIES = [
  'All',
  'Cooked Meals',
  'Bakery & Breads',
  'Fresh Produce',
  'Dairy & Groceries',
  'Packaged Food',
];

export default function ReceiverDashboard({ onNavigate }) {
  const { isDark, toggleTheme } = useTheme();
  const { user, profile, logout, refreshProfile } = useAuth();

  const avatarUrl = getAvatarUrl(profile, user);
  const avatarInitials = getUserInitials(profile, user);

  const [activeNav, setActiveNav] = useState('browse'); // 'browse' | 'requests' | 'impact' | 'support'
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

  // Data states
  const [availableFood, setAvailableFood] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [selectedFoodItem, setSelectedFoodItem] = useState(null);
  const [requestServings, setRequestServings] = useState(5);
  const [requestNotes, setRequestNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = (message, type = 'success', duration = 4000) => {
    setToastMessage(message);
    setToastType(type);
    if (duration > 0) {
      setTimeout(() => setToastMessage(''), duration);
    }
  };

  // ── Load Available Food and Requests ──
  const loadData = async () => {
    setLoadingData(true);
    try {
      // 1. Fetch available food listings
      const items = await foodService.getAvailableFoodItems({
        category: selectedCategory,
        searchQuery,
      });
      setAvailableFood(items || []);

      // 2. Fetch user's submitted requests if logged in
      if (user?.id) {
        const requests = await foodService.getReceiverRequests(user.id);
        setMyRequests(requests || []);
      }
    } catch (err) {
      console.warn('ReceiverDashboard fetch notice:', err.message);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id, selectedCategory]);

  // ── Realtime subscriptions for live updates ──
  useEffect(() => {
    // Subscribe to food_items changes (new listings, status changes)
    const foodChannel = supabase
      .channel('receiver_food_live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'food_items' },
        () => { loadData(); }
      )
      .subscribe();

    // Subscribe to food_requests changes (status updates on user's requests)
    const requestChannel = user?.id
      ? supabase
          .channel('receiver_requests_live')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'food_requests',
              filter: `receiver_id=eq.${user.id}`,
            },
            () => { loadData(); }
          )
          .subscribe()
      : null;

    return () => {
      supabase.removeChannel(foodChannel);
      if (requestChannel) supabase.removeChannel(requestChannel);
    };
  }, [user?.id]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  // ── Handle Request Submission ──
  const handleOpenRequestModal = (foodItem) => {
    setSelectedFoodItem(foodItem);
    setRequestServings(Math.min(foodItem.servings || 5, 10));
    setRequestNotes('');
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!selectedFoodItem) return;

    if (!user?.id) {
      showToast('Please log in to request food.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await foodService.createFoodRequest({
        foodId: selectedFoodItem.id,
        receiverId: user.id,
        donorId: selectedFoodItem.donor_id,
        requestedServings: parseInt(requestServings) || 1,
        notes: requestNotes.trim(),
      });

      showToast(`Request sent for "${selectedFoodItem.food_name}"! The donor has been alerted.`, 'success', 5000);
      setSelectedFoodItem(null);
      setActiveNav('requests');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Error submitting request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Handle Cancel Request ──
  const handleCancelRequest = async (requestId, foodId) => {
    try {
      await foodService.updateRequestStatus(requestId, foodId, 'cancelled');
      showToast('Request cancelled.', 'success');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to cancel request.', 'error');
    }
  };

  const handleLogout = async () => {
    await logout();
    if (onNavigate) onNavigate('home');
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoHome = () => {
    if (onNavigate) onNavigate('home');
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Computed display user information
  const displayName = profile?.full_name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Receiver');
  const firstName = displayName.split(' ')[0] || 'Receiver';
  const displayEmail = user?.email || 'receiver@foodbridge.org';
  const displayRole = profile?.role || user?.user_metadata?.role || 'Receiver';

  // Impact metrics
  const totalApprovedRequests = myRequests.filter((r) => r.status === 'accepted' || r.status === 'completed').length;
  const totalMealsReceived = myRequests
    .filter((r) => r.status === 'accepted' || r.status === 'completed')
    .reduce((sum, r) => sum + (Number(r.requested_servings) || Number(r.food?.servings) || 0), 0);

  return (
    <div className={`receiver-dashboard ${isDark ? 'dark-mode' : ''}`}>
      {/* ═══════════ SIDEBAR ═══════════ */}
      <aside className={`rd-sidebar ${mobileMenuOpen ? 'rd-sidebar-open' : ''}`}>
        <div className="rd-sidebar-header">
          <div className="rd-brand" onClick={handleGoHome} role="button" tabIndex={0}>
            <div className="rd-logo-icon">
              <svg viewBox="0 0 48 48" fill="none">
                <path d="M24 6 C21 10 21 15 24 18 C27 15 27 10 24 6 Z" fill="#16a34a" />
                <path d="M17 10 C14 12 14 16 18 18 C19 15 18 12 17 10 Z" fill="#16a34a" />
                <path d="M31 10 C34 12 34 16 30 18 C29 15 30 12 31 10 Z" fill="#16a34a" />
                <path d="M12 28 Q 24 16 36 28" stroke="#16a34a" strokeWidth="2.8" fill="none" />
                <line x1="18" y1="21" x2="18" y2="28" stroke="#16a34a" strokeWidth="2.2" />
                <line x1="24" y1="19" x2="24" y2="28" stroke="#16a34a" strokeWidth="2.2" />
                <line x1="30" y1="21" x2="30" y2="28" stroke="#16a34a" strokeWidth="2.2" />
                <path d="M10 30 C14 42 34 42 38 30" stroke="#16a34a" strokeWidth="2.8" fill="none" />
              </svg>
            </div>
            <div className="rd-brand-text">
              <span className="rd-brand-name">FoodBridge</span>
              <span className="rd-brand-tagline">Receiver Portal</span>
            </div>
          </div>
          <button
            type="button"
            className="rd-close-mobile-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="rd-nav">
          <button
            type="button"
            className={`rd-nav-item ${activeNav === 'browse' ? 'active' : ''}`}
            onClick={() => { setActiveNav('browse'); setMobileMenuOpen(false); }}
          >
            <svg className="rd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span>Browse Available Food</span>
          </button>

          <button
            type="button"
            className={`rd-nav-item ${activeNav === 'requests' ? 'active' : ''}`}
            onClick={() => { setActiveNav('requests'); setMobileMenuOpen(false); }}
          >
            <svg className="rd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <span>My Food Requests</span>
            {myRequests.length > 0 && <span className="rd-badge-count">{myRequests.length}</span>}
          </button>

          <button
            type="button"
            className={`rd-nav-item ${activeNav === 'impact' ? 'active' : ''}`}
            onClick={() => { setActiveNav('impact'); setMobileMenuOpen(false); }}
          >
            <svg className="rd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Community Impact</span>
          </button>

          <button
            type="button"
            className={`rd-nav-item ${activeNav === 'support' ? 'active' : ''}`}
            onClick={() => { setActiveNav('support'); setMobileMenuOpen(false); }}
          >
            <svg className="rd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>Help & Support</span>
          </button>
        </nav>

        {/* Sidebar Footer Motivation */}
        <div className="rd-sidebar-footer">
          <div className="rd-promo-box">
            <div className="rd-promo-text">
              Connecting surplus meals to those who need them most. 🤝
            </div>
          </div>
          <button
            type="button"
            className="rd-btn-refresh"
            onClick={loadData}
          >
            ↻ Refresh Food Listings
          </button>
        </div>
      </aside>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <div className="rd-main-container">
        {/* Top Header */}
        <header className="rd-top-header">
          <div className="rd-header-left">
            <button
              type="button"
              className="rd-hamburger-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="rd-welcome-wrap">
              <h1 className="rd-welcome-title">
                Hello, <span className="rd-highlight-name">{firstName}!</span> <span className="rd-wave">🌱</span>
              </h1>
              <p className="rd-welcome-subtitle">Browse available meals and request food for your organization or community.</p>
            </div>
          </div>

          <div className="rd-header-right">
            {/* Dark Mode Toggle */}
            <button
              type="button"
              className="rd-theme-btn"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {/* Profile Dropdown */}
            <div className="rd-user-profile-wrap">
              <button
                type="button"
                className="rd-user-profile-btn"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  avatarInitials
                )}
                <div className="rd-user-meta">
                  <span className="rd-user-fullname">{displayName}</span>
                  <span className="rd-user-role-badge">{displayRole}</span>
                </div>
                <svg
                  className={`rd-user-chevron ${userDropdownOpen ? 'open' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <AnimatePresence>
                {userDropdownOpen && (
                  <motion.div
                    className="rd-user-dropdown"
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="rd-dropdown-user-info">
                      <p className="rd-dropdown-name">{displayName}</p>
                      <p className="rd-dropdown-email">{displayEmail}</p>
                    </div>
                    <div className="rd-dropdown-divider" />
                    <button
                      type="button"
                      className="rd-dropdown-item"
                      onClick={() => { setUserDropdownOpen(false); setAvatarPickerOpen(true); }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      Change Avatar
                    </button>
                    <button
                      type="button"
                      className="rd-dropdown-item"
                      onClick={() => { setUserDropdownOpen(false); handleGoHome(); }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      </svg>
                      Back to FoodBridge Home
                    </button>
                    <div className="rd-dropdown-divider" />
                    <button
                      type="button"
                      className="rd-dropdown-item rd-logout-item"
                      onClick={() => { setUserDropdownOpen(false); handleLogout(); }}
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

        {/* Global Toast Message */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              className="rd-floating-toast"
              style={{
                background: toastType === 'error' ? '#fef2f2' : '#edf7ee',
                border: `1.5px solid ${toastType === 'error' ? '#fecaca' : '#a7f3d0'}`,
                color: toastType === 'error' ? '#991b1b' : '#065f46',
              }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════ MAIN CONTENT BODY ═══════════ */}
        {activeNav === 'browse' && (
          <div className="rd-browse-view">
            {/* Search & Category Filter Bar */}
            <div className="rd-filter-panel">
              <form className="rd-search-box" onSubmit={handleSearchSubmit}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="rd-search-icon">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search available food items (e.g. Biryani, Rice, Bread)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="rd-search-btn">Search</button>
              </form>

              <div className="rd-category-pills">
                {FOOD_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`rd-cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Food Items Grid */}
            <div className="rd-items-section">
              <div className="rd-section-title-wrap">
                <h2 className="rd-section-title">Available Food Listings</h2>
                <span className="rd-items-count-badge">{availableFood.length} available</span>
              </div>

              {availableFood.length > 0 ? (
                <div className="rd-food-grid">
                  {availableFood.map((item) => (
                    <motion.div
                      key={item.id}
                      className="rd-food-card"
                      whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.06)' }}
                    >
                      <div className="rd-card-img-wrap">
                        <img
                          src={item.image_url || '/assets/dish_biryani.jpg'}
                          alt={item.food_name}
                          className="rd-card-img"
                        />
                        <span className="rd-card-cat-badge">{item.category}</span>
                      </div>

                      <div className="rd-card-content">
                        <h3 className="rd-card-title">{item.food_name}</h3>
                        {item.description && <p className="rd-card-desc">{item.description}</p>}

                        <div className="rd-card-details">
                          <div className="rd-detail-row">
                            <span className="rd-detail-label">Quantity:</span>
                            <span className="rd-detail-val">{item.quantity || `${item.servings} servings`}</span>
                          </div>
                          <div className="rd-detail-row">
                            <span className="rd-detail-label">Pickup:</span>
                            <span className="rd-detail-val">{item.pickup_location}</span>
                          </div>
                          <div className="rd-detail-row">
                            <span className="rd-detail-label">Time Window:</span>
                            <span className="rd-detail-val">{item.pickup_time || 'Today'}</span>
                          </div>
                          {item.donor?.full_name && (
                            <div className="rd-detail-row">
                              <span className="rd-detail-label">Donor:</span>
                              <span className="rd-detail-val rd-donor-tag">
                                {item.donor.organization_name || item.donor.full_name}
                              </span>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          className="rd-btn-request-food"
                          onClick={() => handleOpenRequestModal(item)}
                        >
                          Request This Food
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="rd-empty-state">
                  <div className="rd-empty-icon-circle">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                    </svg>
                  </div>
                  <h3>No food items currently available</h3>
                  <p>Check back shortly as donors post newly available surplus meals throughout the day.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════ MY REQUESTS VIEW ═══════════ */}
        {activeNav === 'requests' && (
          <div className="rd-requests-view">
            <div className="rd-section-title-wrap">
              <h2 className="rd-section-title">My Food Requests</h2>
              <span className="rd-items-count-badge">{myRequests.length} total</span>
            </div>

            {myRequests.length > 0 ? (
              <div className="rd-requests-list">
                {myRequests.map((req) => (
                  <div key={req.id} className="rd-request-row">
                    <img
                      src={req.food?.image_url || '/assets/dish_biryani.jpg'}
                      alt={req.food?.food_name || 'Food item'}
                      className="rd-request-thumb"
                    />

                    <div className="rd-request-main">
                      <h4 className="rd-request-food-name">{req.food?.food_name || 'Food Donation'}</h4>
                      <p className="rd-request-sub">
                        Requested: <strong>{req.requested_servings || req.food?.servings || 1} servings</strong> • Pickup: {req.food?.pickup_location}
                      </p>
                      {req.donor?.full_name && (
                        <p className="rd-request-donor">
                          Donor: {req.donor.organization_name || req.donor.full_name} {req.donor.phone ? `(${req.donor.phone})` : ''}
                        </p>
                      )}
                    </div>

                    <div className="rd-request-status-col">
                      <span className={`rd-status-pill rd-status-${req.status}`}>
                        {req.status.toUpperCase()}
                      </span>
                      <span className="rd-request-time">
                        {new Date(req.requested_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>

                    {req.status === 'pending' && (
                      <button
                        type="button"
                        className="rd-btn-cancel-req"
                        onClick={() => handleCancelRequest(req.id, req.food_id)}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rd-empty-state">
                <h3>No requests placed yet</h3>
                <p>Browse available food listings and send a request to a donor.</p>
                <button
                  type="button"
                  className="rd-btn-browse-action"
                  onClick={() => setActiveNav('browse')}
                >
                  Browse Available Food
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ IMPACT VIEW ═══════════ */}
        {activeNav === 'impact' && (
          <div className="rd-impact-view">
            <div className="rd-impact-grid">
              <div className="rd-stat-card">
                <span className="rd-stat-num">{totalApprovedRequests}</span>
                <span className="rd-stat-label">Approved Food Requests</span>
              </div>
              <div className="rd-stat-card">
                <span className="rd-stat-num">{totalMealsReceived}</span>
                <span className="rd-stat-label">Meals Received & Shared</span>
              </div>
              <div className="rd-stat-card">
                <span className="rd-stat-num">{(totalMealsReceived * 0.4).toFixed(1)} <small>KG</small></span>
                <span className="rd-stat-label">Food Waste Rescued</span>
              </div>
              <div className="rd-stat-card">
                <span className="rd-stat-num">{(totalMealsReceived * 0.4 * 2.98).toFixed(1)} <small>KG</small></span>
                <span className="rd-stat-label">CO₂ Emissions Avoided</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════ REQUEST MODAL ═══════════ */}
      <AnimatePresence>
        {selectedFoodItem && (
          <div className="rd-modal-backdrop" onClick={() => setSelectedFoodItem(null)}>
            <motion.div
              className="rd-modal-box"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
            >
              <button
                type="button"
                className="rd-modal-close"
                onClick={() => setSelectedFoodItem(null)}
                aria-label="Close modal"
              >
                ✕
              </button>

              <div className="rd-modal-body">
                <h3>Request Food Donation</h3>
                <p>Submit your request for <strong>{selectedFoodItem.food_name}</strong> to the donor.</p>

                <div className="rd-modal-food-summary">
                  <div><strong>Available:</strong> {selectedFoodItem.quantity || `${selectedFoodItem.servings} servings`}</div>
                  <div><strong>Pickup Location:</strong> {selectedFoodItem.pickup_location}</div>
                  <div><strong>Time Slot:</strong> {selectedFoodItem.pickup_time}</div>
                </div>

                <form onSubmit={handleSubmitRequest}>
                  <div className="rd-modal-field">
                    <label>Servings Needed</label>
                    <input
                      type="number"
                      min="1"
                      max={selectedFoodItem.servings || 100}
                      value={requestServings}
                      onChange={(e) => setRequestServings(e.target.value)}
                      required
                    />
                  </div>

                  <div className="rd-modal-field">
                    <label>Distribution Plan / Note for Donor (Optional)</label>
                    <textarea
                      placeholder="e.g. Will be distributed at our community shelter at 6:00 PM..."
                      rows="3"
                      value={requestNotes}
                      onChange={(e) => setRequestNotes(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="rd-modal-submit-btn" disabled={submitting}>
                    {submitting ? 'Submitting Request...' : 'Confirm Food Request'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Avatar Picker Modal */}
      <AvatarPicker
        isOpen={avatarPickerOpen}
        onClose={() => setAvatarPickerOpen(false)}
        currentAvatar={profile?.avatar_url}
        userId={user?.id}
        profile={profile}
        user={user}
        onAvatarChange={() => {
          refreshProfile();
          showToast('Avatar updated successfully!', 'success');
        }}
      />
    </div>
  );
}
