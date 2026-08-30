import '../AdminDashboard.css';
import React, { useMemo } from 'react';

export default function AdminActivityView({
  users = [],
  foodItems = [],
  pickups = [],
  messages = [],
}) {
  const allEvents = useMemo(() => {
    const list = [];

    users.forEach((u) => {
      list.push({
        id: `u_${u.id}`,
        title: u.role === 'donor' ? 'Donor Account Created' : (u.role === 'receiver' ? 'NGO Account Created' : 'User Registered'),
        desc: `"${u.full_name || 'Member'}" signed up (${u.email}).`,
        type: 'user',
        date: u.created_at ? new Date(u.created_at) : new Date(),
        icon: '👤',
        color: '#22c55e',
      });
    });

    foodItems.forEach((f) => {
      list.push({
        id: `f_${f.id}`,
        title: 'Surplus Food Published',
        desc: `"${f.food_name}" (${f.servings || 1} servings, ${f.category}) listed for rescue.`,
        type: 'food',
        date: f.created_at ? new Date(f.created_at) : new Date(),
        icon: '🍲',
        color: '#10b981',
      });
    });

    pickups.forEach((p) => {
      list.push({
        id: `p_${p.id}`,
        title: p.status === 'completed' ? 'Pickup Delivery Completed' : 'Pickup Slot Scheduled',
        desc: `OTP verified dispatch #${String(p.id).slice(0, 4)} completed for food package.`,
        type: 'pickup',
        date: p.created_at ? new Date(p.created_at) : new Date(),
        icon: '🚚',
        color: '#f59e0b',
      });
    });

    messages.forEach((m) => {
      list.push({
        id: `m_${m.id}`,
        title: 'Community Message Submitted',
        desc: `"${m.subject || 'Support Message'}" from ${m.name} (${m.email}).`,
        type: 'message',
        date: m.created_at ? new Date(m.created_at) : new Date(),
        icon: '✉️',
        color: '#8b5cf6',
      });
    });

    return list.sort((a, b) => b.date - a.date);
  }, [users, foodItems, pickups, messages]);

  return (
    <div className="ad-view-container">
      <div className="ad-view-header">
        <div>
          <h2 className="ad-view-title">Realtime Activity Audit Trail</h2>
          <p className="ad-view-subtitle">
            Complete chronological record of all system events, authentication records, and transaction logs ({allEvents.length} events).
          </p>
        </div>
      </div>

      <div className="ad-table-card">
        <div className="ad-activity-full-timeline">
          {allEvents.map((evt) => (
            <div key={evt.id} className="ad-timeline-item">
              <div className="ad-timeline-icon-bubble" style={{ backgroundColor: `${evt.color}15`, color: evt.color }}>
                {evt.icon}
              </div>
              <div className="ad-timeline-body">
                <div className="ad-timeline-top">
                  <span className="ad-timeline-title">{evt.title}</span>
                  <span className="ad-timeline-time">
                    {evt.date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="ad-timeline-desc">{evt.desc}</p>
              </div>
            </div>
          ))}

          {allEvents.length === 0 && (
            <div className="ad-empty-cell" style={{ padding: '40px' }}>
              No platform activity logs recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
