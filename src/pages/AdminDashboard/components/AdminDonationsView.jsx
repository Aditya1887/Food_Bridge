import '../AdminDashboard.css';
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDonationsView({
  foodItems = [],
  onUpdateStatus,
  onDeleteListing,
}) {
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'available' | 'reserved' | 'collected' | 'cancelled'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dietaryFilter, setDietaryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'servings_high' | 'weight_high'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const CATEGORIES = [
    'all',
    'Cooked Meals',
    'Bakery & Breads',
    'Fresh Produce',
    'Dairy & Groceries',
    'Packaged Food',
  ];

  const DIETARY_TYPES = ['all', 'Vegetarian', 'Non-Vegetarian', 'Vegan', 'Halal', 'Jain'];

  // Top summary stats
  const totalCount = foodItems.length;
  const availableCount = foodItems.filter(f => (f.status || 'available') === 'available').length;
  const reservedCount = foodItems.filter(f => f.status === 'reserved' || f.status === 'accepted' || f.status === 'in_transit').length;
  const completedCount = foodItems.filter(f => f.status === 'collected' || f.status === 'completed').length;
  const totalKgRescued = foodItems.reduce((acc, f) => acc + (Number(f.food_weight_kg) || 0), 0);
  const totalServings = foodItems.reduce((acc, f) => acc + (Number(f.servings) || 0), 0);

  // Filtered and sorted donations
  const filteredDonations = useMemo(() => {
    let result = foodItems.filter((f) => {
      // Status filter
      if (statusFilter !== 'all') {
        const s = (f.status || 'available').toLowerCase();
        if (statusFilter === 'available' && s !== 'available') return false;
        if (statusFilter === 'reserved' && s !== 'reserved' && s !== 'accepted' && s !== 'in_transit') return false;
        if (statusFilter === 'collected' && s !== 'collected' && s !== 'completed') return false;
        if (statusFilter === 'cancelled' && s !== 'cancelled' && s !== 'expired') return false;
      }

      // Category filter
      if (categoryFilter !== 'all') {
        const cat = (f.category || '').toLowerCase();
        if (!cat.includes(categoryFilter.toLowerCase())) return false;
      }

      // Dietary filter
      if (dietaryFilter !== 'all') {
        const diet = (f.dietary_type || '').toLowerCase();
        if (!diet.includes(dietaryFilter.toLowerCase())) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (f.food_name || '').toLowerCase();
        const desc = (f.description || '').toLowerCase();
        const donor = (f.donor?.full_name || f.donor?.organization_name || '').toLowerCase();
        const loc = (f.pickup_location || '').toLowerCase();
        const id = String(f.id || '').toLowerCase();
        if (
          !name.includes(q) &&
          !desc.includes(q) &&
          !donor.includes(q) &&
          !loc.includes(q) &&
          !id.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      } else if (sortBy === 'servings_high') {
        return (Number(b.servings) || 0) - (Number(a.servings) || 0);
      } else if (sortBy === 'weight_high') {
        return (Number(b.food_weight_kg) || 0) - (Number(a.food_weight_kg) || 0);
      } else {
        // newest
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
    });

    return result;
  }, [foodItems, statusFilter, categoryFilter, dietaryFilter, searchQuery, sortBy]);

  const handleStatusChange = async (foodId, newStatus) => {
    if (!onUpdateStatus) return;
    setUpdatingId(foodId);
    try {
      await onUpdateStatus(foodId, newStatus);
      if (selectedDonation && selectedDonation.id === foodId) {
        setSelectedDonation({ ...selectedDonation, status: newStatus });
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (foodId) => {
    if (!window.confirm('Are you sure you want to remove this food listing from the platform?')) return;
    if (!onDeleteListing) return;
    try {
      await onDeleteListing(foodId);
      setSelectedDonation(null);
    } catch (err) {
      console.error('Delete donation error:', err);
    }
  };

  // Helper to determine expiry freshness status
  const getExpiryStatus = (expiryTime) => {
    if (!expiryTime) return { label: 'Flexible Window', class: 'fresh' };
    const diffHours = (new Date(expiryTime).getTime() - Date.now()) / (1000 * 60 * 60);
    if (diffHours < 0) return { label: 'Expired', class: 'expired' };
    if (diffHours < 4) return { label: `Expiring Soon (${Math.round(diffHours)}h left)`, class: 'warning' };
    return { label: `Fresh (${Math.round(diffHours)}h left)`, class: 'fresh' };
  };

  return (
    <div className="ad-view-container">
      {/* ── 1. Header & Search ── */}
      <div className="ad-view-header">
        <div>
          <h2 className="ad-view-title">Food Donation Management</h2>
          <p className="ad-view-subtitle">
            Inspect, filter, update statuses, and supervise surplus food contributions across all donor networks ({filteredDonations.length} listings shown).
          </p>
        </div>

        {/* Search Bar */}
        <div className="ad-table-search-wrap">
          <svg className="ad-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="ad-table-search-input"
            placeholder="Search by food item, donor, address, or ID..."
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

      {/* ── 2. Top Metric Cards ── */}
      <div className="ad-kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="ad-kpi-card">
          <div className="ad-kpi-top">
            <div className="ad-kpi-icon-wrap" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#16a34a' }}>
              🍲
            </div>
            <span className="ad-kpi-trend positive">Total</span>
          </div>
          <span className="ad-kpi-label">All Donations</span>
          <div className="ad-kpi-number">{totalCount}</div>
          <span className="ad-kpi-sub">{totalServings} total servings</span>
        </div>

        <div className="ad-kpi-card">
          <div className="ad-kpi-top">
            <div className="ad-kpi-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706' }}>
              ✨
            </div>
            <span className="ad-kpi-trend positive">Active</span>
          </div>
          <span className="ad-kpi-label">Available Now</span>
          <div className="ad-kpi-number" style={{ color: '#d97706' }}>{availableCount}</div>
          <span className="ad-kpi-sub">Ready for NGO claims</span>
        </div>

        <div className="ad-kpi-card">
          <div className="ad-kpi-top">
            <div className="ad-kpi-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb' }}>
              🚚
            </div>
            <span className="ad-kpi-trend positive">In Transit</span>
          </div>
          <span className="ad-kpi-label">Reserved & Pickups</span>
          <div className="ad-kpi-number" style={{ color: '#2563eb' }}>{reservedCount}</div>
          <span className="ad-kpi-sub">Claimed by verified shelters</span>
        </div>

        <div className="ad-kpi-card">
          <div className="ad-kpi-top">
            <div className="ad-kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.14)', color: '#059669' }}>
              ✓
            </div>
            <span className="ad-kpi-trend positive">Delivered</span>
          </div>
          <span className="ad-kpi-label">Completed Rescues</span>
          <div className="ad-kpi-number" style={{ color: '#059669' }}>{completedCount}</div>
          <span className="ad-kpi-sub">OTP verified handovers</span>
        </div>

        <div className="ad-kpi-card">
          <div className="ad-kpi-top">
            <div className="ad-kpi-icon-wrap" style={{ background: 'rgba(22, 163, 74, 0.14)', color: '#15803d' }}>
              ⚖️
            </div>
            <span className="ad-kpi-trend positive">Impact</span>
          </div>
          <span className="ad-kpi-label">Rescued Weight</span>
          <div className="ad-kpi-number">{totalKgRescued.toFixed(1)} <span style={{ fontSize: '14px' }}>KG</span></div>
          <span className="ad-kpi-sub">Zero food waste</span>
        </div>
      </div>

      {/* ── 3. Filter Bar (Status Chips + Category Dropdown + Dietary + Sort) ── */}
      <div className="ad-filter-bar-wrap">
        {/* Status Chips */}
        <div className="ad-tab-chips-row">
          {[
            { id: 'all', label: 'All Listings', count: foodItems.length },
            { id: 'available', label: 'Available', count: availableCount },
            { id: 'reserved', label: 'Reserved / Scheduled', count: reservedCount },
            { id: 'collected', label: 'Completed', count: completedCount },
            { id: 'cancelled', label: 'Cancelled / Expired', count: foodItems.filter(f => f.status === 'cancelled' || f.status === 'expired').length },
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

        {/* Dropdown Selects */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select
            className="ad-category-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by Category"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          <select
            className="ad-category-select"
            value={dietaryFilter}
            onChange={(e) => setDietaryFilter(e.target.value)}
            aria-label="Filter by Dietary Type"
          >
            {DIETARY_TYPES.map((d) => (
              <option key={d} value={d}>
                {d === 'all' ? 'All Diets' : d}
              </option>
            ))}
          </select>

          <select
            className="ad-category-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort Donations"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="servings_high">Sort: Most Servings</option>
            <option value="weight_high">Sort: Heaviest (KG)</option>
          </select>
        </div>
      </div>

      {/* ── 4. Main Donations Table Card ── */}
      <div className="ad-table-card">
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Listing ID & Food Name</th>
                <th>Donor Profile</th>
                <th>Category & Diet</th>
                <th>Quantity / Servings</th>
                <th>Status</th>
                <th>Expiry / Pickup Window</th>
                <th style={{ textAlign: 'right' }}>Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDonations.map((item) => {
                const donorName = item.donor?.organization_name || item.donor?.full_name || 'Community Donor';
                const servings = item.servings ? `${item.servings} servings` : (item.food_weight_kg ? `${item.food_weight_kg} kg` : '1 batch');
                const expiryInfo = getExpiryStatus(item.expiry_time);

                let statusClass = 'pending';
                let statusLabel = 'Available';
                if (item.status === 'collected' || item.status === 'completed') {
                  statusClass = 'completed';
                  statusLabel = 'Completed';
                } else if (item.status === 'reserved' || item.status === 'accepted' || item.status === 'in_transit') {
                  statusClass = 'scheduled';
                  statusLabel = 'Reserved';
                } else if (item.status === 'cancelled' || item.status === 'expired') {
                  statusClass = 'cancelled';
                  statusLabel = item.status === 'expired' ? 'Expired' : 'Cancelled';
                }

                return (
                  <tr key={item.id}>
                    <td>
                      <div className="ad-food-table-cell">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.food_name} className="ad-table-food-img" />
                        ) : (
                          <div className="ad-table-food-icon-placeholder">🍲</div>
                        )}
                        <div>
                          <span className="ad-code-badge">#DON-{String(item.id).substring(0, 4).toUpperCase()}</span>
                          <span className="ad-cell-bold ad-food-name-row">{item.food_name || 'Prepared Food Item'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="ad-user-cell">
                        <div>
                          <span className="ad-cell-bold">{donorName}</span>
                          {item.donor?.email && (
                            <span className="ad-cell-muted" style={{ display: 'block', fontSize: '11px' }}>
                              {item.donor.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="ad-food-tags-cell">
                        <span className="ad-category-tag">{item.category || 'Cooked Meals'}</span>
                        {item.dietary_type && (
                          <span className={`ad-diet-tag ${item.dietary_type.toLowerCase()}`}>
                            {item.dietary_type}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="ad-cell-bold">{servings}</span>
                      {item.food_weight_kg && <span className="ad-cell-weight">({item.food_weight_kg} kg)</span>}
                    </td>
                    <td>
                      <span className={`ad-status-badge ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td>
                      <div>
                        <span className="ad-cell-muted" style={{ display: 'block', fontSize: '11.5px' }}>
                          {item.expiry_time ? new Date(item.expiry_time).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Flexible'}
                        </span>
                        <span className={`ad-expiry-pill ${expiryInfo.class}`}>
                          {expiryInfo.label}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="ad-btn-view-details"
                        onClick={() => setSelectedDonation(item)}
                      >
                        Inspect & Control
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredDonations.length === 0 && (
                <tr>
                  <td colSpan={7} className="ad-empty-cell">
                    <div style={{ padding: '24px' }}>
                      <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
                        {searchQuery ? `No food listings matching "${searchQuery}"` : 'No food donations found matching current filters.'}
                      </p>
                      {(searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || dietaryFilter !== 'all') && (
                        <button
                          type="button"
                          className="ad-btn-view-details"
                          onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('all');
                            setCategoryFilter('all');
                            setDietaryFilter('all');
                          }}
                        >
                          Reset Filters
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

      {/* ── 5. Rich Donation Details Inspection & Control Modal ── */}
      <AnimatePresence>
        {selectedDonation && (
          <div className="ad-modal-backdrop" onClick={() => setSelectedDonation(null)}>
            <motion.div
              className="ad-modal-content ad-donation-modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
            >
              <div className="ad-modal-header">
                <div>
                  <span className="ad-code-badge">#DON-{String(selectedDonation.id).substring(0, 6).toUpperCase()}</span>
                  <h3 className="ad-modal-title">{selectedDonation.food_name || 'Food Donation'}</h3>
                </div>
                <button
                  type="button"
                  className="ad-modal-close-btn"
                  onClick={() => setSelectedDonation(null)}
                >
                  ✕
                </button>
              </div>

              <div className="ad-donation-modal-body">
                {selectedDonation.image_url && (
                  <div className="ad-modal-food-img-hero">
                    <img src={selectedDonation.image_url} alt={selectedDonation.food_name} />
                  </div>
                )}

                <div className="ad-modal-grid">
                  <div className="ad-modal-info-item">
                    <span className="ad-info-label">Category</span>
                    <span className="ad-info-val">{selectedDonation.category || 'Cooked Meals'}</span>
                  </div>
                  <div className="ad-modal-info-item">
                    <span className="ad-info-label">Dietary Type</span>
                    <span className="ad-info-val">{selectedDonation.dietary_type || 'Vegetarian'}</span>
                  </div>
                  <div className="ad-modal-info-item">
                    <span className="ad-info-label">Quantity / Servings</span>
                    <span className="ad-info-val">{selectedDonation.servings || '1'} servings ({selectedDonation.food_weight_kg || '—'} kg)</span>
                  </div>
                  <div className="ad-modal-info-item">
                    <span className="ad-info-label">Current Status</span>
                    <span className="ad-info-val" style={{ textTransform: 'capitalize' }}>{selectedDonation.status || 'available'}</span>
                  </div>
                  <div className="ad-modal-info-item">
                    <span className="ad-info-label">Prepared Time</span>
                    <span className="ad-info-val">{selectedDonation.prepared_time ? new Date(selectedDonation.prepared_time).toLocaleString() : 'Recent'}</span>
                  </div>
                  <div className="ad-modal-info-item">
                    <span className="ad-info-label">Expiry / Pickup Limit</span>
                    <span className="ad-info-val">{selectedDonation.expiry_time ? new Date(selectedDonation.expiry_time).toLocaleString() : 'Flexible'}</span>
                  </div>
                  <div className="ad-modal-info-item" style={{ gridColumn: 'span 2' }}>
                    <span className="ad-info-label">Pickup Location</span>
                    <span className="ad-info-val">📍 {selectedDonation.pickup_location || 'Address specified by donor'}</span>
                  </div>
                  <div className="ad-modal-info-item" style={{ gridColumn: 'span 2' }}>
                    <span className="ad-info-label">Donor Information</span>
                    <span className="ad-info-val">
                      {selectedDonation.donor?.organization_name || selectedDonation.donor?.full_name || 'Community Donor'} ({selectedDonation.donor?.email || '—'})
                      {selectedDonation.donor?.phone && ` · 📞 ${selectedDonation.donor.phone}`}
                    </span>
                  </div>
                  {selectedDonation.description && (
                    <div className="ad-modal-info-item" style={{ gridColumn: 'span 2' }}>
                      <span className="ad-info-label">Listing Description</span>
                      <span className="ad-info-val">{selectedDonation.description}</span>
                    </div>
                  )}
                </div>

                {/* Admin Status Overrides */}
                <div className="ad-modal-admin-actions-bar">
                  <span className="ad-action-bar-label">Admin Status Control:</span>
                  <div className="ad-action-buttons-group">
                    <button
                      type="button"
                      className="ad-status-action-btn btn-complete"
                      onClick={() => handleStatusChange(selectedDonation.id, 'collected')}
                      disabled={updatingId === selectedDonation.id}
                    >
                      Mark Collected ✓
                    </button>
                    <button
                      type="button"
                      className="ad-status-action-btn btn-available"
                      onClick={() => handleStatusChange(selectedDonation.id, 'available')}
                      disabled={updatingId === selectedDonation.id}
                    >
                      Set Available
                    </button>
                    <button
                      type="button"
                      className="ad-status-action-btn btn-cancel"
                      onClick={() => handleStatusChange(selectedDonation.id, 'cancelled')}
                      disabled={updatingId === selectedDonation.id}
                    >
                      Cancel Listing
                    </button>
                    <button
                      type="button"
                      className="ad-status-action-btn btn-delete"
                      onClick={() => handleDelete(selectedDonation.id)}
                    >
                      Delete Listing
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
