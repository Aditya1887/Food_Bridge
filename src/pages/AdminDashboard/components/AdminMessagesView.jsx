import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminMessagesView({
  messages = [],
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);

  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (m.name || '').toLowerCase();
        const email = (m.email || '').toLowerCase();
        const subject = (m.subject || '').toLowerCase();
        const msg = (m.message || '').toLowerCase();
        if (!name.includes(q) && !email.includes(q) && !subject.includes(q) && !msg.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [messages, searchQuery]);

  return (
    <div className="ad-view-container">
      {/* Header */}
      <div className="ad-view-header">
        <div>
          <h2 className="ad-view-title">Community Messages & Inquiries</h2>
          <p className="ad-view-subtitle">
            Messages and partnership inquiries submitted through the public Contact page ({filteredMessages.length} total).
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
            placeholder="Search inquiries by sender, email, or keywords..."
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

      {/* Messages Table Card */}
      <div className="ad-table-card">
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Sender</th>
                <th>Subject</th>
                <th>Message Excerpt</th>
                <th>Received</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMessages.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div className="ad-user-cell">
                      <div className="ad-table-mini-avatar" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#7c3aed' }}>✉️</div>
                      <div>
                        <span className="ad-cell-bold">{m.name || 'Anonymous Visitor'}</span>
                        <span className="ad-cell-email">{m.email || '—'}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="ad-cell-bold">{m.subject || 'General Inquiry'}</span>
                  </td>
                  <td className="ad-cell-truncate" style={{ maxWidth: '280px' }}>
                    {m.message || '—'}
                  </td>
                  <td className="ad-cell-muted">
                    {m.created_at ? new Date(m.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="ad-btn-view-details"
                      onClick={() => setSelectedMessage(m)}
                    >
                      Read Message
                    </button>
                  </td>
                </tr>
              ))}

              {filteredMessages.length === 0 && (
                <tr>
                  <td colSpan={5} className="ad-empty-cell">
                    {searchQuery ? `No messages matching "${searchQuery}"` : 'No community messages received yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Inspection Modal */}
      <AnimatePresence>
        {selectedMessage && (
          <div className="ad-modal-backdrop" onClick={() => setSelectedMessage(null)}>
            <motion.div
              className="ad-modal-content"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
            >
              <div className="ad-modal-header">
                <div>
                  <h3 className="ad-modal-title">{selectedMessage.subject || 'Inquiry Message'}</h3>
                  <span className="ad-cell-muted" style={{ fontSize: '12px' }}>
                    From: {selectedMessage.name} &lt;{selectedMessage.email}&gt;
                  </span>
                </div>
                <button
                  type="button"
                  className="ad-modal-close-btn"
                  onClick={() => setSelectedMessage(null)}
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: '24px', lineHeight: '1.6', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                {selectedMessage.message || 'No message text provided.'}
              </div>

              <div className="ad-modal-footer-actions">
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject || 'FoodBridge Inquiry')}`}
                  className="ad-status-action-btn btn-complete"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  Reply via Email ✉️
                </a>
                <button
                  type="button"
                  className="ad-btn-contact-user"
                  onClick={() => setSelectedMessage(null)}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
