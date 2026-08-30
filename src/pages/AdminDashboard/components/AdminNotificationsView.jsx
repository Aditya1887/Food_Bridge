import '../AdminDashboard.css';
import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function AdminNotificationsView({
  notifications = [],
  users = [],
  foodItems = [],
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  // Synthetic activity-derived notifications list if database notifications are empty
  const allNotifs = notifications.length > 0 ? notifications : [
    ...foodItems.slice(0, 4).map(f => ({
      id: `notif_f_${f.id}`,
      title: 'New Donation Created',
      message: `"${f.food_name}" (${f.servings || 1} servings) was published by ${f.donor?.organization_name || f.donor?.full_name || 'Donor'}.`,
      type: 'donation',
      created_at: f.created_at,
      is_read: false,
    })),
    ...users.slice(0, 3).map(u => ({
      id: `notif_u_${u.id}`,
      title: 'New User Registered',
      message: `"${u.full_name || 'Member'}" joined as a ${u.role}.`,
      type: 'user',
      created_at: u.created_at,
      is_read: true,
    })),
  ];

  const filtered = allNotifs.filter(n => filter === 'all' || !n.is_read);

  return (
    <div className="ad-view-container">
      <div className="ad-view-header">
        <div>
          <h2 className="ad-view-title">System Notifications Center</h2>
          <p className="ad-view-subtitle">
            Real-time administrative alerts for new user registrations, food donations, and verification milestones.
          </p>
        </div>

        <div className="ad-timeframe-toggle">
          <button
            type="button"
            className={`ad-tf-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Alerts ({allNotifs.length})
          </button>
          <button
            type="button"
            className={`ad-tf-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread
          </button>
        </div>
      </div>

      <div className="ad-table-card">
        <div className="ad-notifs-full-list">
          {filtered.map((n) => (
            <div key={n.id} className={`ad-notif-full-item ${!n.is_read ? 'unread' : ''}`}>
              <div className="ad-notif-icon-wrap">
                {n.type === 'donation' ? '🍲' : (n.type === 'user' ? '👤' : '🔔')}
              </div>
              <div className="ad-notif-body">
                <div className="ad-notif-top-row">
                  <span className="ad-notif-full-title">{n.title}</span>
                  <span className="ad-notif-full-time">
                    {n.created_at ? new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                  </span>
                </div>
                <p className="ad-notif-full-msg">{n.message}</p>
              </div>
              {!n.is_read && <span className="ad-notif-unread-dot" />}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="ad-empty-cell" style={{ padding: '40px' }}>
              No notifications found matching filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
