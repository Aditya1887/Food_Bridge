import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../components/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { foodService } from '../../services/foodService';
import { getAvatarUrl, getUserInitials } from '../../services/avatarService';
import AvatarPicker from '../../components/AvatarPicker/AvatarPicker';
import './DonorDashboard.css';

export default function DonorDashboard({ onNavigate }) {
  const { isDark, toggleTheme } = useTheme();
  const { user, profile, logout, refreshProfile } = useAuth();

  const avatarUrl = getAvatarUrl(profile, user);
  const avatarInitials = getUserInitials(profile, user);

  const [activeNav, setActiveNav] = useState('dashboard');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeQuickModal, setActiveQuickModal] = useState(null); // 'donate' | 'schedule' | 'ngo' | 'history' | 'requests' | null
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

  // Backend state
  const [donations, setDonations] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Form states
  const [donationForm, setDonationForm] = useState({
    title: '',
    description: '',
    category: 'Cooked Meals',
    quantity: '',
    servings: '10',
    weight: '2.5',
    location: '',
    dishType: 'biryani',
  });

  const [pickupForm, setPickupForm] = useState({
    date: '2024-05-22',
    timeSlot: 'Morning (09:00 AM - 12:00 PM)',
    ngoName: 'NGO Asha Foundation',
  });

  const showToast = (message, type = 'success', duration = 4000) => {
    setToastMessage(message);
    setToastType(type);
    if (duration > 0) {
      setTimeout(() => {
        setToastMessage('');
      }, duration);
    }
  };

  // ── Load User & Supabase Data on Mount ──
  const loadUserData = async () => {
    if (!user?.id) {
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    try {
      // 1. Fetch user's real food items from food_items table
      const foodItems = await foodService.getDonorFoodItems(user.id);
      
      const formattedDonations = (foodItems || []).map((d) => ({
        id: d.id,
        title: d.food_name,
        quantity: d.quantity || `${d.servings} servings`,
        servings: Number(d.servings) || 10,
        food_weight_kg: Number(d.food_weight_kg) || 2.5,
        status: d.status === 'available' ? 'Available' : d.status === 'requested' ? 'Requested' : d.status === 'reserved' ? 'Reserved' : d.status === 'collected' ? 'Completed' : d.status,
        statusType: d.status === 'collected' ? 'completed' : d.status === 'reserved' ? 'scheduled' : 'pending',
        date: d.created_at ? new Date(d.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today',
        time: d.created_at ? new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:00 PM',
        image: d.image_url || '/assets/dish_biryani.jpg',
      }));
      setDonations(formattedDonations);

      // 2. Fetch user's pickups (isolated so failure doesn't block other data)
      try {
        const { data: userPickups } = await supabase
          .from('pickups')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setPickups(userPickups || []);
      } catch (pickupErr) {
        console.warn('Pickups table query notice:', pickupErr.message);
        setPickups([]);
      }

      // 3. Fetch incoming food requests from receivers
      const requests = await foodService.getDonorRequests(user.id);
      setIncomingRequests(requests || []);
    } catch (err) {
      console.warn('DonorDashboard fetch notice:', err.message);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [user?.id]);

  // ── Realtime subscription for incoming food requests ──
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('donor_requests_live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'food_requests',
          filter: `donor_id=eq.${user.id}`,
        },
        () => {
          // Reload all data when a request changes
          loadUserData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Compute User Display Information
  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : 'Aditya');
  
  const firstName = displayName.split(' ')[0] || 'Aditya';
  const displayEmail = user?.email || 'aditya.donor@foodbridge.org';
  const displayRole = profile?.role || user?.user_metadata?.role || 'Donor';

  // Compute Real Dynamic Impact Metrics
  const totalDonationsCount = donations.length;
  const totalMealsCount = donations.reduce((acc, curr) => acc + (Number(curr.servings) || 0), 0);
  const totalKgCount = donations.reduce((acc, curr) => acc + (Number(curr.food_weight_kg) || 0), 0).toFixed(1);
  const totalCO2Count = (parseFloat(totalKgCount) * 2.98).toFixed(1);

  const handleNavClick = (navId) => {
    setActiveNav(navId);
    setMobileMenuOpen(false);
    if (navId === 'logout') {
      handleLogout();
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

  // ── Handle New Food Listing Submission ──
  const handleCreateDonation = async (e) => {
    e.preventDefault();
    if (!donationForm.title.trim()) {
      showToast('Please enter the food title.', 'error');
      return;
    }

    setSubmitting(true);

    const dishImages = {
      biryani: '/assets/dish_biryani.jpg',
      dal_rice: '/assets/dish_dal_rice.jpg',
      pasta: '/assets/dish_pasta.jpg',
      fruits: '/assets/dish_fruits.jpg',
      bread: '/assets/dish_bread_packets.jpg',
      mixed_veg: '/assets/dish_mixed_veg.jpg',
      idli: '/assets/dish_idli_pack.jpg',
      chole_puri: '/assets/dish_chole_puri.jpg',
      milk: '/assets/dish_milk_packets.jpg',
    };

    const chosenImage = dishImages[donationForm.dishType] || '/assets/dish_biryani.jpg';
    const servingsNum = parseInt(donationForm.servings) || 10;
    const weightNum = parseFloat(donationForm.weight) || 2.5;

    // 1. Payload for food_items table
    const foodItemPayload = {
      donor_id: user?.id,
      food_name: donationForm.title.trim(),
      description: donationForm.description.trim() || '',
      category: donationForm.category || 'Cooked Meals',
      quantity: donationForm.quantity.trim() || `${servingsNum} servings`,
      quantity_unit: 'servings',
      servings: servingsNum,
      food_weight_kg: weightNum,
      pickup_location: donationForm.location.trim() || 'Main Kitchen Drop Point',
      pickup_date: new Date().toISOString().split('T')[0],
      pickup_time: 'Today (Flexible)',
      status: 'available',
      image_url: chosenImage,
    };

    try {
      if (user?.id) {
        await foodService.createFoodItem(foodItemPayload);
      }

      showToast('Food listing published! Receivers and NGOs in your area have been alerted.', 'success', 5000);
      setActiveQuickModal(null);
      setDonationForm({
        title: '',
        description: '',
        category: 'Cooked Meals',
        quantity: '',
        servings: '10',
        weight: '2.5',
        location: '',
        dishType: 'biryani',
      });
      await loadUserData();
    } catch (err) {
      showToast(err.message || 'Error creating food donation.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Handle Schedule Pickup Submission ──
  const handleSchedulePickup = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const refCode = `#FB${Math.floor(10000 + Math.random() * 90000)}`;

    const newPickupPayload = {
      user_id: user?.id || null,
      pickup_date: pickupForm.date,
      time_slot: pickupForm.timeSlot,
      ngo_name: pickupForm.ngoName,
      reference_code: refCode,
      status: 'Scheduled',
    };

    try {
      if (user?.id) {
        await supabase
          .from('pickups')
          .insert([newPickupPayload]);
      }

      showToast(`Pickup scheduled with ${pickupForm.ngoName}! Reference: ${refCode}`, 'success', 5000);
      setActiveQuickModal(null);
      await loadUserData();
    } catch (err) {
      showToast(err.message || 'Error scheduling pickup.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Handle Request Acceptance / Rejection by Donor ──
  const handleUpdateIncomingRequest = async (requestId, foodId, status) => {
    try {
      await foodService.updateRequestStatus(requestId, foodId, status);
      showToast(`Request ${status === 'accepted' ? 'accepted! Receiver will coordinate pickup.' : 'updated.'}`, 'success');
      await loadUserData();
    } catch (err) {
      showToast(err.message || 'Failed to update request.', 'error');
    }
  };

  const activePickup = pickups[0] || null;

  return (
    <div className={`donor-dashboard ${isDark ? 'dark-mode' : ''}`}>
      {/* ═══════════ LEFT SIDEBAR ═══════════ */}
      <aside className={`dd-sidebar ${mobileMenuOpen ? 'dd-sidebar-open' : ''}`}>
        {/* Brand Logo */}
        <div className="dd-sidebar-header">
          <div className="dd-brand" onClick={handleGoHome} role="button" tabIndex={0}>
            <div className="dd-logo-icon">
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
            <div className="dd-brand-text">
              <span className="dd-brand-name">FoodBridge</span>
              <span className="dd-brand-tagline">Share Food. Share Hope.</span>
            </div>
          </div>
          <button
            type="button"
            className="dd-close-mobile-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="dd-nav">
          <button
            type="button"
            className={`dd-nav-item ${activeNav === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavClick('dashboard')}
          >
            <svg className="dd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className={`dd-nav-item ${activeNav === 'donations' ? 'active' : ''}`}
            onClick={() => handleNavClick('donations')}
          >
            <svg className="dd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span>My Food Listings</span>
            {donations.length > 0 && <span className="dd-badge-count">{donations.length}</span>}
          </button>

          <button
            type="button"
            className={`dd-nav-item ${activeNav === 'requests' ? 'active' : ''}`}
            onClick={() => { handleNavClick('requests'); setActiveQuickModal('requests'); }}
          >
            <svg className="dd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Incoming Requests</span>
            {incomingRequests.length > 0 && <span className="dd-badge-count">{incomingRequests.length}</span>}
          </button>

          <button
            type="button"
            className={`dd-nav-item ${activeNav === 'schedule' ? 'active' : ''}`}
            onClick={() => { handleNavClick('schedule'); setActiveQuickModal('schedule'); }}
          >
            <svg className="dd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Schedule Pickup</span>
          </button>

          <button
            type="button"
            className={`dd-nav-item ${activeNav === 'history' ? 'active' : ''}`}
            onClick={() => handleNavClick('history')}
          >
            <svg className="dd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>Donations History</span>
          </button>

          <button
            type="button"
            className={`dd-nav-item ${activeNav === 'impact' ? 'active' : ''}`}
            onClick={() => handleNavClick('impact')}
          >
            <svg className="dd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 20h10" />
              <path d="M10 20c0-4 4-5 4-10" />
              <path d="M14 4c0 3-3 6-3 6" />
              <path d="M10 8c2.5-3 5-3 5-3" />
            </svg>
            <span>My Impact</span>
          </button>

          <button
            type="button"
            className={`dd-nav-item ${activeNav === 'support' ? 'active' : ''}`}
            onClick={() => handleNavClick('support')}
          >
            <svg className="dd-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>Help & Support</span>
          </button>
        </nav>

        {/* Sidebar Footer Motivation Card */}
        <div className="dd-sidebar-footer">
          <div className="dd-promo-box">
            <div className="dd-promo-text">
              Together, we can reduce waste and spread hope. 💚
            </div>
            <div className="dd-promo-leaves" aria-hidden="true">
              <svg viewBox="0 0 80 80" fill="none" className="dd-leaf-illus">
                <path d="M20 70 C10 50 15 20 45 15 C55 35 45 65 20 70 Z" fill="#bbf7d0" fillOpacity="0.6" />
                <path d="M20 70 C30 45 40 30 45 15" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
                <path d="M40 75 C45 60 65 50 75 35 C65 25 45 40 40 75 Z" fill="#86efac" fillOpacity="0.5" />
                <path d="M40 75 C55 60 65 45 75 35" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <motion.button
            type="button"
            className="dd-btn-donate"
            whileHover={{ scale: 1.02, boxShadow: '0 8px 20px rgba(22, 163, 74, 0.3)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveQuickModal('donate')}
          >
            <span>Donate More Food</span>
            <span className="dd-btn-plus">+</span>
          </motion.button>
        </div>
      </aside>

      {/* ═══════════ MAIN CONTENT AREA ═══════════ */}
      <div className="dd-main-container">
        {/* Top Header */}
        <header className="dd-top-header">
          <div className="dd-header-left">
            <button
              type="button"
              className="dd-hamburger-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="dd-welcome-wrap">
              <h1 className="dd-welcome-title">
                Welcome back, <span className="dd-highlight-name">{firstName}!</span> <span className="dd-wave">👋</span>
              </h1>
              <p className="dd-welcome-subtitle">Thank you for being a part of the change.</p>
            </div>
          </div>

          <div className="dd-header-right">
            {/* Dark Mode Toggle */}
            <button
              type="button"
              className="dd-theme-btn"
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
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {/* Notification Bell */}
            <button
              type="button"
              className="dd-bell-btn"
              onClick={() => showToast(`You have ${incomingRequests.length} pending food requests.`, 'success')}
              aria-label="Notifications"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {incomingRequests.length > 0 && <span className="dd-bell-dot">{incomingRequests.length}</span>}
            </button>

            {/* User Profile Dropdown */}
            <div className="dd-user-profile-wrap">
              <button
                type="button"
                className="dd-user-profile-btn"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    className="dd-user-avatar"
                  />
                ) : (
                  <span className="dd-user-avatar" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                    color: '#16a34a',
                    fontSize: '14px',
                    fontWeight: 800,
                    letterSpacing: '0.02em',
                  }}>
                    {avatarInitials}
                  </span>
                )}
                <div className="dd-user-meta">
                  <span className="dd-user-fullname">{displayName}</span>
                  <span className="dd-user-role-badge">{displayRole}</span>
                </div>
                <svg
                  className={`dd-user-chevron ${userDropdownOpen ? 'open' : ''}`}
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
                    className="dd-user-dropdown"
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="dd-dropdown-user-info">
                      <p className="dd-dropdown-name">{displayName}</p>
                      <p className="dd-dropdown-email">{displayEmail}</p>
                    </div>
                    <div className="dd-dropdown-divider" />
                    <button
                      type="button"
                      className="dd-dropdown-item"
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
                      className="dd-dropdown-item"
                      onClick={() => { setUserDropdownOpen(false); handleGoHome(); }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      </svg>
                      Back to FoodBridge Home
                    </button>
                    <div className="dd-dropdown-divider" />
                    <button
                      type="button"
                      className="dd-dropdown-item dd-logout-item"
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
              className="dd-floating-toast"
              style={{
                background: toastType === 'error' ? '#fef2f2' : '#edf7ee',
                border: `1.5px solid ${toastType === 'error' ? '#fecaca' : '#a7f3d0'}`,
                color: toastType === 'error' ? '#991b1b' : '#065f46',
              }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {toastType === 'error' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" className="dd-toast-icon">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" className="dd-toast-icon">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              )}
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard Grid Content */}
        <main className="dd-content-grid">
          {/* ═══════════ LEFT 2-COL BLOCK ═══════════ */}
          <div className="dd-left-col">
            {/* 1. Motivational Hero Banner Card */}
            <motion.section
              className="dd-banner-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="dd-banner-text-side">
                <h2 className="dd-banner-title">
                  Every meal you share <br />
                  makes a <span className="dd-diff-word">difference <span className="dd-leaf-icon-inline">💚</span></span>
                </h2>
                <p className="dd-banner-sub">
                  Your contribution helps reduce food waste and brings smiles to many faces.
                </p>
              </div>

              <div className="dd-banner-visual-side">
                {/* Floating Connected Nodes */}
                <div className="dd-node dd-node-globe" title="Global Impact">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>

                <div className="dd-node dd-node-people" title="Community Connected">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>

                <div className="dd-node dd-node-heart" title="Love & Kindness">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </div>

                {/* Curved Connection Path */}
                <svg className="dd-connect-curve" viewBox="0 0 240 140" fill="none">
                  <path
                    d="M 20 70 Q 70 10, 130 50 T 220 80"
                    stroke="#86efac"
                    strokeWidth="1.8"
                    strokeDasharray="4 4"
                  />
                </svg>

                {/* Fresh Salad Bowl Image */}
                <div className="dd-bowl-img-wrap">
                  <img
                    src="/assets/Bowl_png.png"
                    onError={(e) => { e.currentTarget.src = '/assets/about_salad_bowl.jpg'; }}
                    alt="Fresh healthy salad bowl"
                    className="dd-banner-salad"
                  />
                </div>
              </div>
            </motion.section>

            {/* 2. Recent Donations Card */}
            <section className="dd-card dd-recent-donations-card">
              <div className="dd-card-header">
                <h3 className="dd-card-title">Recent Food Listings</h3>
                <button
                  type="button"
                  className="dd-link-all"
                  onClick={() => setActiveQuickModal('donate')}
                >
                  + Add New
                </button>
              </div>

              {donations.length > 0 ? (
                <div className="dd-donations-list">
                  {donations.map((item) => (
                    <motion.div
                      key={item.id}
                      className="dd-donation-row"
                      whileHover={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#fafdfa', x: 2 }}
                      transition={{ duration: 0.15 }}
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className="dd-dish-thumb"
                      />

                      <div className="dd-donation-info">
                        <h4 className="dd-dish-name">{item.title}</h4>
                        <p className="dd-dish-qty">Quantity: {item.quantity}</p>
                      </div>

                      <div className="dd-donation-status">
                        <span className={`dd-status-badge dd-status-${item.statusType || 'completed'}`}>
                          {item.status}
                        </span>
                      </div>

                      <div className="dd-donation-datetime">
                        <span className="dd-date">{item.date}</span>
                        <span className="dd-time">{item.time}</span>
                      </div>

                      <div className="dd-donation-action">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="dd-row-chevron">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="dd-empty-donations">
                  <div className="dd-empty-icon-circle">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                  </div>
                  <h4 className="dd-empty-title">No donations recorded yet</h4>
                  <p className="dd-empty-subtitle">
                    You haven't made any food contributions yet. Share your first surplus meal to start reducing food waste!
                  </p>
                  <motion.button
                    type="button"
                    className="dd-btn-empty-donate"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveQuickModal('donate')}
                  >
                    + Donate Food Now
                  </motion.button>
                </div>
              )}
            </section>

            {/* 3. Upcoming Pickups Card */}
            <section className="dd-card dd-upcoming-card">
              <div className="dd-card-header">
                <h3 className="dd-card-title">Upcoming Pickups</h3>
                <button
                  type="button"
                  className="dd-link-all"
                  onClick={() => setActiveQuickModal('schedule')}
                >
                  + Schedule
                </button>
              </div>

              {activePickup ? (
                <div className="dd-pickup-item">
                  <div className="dd-calendar-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                      <path d="m9 16 2 2 4-4" strokeWidth="2" />
                    </svg>
                  </div>

                  <div className="dd-pickup-datetime-col">
                    <h4 className="dd-pickup-date">{activePickup.pickup_date}</h4>
                    <p className="dd-pickup-window">{activePickup.time_slot}</p>
                  </div>

                  <div className="dd-pickup-ngo-col">
                    <h4 className="dd-ngo-name">{activePickup.ngo_name}</h4>
                    <p className="dd-ngo-ref">{activePickup.reference_code || '#FB12345'}</p>
                  </div>

                  <div className="dd-pickup-status-col">
                    <span className="dd-status-badge dd-status-scheduled">
                      {activePickup.status || 'Scheduled'}
                    </span>
                  </div>

                  <div className="dd-pickup-action">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="dd-row-chevron">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="dd-empty-pickup-item">
                  <div className="dd-calendar-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                    </svg>
                  </div>
                  <div className="dd-pickup-empty-info">
                    <h4 className="dd-pickup-date">No upcoming pickups</h4>
                    <p className="dd-pickup-window">Schedule a pickup slot for your next food donation.</p>
                  </div>
                  <button
                    type="button"
                    className="dd-btn-schedule-sm"
                    onClick={() => setActiveQuickModal('schedule')}
                  >
                    + Schedule
                  </button>
                </div>
              )}
            </section>
          </div>

          {/* ═══════════ RIGHT 1-COL BLOCK ═══════════ */}
          <div className="dd-right-col">
            {/* 1. Your Impact So Far Card */}
            <section className="dd-card dd-impact-card">
              <div className="dd-card-header">
                <h3 className="dd-card-title">
                  Your Impact So Far <span className="dd-leaf-inline">🍃</span>
                </h3>
              </div>

              <div className="dd-impact-grid">
                {/* Stat 1: Donations Made */}
                <div className="dd-stat-tile">
                  <div className="dd-stat-icon-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                      <line x1="6" y1="1" x2="6" y2="4" />
                      <line x1="10" y1="1" x2="10" y2="4" />
                      <line x1="14" y1="1" x2="14" y2="4" />
                    </svg>
                  </div>
                  <div className="dd-stat-number">{totalDonationsCount}</div>
                  <div className="dd-stat-label">Donations Made</div>
                </div>

                {/* Stat 2: Meals Shared */}
                <div className="dd-stat-tile">
                  <div className="dd-stat-icon-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div className="dd-stat-number">{totalMealsCount}</div>
                  <div className="dd-stat-label">Meals Shared</div>
                </div>

                {/* Stat 3: Food Donated */}
                <div className="dd-stat-tile">
                  <div className="dd-stat-icon-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                      <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1" />
                      <path d="M18 8h4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-4" />
                      <circle cx="8" cy="12" r="2" />
                    </svg>
                  </div>
                  <div className="dd-stat-number">{totalKgCount} <span className="dd-unit">KG</span></div>
                  <div className="dd-stat-label">Food Donated</div>
                </div>

                {/* Stat 4: CO2 Prevented */}
                <div className="dd-stat-tile">
                  <div className="dd-stat-icon-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                      <path d="M2 12h20" />
                    </svg>
                  </div>
                  <div className="dd-stat-number">{totalCO2Count} <span className="dd-unit">KG</span></div>
                  <div className="dd-stat-label">CO₂ Prevented</div>
                </div>
              </div>

              <motion.button
                type="button"
                className="dd-btn-view-impact"
                whileHover={{ scale: 1.01, backgroundColor: '#edf7ee' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => showToast(totalDonationsCount > 0 ? `Impact Milestone: ${totalMealsCount} meals shared so far! 🎉` : 'Make your first donation to see your impact grow!')}
              >
                <span>View My Impact</span>
                <span className="dd-arrow-right">→</span>
              </motion.button>
            </section>

            {/* 2. Quick Actions Card */}
            <section className="dd-card dd-actions-card">
              <div className="dd-card-header">
                <h3 className="dd-card-title">
                  Quick Actions <span className="dd-flash-inline">⚡</span>
                </h3>
              </div>

              <div className="dd-actions-grid">
                {/* Action 1: Schedule Pickup */}
                <motion.div
                  className="dd-action-tile"
                  whileHover={{ y: -3, boxShadow: '0 8px 18px rgba(0,0,0,0.06)' }}
                  onClick={() => setActiveQuickModal('schedule')}
                >
                  <div className="dd-action-icon-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div className="dd-action-text">
                    <h4 className="dd-action-heading">Schedule Pickup</h4>
                    <p className="dd-action-desc">Request a pickup for your donation</p>
                  </div>
                </motion.div>

                {/* Action 2: New Donation */}
                <motion.div
                  className="dd-action-tile"
                  whileHover={{ y: -3, boxShadow: '0 8px 18px rgba(0,0,0,0.06)' }}
                  onClick={() => setActiveQuickModal('donate')}
                >
                  <div className="dd-action-icon-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                  </div>
                  <div className="dd-action-text">
                    <h4 className="dd-action-heading">New Donation</h4>
                    <p className="dd-action-desc">Add details of food to donate</p>
                  </div>
                </motion.div>

                {/* Action 3: Review Requests */}
                <motion.div
                  className="dd-action-tile"
                  whileHover={{ y: -3, boxShadow: '0 8px 18px rgba(0,0,0,0.06)' }}
                  onClick={() => setActiveQuickModal('requests')}
                >
                  <div className="dd-action-icon-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    </svg>
                  </div>
                  <div className="dd-action-text">
                    <h4 className="dd-action-heading">Food Requests</h4>
                    <p className="dd-action-desc">{incomingRequests.length} pending requests</p>
                  </div>
                </motion.div>

                {/* Action 4: Find NGOs */}
                <motion.div
                  className="dd-action-tile"
                  whileHover={{ y: -3, boxShadow: '0 8px 18px rgba(0,0,0,0.06)' }}
                  onClick={() => setActiveQuickModal('ngo')}
                >
                  <div className="dd-action-icon-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                    </svg>
                  </div>
                  <div className="dd-action-text">
                    <h4 className="dd-action-heading">Find NGOs</h4>
                    <p className="dd-action-desc">Trusted partner NGOs near you</p>
                  </div>
                </motion.div>
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* ═══════════ QUICK ACTION MODAL (Interactive & Live Backend) ═══════════ */}
      <AnimatePresence>
        {activeQuickModal && (
          <div className="dd-modal-backdrop" onClick={() => setActiveQuickModal(null)}>
            <motion.div
              className="dd-modal-box"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
            >
              <button
                type="button"
                className="dd-modal-close"
                onClick={() => setActiveQuickModal(null)}
                aria-label="Close modal"
              >
                ✕
              </button>

              {/* Modal 1: Create New Food Listing */}
              {activeQuickModal === 'donate' && (
                <div className="dd-modal-body">
                  <div className="dd-modal-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                    </svg>
                  </div>
                  <h3>Create New Food Donation</h3>
                  <p>Submit details of your surplus food. It will be available immediately for receivers and NGOs to request.</p>
                  <form onSubmit={handleCreateDonation}>
                    <div className="dd-modal-field">
                      <label>Food Item Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Steamed Rice & Dal Makhani"
                        value={donationForm.title}
                        onChange={(e) => setDonationForm({ ...donationForm, title: e.target.value })}
                        required
                      />
                    </div>

                    <div className="dd-modal-field">
                      <label>Category</label>
                      <select
                        value={donationForm.category}
                        onChange={(e) => setDonationForm({ ...donationForm, category: e.target.value })}
                      >
                        <option value="Cooked Meals">Cooked Meals</option>
                        <option value="Bakery & Breads">Bakery & Breads</option>
                        <option value="Fresh Produce">Fresh Produce (Fruits & Veggies)</option>
                        <option value="Dairy & Groceries">Dairy & Groceries</option>
                        <option value="Packaged Food">Packaged Food</option>
                      </select>
                    </div>

                    <div className="dd-modal-grid-2">
                      <div className="dd-modal-field">
                        <label>Servings Count</label>
                        <input
                          type="number"
                          min="1"
                          placeholder="10"
                          value={donationForm.servings}
                          onChange={(e) => setDonationForm({ ...donationForm, servings: e.target.value })}
                          required
                        />
                      </div>
                      <div className="dd-modal-field">
                        <label>Weight (KG approx)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.5"
                          placeholder="2.5"
                          value={donationForm.weight}
                          onChange={(e) => setDonationForm({ ...donationForm, weight: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="dd-modal-field">
                      <label>Pickup Address / Location</label>
                      <input
                        type="text"
                        placeholder="e.g. 14 Green Park Road, Main Kitchen"
                        value={donationForm.location}
                        onChange={(e) => setDonationForm({ ...donationForm, location: e.target.value })}
                        required
                      />
                    </div>

                    <div className="dd-modal-field">
                      <label>Photo Style</label>
                      <select
                        value={donationForm.dishType}
                        onChange={(e) => setDonationForm({ ...donationForm, dishType: e.target.value })}
                      >
                        <option value="biryani">Biryani / Rice Dish</option>
                        <option value="dal_rice">Dal & Rice</option>
                        <option value="pasta">Pasta / Noodles</option>
                        <option value="fruits">Fresh Fruits</option>
                        <option value="bread">Bread & Bakery</option>
                        <option value="mixed_veg">Mixed Vegetables</option>
                        <option value="idli">Idli / South Indian</option>
                        <option value="chole_puri">Chole Puri / North Indian</option>
                        <option value="milk">Milk & Dairy</option>
                      </select>
                    </div>

                    <button type="submit" className="dd-modal-submit-btn" disabled={submitting}>
                      {submitting ? 'Publishing Food Listing...' : 'Publish Food Donation'}
                    </button>
                  </form>
                </div>
              )}

              {/* Modal 2: Review Incoming Food Requests */}
              {activeQuickModal === 'requests' && (
                <div className="dd-modal-body">
                  <div className="dd-modal-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                  </div>
                  <h3>Incoming Food Requests</h3>
                  <p>Requests placed by receivers and NGOs for your listed food items.</p>

                  {incomingRequests.length > 0 ? (
                    <div className="dd-ngo-list">
                      {incomingRequests.map((req) => (
                        <div key={req.id} className="dd-ngo-item" style={{ gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <strong>{req.receiver?.full_name || 'Receiver'}</strong>
                              {req.receiver?.organization_name && <span> ({req.receiver.organization_name})</span>}
                            </div>
                            <span className={`dd-status-badge dd-status-${req.status === 'accepted' ? 'completed' : req.status === 'pending' ? 'scheduled' : 'pending'}`}>
                              {req.status.toUpperCase()}
                            </span>
                          </div>
                          <span style={{ color: '#4b5563', fontSize: '12px' }}>
                            Item: <strong>{req.food?.food_name}</strong> • Requested: <strong>{req.requested_servings} servings</strong>
                          </span>
                          {req.notes && <span style={{ color: '#6b7280', fontSize: '11.5px', fontStyle: 'italic' }}>"{req.notes}"</span>}
                          {req.receiver?.phone && <span style={{ color: '#16a34a', fontSize: '11.5px' }}>📞 Phone: {req.receiver.phone}</span>}

                          {req.status === 'pending' && (
                            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                              <button
                                type="button"
                                style={{ flex: 1, padding: '6px 10px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                                onClick={() => handleUpdateIncomingRequest(req.id, req.food_id, 'accepted')}
                              >
                                Accept Request
                              </button>
                              <button
                                type="button"
                                style={{ flex: 1, padding: '6px 10px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                                onClick={() => handleUpdateIncomingRequest(req.id, req.food_id, 'rejected')}
                              >
                                Decline
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: '#6b7280' }}>
                      <p>No active requests right now. When a receiver requests your food, it will show up here.</p>
                    </div>
                  )}

                  <button
                    type="button"
                    className="dd-modal-submit-btn"
                    onClick={() => setActiveQuickModal(null)}
                  >
                    Close
                  </button>
                </div>
              )}

              {/* Modal 3: Schedule Pickup Window */}
              {activeQuickModal === 'schedule' && (
                <div className="dd-modal-body">
                  <div className="dd-modal-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                    </svg>
                  </div>
                  <h3>Schedule Pickup Slot</h3>
                  <p>Book a dedicated volunteer pickup window with a trusted NGO.</p>
                  <form onSubmit={handleSchedulePickup}>
                    <div className="dd-modal-field">
                      <label>Assign to NGO</label>
                      <select
                        value={pickupForm.ngoName}
                        onChange={(e) => setPickupForm({ ...pickupForm, ngoName: e.target.value })}
                      >
                        <option value="NGO Asha Foundation">NGO Asha Foundation (4.9 ★)</option>
                        <option value="Robin Hood Army Local">Robin Hood Army Local (4.95 ★)</option>
                        <option value="Feed The Hungry Mission">Feed The Hungry Mission (4.8 ★)</option>
                      </select>
                    </div>

                    <div className="dd-modal-field">
                      <label>Preferred Pickup Date</label>
                      <input
                        type="date"
                        value={pickupForm.date}
                        onChange={(e) => setPickupForm({ ...pickupForm, date: e.target.value })}
                        required
                      />
                    </div>

                    <div className="dd-modal-field">
                      <label>Preferred Time Slot</label>
                      <select
                        value={pickupForm.timeSlot}
                        onChange={(e) => setPickupForm({ ...pickupForm, timeSlot: e.target.value })}
                      >
                        <option value="Morning (09:00 AM - 12:00 PM)">Morning (09:00 AM - 12:00 PM)</option>
                        <option value="Afternoon (01:00 PM - 04:00 PM)">Afternoon (01:00 PM - 04:00 PM)</option>
                        <option value="Evening (05:00 PM - 08:00 PM)">Evening (05:00 PM - 08:00 PM)</option>
                      </select>
                    </div>

                    <button type="submit" className="dd-modal-submit-btn" disabled={submitting}>
                      {submitting ? 'Confirming with NGO...' : 'Confirm Schedule'}
                    </button>
                  </form>
                </div>
              )}

              {/* Modal 4: Verified NGOs */}
              {activeQuickModal === 'ngo' && (
                <div className="dd-modal-body">
                  <div className="dd-modal-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                  </div>
                  <h3>Verified Food Rescue NGOs</h3>
                  <p>Partner organizations operating active pickup routes near your neighborhood.</p>
                  <div className="dd-ngo-list">
                    <div className="dd-ngo-item">
                      <strong>NGO Asha Foundation</strong>
                      <span>📍 1.8 km away • 4.9 ★ (120+ verified pickups)</span>
                    </div>
                    <div className="dd-ngo-item">
                      <strong>Robin Hood Army Local Chapter</strong>
                      <span>📍 2.4 km away • 4.95 ★ (350+ verified pickups)</span>
                    </div>
                    <div className="dd-ngo-item">
                      <strong>Feed The Hungry Mission</strong>
                      <span>📍 3.1 km away • 4.8 ★ (80+ verified pickups)</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="dd-modal-submit-btn"
                    onClick={() => setActiveQuickModal(null)}
                  >
                    Done
                  </button>
                </div>
              )}
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
