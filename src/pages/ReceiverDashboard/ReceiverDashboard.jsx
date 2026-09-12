import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../components/ThemeContext';
import { useAuth, checkIsAdmin } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { foodService } from '../../services/foodService';
import { pickupService } from '../../services/pickupService';
import { notificationService } from '../../services/notificationService';
import { getAvatarUrl, getUserInitials } from '../../services/avatarService';
import AvatarPicker from '../../components/AvatarPicker/AvatarPicker';
import MapView from '../../components/MapView/MapView';
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
  const { user, profile, role, isAdmin, logout, refreshProfile } = useAuth();
  const isUserAdmin = isAdmin || role === 'admin' || checkIsAdmin(user, profile, role);

  const avatarUrl = getAvatarUrl(profile, user);
  const avatarInitials = getUserInitials(profile, user);

  // Navigation & View Modes
  const [activeNav, setActiveNav] = useState('browse'); // 'browse' | 'requests' | 'impact' | 'support'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'
  const [requestFilter, setRequestFilter] = useState('all'); // 'all' | 'ready' | 'pending' | 'completed'
  const [fulfillmentFilter, setFulfillmentFilter] = useState('all'); // 'all' | 'receiver_pickup' | 'donor_delivery'

  // Dropdowns and Drawers
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [copiedOtpId, setCopiedOtpId] = useState(null);

  // Data states
  const [availableFood, setAvailableFood] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states for requesting food
  const [selectedFoodItem, setSelectedFoodItem] = useState(null);
  const [requestServings, setRequestServings] = useState(5);
  const [requestNotes, setRequestNotes] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  const showToast = (message, type = 'success', duration = 4000) => {
    setToastMessage(message);
    setToastType(type);
    if (duration > 0) {
      setTimeout(() => setToastMessage(''), duration);
    }
  };

  // ── Load Available Food and Requests ──
  const loadData = async () => {
    try {
      // 1. Fetch available food listings
      const items = await foodService.getAvailableFoodItems({
        category: selectedCategory,
        searchQuery,
      });
      setAvailableFood(items || []);

      // 2. Fetch user's submitted requests & pickups & notifications if logged in
      if (user?.id) {
        const [requests, userPickups, userNotifs, unreadCount] = await Promise.all([
          foodService.getReceiverRequests(user.id),
          pickupService.getReceiverPickups(user.id).catch(() => []),
          notificationService.getUserNotifications(user.id, 15).catch(() => []),
          notificationService.getUnreadCount(user.id).catch(() => 0),
        ]);
        setMyRequests(requests || []);
        setPickups(userPickups || []);
        setNotifications(userNotifs || []);
        setUnreadNotifsCount(unreadCount || 0);
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
    const foodChannel = supabase
      .channel('receiver_food_live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'food_items' },
        () => { loadData(); }
      )
      .subscribe();

    const requestChannel = user?.id
      ? supabase
          .channel(`receiver_requests_live_${user.id}`)
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

    const pickupChannel = user?.id
      ? supabase
          .channel(`receiver_pickups_live_${user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'pickup_records',
              filter: `receiver_id=eq.${user.id}`,
            },
            () => { loadData(); }
          )
          .subscribe()
      : null;

    const notifChannel = user?.id
      ? supabase
          .channel(`receiver_notifs_live_${user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            () => { loadData(); }
          )
          .subscribe()
      : null;

    return () => {
      supabase.removeChannel(foodChannel);
      if (requestChannel) supabase.removeChannel(requestChannel);
      if (pickupChannel) supabase.removeChannel(pickupChannel);
      if (notifChannel) supabase.removeChannel(notifChannel);
    };
  }, [user?.id]);

  // Handle outside clicks for dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedFoodItem(null);
        setUserDropdownOpen(false);
        setNotifOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  // ── Handle Request Submission ──
  const handleOpenRequestModal = (foodItem) => {
    setSelectedFoodItem(foodItem);
    setRequestServings(Math.min(foodItem.servings || 5, 10));
    setRequestNotes('');
    setDeliveryAddress(profile?.address || '');
    setDeliveryPhone(profile?.phone || '');
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!selectedFoodItem) return;

    if (!user?.id) {
      showToast('Please log in to request food.', 'error');
      return;
    }

    const fulfillmentType = selectedFoodItem.fulfillment_type || 'receiver_pickup';
    if (fulfillmentType === 'donor_delivery' && !deliveryAddress.trim()) {
      showToast('Please specify your delivery address so the donor can dispatch the food.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await foodService.createFoodRequest({
        foodId: selectedFoodItem.id,
        receiverId: user.id,
        donorId: selectedFoodItem.donor_id,
        requestedServings: parseInt(requestServings, 10) || 1,
        notes: requestNotes.trim(),
        fulfillmentType,
        deliveryAddress: deliveryAddress.trim() || profile?.address || '',
        deliveryPhone: deliveryPhone.trim() || profile?.phone || '',
      });

      // Notify the donor
      try {
        await notificationService.notifyNewRequest(
          selectedFoodItem.donor_id,
          profile?.organization_name || profile?.full_name || 'Community Receiver',
          selectedFoodItem.food_name,
          selectedFoodItem.id
        );
      } catch (notifErr) {
        console.warn('Notification notice:', notifErr.message);
      }

      showToast(`Request placed for "${selectedFoodItem.food_name}". Donor has been notified.`, 'success', 5000);
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
      showToast('Request cancelled successfully.', 'success');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to cancel request.', 'error');
    }
  };

  // ── Handle Copy OTP ──
  const handleCopyOtp = (otpCode, id) => {
    if (!otpCode) return;
    navigator.clipboard.writeText(otpCode);
    setCopiedOtpId(id);
    showToast(`Security OTP ${otpCode} copied to clipboard`, 'success', 2200);
    setTimeout(() => {
      setCopiedOtpId((prev) => (prev === id ? null : prev));
    }, 2200);
  };

  // ── Notifications Actions ──
  const handleMarkAsRead = async (notifId) => {
    try {
      await notificationService.markAsRead(notifId);
      setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n)));
      setUnreadNotifsCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('Error marking notification as read:', err.message);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadNotifsCount(0);
    } catch (err) {
      console.warn('Error marking all notifications as read:', err.message);
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

  // Computed display data
  const displayName = profile?.organization_name || profile?.full_name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Community Partner');
  const displayRole = profile?.role === 'ngo' ? 'Verified NGO Partner' : 'Community Receiver';

  // Impact metrics
  const totalApprovedRequests = myRequests.filter((r) => r.status === 'accepted' || r.status === 'completed').length;
  const totalMealsReceived = myRequests
    .filter((r) => r.status === 'accepted' || r.status === 'completed')
    .reduce((sum, r) => sum + (Number(r.requested_servings) || Number(r.food?.servings) || 0), 0);
  const totalWastePreventedKg = (totalMealsReceived * 0.4).toFixed(1);
  const totalCo2AvertedKg = (totalMealsReceived * 0.4 * 2.98).toFixed(1);

  // Active / Ready for Pickup Missions (Crucial operational item)
  const activeDispatches = useMemo(() => {
    return myRequests
      .filter((req) => req.status === 'accepted' || req.status === 'assigned')
      .map((req) => {
        const matchedPickup = pickups.find(
          (p) => p.request_id === req.id || p.food_id === req.food_id
        );
        return {
          ...req,
          pickup: matchedPickup,
          otpCode: matchedPickup?.otp_code,
        };
      });
  }, [myRequests, pickups]);

  // Filtered Food Listings
  const filteredFood = useMemo(() => {
    return availableFood.filter((item) => {
      if (fulfillmentFilter !== 'all') {
        const type = item.fulfillment_type || 'receiver_pickup';
        if (type !== fulfillmentFilter) return false;
      }
      return true;
    });
  }, [availableFood, fulfillmentFilter]);

  // Filtered Requests
  const filteredRequests = useMemo(() => {
    return myRequests.filter((req) => {
      if (requestFilter === 'ready') return req.status === 'accepted' || req.status === 'assigned';
      if (requestFilter === 'pending') return req.status === 'pending';
      if (requestFilter === 'completed') return req.status === 'completed';
      return true;
    });
  }, [myRequests, requestFilter]);

  // Map markers preparation
  const mapCenter = useMemo(() => {
    const itemWithCoords = availableFood.find((i) => i.latitude && i.longitude);
    if (itemWithCoords) {
      return { lat: itemWithCoords.latitude, lng: itemWithCoords.longitude };
    }
    return { lat: 28.6139, lng: 77.209 }; // Default Delhi Coordinates
  }, [availableFood]);

  if (loadingData && availableFood.length === 0 && myRequests.length === 0) {
    return (
      <div className={`receiver-dashboard ${isDark ? 'dark-mode' : ''}`}>
        <div className="rd-skeleton-loader-screen">
          <div className="rd-skeleton-spinner" />
          <p className="rd-skeleton-text">Synchronizing Food Rescue Network...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`receiver-dashboard ${isDark ? 'dark-mode' : ''}`}>
      {/* ═══════════ ARCHITECTURAL TOP COMMAND BAR ═══════════ */}
      <header className="rd-command-bar">
        <div className="rd-command-left">
          <button
            type="button"
            className="rd-mobile-menu-trigger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation drawer"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="rd-brand-capsule" onClick={handleGoHome} role="button" tabIndex={0}>
            <div className="rd-brand-mark">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="rd-brand-meta">
              <span className="rd-brand-title">FoodBridge</span>
              <span className="rd-brand-subtitle">Receiver Console</span>
            </div>
          </div>
        </div>

        {/* Center Navigation Hub */}
        <nav className="rd-command-nav">
          <button
            type="button"
            className={`rd-nav-link ${activeNav === 'browse' ? 'active' : ''}`}
            onClick={() => setActiveNav('browse')}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </svg>
            <span>Available Surplus</span>
            {availableFood.length > 0 && <span className="rd-nav-counter">{availableFood.length}</span>}
          </button>

          <button
            type="button"
            className={`rd-nav-link ${activeNav === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveNav('requests')}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <span>My Requests</span>
            {activeDispatches.length > 0 && (
              <span className="rd-nav-counter alert" title={`${activeDispatches.length} active pickups ready!`}>
                {activeDispatches.length}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`rd-nav-link ${activeNav === 'impact' ? 'active' : ''}`}
            onClick={() => setActiveNav('impact')}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
              <path d="M22 12A10 10 0 0 0 12 2v10z" />
            </svg>
            <span>Verified Impact</span>
          </button>

          <button
            type="button"
            className={`rd-nav-link ${activeNav === 'support' ? 'active' : ''}`}
            onClick={() => setActiveNav('support')}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>Protocols & Help</span>
          </button>
        </nav>

        {/* Right Tools & User Profile */}
        <div className="rd-command-right">
          {/* Refresh Action */}
          <button
            type="button"
            className="rd-icon-tool-btn"
            onClick={loadData}
            title="Refresh network inventory"
            aria-label="Refresh inventory"
          >
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            type="button"
            className="rd-icon-tool-btn"
            onClick={toggleTheme}
            aria-label="Toggle visual theme"
            title={isDark ? 'Switch to daylight theme' : 'Switch to nocturnal theme'}
          >
            {isDark ? (
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {/* Notifications Center */}
          <div className="rd-popover-anchor" ref={notifRef}>
            <button
              type="button"
              className={`rd-icon-tool-btn ${unreadNotifsCount > 0 ? 'has-unread' : ''}`}
              onClick={() => setNotifOpen(!notifOpen)}
              aria-label="Notifications"
              title="Notifications & Dispatches"
            >
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadNotifsCount > 0 && <span className="rd-unread-badge">{unreadNotifsCount}</span>}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  className="rd-notif-popover"
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="rd-popover-header">
                    <div className="rd-popover-title-row">
                      <h4>Notifications & Alerts</h4>
                      {unreadNotifsCount > 0 && (
                        <button type="button" className="rd-popover-action" onClick={handleMarkAllRead}>
                          Mark all as read
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="rd-notif-scroll-list">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`rd-notif-card ${!n.is_read ? 'unread' : ''}`}
                          onClick={() => handleMarkAsRead(n.id)}
                        >
                          <div className="rd-notif-indicator" />
                          <div className="rd-notif-body">
                            <p className="rd-notif-title">{n.title}</p>
                            <p className="rd-notif-message">{n.message}</p>
                            <span className="rd-notif-timestamp">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                              {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rd-popover-empty">
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <p>No new notifications at this time.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile Capsule */}
          <div className="rd-popover-anchor" ref={userMenuRef}>
            <button
              type="button"
              className="rd-user-capsule-btn"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              aria-label="User Account Menu"
            >
              <div className="rd-user-avatar">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} />
                ) : (
                  <span>{avatarInitials}</span>
                )}
              </div>
              <div className="rd-user-details">
                <span className="rd-user-name">{displayName}</span>
                <span className="rd-user-badge">{displayRole}</span>
              </div>
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className={`rd-chevron ${userDropdownOpen ? 'open' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            <AnimatePresence>
              {userDropdownOpen && (
                <motion.div
                  className="rd-user-dropdown-popover"
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="rd-dropdown-profile-snippet">
                    <p className="rd-snippet-name">{displayName}</p>
                    <p className="rd-snippet-email">{user?.email || 'receiver@foodbridge.org'}</p>
                    <span className="rd-snippet-role-tag">{displayRole}</span>
                  </div>

                  <div className="rd-dropdown-divider" />

                  <button
                    type="button"
                    className="rd-dropdown-link"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      setAvatarPickerOpen(true);
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    Profile & Organization Details
                  </button>

                  {isUserAdmin && (
                    <button
                      type="button"
                      className="rd-dropdown-link rd-admin-link"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        if (onNavigate) onNavigate('admin-dashboard');
                        window.location.hash = '#admin-dashboard';
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" rx="1.5" />
                        <rect x="14" y="3" width="7" height="7" rx="1.5" />
                        <rect x="14" y="14" width="7" height="7" rx="1.5" />
                        <rect x="3" y="14" width="7" height="7" rx="1.5" />
                      </svg>
                      Open Admin Oversight Panel
                    </button>
                  )}

                  <button
                    type="button"
                    className="rd-dropdown-link"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      handleGoHome();
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    </svg>
                    Return to Public Portal
                  </button>

                  <div className="rd-dropdown-divider" />

                  <button
                    type="button"
                    className="rd-dropdown-link rd-logout-btn"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      handleLogout();
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="rd-mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
            <motion.div
              className="rd-mobile-drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ ease: [0.32, 0.72, 0, 1], duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="rd-drawer-header">
                <div className="rd-brand-capsule">
                  <div className="rd-brand-mark">FB</div>
                  <div className="rd-brand-meta">
                    <span className="rd-brand-title">FoodBridge</span>
                    <span className="rd-brand-subtitle">Receiver Mobile</span>
                  </div>
                </div>
                <button type="button" className="rd-drawer-close" onClick={() => setMobileMenuOpen(false)}>
                  ✕
                </button>
              </div>

              <div className="rd-drawer-nav">
                <button
                  type="button"
                  className={`rd-drawer-item ${activeNav === 'browse' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveNav('browse');
                    setMobileMenuOpen(false);
                  }}
                >
                  Available Food Listings ({availableFood.length})
                </button>
                <button
                  type="button"
                  className={`rd-drawer-item ${activeNav === 'requests' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveNav('requests');
                    setMobileMenuOpen(false);
                  }}
                >
                  My Food Requests ({myRequests.length})
                </button>
                <button
                  type="button"
                  className={`rd-drawer-item ${activeNav === 'impact' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveNav('impact');
                    setMobileMenuOpen(false);
                  }}
                >
                  Community Impact
                </button>
                <button
                  type="button"
                  className={`rd-drawer-item ${activeNav === 'support' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveNav('support');
                    setMobileMenuOpen(false);
                  }}
                >
                  Protocols & Help
                </button>
                <button
                  type="button"
                  className="rd-drawer-item"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAvatarPickerOpen(true);
                  }}
                >
                  Profile & Settings
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Tactical Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            className={`rd-toast-banner ${toastType}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <span className="rd-toast-indicator" />
            <span className="rd-toast-copy">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════ PRIMARY VIEWPORT CONTENT ═══════════ */}
      <main className="rd-content-stage">
        {/* ─── URGENT DISPATCH TICKETS ("Needs Your Attention Now") ─── */}
        {activeDispatches.length > 0 && (
          <section className="rd-action-hub-section" aria-label="Active Pickups Needing Attention">
            <div className="rd-hub-header">
              <div className="rd-pulse-tag">
                <span className="rd-live-dot" />
                <span>ACTION REQUIRED • {activeDispatches.length} ACTIVE DISPATCH{activeDispatches.length > 1 ? 'ES' : ''}</span>
              </div>
              <p className="rd-hub-subtext">The donor has accepted your request. Present the secure verification code upon handover.</p>
            </div>

            <div className="rd-tickets-track">
              {activeDispatches.map((dispatch) => {
                const isDelivery = dispatch.fulfillment_type === 'donor_delivery' || dispatch.food?.fulfillment_type === 'donor_delivery';
                return (
                  <div key={dispatch.id} className="rd-dispatch-ticket">
                    <div className="rd-ticket-core">
                      <div className="rd-ticket-eyebrow">
                        <span className={`rd-type-tag ${isDelivery ? 'delivery' : 'pickup'}`}>
                          {isDelivery ? '🚗 DONOR DELIVERY TO YOUR ADDRESS' : '🚶 RECEIVER PICKUP AT LOCATION'}
                        </span>
                        <span className="rd-status-approved">CONFIRMED & READY</span>
                      </div>

                      <h3 className="rd-ticket-dish-name">{dispatch.food?.food_name || 'Food Donation'}</h3>

                      <div className="rd-ticket-meta-grid">
                        <div className="rd-meta-cell">
                          <span className="rd-meta-label">Allocation</span>
                          <span className="rd-meta-val">{dispatch.requested_servings || dispatch.food?.servings || 1} Servings</span>
                        </div>
                        <div className="rd-meta-cell">
                          <span className="rd-meta-label">{isDelivery ? 'Delivery Destination' : 'Pickup Point'}</span>
                          <span className="rd-meta-val truncate">
                            {isDelivery
                              ? dispatch.delivery_address || profile?.address || 'Your Registered Address'
                              : dispatch.food?.pickup_location || 'Donor Kitchen Point'}
                          </span>
                        </div>
                        <div className="rd-meta-cell">
                          <span className="rd-meta-label">Donor Contact</span>
                          <span className="rd-meta-val">
                            {dispatch.donor?.organization_name || dispatch.donor?.full_name || 'Donor'}
                            {dispatch.donor?.phone ? ` (${dispatch.donor.phone})` : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Perforated Security Code Compartment */}
                    <div className="rd-ticket-stub">
                      <span className="rd-stub-label">{isDelivery ? 'DELIVERY HANDOVER OTP' : 'COLLECTION VERIFY OTP'}</span>
                      <div className="rd-otp-code-box">
                        <span className="rd-otp-digits">{dispatch.otpCode || '----'}</span>
                        <button
                          type="button"
                          className="rd-copy-otp-btn"
                          onClick={() => handleCopyOtp(dispatch.otpCode, dispatch.id)}
                          title="Copy OTP to clipboard"
                        >
                          {copiedOtpId === dispatch.id ? (
                            <span className="copied-text">Copied!</span>
                          ) : (
                            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <p className="rd-stub-instruction">
                        {isDelivery
                          ? 'Provide to the donor when they deliver.'
                          : 'Show this 4-digit OTP code to the kitchen staff.'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── TAB 1: BROWSE AVAILABLE FOOD & RADAR MAP ─── */}
        {activeNav === 'browse' && (
          <div className="rd-browse-hub">
            {/* Filter & View Switcher Toolbar */}
            <div className="rd-control-toolbar">
              <form className="rd-search-input-wrap" onSubmit={handleSearchSubmit}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="rd-search-glass">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search available meals, donor restaurants, or ingredients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rd-main-search-input"
                  aria-label="Search available food"
                />
                {searchQuery && (
                  <button type="button" className="rd-clear-search" onClick={() => { setSearchQuery(''); loadData(); }}>
                    ✕
                  </button>
                )}
                <button type="submit" className="rd-search-submit-btn">
                  Search
                </button>
              </form>

              {/* View Mode & Fulfillment Filter */}
              <div className="rd-toolbar-options">
                <div className="rd-segmented-switch" role="group" aria-label="Fulfillment Filter">
                  <button
                    type="button"
                    className={`rd-switch-option ${fulfillmentFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setFulfillmentFilter('all')}
                  >
                    All Modes
                  </button>
                  <button
                    type="button"
                    className={`rd-switch-option ${fulfillmentFilter === 'receiver_pickup' ? 'active' : ''}`}
                    onClick={() => setFulfillmentFilter('receiver_pickup')}
                  >
                    Self Pickup
                  </button>
                  <button
                    type="button"
                    className={`rd-switch-option ${fulfillmentFilter === 'donor_delivery' ? 'active' : ''}`}
                    onClick={() => setFulfillmentFilter('donor_delivery')}
                  >
                    Donor Delivery
                  </button>
                </div>

                <div className="rd-view-toggle-wrap">
                  <button
                    type="button"
                    className={`rd-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                    title="Grid Gallery View"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="14" width="7" height="7" rx="1.5" />
                      <rect x="3" y="14" width="7" height="7" rx="1.5" />
                    </svg>
                    <span>Gallery</span>
                  </button>
                  <button
                    type="button"
                    className={`rd-view-btn ${viewMode === 'map' ? 'active' : ''}`}
                    onClick={() => setViewMode('map')}
                    title="Spatial Rescue Map"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                      <line x1="8" y1="2" x2="8" y2="18" />
                      <line x1="16" y1="6" x2="16" y2="22" />
                    </svg>
                    <span>Radar Map</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Category Chips Bar */}
            <div className="rd-category-rail">
              {FOOD_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`rd-cat-chip ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* View Mode 1: Interactive Map Radar */}
            {viewMode === 'map' && (
              <div className="rd-spatial-radar-card">
                <div className="rd-radar-header">
                  <div>
                    <h3 className="rd-radar-title">Geographic Surplus Radar</h3>
                    <p className="rd-radar-sub">Real-time coordinates of available donor kitchens and pickup depots.</p>
                  </div>
                  <span className="rd-radar-count">{filteredFood.length} Active Locations</span>
                </div>

                <div className="rd-map-container-shell">
                  <MapView
                    center={mapCenter}
                    items={filteredFood.map((item, idx) => ({
                      ...item,
                      title: item.food_name,
                      food_name: item.food_name,
                      servingsCount: item.servings,
                      latitude: item.latitude || (mapCenter.lat + ((idx % 4) - 1.5) * 0.018),
                      longitude: item.longitude || (mapCenter.lng + (((idx * 2) % 4) - 1.5) * 0.018),
                      pickup_location: item.pickup_location,
                    }))}
                    height="540px"
                    showRadius={true}
                    rescueRadius={15}
                    onItemClick={(item) => handleOpenRequestModal(item)}
                  />
                </div>
              </div>
            )}

            {/* View Mode 2: Responsive Bento Gallery */}
            {viewMode === 'grid' && (
              <div className="rd-gallery-section">
                <div className="rd-gallery-stats-bar">
                  <span className="rd-inventory-headline">
                    Showing <strong>{filteredFood.length}</strong> available food {filteredFood.length === 1 ? 'donation' : 'donations'}
                  </span>
                  {selectedCategory !== 'All' && (
                    <span className="rd-active-filter-badge">
                      Category: {selectedCategory}
                    </span>
                  )}
                </div>

                {filteredFood.length > 0 ? (
                  <div className="rd-cards-grid">
                    {filteredFood.map((item) => {
                      const isDelivery = item.fulfillment_type === 'donor_delivery';
                      const portions = item.quantity || `${item.servings || 10} portions`;

                      return (
                        <div key={item.id} className="rd-food-item-card">
                          <div className="rd-card-visual">
                            <img
                              src={item.image_url || '/assets/dish_biryani.jpg'}
                              alt={item.food_name}
                              loading="lazy"
                            />
                            <div className="rd-card-pill-row">
                              <span className="rd-category-tag">{item.category || 'General'}</span>
                              <span className={`rd-fulfillment-tag ${isDelivery ? 'delivery' : 'pickup'}`}>
                                {isDelivery ? '🚗 Delivery' : '🚶 Pickup'}
                              </span>
                            </div>
                          </div>

                          <div className="rd-card-body">
                            <div className="rd-card-headline-row">
                              <h3 className="rd-card-dish-title">{item.food_name}</h3>
                              <span className="rd-portions-pill">{portions}</span>
                            </div>

                            {item.description && (
                              <p className="rd-card-dish-desc">{item.description}</p>
                            )}

                            <div className="rd-card-meta-list">
                              <div className="rd-meta-item">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                  <circle cx="12" cy="10" r="3" />
                                </svg>
                                <span className="truncate">{item.pickup_location || 'Local Kitchen'}</span>
                              </div>

                              <div className="rd-meta-item">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10" />
                                  <polyline points="12 6 12 12 16 14" />
                                </svg>
                                <span>{item.pickup_time || 'Collect Today'}</span>
                              </div>

                              {item.donor?.full_name && (
                                <div className="rd-meta-item donor">
                                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                  </svg>
                                  <span className="truncate">{item.donor.organization_name || item.donor.full_name}</span>
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              className="rd-request-action-btn"
                              onClick={() => handleOpenRequestModal(item)}
                            >
                              <span>Claim Food Donation</span>
                              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rd-empty-console">
                    <div className="rd-empty-glyph">
                      <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </div>
                    <h4>No active listings match your filter</h4>
                    <p>Donors post fresh batches throughout meal periods. Try resetting your search or category filters.</p>
                    <button
                      type="button"
                      className="rd-reset-filters-btn"
                      onClick={() => {
                        setSelectedCategory('All');
                        setSearchQuery('');
                        setFulfillmentFilter('all');
                      }}
                    >
                      Reset All Filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: MY FOOD REQUESTS & STATUS TRACKER ─── */}
        {activeNav === 'requests' && (
          <div className="rd-requests-hub">
            <div className="rd-requests-header-bar">
              <div>
                <h2 className="rd-view-heading">Request Tracking & Fulfillment</h2>
                <p className="rd-view-subhead">Track all food requests submitted to partner donors across your area.</p>
              </div>

              {/* Segmented Status Selector */}
              <div className="rd-request-filter-pills">
                <button
                  type="button"
                  className={`rd-filter-pill ${requestFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setRequestFilter('all')}
                >
                  All ({myRequests.length})
                </button>
                <button
                  type="button"
                  className={`rd-filter-pill ${requestFilter === 'ready' ? 'active' : ''}`}
                  onClick={() => setRequestFilter('ready')}
                >
                  Ready / In Transit ({myRequests.filter((r) => r.status === 'accepted' || r.status === 'assigned').length})
                </button>
                <button
                  type="button"
                  className={`rd-filter-pill ${requestFilter === 'pending' ? 'active' : ''}`}
                  onClick={() => setRequestFilter('pending')}
                >
                  Pending ({myRequests.filter((r) => r.status === 'pending').length})
                </button>
                <button
                  type="button"
                  className={`rd-filter-pill ${requestFilter === 'completed' ? 'active' : ''}`}
                  onClick={() => setRequestFilter('completed')}
                >
                  Completed ({myRequests.filter((r) => r.status === 'completed').length})
                </button>
              </div>
            </div>

            {filteredRequests.length > 0 ? (
              <div className="rd-requests-stack">
                {filteredRequests.map((req) => {
                  const matchedPickup = pickups.find(
                    (p) => p.request_id === req.id || p.food_id === req.food_id
                  );
                  const isDelivery = req.fulfillment_type === 'donor_delivery' || req.food?.fulfillment_type === 'donor_delivery';
                  const isAccepted = req.status === 'accepted' || req.status === 'assigned';
                  const isCompleted = req.status === 'completed';
                  const isPending = req.status === 'pending';

                  return (
                    <div key={req.id} className={`rd-request-item-card status-${req.status}`}>
                      <div className="rd-request-item-visual">
                        <img
                          src={req.food?.image_url || '/assets/dish_biryani.jpg'}
                          alt={req.food?.food_name || 'Food'}
                        />
                      </div>

                      <div className="rd-request-item-content">
                        <div className="rd-item-top-line">
                          <h4 className="rd-request-title">{req.food?.food_name || 'Food Donation'}</h4>
                          <span className={`rd-status-chip ${req.status}`}>
                            {req.status === 'accepted' ? 'ACCEPTED BY DONOR' : req.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="rd-request-logistics">
                          <span><strong>Requested:</strong> {req.requested_servings || req.food?.servings || 1} Servings</span>
                          <span>•</span>
                          <span>
                            {isDelivery ? '🚗 Delivery to:' : '🚶 Pickup from:'}{' '}
                            {isDelivery ? (req.delivery_address || 'Your Address') : (req.food?.pickup_location || 'Donor Kitchen')}
                          </span>
                          {req.donor?.full_name && (
                            <>
                              <span>•</span>
                              <span>Donor: {req.donor.organization_name || req.donor.full_name}</span>
                            </>
                          )}
                        </div>

                        {/* Handover OTP Capsule if accepted */}
                        {isAccepted && matchedPickup?.otp_code && (
                          <div className="rd-active-otp-capsule">
                            <span className="capsule-label">{isDelivery ? 'Handover OTP:' : 'Pickup OTP:'}</span>
                            <span className="capsule-code">{matchedPickup.otp_code}</span>
                            <button
                              type="button"
                              className="capsule-copy-btn"
                              onClick={() => handleCopyOtp(matchedPickup.otp_code, req.id)}
                            >
                              {copiedOtpId === req.id ? 'Copied' : 'Copy'}
                            </button>
                            <span className="capsule-hint">
                              {isDelivery ? 'Give code to driver' : 'Show code at kitchen'}
                            </span>
                          </div>
                        )}

                        {/* Status Lifecycle Progress Bar */}
                        <div className="rd-lifecycle-tracker">
                          <div className={`step ${isPending || isAccepted || isCompleted ? 'done' : ''}`}>
                            <span className="dot" />
                            <span className="label">Requested</span>
                          </div>
                          <div className={`line ${isAccepted || isCompleted ? 'done' : ''}`} />
                          <div className={`step ${isAccepted || isCompleted ? 'done' : ''}`}>
                            <span className="dot" />
                            <span className="label">Accepted</span>
                          </div>
                          <div className={`line ${isCompleted ? 'done' : ''}`} />
                          <div className={`step ${isCompleted ? 'done' : ''}`}>
                            <span className="dot" />
                            <span className="label">Fulfilled</span>
                          </div>
                        </div>
                      </div>

                      <div className="rd-request-actions-col">
                        <span className="rd-request-date">
                          {new Date(req.requested_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                        {isPending && (
                          <button
                            type="button"
                            className="rd-cancel-req-btn"
                            onClick={() => handleCancelRequest(req.id, req.food_id)}
                          >
                            Cancel Request
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rd-empty-console">
                <h4>No requests found in this view</h4>
                <p>Browse available food donations to request meals for your organization.</p>
                <button type="button" className="rd-primary-cta" onClick={() => setActiveNav('browse')}>
                  Browse Available Food
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: VERIFIED COMMUNITY IMPACT ─── */}
        {activeNav === 'impact' && (
          <div className="rd-impact-hub">
            <div className="rd-impact-header">
              <span className="rd-impact-eyebrow">VERIFIED RESCUE METRICS</span>
              <h2 className="rd-view-heading">Your Community Environmental & Social Impact</h2>
              <p className="rd-view-subhead">Every meal received and distributed prevents organic waste from generating harmful landfill emissions.</p>
            </div>

            <div className="rd-impact-bento-grid">
              <div className="rd-impact-metric-card highlight">
                <span className="metric-tag">Direct Nourishment</span>
                <span className="metric-number">{totalMealsReceived}</span>
                <span className="metric-unit">Meals Received & Shared</span>
                <p className="metric-description">Delivered directly to individuals, families, and community members in need.</p>
              </div>

              <div className="rd-impact-metric-card">
                <span className="metric-tag">Waste Diversion</span>
                <span className="metric-number">{totalWastePreventedKg} <small>KG</small></span>
                <span className="metric-unit">Solid Food Waste Rescued</span>
                <p className="metric-description">Edible nutrition redirected from landfills to community dining tables.</p>
              </div>

              <div className="rd-impact-metric-card">
                <span className="metric-tag">Carbon Offset</span>
                <span className="metric-number">{totalCo2AvertedKg} <small>KG</small></span>
                <span className="metric-unit">CO₂ Emissions Averted</span>
                <p className="metric-description">Equivalent greenhouse gas prevention through sustainable redistribution.</p>
              </div>

              <div className="rd-impact-metric-card">
                <span className="metric-tag">Operational Missions</span>
                <span className="metric-number">{totalApprovedRequests}</span>
                <span className="metric-unit">Approved Allocations</span>
                <p className="metric-description">Coordinated food rescue pickups fulfilled with partner donors.</p>
              </div>
            </div>

            <div className="rd-impact-callout-panel">
              <div className="rd-callout-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className="rd-callout-text">
                <h4>Verified Zero-Waste Logistics</h4>
                <p>
                  FoodBridge tracks every food rescue batch using end-to-end OTP verification. By claiming surplus from hotels, caterers, and bakeries, your organization directly strengthens your local circular food ecosystem.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 4: PROTOCOLS & SUPPORT ─── */}
        {activeNav === 'support' && (
          <div className="rd-support-hub">
            <div className="rd-support-header">
              <span className="rd-impact-eyebrow">RECEIVER PROTOCOLS</span>
              <h2 className="rd-view-heading">Food Safety, Handover Guidelines & Support</h2>
              <p className="rd-view-subhead">Clear standards for collecting, inspecting, and distributing rescued food safely.</p>
            </div>

            <div className="rd-support-grid">
              <div className="rd-protocol-card">
                <h4>🔐 How OTP Verification Works</h4>
                <p>
                  When a donor approves your request, a unique 4-digit code is generated.
                  For <strong>Receiver Pickup</strong>, show this code upon arrival at the donor kitchen.
                  For <strong>Donor Delivery</strong>, share the code with the driver after receiving and inspecting the containers.
                </p>
              </div>

              <div className="rd-protocol-card">
                <h4>🍲 Food Safety & Temperature Check</h4>
                <p>
                  Ensure all hot food is kept above 60°C and cold groceries are refrigerated below 5°C.
                  Consume or distribute prepared meals within 3–4 hours of collection. Always inspect seal integrity before distribution.
                </p>
              </div>

              <div className="rd-protocol-card">
                <h4>🚚 Middleman Fleet & Special Logistics</h4>
                <p>
                  Need large-capacity transportation or volunteer drivers? FoodBridge's middleman dispatch system is expanding.
                  Reach out to our logistics coordination desk for bulk allocations.
                </p>
              </div>

              <div className="rd-protocol-card contact">
                <h4>💬 Direct Assistance Channel</h4>
                <p>Have an urgent inquiry regarding an ongoing donation or pickup discrepancy?</p>
                <a href="mailto:support@foodbridge.org" className="rd-contact-email-btn">
                  Contact Dispatch Desk (support@foodbridge.org)
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ═══════════ INTERACTIVE REQUEST MODAL ═══════════ */}
      <AnimatePresence>
        {selectedFoodItem && (
          <div className="rd-modal-backdrop" onClick={() => setSelectedFoodItem(null)}>
            <motion.div
              className="rd-request-modal-box"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="rd-modal-top-bar">
                <span className="rd-modal-pill-tag">FOOD RESCUE REQUEST</span>
                <button
                  type="button"
                  className="rd-modal-close-trigger"
                  onClick={() => setSelectedFoodItem(null)}
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              <div className="rd-modal-content">
                <h3 className="rd-modal-dish-name">{selectedFoodItem.food_name}</h3>
                <p className="rd-modal-donor-sub">
                  Offered by <strong>{selectedFoodItem.donor?.organization_name || selectedFoodItem.donor?.full_name || 'Community Donor'}</strong>
                </p>

                {/* Fulfillment Dispatch Notice */}
                {selectedFoodItem.fulfillment_type === 'donor_delivery' ? (
                  <div className="rd-modal-dispatch-alert delivery">
                    <span className="alert-glyph">🚗</span>
                    <div>
                      <strong>Donor Delivery Selected</strong>
                      <p>The donor will transport this food to your destination address. Please confirm your contact phone and drop-off point.</p>
                    </div>
                  </div>
                ) : (
                  <div className="rd-modal-dispatch-alert pickup">
                    <span className="alert-glyph">🚶</span>
                    <div>
                      <strong>Self Pickup Selected</strong>
                      <p>You or your team will collect this donation from <strong>{selectedFoodItem.pickup_location}</strong>.</p>
                    </div>
                  </div>
                )}

                <div className="rd-modal-summary-grid">
                  <div className="summary-item">
                    <span className="summary-label">Total Available:</span>
                    <span className="summary-val">{selectedFoodItem.quantity || `${selectedFoodItem.servings} portions`}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Pickup Location:</span>
                    <span className="summary-val truncate">{selectedFoodItem.pickup_location}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Time Window:</span>
                    <span className="summary-val">{selectedFoodItem.pickup_time || 'Today'}</span>
                  </div>
                </div>

                <form onSubmit={handleSubmitRequest} className="rd-modal-form">
                  <div className="rd-input-group">
                    <label htmlFor="rd-servings-stepper">
                      Portions Needed (Max {selectedFoodItem.servings || 50})
                    </label>
                    <div className="rd-stepper-control">
                      <button
                        type="button"
                        className="stepper-btn"
                        onClick={() => setRequestServings((prev) => Math.max(1, Number(prev) - 5))}
                      >
                        -
                      </button>
                      <input
                        id="rd-servings-stepper"
                        name="requestServings"
                        type="number"
                        min="1"
                        max={selectedFoodItem.servings || 500}
                        value={requestServings}
                        onChange={(e) => setRequestServings(e.target.value)}
                        required
                        className="stepper-input"
                      />
                      <button
                        type="button"
                        className="stepper-btn"
                        onClick={() => setRequestServings((prev) => Math.min(selectedFoodItem.servings || 500, Number(prev) + 5))}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {selectedFoodItem.fulfillment_type === 'donor_delivery' && (
                    <>
                      <div className="rd-input-group">
                        <label htmlFor="rd-delivery-address">Drop-Off Destination Address *</label>
                        <input
                          id="rd-delivery-address"
                          name="deliveryAddress"
                          type="text"
                          placeholder="e.g. Shelter #4, Community Hall, North Gate"
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          required
                          className="rd-text-input"
                        />
                      </div>

                      <div className="rd-input-group">
                        <label htmlFor="rd-delivery-phone">Coordinator Phone Number *</label>
                        <input
                          id="rd-delivery-phone"
                          name="deliveryPhone"
                          type="tel"
                          placeholder="e.g. +91 98765 43210"
                          value={deliveryPhone}
                          onChange={(e) => setDeliveryPhone(e.target.value)}
                          required
                          className="rd-text-input"
                        />
                      </div>
                    </>
                  )}

                  <div className="rd-input-group">
                    <label htmlFor="rd-request-notes">Note for Donor / Distribution Plan (Optional)</label>
                    <textarea
                      id="rd-request-notes"
                      name="requestNotes"
                      placeholder="e.g. Will be distributed to 25 families at our evening relief program..."
                      rows="2"
                      value={requestNotes}
                      onChange={(e) => setRequestNotes(e.target.value)}
                      className="rd-textarea-input"
                    />
                  </div>

                  <div className="rd-modal-actions">
                    <button
                      type="button"
                      className="rd-btn-secondary"
                      onClick={() => setSelectedFoodItem(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rd-btn-confirm"
                      disabled={submitting}
                    >
                      {submitting ? 'Placing Request...' : 'Confirm Request'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Avatar & Profile Picker Modal */}
      <AvatarPicker
        isOpen={avatarPickerOpen}
        onClose={() => setAvatarPickerOpen(false)}
        currentAvatar={profile?.avatar_url}
        userId={user?.id}
        profile={profile}
        user={user}
        onAvatarChange={() => {
          refreshProfile();
          showToast('Profile updated successfully!', 'success');
        }}
      />
    </div>
  );
}
