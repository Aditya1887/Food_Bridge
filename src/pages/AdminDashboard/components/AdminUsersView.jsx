import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAvatarUrl, getUserInitials } from '../../../services/avatarService';

export default function AdminUsersView({
  users = [],
  onToggleVerify,
  onUpdateRole,
  loading = false,
  roleFilterDefault = 'all',
}) {
  const [roleTab, setRoleTab] = useState(roleFilterDefault); // 'all' | 'donor' | 'receiver' | 'admin' | 'verified'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [updatingRoleId, setUpdatingRoleId] = useState(null);

  // Sync roleTab whenever roleFilterDefault changes (e.g. sidebar clicks)
  useEffect(() => {
    setRoleTab(roleFilterDefault);
  }, [roleFilterDefault]);

  // Top summary metrics
  const totalUsers = users.length;
  const donorCount = users.filter((u) => u.role === 'donor').length;
  const receiverCount = users.filter((u) => u.role === 'receiver').length;
  const verifiedCount = users.filter((u) => u.is_verified).length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleTab === 'donor' && u.role !== 'donor') return false;
      if (roleTab === 'receiver' && u.role !== 'receiver') return false;
      if (roleTab === 'admin' && u.role !== 'admin') return false;
      if (roleTab === 'verified' && !u.is_verified) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (u.full_name || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const org = (u.organization_name || '').toLowerCase();
        const phone = (u.phone || '').toLowerCase();
        const city = (u.city || '').toLowerCase();
        const address = (u.address || '').toLowerCase();
        if (
          !name.includes(q) &&
          !email.includes(q) &&
          !org.includes(q) &&
          !phone.includes(q) &&
          !city.includes(q) &&
          !address.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [users, roleTab, searchQuery]);

  const handleToggleVerification = async (user) => {
    if (!onToggleVerify) return;
    setTogglingId(user.id);
    try {
      await onToggleVerify(user.id, !!user.is_verified);
      if (selectedUser && selectedUser.id === user.id) {
        setSelectedUser({ ...selectedUser, is_verified: !selectedUser.is_verified });
      }
    } finally {
      setTogglingId(null);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!onUpdateRole) return;
    setUpdatingRoleId(userId);
    try {
      await onUpdateRole(userId, newRole);
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, role: newRole });
      }
    } finally {
      setUpdatingRoleId(null);
    }
  };

  return (
    <div className="ad-view-container">
      {/* ── View Header & Controls ── */}
      <div className="ad-view-header">
        <div>
          <h2 className="ad-view-title">User & Organization Management</h2>
          <p className="ad-view-subtitle">
            Supervise registered accounts, verify community NGOs, manage roles, and review organization contact details ({filteredUsers.length} users shown).
          </p>
        </div>

        {/* Search input */}
        <div className="ad-table-search-wrap">
          <svg className="ad-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="ad-table-search-input"
            placeholder="Search by name, organization, email, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="ad-clear-search-btn"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Top Metric Summary Cards ── */}
      <div className="ad-kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="ad-kpi-card" onClick={() => setRoleTab('all')}>
          <div className="ad-kpi-top">
            <div className="ad-kpi-icon-wrap" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#16a34a' }}>
              👥
            </div>
            <span className="ad-kpi-trend positive">Total</span>
          </div>
          <span className="ad-kpi-label">Registered Users</span>
          <div className="ad-kpi-number">{totalUsers}</div>
          <span className="ad-kpi-sub">Across all regions</span>
        </div>

        <div className="ad-kpi-card" onClick={() => setRoleTab('donor')}>
          <div className="ad-kpi-top">
            <div className="ad-kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.14)', color: '#059669' }}>
              🌱
            </div>
            <span className="ad-kpi-trend positive">Donors</span>
          </div>
          <span className="ad-kpi-label">Food Donors</span>
          <div className="ad-kpi-number" style={{ color: '#059669' }}>{donorCount}</div>
          <span className="ad-kpi-sub">Restaurants, catering, homes</span>
        </div>

        <div className="ad-kpi-card" onClick={() => setRoleTab('receiver')}>
          <div className="ad-kpi-top">
            <div className="ad-kpi-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb' }}>
              🤝
            </div>
            <span className="ad-kpi-trend positive">NGOs</span>
          </div>
          <span className="ad-kpi-label">Shelters & NGOs</span>
          <div className="ad-kpi-number" style={{ color: '#2563eb' }}>{receiverCount}</div>
          <span className="ad-kpi-sub">Recipient organizations</span>
        </div>

        <div className="ad-kpi-card" onClick={() => setRoleTab('verified')}>
          <div className="ad-kpi-top">
            <div className="ad-kpi-icon-wrap" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#15803d' }}>
              ✓
            </div>
            <span className="ad-kpi-trend positive">Verified</span>
          </div>
          <span className="ad-kpi-label">Verified Badged</span>
          <div className="ad-kpi-number" style={{ color: '#15803d' }}>{verifiedCount}</div>
          <span className="ad-kpi-sub">Approved partner organizations</span>
        </div>

        <div className="ad-kpi-card" onClick={() => setRoleTab('admin')}>
          <div className="ad-kpi-top">
            <div className="ad-kpi-icon-wrap" style={{ background: 'rgba(139, 92, 246, 0.14)', color: '#7c3aed' }}>
              🛡️
            </div>
            <span className="ad-kpi-trend positive">Admins</span>
          </div>
          <span className="ad-kpi-label">Super Admins</span>
          <div className="ad-kpi-number" style={{ color: '#7c3aed' }}>{adminCount}</div>
          <span className="ad-kpi-sub">Platform controllers</span>
        </div>
      </div>

      {/* ── Role Navigation Tabs ── */}
      <div className="ad-tab-chips-row">
        {[
          { id: 'all', label: 'All Users', count: totalUsers },
          { id: 'donor', label: 'Donors', count: donorCount },
          { id: 'receiver', label: 'NGOs & Shelters', count: receiverCount },
          { id: 'verified', label: 'Verified Partners', count: verifiedCount },
          { id: 'admin', label: 'Administrators', count: adminCount },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`ad-tab-chip ${roleTab === tab.id ? 'active' : ''}`}
            onClick={() => setRoleTab(tab.id)}
          >
            <span>{tab.label}</span>
            <span className="ad-tab-chip-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* ── Users Table ── */}
      <div className="ad-table-card">
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>User / Organization</th>
                <th>Role</th>
                <th>Contact Info</th>
                <th>Location</th>
                <th>Verification Status</th>
                <th>Joined Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const avatar = getAvatarUrl(u);
                const initials = getUserInitials(u);
                const isVerified = !!u.is_verified;
                const isToggling = togglingId === u.id;

                let roleBadgeClass = 'role-donor';
                let roleLabel = 'Donor';
                if (u.role === 'receiver') {
                  roleBadgeClass = 'role-receiver';
                  roleLabel = 'NGO / Receiver';
                } else if (u.role === 'admin') {
                  roleBadgeClass = 'role-admin';
                  roleLabel = 'Admin';
                }

                return (
                  <tr key={u.id}>
                    <td>
                      <div className="ad-user-table-cell">
                        {avatar ? (
                          <img src={avatar} alt={u.full_name} className="ad-user-table-img" />
                        ) : (
                          <span className="ad-user-table-initials">{initials}</span>
                        )}
                        <div className="ad-user-table-info">
                          <span className="ad-cell-bold">{u.full_name || 'Community User'}</span>
                          {u.organization_name && (
                            <span className="ad-cell-org">🏢 {u.organization_name}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`ad-role-badge ${roleBadgeClass}`}>
                        {roleLabel}
                      </span>
                    </td>
                    <td>
                      <div className="ad-contact-cell">
                        <span className="ad-contact-email">{u.email || '—'}</span>
                        {u.phone && <span className="ad-contact-phone">📞 {u.phone}</span>}
                      </div>
                    </td>
                    <td>
                      <span className="ad-cell-city">{u.city || u.address || '—'}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`ad-verify-pill-btn ${isVerified ? 'verified' : 'unverified'}`}
                        onClick={() => handleToggleVerification(u)}
                        disabled={isToggling}
                        title={isVerified ? 'Click to revoke verification' : 'Click to verify organization'}
                      >
                        {isToggling ? (
                          <span className="ad-spinner-dot" />
                        ) : isVerified ? (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ad-verify-check">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                            Verified
                          </>
                        ) : (
                          <>
                            <span className="ad-verify-dot" />
                            Unverified
                          </>
                        )}
                      </button>
                    </td>
                    <td className="ad-cell-muted">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="ad-btn-view-details"
                        onClick={() => setSelectedUser(u)}
                      >
                        Inspect Profile
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="ad-empty-cell">
                    <div style={{ padding: '24px' }}>
                      <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
                        {searchQuery ? `No users matching "${searchQuery}"` : 'No users found in this category.'}
                      </p>
                      {searchQuery && (
                        <button
                          type="button"
                          className="ad-btn-view-details"
                          onClick={() => setSearchQuery('')}
                        >
                          Clear Search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── User Details Modal ── */}
      <AnimatePresence>
        {selectedUser && (
          <div className="ad-modal-backdrop" onClick={() => setSelectedUser(null)}>
            <motion.div
              className="ad-modal-content ad-user-modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
            >
              <div className="ad-modal-header">
                <h3 className="ad-modal-title">User Profile & Permissions</h3>
                <button
                  type="button"
                  className="ad-modal-close-btn"
                  onClick={() => setSelectedUser(null)}
                >
                  ✕
                </button>
              </div>

              <div className="ad-user-modal-body">
                <div className="ad-modal-profile-hero">
                  {getAvatarUrl(selectedUser) ? (
                    <img src={getAvatarUrl(selectedUser)} alt={selectedUser.full_name} className="ad-modal-avatar-img" />
                  ) : (
                    <div className="ad-modal-avatar-placeholder">{getUserInitials(selectedUser)}</div>
                  )}
                  <div>
                    <h4 className="ad-modal-user-name">{selectedUser.full_name || 'Community Member'}</h4>
                    <span className="ad-modal-role-tag">{selectedUser.role?.toUpperCase() || 'DONOR'}</span>
                    {selectedUser.is_verified && (
                      <span className="ad-modal-verified-tag">✓ Verified Partner</span>
                    )}
                  </div>
                </div>

                <div className="ad-modal-grid">
                  <div className="ad-modal-info-item">
                    <span className="ad-info-label">Email Address</span>
                    <span className="ad-info-val">{selectedUser.email || '—'}</span>
                  </div>
                  <div className="ad-modal-info-item">
                    <span className="ad-info-label">Phone Number</span>
                    <span className="ad-info-val">{selectedUser.phone || '—'}</span>
                  </div>
                  <div className="ad-modal-info-item">
                    <span className="ad-info-label">Organization Name</span>
                    <span className="ad-info-val">{selectedUser.organization_name || '—'}</span>
                  </div>
                  <div className="ad-modal-info-item">
                    <span className="ad-info-label">City / Region</span>
                    <span className="ad-info-val">{selectedUser.city || '—'}</span>
                  </div>
                  <div className="ad-modal-info-item" style={{ gridColumn: 'span 2' }}>
                    <span className="ad-info-label">Full Address</span>
                    <span className="ad-info-val">{selectedUser.address || '—'}</span>
                  </div>
                  {selectedUser.bio && (
                    <div className="ad-modal-info-item" style={{ gridColumn: 'span 2' }}>
                      <span className="ad-info-label">Organization Bio</span>
                      <span className="ad-info-val">{selectedUser.bio}</span>
                    </div>
                  )}
                </div>

                {/* Role Switcher */}
                <div className="ad-modal-admin-actions-bar" style={{ marginBottom: '16px' }}>
                  <span className="ad-action-bar-label">Assign Role:</span>
                  <div className="ad-action-buttons-group">
                    <button
                      type="button"
                      className={`ad-status-action-btn ${selectedUser.role === 'donor' ? 'btn-complete' : 'btn-available'}`}
                      onClick={() => handleRoleChange(selectedUser.id, 'donor')}
                      disabled={updatingRoleId === selectedUser.id}
                    >
                      Food Donor
                    </button>
                    <button
                      type="button"
                      className={`ad-status-action-btn ${selectedUser.role === 'receiver' ? 'btn-complete' : 'btn-available'}`}
                      onClick={() => handleRoleChange(selectedUser.id, 'receiver')}
                      disabled={updatingRoleId === selectedUser.id}
                    >
                      NGO / Receiver
                    </button>
                    <button
                      type="button"
                      className={`ad-status-action-btn ${selectedUser.role === 'admin' ? 'btn-complete' : 'btn-available'}`}
                      onClick={() => handleRoleChange(selectedUser.id, 'admin')}
                      disabled={updatingRoleId === selectedUser.id}
                    >
                      Admin
                    </button>
                  </div>
                </div>

                <div className="ad-modal-footer-actions">
                  <button
                    type="button"
                    className={`ad-btn-toggle-verify ${selectedUser.is_verified ? 'btn-revoke' : 'btn-grant'}`}
                    onClick={() => handleToggleVerification(selectedUser)}
                  >
                    {selectedUser.is_verified ? 'Revoke Verified Status' : 'Grant Verified Badge ✓'}
                  </button>

                  {selectedUser.email && (
                    <a
                      href={`mailto:${selectedUser.email}`}
                      className="ad-btn-contact-user"
                    >
                      Send Email
                    </a>
                  )}
                  {selectedUser.phone && (
                    <a
                      href={`tel:${selectedUser.phone}`}
                      className="ad-btn-contact-user"
                    >
                      Call Phone
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
