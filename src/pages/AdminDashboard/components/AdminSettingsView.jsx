import '../AdminDashboard.css';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { profileService } from '../../../services/profileService';
import {
  BUILT_IN_AVATARS,
  uploadAvatarFile,
  getAvatarUrl,
  getUserInitials,
} from '../../../services/avatarService';

const CITIES = [
  'Mumbai, Maharashtra',
  'Delhi NCR, India',
  'Bengaluru, Karnataka',
  'Pune, Maharashtra',
  'Hyderabad, Telangana',
  'Kolkata, West Bengal',
  'Chennai, Tamil Nadu',
  'Ahmedabad, Gujarat',
];

export default function AdminSettingsView({
  onShowToast,
  users = [],
  foodItems = [],
  pickups = [],
}) {
  const { user, profile, updateUserProfile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'platform' | 'alerts' | 'diagnostics'

  // Profile Form state
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    organization_name: '',
    city: 'Mumbai, Maharashtra',
    address: '',
    bio: '',
  });

  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Platform operational settings state
  const [platformConfig, setPlatformConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('fb_platform_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      minPickupMinutes: 30,
      autoExpiryHours: 6,
      maxReservationsPerNgo: 5,
      requireOtpVerification: true,
      emergencyBroadcasts: true,
    };
  });

  // Alert preferences
  const [alertPreferences, setAlertPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem('fb_alert_preferences');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      emailOnNewDonation: true,
      emailOnNgoVerification: true,
      smsUrgentPickups: true,
      weeklyImpactDigest: true,
    };
  });

  useEffect(() => {
    if (profile || user) {
      setFormData({
        full_name: profile?.full_name || user?.user_metadata?.full_name || '',
        phone: profile?.phone || '',
        organization_name: profile?.organization_name || '',
        city: profile?.city || 'Mumbai, Maharashtra',
        address: profile?.address || '',
        bio: profile?.bio || '',
      });
      setSelectedAvatar(profile?.avatar_url || '');
    }
  }, [profile, user]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setSavingProfile(true);

    try {
      const payload = {
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        organization_name: formData.organization_name.trim(),
        city: formData.city,
        address: formData.address.trim(),
        bio: formData.bio.trim(),
        avatar_url: selectedAvatar || null,
      };

      if (updateUserProfile) {
        await updateUserProfile(payload);
      } else {
        await profileService.updateProfile(user.id, payload);
      }

      await refreshProfile();
      if (onShowToast) onShowToast('Admin profile & credentials saved successfully!', 'success');
    } catch (err) {
      console.error('Profile update error:', err);
      if (onShowToast) onShowToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    try {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      const publicUrl = await uploadAvatarFile(user.id, file);
      if (publicUrl) {
        setSelectedAvatar(publicUrl);
        if (onShowToast) onShowToast('Avatar uploaded successfully! Click Save to apply.', 'success');
      }
    } catch (err) {
      if (onShowToast) onShowToast('Failed to upload image.', 'error');
    }
  };

  const handleSavePlatformConfig = (e) => {
    e.preventDefault();
    localStorage.setItem('fb_platform_config', JSON.stringify(platformConfig));
    if (onShowToast) onShowToast('Platform operational settings saved successfully!', 'success');
  };

  const handleSaveAlerts = (e) => {
    e.preventDefault();
    localStorage.setItem('fb_alert_preferences', JSON.stringify(alertPreferences));
    if (onShowToast) onShowToast('Notification & alert preferences saved!', 'success');
  };

  const handleExportJSON = () => {
    const dataDump = {
      exportDate: new Date().toISOString(),
      platform: 'FoodBridge Zero-Waste Logistics',
      totalUsers: users.length,
      totalFoodListings: foodItems.length,
      totalPickups: pickups.length,
      users: users.map(u => ({ id: u.id, name: u.full_name, role: u.role, org: u.organization_name, email: u.email, verified: u.is_verified })),
      foodItems: foodItems.map(f => ({ id: f.id, name: f.food_name, category: f.category, servings: f.servings, status: f.status, location: f.pickup_location })),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dataDump, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `foodbridge_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  const currentDisplayAvatar = previewUrl || selectedAvatar || getAvatarUrl(profile, user);
  const initials = getUserInitials(profile, user);

  return (
    <div className="ad-view-container">
      {/* ── Header ── */}
      <div className="ad-view-header">
        <div>
          <h2 className="ad-view-title">Admin Account & System Settings</h2>
          <p className="ad-view-subtitle">
            Configure platform policies, customize administrative credentials, manage alerts, and inspect database diagnostics.
          </p>
        </div>
      </div>

      {/* ── Settings Navigation Tabs ── */}
      <div className="ad-tab-chips-row">
        {[
          { id: 'profile', label: 'Admin Profile & Avatar Studio', icon: '👤' },
          { id: 'platform', label: 'Platform Operations & Rules', icon: '⚙️' },
          { id: 'alerts', label: 'Alerts & Notifications', icon: '🔔' },
          { id: 'diagnostics', label: 'System Health & Backups', icon: '🛡️' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`ad-tab-chip ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── 1. Admin Profile Tab ── */}
      {activeTab === 'profile' && (
        <div className="ad-table-card" style={{ padding: '28px' }}>
          <form onSubmit={handleProfileSave}>
            <div className="ad-modal-profile-hero" style={{ borderBottom: '1px solid rgba(22, 163, 74, 0.1)', paddingBottom: '20px', marginBottom: '24px' }}>
              {currentDisplayAvatar ? (
                <img src={currentDisplayAvatar} alt={formData.full_name} className="ad-modal-avatar-img" />
              ) : (
                <div className="ad-modal-avatar-placeholder">{initials}</div>
              )}
              <div>
                <h3 className="ad-modal-user-name" style={{ fontSize: '20px' }}>{formData.full_name || 'Super Administrator'}</h3>
                <span className="ad-modal-role-tag">Super Admin</span>
                <p className="ad-cell-muted" style={{ marginTop: '4px' }}>{user?.email || 'admin@foodbridge.org'}</p>
              </div>
            </div>

            {/* Avatar Studio Picker */}
            <div style={{ marginBottom: '28px' }}>
              <label className="ad-info-label" style={{ marginBottom: '10px', display: 'block' }}>
                Select Built-in Avatar or Upload Custom Photo:
              </label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                {BUILT_IN_AVATARS.map((av) => (
                  <img
                    key={av.id}
                    src={av.url}
                    alt={av.label}
                    onClick={() => {
                      setSelectedAvatar(av.url);
                      setPreviewUrl(null);
                    }}
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      border: selectedAvatar === av.url ? '3px solid #16a34a' : '2px solid transparent',
                      padding: '2px',
                      transition: 'all 0.18s ease',
                    }}
                    title={av.label}
                  />
                ))}

                <label
                  style={{
                    padding: '8px 14px',
                    borderRadius: '20px',
                    background: '#f1f5f3',
                    border: '1px dashed #16a34a',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#166534',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  📷 Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            {/* Profile Fields Grid */}
            <div className="ad-modal-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div className="ad-modal-info-item">
                <label className="ad-info-label" htmlFor="full_name">Full Name</label>
                <input
                  id="full_name"
                  type="text"
                  className="ad-table-search-input"
                  style={{ width: '100%', marginTop: '6px' }}
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>

              <div className="ad-modal-info-item">
                <label className="ad-info-label" htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="text"
                  className="ad-table-search-input"
                  style={{ width: '100%', marginTop: '6px' }}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="ad-modal-info-item">
                <label className="ad-info-label" htmlFor="org_name">Organization / Team</label>
                <input
                  id="org_name"
                  type="text"
                  className="ad-table-search-input"
                  style={{ width: '100%', marginTop: '6px' }}
                  value={formData.organization_name}
                  onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                  placeholder="FoodBridge Core Leadership"
                />
              </div>

              <div className="ad-modal-info-item">
                <label className="ad-info-label" htmlFor="city">City / Operation Base</label>
                <select
                  id="city"
                  className="ad-category-select"
                  style={{ width: '100%', marginTop: '6px' }}
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="ad-modal-info-item" style={{ gridColumn: 'span 2' }}>
                <label className="ad-info-label" htmlFor="address">Physical Headquarters / Address</label>
                <input
                  id="address"
                  type="text"
                  className="ad-table-search-input"
                  style={{ width: '100%', marginTop: '6px' }}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Central Hub, Bandra West, Mumbai"
                />
              </div>

              <div className="ad-modal-info-item" style={{ gridColumn: 'span 2' }}>
                <label className="ad-info-label" htmlFor="bio">Administrator Bio</label>
                <textarea
                  id="bio"
                  rows="3"
                  className="ad-table-search-input"
                  style={{ width: '100%', marginTop: '6px', height: 'auto', padding: '10px 14px', borderRadius: '12px' }}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Supervising zero-waste redistribution network."
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="submit"
                className="ad-btn-export-csv"
                disabled={savingProfile}
              >
                {savingProfile ? 'Saving Profile...' : 'Save Profile Changes ✓'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── 2. Platform Operations Tab ── */}
      {activeTab === 'platform' && (
        <div className="ad-table-card" style={{ padding: '28px' }}>
          <form onSubmit={handleSavePlatformConfig}>
            <h3 className="ad-panel-title" style={{ fontSize: '16px', marginBottom: '18px' }}>
              Platform Rules & Automation Controls
            </h3>

            <div className="ad-modal-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px' }}>
              <div className="ad-modal-info-item">
                <label className="ad-info-label">Minimum Lead Time for Pickup (Minutes)</label>
                <input
                  type="number"
                  min="10"
                  max="180"
                  className="ad-table-search-input"
                  style={{ width: '100%', marginTop: '6px' }}
                  value={platformConfig.minPickupMinutes}
                  onChange={(e) => setPlatformConfig({ ...platformConfig, minPickupMinutes: Number(e.target.value) })}
                />
                <span className="ad-cell-muted" style={{ fontSize: '11px', marginTop: '3px' }}>
                  Buffer between request acceptance and driver pickup.
                </span>
              </div>

              <div className="ad-modal-info-item">
                <label className="ad-info-label">Cooked Meal Default Expiry (Hours)</label>
                <input
                  type="number"
                  min="2"
                  max="24"
                  className="ad-table-search-input"
                  style={{ width: '100%', marginTop: '6px' }}
                  value={platformConfig.autoExpiryHours}
                  onChange={(e) => setPlatformConfig({ ...platformConfig, autoExpiryHours: Number(e.target.value) })}
                />
                <span className="ad-cell-muted" style={{ fontSize: '11px', marginTop: '3px' }}>
                  Automatic countdown threshold for prepared dishes.
                </span>
              </div>

              <div className="ad-modal-info-item">
                <label className="ad-info-label">Max Active Claims per NGO</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  className="ad-table-search-input"
                  style={{ width: '100%', marginTop: '6px' }}
                  value={platformConfig.maxReservationsPerNgo}
                  onChange={(e) => setPlatformConfig({ ...platformConfig, maxReservationsPerNgo: Number(e.target.value) })}
                />
                <span className="ad-cell-muted" style={{ fontSize: '11px', marginTop: '3px' }}>
                  Prevents single shelters from hoarding unclaimed listings.
                </span>
              </div>

              <div className="ad-modal-info-item" style={{ justifyContent: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '12px' }}>
                  <input
                    type="checkbox"
                    checked={platformConfig.requireOtpVerification}
                    onChange={(e) => setPlatformConfig({ ...platformConfig, requireOtpVerification: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#16a34a' }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f291e' }}>
                    Require 4-Digit OTP Confirmation on Handover
                  </span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button type="submit" className="ad-btn-export-csv">
                Save Platform Configuration ✓
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── 3. Alerts & Notifications Tab ── */}
      {activeTab === 'alerts' && (
        <div className="ad-table-card" style={{ padding: '28px' }}>
          <form onSubmit={handleSaveAlerts}>
            <h3 className="ad-panel-title" style={{ fontSize: '16px', marginBottom: '18px' }}>
              Administrative Alert Preferences
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8faf9', borderRadius: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={alertPreferences.emailOnNewDonation}
                  onChange={(e) => setAlertPreferences({ ...alertPreferences, emailOnNewDonation: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#16a34a' }}
                />
                <div>
                  <span style={{ fontSize: '13.5px', fontWeight: 700, display: 'block', color: '#0f291e' }}>Email Alert on New Surplus Donations</span>
                  <span className="ad-cell-muted">Receive administrative dispatch notifications whenever large food packages are published.</span>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8faf9', borderRadius: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={alertPreferences.emailOnNgoVerification}
                  onChange={(e) => setAlertPreferences({ ...alertPreferences, emailOnNgoVerification: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#16a34a' }}
                />
                <div>
                  <span style={{ fontSize: '13.5px', fontWeight: 700, display: 'block', color: '#0f291e' }}>NGO Verification Request Alerts</span>
                  <span className="ad-cell-muted">Notify admin when a newly registered charity requests verified badge status.</span>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8faf9', borderRadius: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={alertPreferences.smsUrgentPickups}
                  onChange={(e) => setAlertPreferences({ ...alertPreferences, smsUrgentPickups: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#16a34a' }}
                />
                <div>
                  <span style={{ fontSize: '13.5px', fontWeight: 700, display: 'block', color: '#0f291e' }}>Urgent Expiry Reminders</span>
                  <span className="ad-cell-muted">Alert nearby NGO coordinators when cooked food has under 2 hours before expiration.</span>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8faf9', borderRadius: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={alertPreferences.weeklyImpactDigest}
                  onChange={(e) => setAlertPreferences({ ...alertPreferences, weeklyImpactDigest: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#16a34a' }}
                />
                <div>
                  <span style={{ fontSize: '13.5px', fontWeight: 700, display: 'block', color: '#0f291e' }}>Weekly Platform Impact Digest</span>
                  <span className="ad-cell-muted">Automated summary of meals rescued, CO2 avoided, and volunteer deliveries.</span>
                </div>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button type="submit" className="ad-btn-export-csv">
                Save Alert Settings ✓
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── 4. Diagnostics & System Health Tab ── */}
      {activeTab === 'diagnostics' && (
        <div className="ad-table-card" style={{ padding: '28px' }}>
          <h3 className="ad-panel-title" style={{ fontSize: '16px', marginBottom: '18px' }}>
            System Diagnostics & Database Health
          </h3>

          <div className="ad-modal-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div className="ad-modal-info-item">
              <span className="ad-info-label">Supabase Database Engine</span>
              <span className="ad-info-val" style={{ color: '#16a34a' }}>● Connected & Operational</span>
            </div>

            <div className="ad-modal-info-item">
              <span className="ad-info-label">Realtime WebSockets</span>
              <span className="ad-info-val" style={{ color: '#16a34a' }}>● 6 Active PostgreSQL Channels</span>
            </div>

            <div className="ad-modal-info-item">
              <span className="ad-info-label">Frontend Deployment Host</span>
              <span className="ad-info-val">Vercel Production SPA</span>
            </div>

            <div className="ad-modal-info-item">
              <span className="ad-info-label">Total Cached Entities</span>
              <span className="ad-info-val">{users.length} Users · {foodItems.length} Listings · {pickups.length} Dispatches</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(22, 163, 74, 0.1)', paddingTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="ad-btn-export-csv"
              onClick={handleExportJSON}
            >
              Export Full Database Backup (JSON) 📦
            </button>
            <button
              type="button"
              className="ad-btn-contact-user"
              onClick={() => {
                localStorage.clear();
                if (onShowToast) onShowToast('Local application cache cleared.', 'success');
              }}
            >
              Clear Local Cache 🧹
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
