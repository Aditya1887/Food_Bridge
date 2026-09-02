import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  BUILT_IN_AVATARS,
  uploadAvatarFile,
  getAvatarUrl,
  getUserInitials,
} from '../../services/avatarService';
import { profileService } from '../../services/profileService';
import { INDIAN_CITY_NAMES } from '../../services/citySearch';
import './AvatarPicker.css';



/**
 * AvatarPicker / ProfileSettingsModal — Clean, non-scrollable Profile & Settings Center connected to Supabase.
 */
export default function AvatarPicker({
  isOpen,
  onClose,
  currentAvatar,
  userId,
  profile,
  user,
  onAvatarChange,
}) {
  const { isDark, toggleTheme } = useTheme();
  const { updateUserProfile, refreshProfile } = useAuth();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'avatars' | 'preferences' | 'impact'

  // Real backend form data
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    organization_name: '',
    city: '',
    address: '',
    bio: '',
  });

  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);

  // Real backend user stats
  const [userStats, setUserStats] = useState({
    mealsShared: 0,
    mealsReceived: 0,
    kgSaved: 0,
    activeListings: 0,
    totalRequests: 0,
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: true,
    pickupReminders: true,
    weeklyReport: false,
  });

  // UI status
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const effectiveUserId = userId || user?.id;
  const effectiveRole = profile?.role || user?.user_metadata?.role || 'donor';

  // Fetch real backend data whenever modal opens
  useEffect(() => {
    if (!isOpen || !effectiveUserId) return;

    let isMounted = true;
    setFetchingData(true);

    const loadRealUserData = async () => {
      try {
        // 1. Fetch real latest profile from Supabase
        const realProfile = await profileService.getProfile(effectiveUserId);
        const resolved = realProfile || profile;

        if (isMounted && resolved) {
          setFormData({
            full_name: resolved.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
            phone: resolved.phone || user?.user_metadata?.phone || '',
            organization_name: resolved.organization_name || '',
            city: resolved.city || '',
            address: resolved.address || '',
            bio: resolved.bio || 'Helping build a zero-hunger, zero-waste community with FoodBridge.',
          });
          setSelectedAvatar(resolved.avatar_url || user?.user_metadata?.avatar_url || '');
        }

        // 2. Fetch real stats from Supabase
        const stats = await profileService.getUserStats(effectiveUserId, effectiveRole);
        if (isMounted && stats) {
          setUserStats(stats);
        }
      } catch (err) {
        console.warn('Load user profile notice:', err.message);
      } finally {
        if (isMounted) setFetchingData(false);
      }
    };

    loadRealUserData();

    setPreviewUrl(null);
    setUploadFile(null);
    setErrorMsg('');
    setSuccessMsg('');

    return () => {
      isMounted = false;
    };
  }, [isOpen, effectiveUserId, effectiveRole]);

  // Handle escape key to close cleanly
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background window scroll strictly while Profile & Settings modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  const initials = getUserInitials(profile, user);
  const currentDisplayUrl = getAvatarUrl(profile, user);

  // Active preview image
  const getActivePreviewSrc = () => {
    if (previewUrl) return previewUrl;
    if (selectedAvatar) {
      const builtIn = BUILT_IN_AVATARS.find((a) => a.id === selectedAvatar);
      if (builtIn) return builtIn.src;
      if (selectedAvatar.startsWith('http') || selectedAvatar.startsWith('data:image/') || selectedAvatar.startsWith('/assets/')) {
        return selectedAvatar;
      }
    }
    return currentDisplayUrl;
  };

  const activePreviewSrc = getActivePreviewSrc();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectAvatar = (avatar) => {
    setSelectedAvatar(avatar.id);
    setPreviewUrl(null);
    setUploadFile(null);
    setErrorMsg('');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size must be less than 5MB.');
      return;
    }

    setErrorMsg('');
    setUploadFile(file);
    setSelectedAvatar('');

    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target.result);
    reader.readAsDataURL(file);
  };

  const toggleNotification = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (!effectiveUserId) throw new Error('User session not found.');

      let finalAvatarUrl = selectedAvatar;

      // 1. Process custom file upload if selected
      if (uploadFile) {
        try {
          const uploadedUrl = await uploadAvatarFile(effectiveUserId, uploadFile);
          if (uploadedUrl) {
            finalAvatarUrl = uploadedUrl;
          }
        } catch (uploadErr) {
          console.warn('Avatar file upload warning:', uploadErr.message);
        }
      }

      const profilePayload = {
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        organization_name: formData.organization_name.trim() || null,
        city: formData.city.trim(),
        address: formData.address.trim() || null,
        avatar_url: finalAvatarUrl || profile?.avatar_url || '',
        updated_at: new Date().toISOString(),
      };

      // 2. Save in database
      if (updateUserProfile) {
        await updateUserProfile(profilePayload);
      } else {
        await profileService.updateProfile(effectiveUserId, profilePayload);
      }

      if (refreshProfile) {
        await refreshProfile();
      }

      if (onAvatarChange) {
        onAvatarChange(finalAvatarUrl);
      }

      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Save profile error:', err);
      setErrorMsg(err.message || 'Failed to update profile settings.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="ap-backdrop"
      onClick={onClose}
    >
      <div
        className="profile-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ════ TOP HERO BANNER ════ */}
        <div className="pm-header-banner">
          <div className="pm-user-glance">
            <div
              className="pm-avatar-wrap"
              onClick={() => setActiveTab('avatars')}
              title="Change avatar"
            >
              <div className="pm-avatar-circle">
                {activePreviewSrc ? (
                  <img src={activePreviewSrc} alt="Avatar" className="pm-avatar-img" />
                ) : (
                  <span className="pm-avatar-initials">{initials}</span>
                )}
              </div>
              <div className="pm-avatar-badge-edit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
            </div>

            <div className="pm-user-details">
              <div className="pm-user-name-row">
                <h3 className="pm-user-name">{formData.full_name || 'FoodBridge Member'}</h3>
                <span className="pm-role-pill">
                  {effectiveRole.toUpperCase()}
                </span>
                {profile?.is_verified && (
                  <span className="pm-verified-tag">
                    <svg viewBox="0 0 24 24" fill="#16a34a" width="12" height="12">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    Verified
                  </span>
                )}
              </div>
              <p className="pm-user-email">{user?.email || 'member@foodbridge.org'}</p>
            </div>
          </div>

          <button type="button" className="pm-close-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ════ TABS NAVIGATION BAR (Backend-connected) ════ */}
        <div className="pm-tabs-bar">
          {[
            { id: 'profile', label: '👤 Profile Info' },
            { id: 'avatars', label: '🎨 Choose Avatar' },
            { id: 'preferences', label: '⚙️ Settings' },
            { id: 'impact', label: '📊 Real Impact' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`pm-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="pm-tab-label-text">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ════ TAB BODY (Adaptive Smart Scroll) ════ */}
        <div className="pm-tab-body-wrapper">
              {/* TAB 1: Real Profile Information */}
              {activeTab === 'profile' && (
                <div className="pm-tab-pane">
                  <form onSubmit={handleSaveProfile} className="pm-compact-form">
                    <div className="pm-row-2">
                      <div className="pm-field">
                        <label htmlFor="pm-full-name" className="pm-lbl">Full Name</label>
                        <input
                          id="pm-full-name"
                          type="text"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleInputChange}
                          placeholder="Your Name"
                          required
                          className="pm-ctrl"
                          autoComplete="name"
                        />
                      </div>
                      <div className="pm-field">
                        <label htmlFor="pm-phone" className="pm-lbl">Phone Number</label>
                        <input
                          id="pm-phone"
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+91 98765 43210"
                          className="pm-ctrl"
                          autoComplete="tel"
                        />
                      </div>
                    </div>

                    <div className="pm-row-2">
                      <div className="pm-field">
                        <label htmlFor="pm-organization-name" className="pm-lbl">Organization / Cause</label>
                        <input
                          id="pm-organization-name"
                          type="text"
                          name="organization_name"
                          value={formData.organization_name}
                          onChange={handleInputChange}
                          placeholder="Organization (optional)"
                          className="pm-ctrl"
                          autoComplete="organization"
                        />
                      </div>
                      <div className="pm-field">
                        <label htmlFor="pm-city" className="pm-lbl">City / Region (India)</label>
                        <input
                          id="pm-city"
                          type="text"
                          name="city"
                          list="pm-indian-cities-list"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="e.g. Mumbai, Delhi, Jaipur, Pune"
                          className="pm-ctrl"
                          autoComplete="address-level2"
                        />
                        <datalist id="pm-indian-cities-list">
                          {INDIAN_CITY_NAMES.map((name) => (
                            <option key={name} value={name} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    <div className="pm-field">
                      <label htmlFor="pm-address" className="pm-lbl">Pickup Drop Point / Address</label>
                      <input
                        id="pm-address"
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="e.g. Ground Floor Gate #2, Sector 5"
                        className="pm-ctrl"
                        autoComplete="street-address"
                      />
                    </div>

                    <div className="pm-field">
                      <label htmlFor="pm-bio" className="pm-lbl">Community Bio</label>
                      <input
                        id="pm-bio"
                        type="text"
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="Short mission statement..."
                        className="pm-ctrl"
                        autoComplete="off"
                      />
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 2: AI Animated Avatars Grid */}
              {activeTab === 'avatars' && (
                <div className="pm-tab-pane">
                  {/* Clean 4x2 Avatar Grid */}
                  <div className="pm-clean-avatar-grid">
                    {BUILT_IN_AVATARS.map((avatar) => {
                      const isSelected = selectedAvatar === avatar.id;
                      return (
                        <button
                          key={avatar.id}
                          type="button"
                          className={`pm-clean-avatar-btn ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleSelectAvatar(avatar)}
                        >
                          <img src={avatar.src} alt="Avatar" className="pm-clean-avatar-img" />
                          {isSelected && (
                            <div className="pm-clean-check-badge">
                              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Compact Custom Photo Upload Bar */}
                  <div className="pm-compact-upload-bar">
                    <div className="pm-upload-info-text">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" width="18" height="18">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span>{uploadFile ? uploadFile.name : 'Or upload a custom photo (JPG/PNG, Max 5MB)'}</span>
                    </div>

                    <input
                      id="pm-custom-avatar-file-input"
                      name="avatarPhoto"
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                      aria-label="Upload custom avatar image"
                    />

                    <button
                      type="button"
                      className="pm-btn-upload-trigger"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Browse
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: Real Settings & Notifications */}
              {activeTab === 'preferences' && (
                <div className="pm-tab-pane">
                  <div className="pm-settings-list">
                    {[
                      { key: 'emailAlerts', title: 'Email Notifications', desc: 'Updates on accepted food donations & requests' },
                      { key: 'smsAlerts', title: 'Real-time SMS Alerts', desc: 'Verification OTP and immediate driver arrival codes' },
                      { key: 'pickupReminders', title: 'Pickup Reminders', desc: 'Reminders 30 minutes before food pickup window' },
                    ].map((item) => (
                      <div key={item.key} className="pm-setting-item">
                        <div>
                          <strong className="pm-setting-title">{item.title}</strong>
                          <p className="pm-setting-desc">{item.desc}</p>
                        </div>
                        <label htmlFor={`pm-switch-${item.key}`} className="pm-switch" aria-label={item.title}>
                          <input
                            id={`pm-switch-${item.key}`}
                            name={item.key}
                            type="checkbox"
                            checked={notifications[item.key]}
                            onChange={() => toggleNotification(item.key)}
                            aria-label={item.title}
                          />
                          <span className="pm-slider" />
                        </label>
                      </div>
                    ))}

                    <div className="pm-setting-item pm-theme-item">
                      <div>
                        <strong className="pm-setting-title">Appearance Theme</strong>
                        <p className="pm-setting-desc">Currently in {isDark ? 'Dark' : 'Light'} Mode</p>
                      </div>
                      <button
                        type="button"
                        className="pm-btn-compact-theme"
                        onClick={toggleTheme}
                      >
                        {isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Real Impact from Backend */}
              {activeTab === 'impact' && (
                <div className="pm-tab-pane">
                  <div className="pm-real-stats-grid">
                    <div className="pm-real-stat-card">
                      <span className="pm-rstat-num">
                        {effectiveRole === 'donor' ? (userStats.mealsShared || 0) : (userStats.mealsReceived || 0)}
                      </span>
                      <span className="pm-rstat-lbl">
                        {effectiveRole === 'donor' ? 'Meals Shared' : 'Meals Received'}
                      </span>
                    </div>

                    <div className="pm-real-stat-card">
                      <span className="pm-rstat-num">
                        {userStats.kgSaved || 0} kg
                      </span>
                      <span className="pm-rstat-lbl">Waste Prevented</span>
                    </div>

                    <div className="pm-real-stat-card">
                      <span className="pm-rstat-num">
                        {effectiveRole === 'donor' ? (userStats.activeListings || 0) : (userStats.totalRequests || 0)}
                      </span>
                      <span className="pm-rstat-lbl">
                        {effectiveRole === 'donor' ? 'Active Listings' : 'Total Requests'}
                      </span>
                    </div>
                  </div>

                  <div className="pm-user-meta-summary">
                    <div className="pm-meta-pill">
                      <span>🌱 Status:</span>
                      <strong>{profile?.is_verified ? 'Verified Community Partner' : 'Active Community Member'}</strong>
                    </div>
                    <div className="pm-meta-pill">
                      <span>📅 Member Since:</span>
                      <strong>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active Member'}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ════ NOTIFICATIONS / ALERTS ════ */}
            {errorMsg && (
              <div className="pm-status-banner error">
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="pm-status-banner success">
                <span>{successMsg}</span>
              </div>
            )}

            {/* ════ FOOTER ════ */}
            <div className="pm-compact-footer">
              <button type="button" className="pm-btn-cancel-flat" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="pm-btn-save-flat"
                onClick={handleSaveProfile}
                disabled={loading || fetchingData}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
      </div>
    </div>
  );
}

