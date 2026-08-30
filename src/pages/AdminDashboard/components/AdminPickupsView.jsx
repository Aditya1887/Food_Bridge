import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminPickupsView({
  pickups = [],
  onUpdateStatus,
}) {
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'assigned' | 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const filteredPickups = useMemo(() => {
    return pickups.filter((p) => {
      if (statusFilter === 'completed' && p.status !== 'completed') return false;
      if (statusFilter === 'active' && p.status === 'completed') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const loc = (p.pickup_location || '').toLowerCase();
        const otp = (p.otp_code || '').toLowerCase();
        const food = (p.food?.food_name || '').toLowerCase();
        const receiver = (p.receiver?.full_name || p.receiver?.organization_name || '').toLowerCase();
        const donor = (p.donor?.full_name || p.donor?.organization_name || '').toLowerCase();
        if (!loc.includes(q) && !otp.includes(q) && !food.includes(q) && !receiver.includes(q) && !donor.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [pickups, statusFilter, searchQuery]);

  const handleStatusChange = async (pickupId, newStatus) => {
    if (!onUpdateStatus) return;
    setUpdatingId(pickupId);
    try {
      await onUpdateStatus(pickupId, newStatus);
      if (selectedPickup && selectedPickup.id === pickupId) {
        setSelectedPickup({ ...selectedPickup, status: newStatus });
      }
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="ad-view-container">
      {/* Header */}
      <div className="ad-view-header">
        <div>
          <h2 className="ad-view-title">Pickup & Logistics Monitoring</h2>
          <p className="ad-view-subtitle">
            Track volunteer drivers, partner NGO pickup dispatches, OTP confirmations, and completed handovers ({filteredPickups.length} records).
          </p>
        </div>

        {/* Search */}
        <div className="ad-table-search-wrap">
          <svg className="ad-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="ad-table-search-input"
            placeholder="Search by pickup location, OTP, or recipient..."
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

      {/* Tabs */}
      <div className="ad-tab-chips-row">
        {[
          { id: 'all', label: 'All Dispatches', count: pickups.length },
          { id: 'active', label: 'Active In-Progress', count: pickups.filter((p) => p.status !== 'completed').length },
          { id: 'completed', label: 'Verified & Delivered', count: pickups.filter((p) => p.status === 'completed').length },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`ad-tab-chip ${statusFilter === tab.id ? 'active' : ''}`}
            onClick={() => setStatusFilter(tab.id)}
          >
            <span>{tab.label}</span>
            <span className="ad-tab-chip-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="ad-table-card">
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Pickup ID</th>
                <th>Food Package</th>
                <th>Recipient / NGO</th>
                <th>Fulfillment Mode</th>
                <th>Verification OTP</th>
                <th>Scheduled Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPickups.map((p) => {
                const isCompleted = p.status === 'completed';
                const foodName = p.food?.food_name || 'Food Package';
                const receiverName = p.receiver?.organization_name || p.receiver?.full_name || 'Community Receiver';
                const fulfillmentLabel = p.fulfillment_type === 'donor_delivery' ? '🚗 Donor Delivery' : '🏢 Receiver Pickup';
                const dateStr = p.scheduled_time
                  ? new Date(p.scheduled_time).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : (p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Scheduled');

                return (
                  <tr key={p.id}>
                    <td className="ad-code-cell">#PKP-{String(p.id).substring(0, 4).toUpperCase()}</td>
                    <td>
                      <span className="ad-cell-bold">{foodName}</span>
                    </td>
                    <td>
                      <span className="ad-cell-org">🤝 {receiverName}</span>
                    </td>
                    <td>
                      <span className="ad-fulfillment-tag">{fulfillmentLabel}</span>
                    </td>
                    <td>
                      {isCompleted ? (
                        <span className="ad-otp-verified-badge">✓ Verified</span>
                      ) : (
                        <span className="ad-otp-code-pill">OTP: {p.otp_code || '1234'}</span>
                      )}
                    </td>
                    <td>
                      <span className="ad-cell-muted">{dateStr}</span>
                    </td>
                    <td>
                      <span className={`ad-status-badge ${isCompleted ? 'completed' : 'scheduled'}`}>
                        {isCompleted ? 'Completed' : (p.status || 'Assigned')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="ad-btn-view-details"
                        onClick={() => setSelectedPickup(p)}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredPickups.length === 0 && (
                <tr>
                  <td colSpan={8} className="ad-empty-cell">
                    {searchQuery ? `No pickups matching "${searchQuery}"` : 'No pickup records registered yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pickup Details Modal */}
      <AnimatePresence>
        {selectedPickup && (
          <div className="ad-modal-backdrop" onClick={() => setSelectedPickup(null)}>
            <motion.div
              className="ad-modal-content"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
            >
              <div className="ad-modal-header">
                <div>
                  <span className="ad-code-badge">#PKP-{String(selectedPickup.id).substring(0, 6).toUpperCase()}</span>
                  <h3 className="ad-modal-title">Pickup Dispatch Details</h3>
                </div>
                <button
                  type="button"
                  className="ad-modal-close-btn"
                  onClick={() => setSelectedPickup(null)}
                >
                  ✕
                </button>
              </div>

              <div className="ad-modal-grid" style={{ padding: '20px 24px' }}>
                <div className="ad-modal-info-item">
                  <span className="ad-info-label">Food Package</span>
                  <span className="ad-info-val">{selectedPickup.food?.food_name || 'Community Package'}</span>
                </div>
                <div className="ad-modal-info-item">
                  <span className="ad-info-label">Verification OTP Code</span>
                  <span className="ad-info-val" style={{ fontFamily: 'monospace', fontWeight: 800, color: '#16a34a', fontSize: '16px' }}>
                    {selectedPickup.otp_code || '1234'}
                  </span>
                </div>
                <div className="ad-modal-info-item" style={{ gridColumn: 'span 2' }}>
                  <span className="ad-info-label">Pickup Address</span>
                  <span className="ad-info-val">📍 {selectedPickup.pickup_location || 'Address specified by donor'}</span>
                </div>
                <div className="ad-modal-info-item">
                  <span className="ad-info-label">Fulfillment Mode</span>
                  <span className="ad-info-val">{selectedPickup.fulfillment_type === 'donor_delivery' ? 'Donor Delivery' : 'Receiver Pickup'}</span>
                </div>
                <div className="ad-modal-info-item">
                  <span className="ad-info-label">Current Status</span>
                  <span className="ad-info-val" style={{ textTransform: 'capitalize' }}>{selectedPickup.status || 'Assigned'}</span>
                </div>
              </div>

              <div className="ad-modal-footer-actions">
                {selectedPickup.status !== 'completed' && (
                  <button
                    type="button"
                    className="ad-status-action-btn btn-complete"
                    onClick={() => handleStatusChange(selectedPickup.id, 'completed')}
                    disabled={updatingId === selectedPickup.id}
                  >
                    Mark Handover Completed ✓
                  </button>
                )}
                <button
                  type="button"
                  className="ad-btn-contact-user"
                  onClick={() => setSelectedPickup(null)}
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
