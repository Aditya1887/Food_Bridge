import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../components/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { statsService } from '../../services/statsService';
import { pickupService } from '../../services/pickupService';
import { getAvatarUrl, getUserInitials } from '../../services/avatarService';
import AvatarPicker from '../../components/AvatarPicker/AvatarPicker';
import './AdminDashboard.css';

export default function AdminDashboard({ onNavigate }) {
  const { isDark, toggleTheme } = useTheme();
  const { user, profile, logout, refreshProfile } = useAuth();

  const [activeNav, setActiveNav] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Data
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [requests, setRequests] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [messages, setMessages] = useState([]);

  const showToast = (message, type = 'success', duration = 4000) => {
    setToastMessage(message);
    setToastType(type);
    if (duration > 0) setTimeout(() => setToastMessage(''), duration);
  };

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [platformStats, allUsers, allItems, allRequests, allPickups, allMessages] = await Promise.all([
        statsService.getPlatformStats(),
        statsService.getAllUsers(),
        statsService.getAllFoodItems(),
        statsService.getAllFoodRequests(),
        pickupService.getAllPickups(),
        statsService.getContactMessages(),
      ]);
      setStats(platformStats);
      setUsers(allUsers);
      setFoodItems(allItems);
      setRequests(allRequests);
      setPickups(allPickups);
      setMessages(allMessages);
    } catch (err) {
      console.warn('Admin data load notice:', err.message);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();

    // Real-time subscriptions across all public tables for the admin dashboard
    const adminProfilesChannel = supabase
      .channel('admin_profiles_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        loadData();
      })
      .subscribe();

    const adminFoodChannel = supabase
      .channel('admin_food_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'food_items' }, () => {
        loadData();
      })
      .subscribe();

    const adminRequestsChannel = supabase
      .channel('admin_requests_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'food_requests' }, () => {
        loadData();
      })
      .subscribe();

    const adminPickupsChannel = supabase
      .channel('admin_pickups_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pickup_records' }, () => {
        loadData();
      })
      .subscribe();

    const adminScheduledChannel = supabase
      .channel('admin_scheduled_pickups_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pickups' }, () => {
        loadData();
      })
      .subscribe();

    const adminMessagesChannel = supabase
      .channel('admin_messages_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_messages' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(adminProfilesChannel);
      supabase.removeChannel(adminFoodChannel);
      supabase.removeChannel(adminRequestsChannel);
      supabase.removeChannel(adminPickupsChannel);
      supabase.removeChannel(adminScheduledChannel);
      supabase.removeChannel(adminMessagesChannel);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    if (onNavigate) onNavigate('home');
    window.location.hash = '';
  };

  const handleGoHome = () => {
    if (onNavigate) onNavigate('home');
    window.location.hash = '';
  };

  const handleToggleVerify = async (userId, currentStatus) => {
    try {
      await statsService.toggleUserVerification(userId, !currentStatus);
      showToast(currentStatus ? 'User unverified.' : 'User verified!', 'success');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update verification.', 'error');
    }
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Admin';
  const avatarUrl = getAvatarUrl(profile, user);
  const initials = getUserInitials(profile, user);

  const NAV_ITEMS = [
    { id: 'overview', label: 'Overview', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg> },
    { id: 'users', label: 'Users', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
    { id: 'donations', label: 'Donations', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg> },
    { id: 'requests', label: 'Requests', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg> },
    { id: 'pickups', label: 'Pickups', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg> },
    { id: 'messages', label: 'Messages', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg> },
    { id: 'settings', label: 'Profile & Settings', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg> },
  ];

  const STAT_CARDS = [
    { label: 'Total Users', value: stats.totalUsers || 0, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg> },
    { label: 'Total Donations', value: stats.totalDonations || 0, color: '#16a34a', bg: 'rgba(22,163,74,0.1)', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /></svg> },
    { label: 'Meals Shared', value: stats.totalMeals || 0, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" /></svg> },
    { label: 'Food Saved (kg)', value: stats.totalKg || 0, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></svg> },
    { label: 'CO₂ Saved (kg)', value: stats.co2Saved || 0, color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg> },
    { label: 'Completed', value: stats.completedRequests || 0, color: '#ec4899', bg: 'rgba(236,72,153,0.1)', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg> },
  ];

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  const renderContent = () => {
    if (loadingData) {
      return (
        <div className="ad-loading-state">
          <div className="ad-loading-spinner" />
          <p>Loading admin data...</p>
        </div>
      );
    }

    switch (activeNav) {
      case 'users':
        return (
          <div className="ad-table-section">
            <div className="ad-table-header">
              <h2 className="ad-table-title">All Users</h2>
              <span className="ad-table-count">{users.length} users</span>
            </div>
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Organization</th>
                    <th>Joined</th>
                    <th>Verified</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={7}><div className="ad-empty-state"><p>No users found.</p></div></td></tr>
                  ) : users.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                      <td>{u.email}</td>
                      <td><span className={`ad-role-badge ${u.role}`}>{u.role}</span></td>
                      <td>{u.organization_name || '-'}</td>
                      <td>{formatDate(u.created_at)}</td>
                      <td>{u.is_verified ? '✅' : '—'}</td>
                      <td>
                        <button
                          className={`ad-verify-btn ${u.is_verified ? 'unverify' : 'verify'}`}
                          onClick={() => handleToggleVerify(u.id, u.is_verified)}
                        >
                          {u.is_verified ? 'Unverify' : 'Verify'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'donations':
        return (
          <div className="ad-table-section">
            <div className="ad-table-header">
              <h2 className="ad-table-title">All Food Donations</h2>
              <span className="ad-table-count">{foodItems.length} items</span>
            </div>
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Food Name</th>
                    <th>Donor</th>
                    <th>Category</th>
                    <th>Servings</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {foodItems.length === 0 ? (
                    <tr><td colSpan={7}><div className="ad-empty-state"><p>No donations found.</p></div></td></tr>
                  ) : foodItems.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.food_name}</td>
                      <td>{item.donor?.full_name || '-'}</td>
                      <td>{item.category}</td>
                      <td>{item.servings}</td>
                      <td>{item.pickup_location}</td>
                      <td><span className={`ad-status-badge ${item.status}`}>{item.status}</span></td>
                      <td>{formatDate(item.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'requests':
        return (
          <div className="ad-table-section">
            <div className="ad-table-header">
              <h2 className="ad-table-title">All Food Requests</h2>
              <span className="ad-table-count">{requests.length} requests</span>
            </div>
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Food Item</th>
                    <th>Receiver</th>
                    <th>Donor</th>
                    <th>Servings</th>
                    <th>Status</th>
                    <th>Requested</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.length === 0 ? (
                    <tr><td colSpan={6}><div className="ad-empty-state"><p>No requests found.</p></div></td></tr>
                  ) : requests.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.food?.food_name || '-'}</td>
                      <td>{r.receiver?.full_name || '-'}</td>
                      <td>{r.donor?.full_name || '-'}</td>
                      <td>{r.requested_servings || '-'}</td>
                      <td><span className={`ad-status-badge ${r.status}`}>{r.status}</span></td>
                      <td>{formatDate(r.requested_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'pickups':
        return (
          <div className="ad-table-section">
            <div className="ad-table-header">
              <h2 className="ad-table-title">All Pickup Records</h2>
              <span className="ad-table-count">{pickups.length} pickups</span>
            </div>
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Food ID</th>
                    <th>Status</th>
                    <th>OTP</th>
                    <th>Location</th>
                    <th>Created</th>
                    <th>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {pickups.length === 0 ? (
                    <tr><td colSpan={6}><div className="ad-empty-state"><p>No pickup records found.</p></div></td></tr>
                  ) : pickups.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{p.food_id?.slice(0, 8)}...</td>
                      <td><span className={`ad-status-badge ${p.status}`}>{p.status}</span></td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{p.otp_code}</td>
                      <td>{p.pickup_location || '-'}</td>
                      <td>{formatDate(p.created_at)}</td>
                      <td>{p.completed_at ? formatDate(p.completed_at) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'messages':
        return (
          <div className="ad-table-section">
            <div className="ad-table-header">
              <h2 className="ad-table-title">Contact Messages</h2>
              <span className="ad-table-count">{messages.length} messages</span>
            </div>
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Subject</th>
                    <th>Message</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.length === 0 ? (
                    <tr><td colSpan={5}><div className="ad-empty-state"><p>No messages yet.</p></div></td></tr>
                  ) : messages.map(m => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 600 }}>{m.name}</td>
                      <td>{m.email}</td>
                      <td>{m.subject || '-'}</td>
                      <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.message}</td>
                      <td>{formatDate(m.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default: // overview
        return (
          <>
            <div className="ad-stats-grid">
              {STAT_CARDS.map((card) => (
                <motion.div
                  key={card.label}
                  className="ad-stat-card"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  whileHover={{ y: -2 }}
                >
                  <div className="ad-stat-icon-wrap" style={{ background: card.bg, color: card.color }}>
                    {card.icon}
                  </div>
                  <div>
                    <div className="ad-stat-value">{typeof card.value === 'number' ? card.value.toLocaleString() : (card.value || 0)}</div>
                    <div className="ad-stat-label">{card.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Recent donations */}
            <div className="ad-table-section">
              <div className="ad-table-header">
                <h2 className="ad-table-title">Recent Donations</h2>
                <span className="ad-table-count">{foodItems.length} total</span>
              </div>
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>Food Name</th>
                      <th>Donor</th>
                      <th>Servings</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {foodItems.slice(0, 8).map(item => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>{item.food_name}</td>
                        <td>{item.donor?.full_name || '-'}</td>
                        <td>{item.servings}</td>
                        <td><span className={`ad-status-badge ${item.status}`}>{item.status}</span></td>
                        <td>{formatDate(item.created_at)}</td>
                      </tr>
                    ))}
                    {foodItems.length === 0 && (
                      <tr><td colSpan={5}><div className="ad-empty-state"><p>No donations yet.</p></div></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent requests */}
            <div className="ad-table-section">
              <div className="ad-table-header">
                <h2 className="ad-table-title">Recent Requests</h2>
                <span className="ad-table-count">{requests.length} total</span>
              </div>
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>Food</th>
                      <th>Receiver</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.slice(0, 5).map(r => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600 }}>{r.food?.food_name || '-'}</td>
                        <td>{r.receiver?.full_name || '-'}</td>
                        <td><span className={`ad-status-badge ${r.status}`}>{r.status}</span></td>
                        <td>{formatDate(r.requested_at)}</td>
                      </tr>
                    ))}
                    {requests.length === 0 && (
                      <tr><td colSpan={4}><div className="ad-empty-state"><p>No requests yet.</p></div></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className={`admin-dashboard ${isDark ? 'dark-mode' : ''}`}>
      {/* Sidebar */}
      <aside className={`ad-sidebar ${mobileMenuOpen ? 'ad-sidebar-open' : ''}`}>
        <div className="ad-sidebar-header">
          <div className="ad-brand" onClick={handleGoHome} role="button" tabIndex={0}>
            <div className="ad-logo-icon">
              <svg viewBox="0 0 48 48" fill="none">
                <path d="M24 6 C21 10 21 15 24 18 C27 15 27 10 24 6 Z" fill="#4ade80" />
                <path d="M17 10 C14 12 14 16 18 18 C19 15 18 12 17 10 Z" fill="#4ade80" />
                <path d="M31 10 C34 12 34 16 30 18 C29 15 30 12 31 10 Z" fill="#4ade80" />
                <path d="M12 28 Q 24 16 36 28" stroke="#4ade80" strokeWidth="2.8" fill="none" />
                <path d="M10 30 C14 42 34 42 38 30" stroke="#4ade80" strokeWidth="2.8" fill="none" />
              </svg>
            </div>
            <div>
              <span className="ad-brand-name">FoodBridge</span>
              <span className="ad-brand-tagline">Admin Panel</span>
            </div>
          </div>
          <button className="ad-close-mobile-btn" onClick={() => setMobileMenuOpen(false)} aria-label="Close">✕</button>
        </div>

        <nav className="ad-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`ad-nav-item ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => {
                if (item.id === 'settings') {
                  setProfileModalOpen(true);
                } else {
                  setActiveNav(item.id);
                }
                setMobileMenuOpen(false);
              }}
            >
              <span className="ad-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.id === 'users' && users.length > 0 && <span className="ad-nav-badge">{users.length}</span>}
              {item.id === 'messages' && messages.length > 0 && <span className="ad-nav-badge">{messages.length}</span>}
            </button>
          ))}

          <div style={{ flex: 1 }} />

          <button className="ad-nav-item" onClick={handleLogout}>
            <svg className="ad-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Log Out</span>
          </button>
        </nav>
      </aside>

      {/* Main */}
      <div className="ad-main-container">
        <header className="ad-top-header">
          <div className="ad-header-left">
            <button className="ad-hamburger-btn" onClick={() => setMobileMenuOpen(true)} aria-label="Menu">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div>
              <h1 className="ad-welcome-title">Admin Dashboard 🛡️</h1>
              <p className="ad-welcome-subtitle">Welcome, {displayName} · Manage FoodBridge platform</p>
            </div>
          </div>
          <div className="ad-header-right">
            <button className="ad-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
              {isDark ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
              )}
            </button>
            <button
              className="ad-theme-btn"
              onClick={loadData}
              aria-label="Refresh"
              title="Refresh data"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
          </div>
        </header>

        <div className="ad-content-body">
          {renderContent()}
        </div>
      </div>

      {/* Profile & Settings Modal */}
      <AvatarPicker
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        currentAvatar={profile?.avatar_url}
        userId={user?.id}
        profile={profile}
        user={user}
        onAvatarChange={() => {
          refreshProfile();
          showToast('Profile & avatar updated successfully!', 'success');
        }}
      />

      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            className="ad-floating-toast"
            style={{
              background: toastType === 'error' ? '#fef2f2' : '#edf7ee',
              border: `1.5px solid ${toastType === 'error' ? '#fecaca' : '#a7f3d0'}`,
              color: toastType === 'error' ? '#991b1b' : '#065f46',
            }}
            initial={{ opacity: 0, y: -10, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
