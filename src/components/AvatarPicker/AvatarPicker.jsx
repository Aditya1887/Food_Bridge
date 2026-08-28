import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BUILT_IN_AVATARS,
  svgToDataUri,
  uploadAvatarFile,
  updateProfileAvatar,
  getAvatarUrl,
  getUserInitials,
} from '../../services/avatarService';
import './AvatarPicker.css';

/**
 * AvatarPicker — Reusable modal for selecting built-in avatars or uploading a custom photo.
 *
 * Props:
 *   isOpen       — boolean, controls visibility
 *   onClose      — function, called to close the picker
 *   currentAvatar — string, current avatar_url from profile
 *   userId       — string, user ID for upload
 *   profile      — object, user profile
 *   user         — object, auth user
 *   onAvatarChange — function(newAvatarUrl), called after avatar is updated
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
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const currentDisplayUrl = getAvatarUrl(profile, user);
  const initials = getUserInitials(profile, user);

  const handleSelectBuiltIn = (avatarId) => {
    setSelectedAvatar(avatarId);
    setPreviewUrl(null);
    setUploadFile(null);
    setError('');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    setError('');
    setUploadFile(file);
    setSelectedAvatar('');

    // Create preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      let finalAvatarUrl = selectedAvatar;

      // If user selected a custom file, upload/convert it
      if (uploadFile) {
        setUploading(true);
        try {
          const publicOrDataUrl = await uploadAvatarFile(userId, uploadFile);
          finalAvatarUrl = publicOrDataUrl;
        } catch (uploadErr) {
          console.warn('Avatar upload notice:', uploadErr.message);
          setError(uploadErr.message || 'Could not process image file. Try selecting a built-in avatar.');
          setSaving(false);
          setUploading(false);
          return;
        }
        setUploading(false);
      }

      // Update profile in database
      if (finalAvatarUrl) {
        await updateProfileAvatar(userId, finalAvatarUrl);
      }

      if (onAvatarChange) onAvatarChange(finalAvatarUrl);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save avatar.');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  // Determine what to show as the preview
  const getPreviewSrc = () => {
    if (previewUrl) return previewUrl;
    if (selectedAvatar) {
      const builtIn = BUILT_IN_AVATARS.find((a) => a.id === selectedAvatar);
      if (builtIn) return svgToDataUri(builtIn.svg);
    }
    return currentDisplayUrl;
  };

  const previewSrc = getPreviewSrc();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="ap-backdrop" onClick={onClose}>
        <motion.div
          className="ap-modal"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          {/* Header */}
          <div className="ap-header">
            <h3 className="ap-title">Choose Your Avatar</h3>
            <button type="button" className="ap-close-btn" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Current Preview */}
          <div className="ap-preview-section">
            <div className="ap-preview-circle">
              {previewSrc ? (
                <img src={previewSrc} alt="Avatar preview" className="ap-preview-img" />
              ) : (
                <span className="ap-preview-initials">{initials}</span>
              )}
            </div>
            <span className="ap-preview-label">
              {previewUrl ? 'Custom Photo' : selectedAvatar ? BUILT_IN_AVATARS.find((a) => a.id === selectedAvatar)?.label : 'Current Avatar'}
            </span>
          </div>

          {/* Built-in Avatars Grid */}
          <div className="ap-section-label">Select a built-in avatar</div>
          <div className="ap-grid">
            {BUILT_IN_AVATARS.map((avatar) => (
              <motion.button
                key={avatar.id}
                type="button"
                className={`ap-avatar-btn ${selectedAvatar === avatar.id ? 'ap-selected' : ''}`}
                onClick={() => handleSelectBuiltIn(avatar.id)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                title={avatar.label}
              >
                <img
                  src={svgToDataUri(avatar.svg)}
                  alt={avatar.label}
                  className="ap-avatar-img"
                />
                {selectedAvatar === avatar.id && (
                  <div className="ap-check-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </motion.button>
            ))}
          </div>

          {/* Upload Custom */}
          <div className="ap-section-label">Or upload your own photo</div>
          <div className="ap-upload-area">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="ap-file-input"
            />
            <motion.button
              type="button"
              className="ap-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>{uploadFile ? uploadFile.name : 'Choose Image (Max 5MB)'}</span>
            </motion.button>
          </div>

          {/* Error */}
          {error && (
            <div className="ap-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="ap-actions">
            <button type="button" className="ap-cancel-btn" onClick={onClose}>Cancel</button>
            <motion.button
              type="button"
              className="ap-save-btn"
              onClick={handleSave}
              disabled={saving || (!selectedAvatar && !uploadFile)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {uploading ? 'Uploading...' : saving ? 'Saving...' : 'Save Avatar'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
