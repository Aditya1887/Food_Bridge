import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../components/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { statsService } from '../../services/statsService';
import { pickupService } from '../../services/pickupService';
import { foodService } from '../../services/foodService';
import { notificationService } from '../../services/notificationService';
import { getAvatarUrl, getUserInitials } from '../../services/avatarService';
import AvatarPicker from '../../components/AvatarPicker/AvatarPicker';

// Subcomponents
import AdminSidebar from './components/AdminSidebar';
import AdminTopNav from './components/AdminTopNav';
import AdminOverview from './components/AdminOverview';
import AdminUsersView from './components/AdminUsersView';
import AdminDonationsView from './components/AdminDonationsView';
import AdminPickupsView from './components/AdminPickupsView';
import AdminCategoriesView from './components/AdminCategoriesView';
import AdminAnalyticsView from './components/AdminAnalyticsView';
import AdminMessagesView from './components/AdminMessagesView';
import AdminNotificationsView from './components/AdminNotificationsView';
import AdminActivityView from './components/AdminActivityView';
import AdminSettingsView from './components/AdminSettingsView';
import AdminSearchModal from './components/AdminSearchModal';

import './AdminDashboard.css';

export default function AdminDashboard({ onNavigate }) {
  const { isDark, toggleTheme } = useTheme();
  const { user, profile, logout, refreshProfile } = useAuth();

  // Navigation & Modal States
  const [activeNav, setActiveNav] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Global Toast
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Backend Data
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [requests, setRequests] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const showToast = (message, type = 'success', duration = 3500) => {
    setToastMessage(message);
    setToastType(type);
    if (duration > 0) {
      setTimeout(() => setToastMessage(''), duration);
    }
  };

  // Load all platform data
  const loadData = async () => {
    try {
      const [platformStats, allUsers, allItems, allRequests, allPickups, allMessages] = await Promise.all([
        statsService.getPlatformStats(),
        statsService.getAllUsers(),
        statsService.getAllFoodItems(),
        statsService.getAllFoodRequests(),
        pickupService.getAllPickups(),
        statsService.getContactMessages(),
      ]);

      setStats(platformStats || {});
      setUsers(allUsers || []);
      setFoodItems(allItems || []);
      setRequests(allRequests || []);
      setPickups(allPickups || []);
      setMessages(allMessages || []);

      if (user?.id) {
        const notifs = await notificationService.getUserNotifications(user.id, 10);
        setNotifications(notifs || []);
      }
    } catch (err) {
      console.warn('AdminDashboard data load notice:', err.message);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();

    // ── 6 Real-time Supabase postgres subscriptions ──
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
  }, [user?.id]);

  // Actions
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
      showToast(currentStatus ? 'User verification revoked.' : 'Organization verified successfully! ✓', 'success');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update verification.', 'error');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      showToast(`User role updated to "${newRole}".`, 'success');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update user role.', 'error');
    }
  };

  const handleUpdateDonationStatus = async (foodId, newStatus) => {
    try {
      await foodService.updateFoodItem(foodId, { status: newStatus });
      showToast(`Donation status updated to "${newStatus}".`, 'success');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update donation status.', 'error');
    }
  };

  const handleDeleteDonation = async (foodId) => {
    try {
      await foodService.deleteFoodItem(foodId);
      showToast('Food listing removed from platform.', 'success');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to remove listing.', 'error');
    }
  };

  const handleUpdatePickupStatus = async (pickupId, newStatus) => {
    try {
      await pickupService.updatePickupStatus(pickupId, newStatus);
      showToast(`Pickup status updated to "${newStatus}".`, 'success');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update pickup status.', 'error');
    }
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Admin';
  const avatarUrl = getAvatarUrl(profile, user);
  const avatarInitials = getUserInitials(profile, user);

  // Counts for sidebar badges
  const navCounts = {
    users: users.length,
    donors: users.filter(u => u.role === 'donor').length,
    receivers: users.filter(u => u.role === 'receiver').length,
    donations: foodItems.length,
    pickups: pickups.filter(p => p.status !== 'completed').length,
    messages: messages.length,
    notifications: notifications.filter(n => !n.is_read).length,
  };

  // Render current active view
  const renderCurrentView = () => {
    switch (activeNav) {
      case 'overview':
        return (
          <AdminOverview
            key="overview"
            stats={stats}
            users={users}
            foodItems={foodItems}
            requests={requests}
            pickups={pickups}
            messages={messages}
            displayName={displayName}
            onSelectNav={setActiveNav}
            onViewDonationDetail={() => setActiveNav('donations')}
          />
        );

      case 'users':
        return (
          <AdminUsersView
            key="users"
            users={users}
            onToggleVerify={handleToggleVerify}
            onUpdateRole={handleUpdateRole}
            loading={loadingData}
            roleFilterDefault="all"
          />
        );

      case 'donors':
        return (
          <AdminUsersView
            key="donors"
            users={users}
            onToggleVerify={handleToggleVerify}
            onUpdateRole={handleUpdateRole}
            loading={loadingData}
            roleFilterDefault="donor"
          />
        );

      case 'receivers':
        return (
          <AdminUsersView
            key="receivers"
            users={users}
            onToggleVerify={handleToggleVerify}
            onUpdateRole={handleUpdateRole}
            loading={loadingData}
            roleFilterDefault="receiver"
          />
        );

      case 'donations':
        return (
          <AdminDonationsView
            key="donations"
            foodItems={foodItems}
            onUpdateStatus={handleUpdateDonationStatus}
            onDeleteListing={handleDeleteDonation}
          />
        );

      case 'pickups':
        return (
          <AdminPickupsView
            key="pickups"
            pickups={pickups}
            onUpdateStatus={handleUpdatePickupStatus}
          />
        );

      case 'categories':
        return (
          <AdminCategoriesView
            key="categories"
            foodItems={foodItems}
            onSelectNav={setActiveNav}
          />
        );

      case 'analytics':
      case 'reports':
        return (
          <AdminAnalyticsView
            key={activeNav}
            stats={stats}
            users={users}
            foodItems={foodItems}
            pickups={pickups}
          />
        );

      case 'messages':
        return (
          <AdminMessagesView
            key="messages"
            messages={messages}
          />
        );

      case 'notifications':
        return (
          <AdminNotificationsView
            key="notifications"
            notifications={notifications}
            users={users}
            foodItems={foodItems}
          />
        );

      case 'admin_users':
        return (
          <AdminUsersView
            key="admin_users"
            users={users}
            onToggleVerify={handleToggleVerify}
            onUpdateRole={handleUpdateRole}
            loading={loadingData}
            roleFilterDefault="admin"
          />
        );

      case 'activity_logs':
        return (
          <AdminActivityView
            key="activity_logs"
            users={users}
            foodItems={foodItems}
            pickups={pickups}
            messages={messages}
          />
        );

      case 'settings':
        return (
          <AdminSettingsView
            key="settings"
            onShowToast={showToast}
            users={users}
            foodItems={foodItems}
            pickups={pickups}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`admin-dashboard ${isDark ? 'dark-mode' : ''}`}>
      {/* ── Left Sticky Sidebar ── */}
      <AdminSidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onGoHome={handleGoHome}
        onLogout={handleLogout}
        counts={navCounts}
      />

      {/* ── Main Container ── */}
      <div className="ad-main-container">
        {/* Top Header Navigation */}
        <AdminTopNav
          activeNav={activeNav}
          displayName={displayName}
          avatarUrl={avatarUrl}
          avatarInitials={avatarInitials}
          isDark={isDark}
          toggleTheme={toggleTheme}
          setMobileMenuOpen={setMobileMenuOpen}
          onOpenSearch={() => setSearchModalOpen(true)}
          onOpenSettings={() => setProfileModalOpen(true)}
          onGoHome={handleGoHome}
          onLogout={handleLogout}
          onNavigate={onNavigate}
          unreadNotifsCount={navCounts.notifications}
          notifications={notifications}
          onSelectNav={setActiveNav}
        />

        {/* Content Body */}
        <main className="ad-content-body">
          {renderCurrentView()}
        </main>
      </div>

      {/* ── Global ⌘K Search Command Palette Modal ── */}
      <AdminSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        users={users}
        foodItems={foodItems}
        onSelectNav={setActiveNav}
      />

      {/* ── Profile & Avatar Picker Studio Modal ── */}
      {profileModalOpen && (
        <AvatarPicker
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          currentAvatar={avatarUrl}
          userId={user?.id}
          profile={profile}
          user={user}
          onAvatarChange={async () => {
            await refreshProfile();
            showToast('Admin profile updated successfully!', 'success');
          }}
        />
      )}

      {/* ── Floating Global Toast ── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            className={`ad-floating-toast ${toastType === 'error' ? 'toast-error' : 'toast-success'}`}
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {toastType === 'error' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ad-toast-icon">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ad-toast-icon">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            )}
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
