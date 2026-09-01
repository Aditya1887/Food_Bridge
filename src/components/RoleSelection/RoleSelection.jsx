import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../components/ThemeContext';
import { getAvatarUrl, getUserInitials } from '../../services/avatarService';
import './RoleSelection.css';

export default function RoleSelection() {
  const { user, profile, selectRole } = useAuth();
  const { isDark } = useTheme();
  const [selected, setSelected] = useState(null); // 'donor' | 'receiver'
  const [saving, setSaving] = useState(false);
  const [imgError, setImgError] = useState(false);

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'there';

  const avatarUrl = getAvatarUrl(profile, user);
  const initials = getUserInitials(profile, user);

  const handleContinue = async () => {
    if (!selected || saving) return;
    setSaving(true);
    await selectRole(selected);
  };

  return (
    <div className={`rs-overlay ${isDark ? 'dark-mode' : ''}`}>
      <motion.div
        className="rs-card"
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Welcome Header */}
        <div className="rs-header">
          <div className="rs-avatar-wrap">
            {avatarUrl && !imgError ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="rs-avatar-img"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="rs-avatar-fallback">
                {initials || displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <h1 className="rs-title">Welcome to FoodBridge, {displayName}!</h1>
          <p className="rs-subtitle">
            One last step — how would you like to use FoodBridge?
          </p>
        </div>

        {/* Role Options */}
        <div className="rs-options">
          <button
            className={`rs-option ${selected === 'donor' ? 'active' : ''}`}
            onClick={() => setSelected('donor')}
            type="button"
          >
            <div className="rs-option-icon">🍲</div>
            <div className="rs-option-info">
              <span className="rs-option-title">Food Donor</span>
              <span className="rs-option-desc">
                I want to share surplus food — from restaurants, events, groceries, or home.
              </span>
            </div>
            <div className="rs-radio">
              <div className="rs-radio-inner" />
            </div>
          </button>

          <button
            className={`rs-option ${selected === 'receiver' ? 'active' : ''}`}
            onClick={() => setSelected('receiver')}
            type="button"
          >
            <div className="rs-option-icon">🤝</div>
            <div className="rs-option-info">
              <span className="rs-option-title">NGO / Receiver</span>
              <span className="rs-option-desc">
                I represent an NGO, shelter, or community that needs food donations.
              </span>
            </div>
            <div className="rs-radio">
              <div className="rs-radio-inner" />
            </div>
          </button>
        </div>

        {/* Continue Button */}
        <button
          className="rs-btn-continue"
          disabled={!selected || saving}
          onClick={handleContinue}
        >
          {saving ? 'Setting up your account...' : 'Continue to Dashboard'}
        </button>

        <p className="rs-footer-note">
          You can change your role anytime from your profile settings.
        </p>
      </motion.div>
    </div>
  );
}
