import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../components/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { foodService } from '../../services/foodService';
import { profileService } from '../../services/profileService';
import { getAvatarUrl, getUserInitials } from '../../services/avatarService';
import Footer from '../../components/Footer/Footer';
import './FoodListings.css';

// ─── CITY LOCATIONS ───
const CITIES = [
  { id: 'mumbai', name: 'Mumbai, Maharashtra' },
  { id: 'delhi', name: 'Delhi NCR, India' },
  { id: 'bengaluru', name: 'Bengaluru, Karnataka' },
  { id: 'pune', name: 'Pune, Maharashtra' },
  { id: 'hyderabad', name: 'Hyderabad, Telangana' },
  { id: 'kolkata', name: 'Kolkata, West Bengal' },
];

export default function FoodListings({ onNavigate }) {
  const { isDark, toggleTheme } = useTheme();
  const { user, profile, role, logout, refreshProfile } = useAuth();

  // ─── STATE MANAGEMENT ───
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Profile Edit Form State
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phone: '',
    city: '',
    organizationName: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // Notifications State (Synchronized with Supabase)
  const [notifications, setNotifications] = useState([]);

  // View state: 'grid' or 'map'
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');

  // Sidebar Filter States
  const [selectedFoodTypes, setSelectedFoodTypes] = useState(['All Types']);
  const [selectedDiets, setSelectedDiets] = useState([]);
  const [selectedExpiry, setSelectedExpiry] = useState('All');
  const [maxDistance, setMaxDistance] = useState(25);

  // Accordion collapsed state
  const [accordionOpen, setAccordionOpen] = useState({
    foodType: true,
    diet: true,
    expiry: true,
    distance: true,
  });

  // Favorites state
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('foodbridge_favorites') || '[]');
    } catch {
      return [];
    }
  });

  // Details Modal
  const [activeModalItem, setActiveModalItem] = useState(null);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimServings, setClaimServings] = useState(1);
  const [claimToken, setClaimToken] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Supabase Backend Items State
  const [backendItems, setBackendItems] = useState([]);
  const [loadingBackend, setLoadingBackend] = useState(true);

  // ─── 1. LOAD SUPABASE BACKEND DATA & REALTIME SYNC ───
  const fetchBackendListings = async () => {
    setLoadingBackend(true);
    try {
      const items = await foodService.getAvailableFoodItems();
      setBackendItems(items || []);
    } catch (err) {
      console.warn('Could not load food listings from Supabase:', err);
      setBackendItems([]);
    } finally {
      setLoadingBackend(false);
    }
  };

  const fetchBackendNotifications = async () => {
    if (!user?.id) return;
    try {
      const liveNotifs = await profileService.getUserNotifications(user.id, role);
      setNotifications(liveNotifs || []);
    } catch (err) {
      console.warn('Notifications fetch notice:', err);
    }
  };

  useEffect(() => {
    fetchBackendListings();

    // Supabase Real-time Listener for Food Items and Requests
    const foodChannel = supabase
      .channel('public_food_items_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'food_items' }, () => {
        fetchBackendListings();
      })
      .subscribe();

    const requestChannel = supabase
      .channel('public_food_requests_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'food_requests' }, () => {
        if (user?.id) fetchBackendNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(foodChannel);
      supabase.removeChannel(requestChannel);
    };
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchBackendNotifications();
    }
  }, [user?.id, role]);

  // Sync profile form when profile loads
  useEffect(() => {
    if (profile || user) {
      setProfileForm({
        fullName: profile?.full_name || user?.user_metadata?.full_name || 'User',
        phone: profile?.phone || user?.user_metadata?.phone || '',
        city: profile?.city || 'Mumbai, Maharashtra',
        organizationName: profile?.organization_name || '',
      });
      if (profile?.city) {
        const found = CITIES.find((c) => c.name.toLowerCase().includes(profile.city.toLowerCase()));
        if (found) setSelectedCity(found);
      }
    }
  }, [profile, user]);

  // Save favorites to localStorage
  const toggleFavorite = (itemId, e) => {
    if (e) e.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId];
      try {
        localStorage.setItem('foodbridge_favorites', JSON.stringify(next));
      } catch (err) {
        console.warn(err);
      }
      return next;
    });
  };

  // ─── FILTER HANDLERS ───
  const handleFoodTypeChange = (type) => {
    if (type === 'All Types') {
      setSelectedFoodTypes(['All Types']);
    } else {
      let updated = selectedFoodTypes.filter((t) => t !== 'All Types');
      if (updated.includes(type)) {
        updated = updated.filter((t) => t !== type);
      } else {
        updated.push(type);
      }
      if (updated.length === 0) {
        updated = ['All Types'];
      }
      setSelectedFoodTypes(updated);
    }
    setCurrentPage(1);
  };

  const handleDietChange = (diet) => {
    let updated;
    if (selectedDiets.includes(diet)) {
      updated = selectedDiets.filter((d) => d !== diet);
    } else {
      updated = [...selectedDiets, diet];
    }
    setSelectedDiets(updated);
    setCurrentPage(1);
  };

  const handleClearAll = () => {
    setSelectedFoodTypes(['All Types']);
    setSelectedDiets([]);
    setSelectedExpiry('All');
    setMaxDistance(25);
    setSearchQuery('');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const toggleAccordion = (section) => {
    setAccordionOpen((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Handle City Change
  const handleCitySelect = async (c) => {
    setSelectedCity(c);
    setIsCityOpen(false);
    if (user?.id) {
      try {
        await profileService.updateProfile(user.id, { city: c.name });
      } catch (err) {
        console.warn('City preference save notice:', err.message);
      }
    }
  };

  // Handle Profile Update
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setProfileSaving(true);
    try {
      await profileService.updateProfile(user.id, {
        full_name: profileForm.fullName,
        phone: profileForm.phone,
        city: profileForm.city,
        organization_name: profileForm.organizationName,
      });
      if (refreshProfile) await refreshProfile();
      setIsEditProfileOpen(false);
    } catch (err) {
      console.error('Profile update failed:', err);
    } finally {
      setProfileSaving(false);
    }
  };

  // Transform live Supabase database items into display format
  const formattedBackendListings = useMemo(() => {
    return backendItems.map((s, idx) => {
      // Calculate time ago
      let timeAgo = 'Just now';
      let isNew = true;
      if (s.created_at) {
        const diffHours = (Date.now() - new Date(s.created_at).getTime()) / (1000 * 60 * 60);
        if (diffHours < 1) {
          timeAgo = `${Math.max(1, Math.round(diffHours * 60))}m ago`;
          isNew = true;
        } else if (diffHours < 24) {
          timeAgo = `${Math.round(diffHours)}h ago`;
          isNew = diffHours < 3;
        } else {
          timeAgo = `${Math.round(diffHours / 24)}d ago`;
          isNew = false;
        }
      }

      // Format distance
      const dist = s.distance_km ? Number(s.distance_km) : Number(((idx * 1.7) % 8 + 1.2).toFixed(1));

      return {
        id: s.id,
        title: s.food_name || 'Food Donation',
        donor: s.donor?.organization_name || s.donor?.full_name || 'Community Donor',
        donorId: s.donor_id,
        distance: dist,
        time: s.pickup_time || timeAgo,
        servings: s.quantity || `Serves ${s.servings || 10}`,
        servingsCount: Number(s.servings || 10),
        category: s.category || 'Cooked Food',
        diet: s.dietary_preference || 'Vegetarian',
        badge: isNew ? 'NEW' : timeAgo,
        badgeType: isNew ? 'new' : 'time',
        image: s.image_url || '/assets/dish_biryani.jpg',
        expiry: s.expiry_time || 'Today',
        expiryDays: s.expiry_date ? Math.max(0, Math.ceil((new Date(s.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))) : 0,
        location: s.pickup_location || 'Mumbai, Maharashtra',
        description: s.description || 'Nutritious surplus food ready for collection.',
        allergens: s.allergens ? [s.allergens] : ['None reported'],
        storage: 'Keep in safe hygienic condition',
        contact: s.donor?.phone || '+91 98000 00000',
        coordinates: {
          x: 20 + ((idx * 23) % 65),
          y: 25 + ((idx * 19) % 60),
        },
      };
    });
  }, [backendItems]);

  // ─── FILTER & SORT LOGIC APPLIED TO BACKEND ITEMS ───
  const filteredDonations = useMemo(() => {
    return formattedBackendListings.filter((item) => {
      // Category filter
      if (!selectedFoodTypes.includes('All Types')) {
        const matchesType = selectedFoodTypes.some((t) => {
          if (t === 'Cooked Food') return item.category.toLowerCase().includes('cooked') || item.category.toLowerCase().includes('meal');
          if (t === 'Fruits') return item.category.toLowerCase().includes('fruit') || item.category.toLowerCase().includes('produce');
          if (t === 'Vegetables') return item.category.toLowerCase().includes('veg') || item.category.toLowerCase().includes('produce');
          if (t === 'Packaged Food') return item.category.toLowerCase().includes('pack') || item.category.toLowerCase().includes('grocer');
          if (t === 'Dry Goods') return item.category.toLowerCase().includes('dry');
          if (t === 'Beverages') return item.category.toLowerCase().includes('bev') || item.category.toLowerCase().includes('dairy') || item.category.toLowerCase().includes('milk');
          return item.category.toLowerCase() === t.toLowerCase();
        });
        if (!matchesType) return false;
      }

      // Dietary preference
      if (selectedDiets.length > 0) {
        if (!selectedDiets.includes(item.diet)) return false;
      }

      // Expiry filter
      if (selectedExpiry !== 'All') {
        if (selectedExpiry === 'Today' && item.expiryDays > 0) return false;
        if (selectedExpiry === 'Within 2 Days' && item.expiryDays > 2) return false;
        if (selectedExpiry === 'Within 5 Days' && item.expiryDays > 5) return false;
        if (selectedExpiry === 'More than 5 Days' && item.expiryDays <= 5) return false;
      }

      // Distance filter
      if (item.distance > maxDistance) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQ =
          item.title.toLowerCase().includes(q) ||
          item.donor.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q);
        if (!matchesQ) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'distance') return a.distance - b.distance;
      if (sortBy === 'expiry') return a.expiryDays - b.expiryDays;
      if (sortBy === 'servings') return b.servingsCount - a.servingsCount;
      return 0;
    });
  }, [formattedBackendListings, selectedFoodTypes, selectedDiets, selectedExpiry, maxDistance, searchQuery, sortBy]);

  // Total pages
  const totalPages = Math.max(1, Math.ceil(filteredDonations.length / itemsPerPage));

  // Current page items
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDonations.slice(start, start + itemsPerPage);
  }, [filteredDonations, currentPage, itemsPerPage]);

  // ─── CLAIM FOOD HANDLER (SUPABASE BACKEND CONNECTION) ───
  const handleClaimFood = async (item) => {
    if (!user?.id) {
      // Not logged in — redirect to login
      if (onNavigate) onNavigate('login');
      return;
    }

    setIsClaiming(true);
    const token = `#FB-${Math.floor(1000 + Math.random() * 9000)}`;
    setClaimToken(token);

    try {
      await foodService.createFoodRequest({
        foodId: item.id,
        receiverId: user.id,
        donorId: item.donor_id || item.donorId || user.id,
        requestedServings: claimServings,
        notes: `Requested via FoodBridge Find Food portal. Pickup Token: ${token}`,
      });
      setTimeout(() => {
        setIsClaiming(false);
        setClaimSuccess(true);
        fetchBackendListings();
      }, 600);
    } catch (err) {
      console.warn('Claim notice:', err);
      setIsClaiming(false);
      setClaimSuccess(true);
    }
  };

  const getCategoryTagClass = (cat) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('fruit')) return 'tag-fruit';
    if (c.includes('pack')) return 'tag-packaged';
    if (c.includes('bev') || c.includes('milk') || c.includes('dairy')) return 'tag-beverage';
    if (c.includes('dry')) return 'tag-dry';
    return 'tag-cooked';
  };

  // User display metadata
  const userDisplayName = profile?.full_name || user?.user_metadata?.full_name || (user ? 'FoodBridge User' : 'Guest');
  const userInitials = getUserInitials(profile, user);
  const userAvatarUrl = getAvatarUrl(profile, user);
  const userRoleDisplay = role === 'donor' ? 'Donor' : 'Receiver';

  return (
    <div className={`food-listings-page ${isDark ? 'dark-mode' : ''}`}>
      {/* ═══════════════════════════════════════════════════════
          1. TOP NAVIGATION BAR
         ═══════════════════════════════════════════════════════ */}
      <header className="fl-navbar">
        <div className="fl-nav-inner">
          {/* Brand Logo */}
          <a
            href="#"
            className="fl-brand"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) onNavigate('home');
            }}
          >
            <div className="fl-logo-icon">
              <svg viewBox="0 0 48 48" fill="none" className="fl-logo-svg">
                <path d="M24 6 C21 10 21 15 24 18 C27 15 27 10 24 6 Z" fill="#1b6b33" />
                <path d="M17 10 C14 12 14 16 18 18 C19 15 18 12 17 10 Z" fill="#1b6b33" />
                <path d="M31 10 C34 12 34 16 30 18 C29 15 30 12 31 10 Z" fill="#1b6b33" />
                <path d="M12 28 Q 24 16 36 28" stroke="#1b6b33" strokeWidth="2.8" fill="none" />
                <line x1="18" y1="21" x2="18" y2="28" stroke="#1b6b33" strokeWidth="2.2" />
                <line x1="24" y1="19" x2="24" y2="28" stroke="#1b6b33" strokeWidth="2.2" />
                <line x1="30" y1="21" x2="30" y2="28" stroke="#1b6b33" strokeWidth="2.2" />
                <path d="M10 30 C14 42 34 42 38 30" stroke="#1b6b33" strokeWidth="2.8" fill="none" />
              </svg>
            </div>
            <div className="fl-brand-text">
              <span className="fl-brand-title">FoodBridge</span>
              <span className="fl-brand-tagline">Share Food. Share Hope.</span>
            </div>
          </a>

          {/* Nav Center Links */}
          <nav className="fl-nav-links">
            <button className="fl-nav-item" onClick={() => onNavigate && onNavigate('home')}>
              Home
            </button>
            <button className="fl-nav-item fl-nav-active" onClick={() => onNavigate && onNavigate('food-listings')}>
              Food Listings
              <motion.span layoutId="flActiveBar" className="fl-active-underline" />
            </button>
            <button className="fl-nav-item" onClick={() => onNavigate && onNavigate('about-us')}>
              About Us
            </button>
            <button className="fl-nav-item" onClick={() => onNavigate && onNavigate('how-it-works')}>
              How It Works
            </button>
            <button className="fl-nav-item" onClick={() => onNavigate && onNavigate('impact')}>
              Impact
            </button>
            <button className="fl-nav-item" onClick={() => onNavigate && onNavigate('contact')}>
              Contact
            </button>
          </nav>

          {/* Nav Right Controls: Location, Notif, User */}
          <div className="fl-nav-right">
            {/* Location Selector */}
            <div className="fl-location-wrapper">
              <button
                className="fl-location-btn"
                onClick={() => setIsCityOpen(!isCityOpen)}
                aria-label="Select City"
              >
                <svg className="fl-loc-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="fl-loc-text">{selectedCity.name}</span>
                <svg className="fl-chevron-down" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <AnimatePresence>
                {isCityOpen && (
                  <motion.div
                    className="fl-dropdown-menu"
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="fl-dropdown-header">Select City</div>
                    {CITIES.map((c) => (
                      <button
                        key={c.id}
                        className={`fl-dropdown-item ${c.id === selectedCity.id ? 'active' : ''}`}
                        onClick={() => handleCitySelect(c)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {c.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Notification Bell */}
            <div className="fl-notif-wrapper">
              <button
                className="fl-notif-btn"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                aria-label="Notifications"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {notifications.length > 0 && <span className="fl-notif-badge">{notifications.length}</span>}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div
                    className="fl-notif-menu"
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="fl-notif-header">
                      <span>Notifications ({notifications.length})</span>
                      <button
                        className="fl-notif-clear"
                        onClick={() => setNotifications([])}
                      >
                        Clear
                      </button>
                    </div>
                    <div className="fl-notif-list">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div key={n.id} className="fl-notif-row">
                            <div className="fl-notif-dot" />
                            <div className="fl-notif-body">
                              <p className="fl-notif-msg">{n.title}</p>
                              <span className="fl-notif-time">{n.time}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="fl-notif-empty">No active notifications</div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Profile Pill */}
            <div className="fl-user-wrapper">
              <div
                className="fl-user-pill"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                title="Manage Profile"
              >
                <div className="fl-avatar-circle">
                  {userAvatarUrl ? (
                    <img src={userAvatarUrl} alt={userDisplayName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    userInitials
                  )}
                </div>
                <div className="fl-user-info">
                  <span className="fl-user-name">{userDisplayName}</span>
                  <span className="fl-user-role">{userRoleDisplay}</span>
                </div>
                <svg className="fl-chevron-down" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {/* Profile Dropdown Menu */}
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    className="fl-profile-dropdown"
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="fl-pdropdown-header">
                      <div className="fl-pdropdown-avatar">
                        {userAvatarUrl ? (
                          <img src={userAvatarUrl} alt={userDisplayName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          userInitials
                        )}
                      </div>
                      <div>
                        <strong>{userDisplayName}</strong>
                        <p>{user?.email || 'Receiver Account'}</p>
                      </div>
                    </div>

                    <div className="fl-pdropdown-body">
                      {user && (
                        <button
                          className="fl-pdropdown-item"
                          onClick={() => {
                            setIsProfileOpen(false);
                            setIsEditProfileOpen(true);
                          }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Edit Profile Details
                        </button>
                      )}

                      <button
                        className="fl-pdropdown-item"
                        onClick={() => {
                          setIsProfileOpen(false);
                          if (!user) {
                            if (onNavigate) onNavigate('login');
                          } else {
                            const target = role === 'donor' ? 'donor-dashboard' : 'receiver-dashboard';
                            if (onNavigate) onNavigate(target);
                          }
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="7" height="7" />
                          <rect x="14" y="3" width="7" height="7" />
                          <rect x="14" y="14" width="7" height="7" />
                          <rect x="3" y="14" width="7" height="7" />
                        </svg>
                        {user ? 'Open Dashboard' : 'Login to Dashboard'}
                      </button>

                      {user ? (
                        <button
                          className="fl-pdropdown-item logout"
                          onClick={() => {
                            setIsProfileOpen(false);
                            if (logout) logout();
                          }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                          </svg>
                          Sign Out
                        </button>
                      ) : (
                        <button
                          className="fl-pdropdown-item login"
                          onClick={() => {
                            setIsProfileOpen(false);
                            if (onNavigate) onNavigate('login');
                          }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                            <polyline points="10 17 15 12 10 7" />
                            <line x1="15" y1="12" x2="3" y2="12" />
                          </svg>
                          Login / Register
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Toggle */}
            <button
              className="fl-theme-btn"
              onClick={toggleTheme}
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M18.36 5.64l1.41-1.41" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════
          2. MAIN CONTENT AREA (Sidebar Filters + Cards Grid)
         ═══════════════════════════════════════════════════════ */}
      <main className="fl-main-container">
        {/* Page Top Header */}
        <div className="fl-header-row">
          <div className="fl-header-left">
            <h1 className="fl-main-title">Available Food Donations</h1>
            <p className="fl-main-subtitle">Nutritious food shared with love, for those who need it.</p>
          </div>

          <div className="fl-header-right">
            {/* View Mode Toggle: Map / Grid */}
            <button
              className={`fl-toggle-view-btn ${viewMode === 'map' ? 'active' : ''}`}
              onClick={() => setViewMode(viewMode === 'grid' ? 'map' : 'grid')}
            >
              {viewMode === 'grid' ? (
                <>
                  <svg className="fl-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                    <line x1="8" y1="2" x2="8" y2="18" />
                    <line x1="16" y1="6" x2="16" y2="22" />
                  </svg>
                  <span>Map View</span>
                </>
              ) : (
                <>
                  <svg className="fl-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                  <span>Grid View</span>
                </>
              )}
            </button>

            {/* Sort by Dropdown */}
            <div className="fl-sort-wrapper">
              <label htmlFor="sort-select" className="fl-sort-label">Sort by:</label>
              <select
                id="sort-select"
                className="fl-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="distance">Distance (Nearest)</option>
                <option value="expiry">Expiry Soonest</option>
                <option value="servings">Most Servings</option>
              </select>
            </div>

            {/* Count Badge */}
            <div className="fl-count-label">{filteredDonations.length} {filteredDonations.length === 1 ? 'donation' : 'donations'} found</div>
          </div>
        </div>

        {/* Layout: Sidebar + Listings Area */}
        <div className="fl-layout-grid">
          {/* ─── LEFT SIDEBAR: FILTERS ─── */}
          <aside className="fl-sidebar">
            <div className="fl-filter-card">
              <div className="fl-filter-card-header">
                <div className="fl-filter-title-wrap">
                  <svg className="fl-filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="21" x2="4" y2="14" />
                    <line x1="4" y1="10" x2="4" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12" y2="3" />
                    <line x1="20" y1="21" x2="20" y2="16" />
                    <line x1="20" y1="12" x2="20" y2="3" />
                    <line x1="1" y1="14" x2="7" y2="14" />
                    <line x1="9" y1="8" x2="15" y2="8" />
                    <line x1="17" y1="16" x2="23" y2="16" />
                  </svg>
                  <span className="fl-filter-heading">Filters</span>
                </div>
                <button className="fl-clear-btn" onClick={handleClearAll}>
                  Clear All
                </button>
              </div>

              {/* Accordion 1: Food Type */}
              <div className="fl-accordion-section">
                <button
                  className="fl-accordion-toggle"
                  onClick={() => toggleAccordion('foodType')}
                >
                  <div className="fl-acc-title-left">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="fl-acc-icon">
                      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                      <line x1="6" y1="1" x2="6" y2="4" />
                      <line x1="10" y1="1" x2="10" y2="4" />
                      <line x1="14" y1="1" x2="14" y2="4" />
                    </svg>
                    <span>Food Type</span>
                  </div>
                  <svg
                    className={`fl-acc-chevron ${accordionOpen.foodType ? 'open' : ''}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  >
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </button>

                {accordionOpen.foodType && (
                  <div className="fl-accordion-body">
                    {['All Types', 'Cooked Food', 'Fruits', 'Vegetables', 'Packaged Food', 'Dry Goods', 'Beverages'].map((type) => {
                      const checked = selectedFoodTypes.includes(type);
                      return (
                        <label key={type} className="fl-checkbox-label">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleFoodTypeChange(type)}
                          />
                          <span className={`fl-custom-check ${checked ? 'checked' : ''}`}>
                            {checked && (
                              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </span>
                          <span className="fl-label-text">{type}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Accordion 2: Dietary Preference */}
              <div className="fl-accordion-section">
                <button
                  className="fl-accordion-toggle"
                  onClick={() => toggleAccordion('diet')}
                >
                  <div className="fl-acc-title-left">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="fl-acc-icon">
                      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    <span>Dietary Preference</span>
                  </div>
                  <svg
                    className={`fl-acc-chevron ${accordionOpen.diet ? 'open' : ''}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  >
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </button>

                {accordionOpen.diet && (
                  <div className="fl-accordion-body">
                    {['Vegetarian', 'Vegan', 'Non-Vegetarian', 'Jain'].map((diet) => {
                      const checked = selectedDiets.includes(diet);
                      return (
                        <label key={diet} className="fl-checkbox-label">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleDietChange(diet)}
                          />
                          <span className={`fl-custom-check ${checked ? 'checked' : ''}`}>
                            {checked && (
                              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </span>
                          <span className="fl-label-text">{diet}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Accordion 3: Expiry / Best Before */}
              <div className="fl-accordion-section">
                <button
                  className="fl-accordion-toggle"
                  onClick={() => toggleAccordion('expiry')}
                >
                  <div className="fl-acc-title-left">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="fl-acc-icon">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>Expiry / Best Before</span>
                  </div>
                  <svg
                    className={`fl-acc-chevron ${accordionOpen.expiry ? 'open' : ''}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  >
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </button>

                {accordionOpen.expiry && (
                  <div className="fl-accordion-body">
                    {['All', 'Today', 'Within 2 Days', 'Within 5 Days', 'More than 5 Days'].map((exp) => {
                      const checked = selectedExpiry === exp;
                      return (
                        <label key={exp} className="fl-radio-label">
                          <input
                            type="radio"
                            name="expiryGroup"
                            checked={checked}
                            onChange={() => {
                              setSelectedExpiry(exp);
                              setCurrentPage(1);
                            }}
                          />
                          <span className={`fl-custom-radio ${checked ? 'checked' : ''}`}>
                            {checked && <span className="fl-radio-dot" />}
                          </span>
                          <span className="fl-label-text">{exp}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Accordion 4: Distance */}
              <div className="fl-accordion-section">
                <button
                  className="fl-accordion-toggle"
                  onClick={() => toggleAccordion('distance')}
                >
                  <div className="fl-acc-title-left">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="fl-acc-icon">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>Distance</span>
                  </div>
                  <span className="fl-distance-val">{maxDistance >= 25 ? '25 km+' : `${maxDistance} km`}</span>
                </button>

                {accordionOpen.distance && (
                  <div className="fl-accordion-body">
                    <div className="fl-slider-container">
                      <input
                        type="range"
                        min="1"
                        max="25"
                        value={maxDistance}
                        onChange={(e) => {
                          setMaxDistance(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="fl-range-slider"
                      />
                      <div className="fl-slider-labels">
                        <span>0 km</span>
                        <span>25 km+</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Apply Filters Button */}
              <button
                className="fl-apply-btn"
                onClick={() => {
                  setCurrentPage(1);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="21" x2="4" y2="14" />
                  <line x1="4" y1="10" x2="4" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12" y2="3" />
                  <line x1="20" y1="21" x2="20" y2="16" />
                  <line x1="20" y1="12" x2="20" y2="3" />
                  <line x1="1" y1="14" x2="7" y2="14" />
                  <line x1="9" y1="8" x2="15" y2="8" />
                  <line x1="17" y1="16" x2="23" y2="16" />
                </svg>
                <span>Apply Filters</span>
              </button>
            </div>
          </aside>

          {/* ─── RIGHT SECTION: FOOD LISTINGS GRID OR MAP VIEW ─── */}
          <div className="fl-content-area">
            {loadingBackend ? (
              /* Loading Skeleton */
              <div className="fl-loading-state">
                <div className="fl-spinner" />
                <p>Loading verified food donations from backend...</p>
              </div>
            ) : viewMode === 'map' ? (
              /* Interactive Map View */
              <div className="fl-map-view-card">
                <div className="fl-map-header">
                  <div>
                    <h3 className="fl-map-title">Interactive Mumbai Donation Map</h3>
                    <p className="fl-map-sub">Showing verified food distribution hubs & donors</p>
                  </div>
                  <button className="fl-map-close-btn" onClick={() => setViewMode('grid')}>
                    Switch to Grid View
                  </button>
                </div>

                <div className="fl-map-canvas-mock">
                  <div className="fl-map-grid-lines" />
                  {filteredDonations.length === 0 ? (
                    <div className="fl-map-empty">No food items to pin on map</div>
                  ) : (
                    filteredDonations.slice(0, 16).map((item) => (
                      <motion.div
                        key={item.id}
                        className="fl-map-pin"
                        style={{ left: `${item.coordinates.x}%`, top: `${item.coordinates.y}%` }}
                        whileHover={{ scale: 1.25, zIndex: 100 }}
                        onClick={() => setActiveModalItem(item)}
                      >
                        <div className="fl-pin-head">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                          </svg>
                        </div>
                        <div className="fl-pin-tooltip">
                          <strong>{item.title}</strong>
                          <span>{item.donor} • {item.distance} km</span>
                        </div>
                      </motion.div>
                    ))
                  )}
                  <div className="fl-map-legend">
                    <span className="legend-item"><span className="legend-dot green" /> Available Food Hubs</span>
                    <span className="legend-item"><span className="legend-dot blue" /> Verified NGOs</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Grid of Backend Donations */
              <>
                {paginatedItems.length === 0 ? (
                  <div className="fl-empty-state">
                    <div className="fl-empty-icon">🍲</div>
                    <h3>No Food Donations Listed Yet</h3>
                    <p>
                      {backendItems.length === 0
                        ? 'There are currently no active food listings from donors. When a donor posts fresh surplus food, it will appear here in real-time.'
                        : 'No food donations match your active filters. Try resetting the filters or increasing distance.'}
                    </p>

                    <div className="fl-empty-actions">
                      {role === 'donor' || user ? (
                        <button
                          className="fl-apply-btn"
                          style={{ maxWidth: '240px', margin: '16px auto 0 auto' }}
                          onClick={() => {
                            if (onNavigate) onNavigate(role === 'receiver' ? 'receiver-dashboard' : 'donor-dashboard');
                          }}
                        >
                          {role === 'donor' ? 'List Food as Donor' : 'Go to Dashboard'}
                        </button>
                      ) : (
                        <button
                          className="fl-apply-btn"
                          style={{ maxWidth: '240px', margin: '16px auto 0 auto' }}
                          onClick={() => {
                            if (onNavigate) onNavigate('login');
                          }}
                        >
                          Sign In to Post / Request Food
                        </button>
                      )}

                      {backendItems.length > 0 && (
                        <button
                          className="fl-clear-btn"
                          style={{ display: 'block', margin: '12px auto 0 auto', fontSize: '13px' }}
                          onClick={handleClearAll}
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="fl-cards-grid">
                    {paginatedItems.map((item) => {
                      const isFav = favorites.includes(item.id);
                      return (
                        <motion.div
                          key={item.id}
                          className="fl-food-card"
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          whileHover={{ y: -4 }}
                        >
                          {/* Card Image Banner */}
                          <div className="fl-card-image-wrap" onClick={() => setActiveModalItem(item)}>
                            <img
                              src={item.image}
                              alt={item.title}
                              className="fl-card-img"
                              loading="lazy"
                              onError={(e) => {
                                e.target.src = '/assets/dish_biryani.jpg';
                              }}
                            />
                            {/* Top Badge: NEW or Time Ago */}
                            <span className={`fl-badge ${item.badgeType === 'new' ? 'fl-badge-new' : 'fl-badge-time'}`}>
                              {item.badge}
                            </span>

                            {/* Favorite Heart Button */}
                            <button
                              className={`fl-heart-btn ${isFav ? 'active' : ''}`}
                              onClick={(e) => toggleFavorite(item.id, e)}
                              aria-label="Save to favorites"
                            >
                              <svg viewBox="0 0 24 24" fill={isFav ? '#e11d48' : 'none'} stroke={isFav ? '#e11d48' : '#ffffff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                              </svg>
                            </button>
                          </div>

                          {/* Card Content Body */}
                          <div className="fl-card-body">
                            <h3 className="fl-card-title" onClick={() => setActiveModalItem(item)}>
                              {item.title}
                            </h3>

                            {/* Donor Info */}
                            <div className="fl-card-donor">
                              <svg className="fl-donor-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                              </svg>
                              <span className="fl-donor-name">{item.donor}</span>
                            </div>

                            {/* Meta Row: Distance, Time, Servings Badge */}
                            <div className="fl-card-meta">
                              <div className="fl-meta-left">
                                <span className="fl-meta-item">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2a8 8 0 0 0-8 8c0 5 8 12 8 12s8-7 8-12a8 8 0 0 0-8-8z" />
                                  </svg>
                                  {item.distance} km away
                                </span>
                                <span className="fl-meta-item">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                  </svg>
                                  {item.time}
                                </span>
                              </div>
                              <span className="fl-servings-badge">{item.servings}</span>
                            </div>

                            {/* Tags Row */}
                            <div className="fl-card-tags">
                              <span className={`fl-tag ${getCategoryTagClass(item.category)}`}>
                                {item.category}
                              </span>
                              <span className="fl-tag tag-veg">
                                {item.diet === 'Vegetarian' ? 'Veg' : item.diet}
                              </span>
                            </div>

                            {/* Action Button */}
                            <button
                              className="fl-view-btn"
                              onClick={() => {
                                setClaimSuccess(false);
                                setActiveModalItem(item);
                              }}
                            >
                              View Details
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* ─── BOTTOM CONTROLS & TRUST BANNER ─── */}
            <div className="fl-bottom-row">
              {/* Pagination Controls */}
              {filteredDonations.length > 0 && (
                <div className="fl-pagination">
                  <button
                    className="fl-page-arrow"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    aria-label="Previous Page"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      className={`fl-page-num ${currentPage === num ? 'active' : ''}`}
                      onClick={() => setCurrentPage(num)}
                    >
                      {num}
                    </button>
                  ))}

                  <button
                    className="fl-page-arrow"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    aria-label="Next Page"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Trust & Safety Guarantee Banner */}
              <div className="fl-trust-banner">
                <svg className="fl-shield-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
                <span>All donations are verified before listing to ensure quality and safety.</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════
          3. ITEM DETAILS & CLAIM MODAL
         ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {activeModalItem && (
          <div className="fl-modal-backdrop" onClick={() => setActiveModalItem(null)}>
            <motion.div
              className="fl-modal-content"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            >
              <button className="fl-modal-close" onClick={() => setActiveModalItem(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <div className="fl-modal-grid">
                <div className="fl-modal-image-col">
                  <img
                    src={activeModalItem.image}
                    alt={activeModalItem.title}
                    className="fl-modal-img"
                    onError={(e) => {
                      e.target.src = '/assets/dish_biryani.jpg';
                    }}
                  />
                  <div className="fl-modal-safety-tag">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span>Hygiene Inspected & 100% Safe</span>
                  </div>
                </div>

                <div className="fl-modal-info-col">
                  <div className="fl-modal-header">
                    <span className="fl-modal-badge">{activeModalItem.category}</span>
                    <span className="fl-modal-diet">{activeModalItem.diet}</span>
                    <h2 className="fl-modal-title">{activeModalItem.title}</h2>
                    <p className="fl-modal-donor">
                      Listed by <strong>{activeModalItem.donor}</strong> • {activeModalItem.location}
                    </p>
                  </div>

                  <div className="fl-modal-pills-row">
                    <div className="fl-pill-box">
                      <span className="fl-pill-label">Distance</span>
                      <span className="fl-pill-val">{activeModalItem.distance} km away</span>
                    </div>
                    <div className="fl-pill-box">
                      <span className="fl-pill-label">Available Quantity</span>
                      <span className="fl-pill-val">{activeModalItem.servings}</span>
                    </div>
                    <div className="fl-pill-box">
                      <span className="fl-pill-label">Best Before</span>
                      <span className="fl-pill-val">{activeModalItem.expiry}</span>
                    </div>
                  </div>

                  <div className="fl-modal-desc-box">
                    <h4>About this donation:</h4>
                    <p>{activeModalItem.description}</p>
                  </div>

                  <div className="fl-modal-meta-grid">
                    <div>
                      <strong>Allergens:</strong>
                      <p>{activeModalItem.allergens.join(', ')}</p>
                    </div>
                    <div>
                      <strong>Storage & Handling:</strong>
                      <p>{activeModalItem.storage}</p>
                    </div>
                  </div>

                  {claimSuccess ? (
                    <motion.div
                      className="fl-claim-success-box"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      <div className="fl-success-icon">✓</div>
                      <h4>Donation Request Confirmed!</h4>
                      <p>
                        Your request has been submitted to <strong>{activeModalItem.donor}</strong>.
                        Show Pickup Token <strong>{claimToken || '#FB-8421'}</strong> at collection.
                      </p>
                      <span className="fl-call-tag">Helpline Contact: {activeModalItem.contact}</span>
                    </motion.div>
                  ) : (
                    <div className="fl-modal-actions">
                      {user ? (
                        <>
                          <div className="fl-servings-select">
                            <label>Portions needed:</label>
                            <select
                              value={claimServings}
                              onChange={(e) => setClaimServings(Number(e.target.value))}
                            >
                              {[1, 2, 3, 4, 5, 8, 10].map((num) => (
                                <option key={num} value={num}>{num} {num === 1 ? 'Portion' : 'Portions'}</option>
                              ))}
                            </select>
                          </div>

                          <button
                            className="fl-claim-submit-btn"
                            disabled={isClaiming}
                            onClick={() => handleClaimFood(activeModalItem)}
                          >
                            {isClaiming ? 'Securing Request...' : 'Claim / Request Food'}
                          </button>
                        </>
                      ) : (
                        <button
                          className="fl-claim-submit-btn"
                          onClick={() => { if (onNavigate) onNavigate('login'); }}
                          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                        >
                          Login to Claim Food →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════
          4. EDIT PROFILE MODAL
         ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isEditProfileOpen && (
          <div className="fl-modal-backdrop" onClick={() => setIsEditProfileOpen(false)}>
            <motion.div
              className="fl-modal-content fl-profile-modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
            >
              <button className="fl-modal-close" onClick={() => setIsEditProfileOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <div className="fl-pmodal-inner">
                <div className="fl-pmodal-header">
                  <div className="fl-pmodal-avatar">
                    {userAvatarUrl ? (
                      <img src={userAvatarUrl} alt={userDisplayName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      userInitials
                    )}
                  </div>
                  <div>
                    <h2>Edit Your Profile</h2>
                    <p>Updates will sync across your FoodBridge account in real-time</p>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="fl-pmodal-form">
                  <div className="fl-form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      required
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      placeholder="e.g. Aditya Sharma"
                    />
                  </div>

                  <div className="fl-form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="e.g. +91 98201 44521"
                    />
                  </div>

                  <div className="fl-form-group">
                    <label>City / Region</label>
                    <select
                      value={profileForm.city}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                    >
                      {CITIES.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="fl-form-group">
                    <label>Organization / Shelter Name (Optional)</label>
                    <input
                      type="text"
                      value={profileForm.organizationName}
                      onChange={(e) => setProfileForm({ ...profileForm, organizationName: e.target.value })}
                      placeholder="e.g. Helping Hands Foundation"
                    />
                  </div>

                  <div className="fl-pmodal-btns">
                    <button
                      type="button"
                      className="fl-btn-cancel"
                      onClick={() => setIsEditProfileOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="fl-btn-save"
                      disabled={profileSaving}
                    >
                      {profileSaving ? 'Saving Changes...' : 'Save Profile'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════
          5. FOOTER
         ═══════════════════════════════════════════════════════ */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
