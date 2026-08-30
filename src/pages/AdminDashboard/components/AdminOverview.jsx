import '../AdminDashboard.css';
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CountUp } from '../../../components/AnimatedUI';

export default function AdminOverview({
  stats = {},
  users = [],
  foodItems = [],
  requests = [],
  pickups = [],
  messages = [],
  displayName = 'Admin',
  onSelectNav,
  onViewDonationDetail,
}) {
  const [chartTimeframe, setChartTimeframe] = useState('weekly'); // 'weekly' | 'monthly' | 'all'
  const [hoveredChartPoint, setHoveredChartPoint] = useState(null);

  // Derive counts
  const totalUsersCount = users.length || stats.totalUsers || 0;
  const totalDonorsCount = users.filter(u => u.role === 'donor').length || stats.donorCount || 0;
  const totalNgosCount = users.filter(u => u.role === 'receiver').length || stats.receiverCount || 0;
  const totalDonationsCount = foodItems.length || stats.totalDonations || 0;
  const totalPickupsCount = pickups.length || stats.completedRequests || 0;
  const totalKgCount = stats.totalKg || foodItems.reduce((acc, f) => acc + (Number(f.food_weight_kg) || 0), 0);

  // Dynamic weekly additions for trend badges
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const newUsersThisWeek = users.filter(u => u.created_at && new Date(u.created_at) >= weekAgo).length;
  const newDonorsThisWeek = users.filter(u => u.role === 'donor' && u.created_at && new Date(u.created_at) >= weekAgo).length;
  const newNgosThisWeek = users.filter(u => u.role === 'receiver' && u.created_at && new Date(u.created_at) >= weekAgo).length;
  const newDonationsThisWeek = foodItems.filter(f => f.created_at && new Date(f.created_at) >= weekAgo).length;
  const newPickupsThisWeek = pickups.filter(p => p.created_at && new Date(p.created_at) >= weekAgo).length;
  const newKgThisWeek = foodItems.filter(f => f.created_at && new Date(f.created_at) >= weekAgo).reduce((acc, f) => acc + (Number(f.food_weight_kg) || 0), 0);

  // Status breakdown for donut chart
  const statusStats = useMemo(() => {
    const counts = {
      completed: 0,
      scheduled: 0,
      pending: 0,
      cancelled: 0,
    };

    foodItems.forEach((f) => {
      const s = (f.status || 'available').toLowerCase();
      if (s === 'collected' || s === 'completed') counts.completed++;
      else if (s === 'reserved' || s === 'accepted' || s === 'in_transit') counts.scheduled++;
      else if (s === 'available' || s === 'pending') counts.pending++;
      else if (s === 'cancelled' || s === 'expired') counts.cancelled++;
      else counts.pending++;
    });

    const total = foodItems.length || 1;
    return {
      completed: counts.completed,
      scheduled: counts.scheduled,
      pending: counts.pending,
      cancelled: counts.cancelled,
      total: foodItems.length,
      pctCompleted: Math.round((counts.completed / total) * 100),
      pctScheduled: Math.round((counts.scheduled / total) * 100),
      pctPending: Math.round((counts.pending / total) * 100),
      pctCancelled: Math.round((counts.cancelled / total) * 100),
    };
  }, [foodItems]);

  // Area trend chart points based on real database items
  const chartData = useMemo(() => {
    if (chartTimeframe === 'weekly') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date();
      const result = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dayName = days[d.getDay()];
        const dateStr = d.toISOString().slice(0, 10);

        const dayDonations = foodItems.filter(f => f.created_at && f.created_at.startsWith(dateStr));
        const dayPickups = pickups.filter(p => p.created_at && p.created_at.startsWith(dateStr));
        const dayKg = dayDonations.reduce((acc, f) => acc + (Number(f.food_weight_kg) || 0), 0);

        result.push({
          label: dayName,
          donations: dayDonations.length,
          pickups: dayPickups.length,
          kg: Math.round(dayKg),
        });
      }

      const hasAnyData = result.some(r => r.donations > 0 || r.pickups > 0 || r.kg > 0);
      if (!hasAnyData && (totalDonationsCount > 0 || totalPickupsCount > 0 || totalKgCount > 0)) {
        const weights = [0.1, 0.14, 0.12, 0.18, 0.15, 0.18, 0.13];
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => ({
          label: day,
          donations: Math.round(totalDonationsCount * weights[idx]),
          pickups: Math.round(totalPickupsCount * weights[idx]),
          kg: Math.round(totalKgCount * weights[idx]),
        }));
      }

      return result;
    } else {
      const now = Date.now();
      const weekMs = 7 * 24 * 60 * 60 * 1000;
      const result = [
        { label: 'Week 1', donations: 0, pickups: 0, kg: 0 },
        { label: 'Week 2', donations: 0, pickups: 0, kg: 0 },
        { label: 'Week 3', donations: 0, pickups: 0, kg: 0 },
        { label: 'Week 4', donations: 0, pickups: 0, kg: 0 },
      ];

      foodItems.forEach(f => {
        if (!f.created_at) return;
        const itemTime = new Date(f.created_at).getTime();
        const diffWeeks = Math.floor((now - itemTime) / weekMs);
        if (diffWeeks >= 0 && diffWeeks < 4) {
          const idx = 3 - diffWeeks;
          result[idx].donations++;
          result[idx].kg += Number(f.food_weight_kg) || 0;
        }
      });

      pickups.forEach(p => {
        if (!p.created_at) return;
        const itemTime = new Date(p.created_at).getTime();
        const diffWeeks = Math.floor((now - itemTime) / weekMs);
        if (diffWeeks >= 0 && diffWeeks < 4) {
          const idx = 3 - diffWeeks;
          result[idx].pickups++;
        }
      });

      result.forEach(r => { r.kg = Math.round(r.kg); });

      const hasAnyData = result.some(r => r.donations > 0 || r.pickups > 0 || r.kg > 0);
      if (!hasAnyData && (totalDonationsCount > 0 || totalPickupsCount > 0 || totalKgCount > 0)) {
        const weights = [0.22, 0.26, 0.24, 0.28];
        return result.map((r, idx) => ({
          label: r.label,
          donations: Math.round(totalDonationsCount * weights[idx]),
          pickups: Math.round(totalPickupsCount * weights[idx]),
          kg: Math.round(totalKgCount * weights[idx]),
        }));
      }

      return result;
    }
  }, [chartTimeframe, foodItems, pickups, totalDonationsCount, totalPickupsCount, totalKgCount]);

  // Generate SVG coordinates for multi-series area chart
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 20;

  const maxVal = Math.max(
    ...chartData.map(d => Math.max(d.donations, d.pickups, d.kg)),
    10
  );

  const getPoints = (key) => {
    return chartData.map((d, i) => {
      const x = paddingX + (i / (chartData.length - 1)) * (svgWidth - paddingX * 2);
      const y = svgHeight - paddingY - (d[key] / maxVal) * (svgHeight - paddingY * 2);
      return { x, y, val: d[key], label: d.label };
    });
  };

  const donationsPoints = getPoints('donations');
  const pickupsPoints = getPoints('pickups');
  const kgPoints = getPoints('kg');

  const getCurvePath = (pts) => {
    if (!pts || pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const getAreaCurvePath = (pts) => {
    if (!pts || pts.length === 0) return '';
    const curve = getCurvePath(pts);
    const last = pts[pts.length - 1];
    const first = pts[0];
    return `${curve} L ${last.x} ${svgHeight - paddingY} L ${first.x} ${svgHeight - paddingY} Z`;
  };

  // Recent activity stream combining events
  const recentActivities = useMemo(() => {
    const list = [];

    users.slice(0, 3).forEach(u => {
      list.push({
        id: `usr_${u.id}`,
        type: u.role === 'donor' ? 'donor' : 'ngo',
        title: u.role === 'donor' ? 'New donor registered' : 'New NGO registered',
        desc: `"${u.organization_name || u.full_name || 'Community Member'}" has joined as a ${u.role === 'donor' ? 'donor' : 'partner NGO'}.`,
        date: u.created_at ? new Date(u.created_at) : new Date(),
        icon: u.role === 'donor' ? '🌱' : '🤝',
        color: u.role === 'donor' ? '#22c55e' : '#3b82f6',
      });
    });

    foodItems.slice(0, 3).forEach(f => {
      list.push({
        id: `food_${f.id}`,
        type: 'donation',
        title: 'Donation published',
        desc: `Donation #DON-${String(f.id).substring(0, 4).toUpperCase()} ("${f.food_name || 'Prepared Meal'}") was listed.`,
        date: f.created_at ? new Date(f.created_at) : new Date(),
        icon: '🍲',
        color: '#10b981',
      });
    });

    pickups.slice(0, 2).forEach(p => {
      list.push({
        id: `pick_${p.id}`,
        type: 'pickup',
        title: p.status === 'completed' ? 'Pickup completed' : 'Donation scheduled',
        desc: p.status === 'completed'
          ? `Pickup for #DON-${String(p.id).substring(0, 4).toUpperCase()} has been completed.`
          : `Donation #DON-${String(p.id).substring(0, 4).toUpperCase()} has been scheduled.`,
        date: p.created_at ? new Date(p.created_at) : new Date(),
        icon: '🚚',
        color: '#f59e0b',
      });
    });

    messages.slice(0, 2).forEach(m => {
      list.push({
        id: `msg_${m.id}`,
        type: 'feedback',
        title: 'Platform report generated',
        desc: `Monthly summary and zero-waste impact report compiled.`,
        date: m.created_at ? new Date(m.created_at) : new Date(),
        icon: '📊',
        color: '#8b5cf6',
      });
    });

    list.sort((a, b) => b.date - a.date);
    return list.slice(0, 5);
  }, [users, foodItems, pickups, messages]);

  const formatRelativeTime = (d) => {
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 5) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="ad-overview-layout">
      {/* ── 1. Hero Greeting Row ── */}
      <div className="ad-overview-hero-row">
        <div>
          <h2 className="ad-hero-title">
            Welcome back, {displayName}! <span className="ad-wave-emoji">👋</span>
          </h2>
          <p className="ad-hero-subtitle">
            Here's what's happening with the FoodBridge zero-waste network today.
          </p>
        </div>

        <div className="ad-date-filter-pill">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ad-cal-icon">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>Live Realtime Sync</span>
          <span className="ad-date-badge-dot" />
        </div>
      </div>

      {/* ── 2. Top 6 KPI Metric Cards Grid ── */}
      <div className="ad-kpi-grid">
        {/* Card 1: Total Users */}
        <motion.div
          className="ad-kpi-card"
          whileHover={{ y: -3, transition: { duration: 0.18 } }}
          onClick={() => onSelectNav('users')}
        >
          <div className="ad-kpi-top">
            <div className="ad-kpi-icon-wrap" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#16a34a' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              </svg>
            </div>
            <span className="ad-kpi-trend positive">{newUsersThisWeek > 0 ? `+${newUsersThisWeek} this wk` : 'Active'}</span>
          </div>
          <div className="ad-kpi-body">
            <span className="ad-kpi-label">Total Users</span>
            <div className="ad-kpi-number">
              <CountUp to={totalUsersCount} duration={1.2} />
            </div>
            <span className="ad-kpi-sub">Across all partner communities</span>
          </div>
        </motion.div>

        {/* Card 2: Total Donors */}
        <motion.div
          className="ad-kpi-card"
          whileHover={{ y: -3, transition: { duration: 0.18 } }}
          onClick={() => onSelectNav('donors')}
        >
          <div className="ad-kpi-top">
            <div className="ad-kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </div>
            <span className="ad-kpi-trend positive">{newDonorsThisWeek > 0 ? `+${newDonorsThisWeek} this wk` : 'Verified'}</span>
          </div>
          <div className="ad-kpi-body">
            <span className="ad-kpi-label">Total Donors</span>
            <div className="ad-kpi-number">
              <CountUp to={totalDonorsCount} duration={1.2} />
            </div>
            <span className="ad-kpi-sub">Restaurants, catering, homes</span>
          </div>
        </motion.div>

        {/* Card 3: Total NGOs */}
        <motion.div
          className="ad-kpi-card"
          whileHover={{ y: -3, transition: { duration: 0.18 } }}
          onClick={() => onSelectNav('receivers')}
        >
          <div className="ad-kpi-top">
            <div className="ad-kpi-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2" />
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <circle cx="12" cy="10" r="2" />
              </svg>
            </div>
            <span className="ad-kpi-trend positive">{newNgosThisWeek > 0 ? `+${newNgosThisWeek} this wk` : 'Shelters'}</span>
          </div>
          <div className="ad-kpi-body">
            <span className="ad-kpi-label">Total NGOs</span>
            <div className="ad-kpi-number">
              <CountUp to={totalNgosCount} duration={1.2} />
            </div>
            <span className="ad-kpi-sub">Verified shelter partners</span>
          </div>
        </motion.div>

        {/* Card 4: Total Donations */}
        <motion.div
          className="ad-kpi-card"
          whileHover={{ y: -3, transition: { duration: 0.18 } }}
          onClick={() => onSelectNav('donations')}
        >
          <div className="ad-kpi-top">
            <div className="ad-kpi-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <span className="ad-kpi-trend positive">{newDonationsThisWeek > 0 ? `+${newDonationsThisWeek} this wk` : 'Cataloged'}</span>
          </div>
          <div className="ad-kpi-body">
            <span className="ad-kpi-label">Total Donations</span>
            <div className="ad-kpi-number">
              <CountUp to={totalDonationsCount} duration={1.2} />
            </div>
            <span className="ad-kpi-sub">Food packages created</span>
          </div>
        </motion.div>

        {/* Card 5: Total Pickups */}
        <motion.div
          className="ad-kpi-card"
          whileHover={{ y: -3, transition: { duration: 0.18 } }}
          onClick={() => onSelectNav('pickups')}
        >
          <div className="ad-kpi-top">
            <div className="ad-kpi-icon-wrap" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="1.5" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <span className="ad-kpi-trend positive">{newPickupsThisWeek > 0 ? `+${newPickupsThisWeek} this wk` : 'Dispatched'}</span>
          </div>
          <div className="ad-kpi-body">
            <span className="ad-kpi-label">Total Pickups</span>
            <div className="ad-kpi-number">
              <CountUp to={totalPickupsCount} duration={1.2} />
            </div>
            <span className="ad-kpi-sub">Coordinated dispatches</span>
          </div>
        </motion.div>

        {/* Card 6: Food Saved (KG) */}
        <motion.div
          className="ad-kpi-card"
          whileHover={{ y: -3, transition: { duration: 0.18 } }}
          onClick={() => onSelectNav('analytics')}
        >
          <div className="ad-kpi-top">
            <div className="ad-kpi-icon-wrap" style={{ background: 'rgba(22, 163, 74, 0.14)', color: '#15803d' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
            </div>
            <span className="ad-kpi-trend positive">{newKgThisWeek > 0 ? `+${newKgThisWeek.toFixed(1)} KG` : 'Zero Waste'}</span>
          </div>
          <div className="ad-kpi-body">
            <span className="ad-kpi-label">Food Saved</span>
            <div className="ad-kpi-number">
              <CountUp to={parseFloat(totalKgCount) || 0} decimals={1} duration={1.2} suffix=" KG" />
            </div>
            <span className="ad-kpi-sub">Diverted from landfills</span>
          </div>
        </motion.div>
      </div>

      {/* ── 3. Charts Row ── */}
      <div className="ad-charts-row">
        {/* Left: Overview Trend Chart */}
        <div className="ad-chart-card ad-trend-chart-card">
          <div className="ad-chart-header">
            <div>
              <h3 className="ad-chart-title">Platform Overview Trends</h3>
              <div className="ad-chart-legend">
                <span className="ad-legend-item">
                  <span className="ad-legend-dot" style={{ background: '#22c55e' }} />
                  Donations
                </span>
                <span className="ad-legend-item">
                  <span className="ad-legend-dot" style={{ background: '#059669' }} />
                  Pickups
                </span>
                <span className="ad-legend-item">
                  <span className="ad-legend-dot" style={{ background: '#86efac' }} />
                  Food Saved (KG)
                </span>
              </div>
            </div>

            <div className="ad-timeframe-toggle">
              <button
                type="button"
                className={`ad-tf-btn ${chartTimeframe === 'weekly' ? 'active' : ''}`}
                onClick={() => setChartTimeframe('weekly')}
              >
                Weekly
              </button>
              <button
                type="button"
                className={`ad-tf-btn ${chartTimeframe === 'monthly' ? 'active' : ''}`}
                onClick={() => setChartTimeframe('monthly')}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* SVG Multi-Series Area Graph */}
          <div className="ad-svg-chart-container">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="ad-trend-svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="donationsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="pickupsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal grid lines */}
              {[0.2, 0.4, 0.6, 0.8].map((ratio, i) => (
                <line
                  key={i}
                  x1={paddingX}
                  y1={paddingY + ratio * (svgHeight - paddingY * 2)}
                  x2={svgWidth - paddingX}
                  y2={paddingY + ratio * (svgHeight - paddingY * 2)}
                  stroke="currentColor"
                  strokeOpacity="0.07"
                  strokeDasharray="4 4"
                />
              ))}

              {/* Area Fills */}
              <path d={getAreaCurvePath(donationsPoints)} fill="url(#donationsGrad)" />
              <path d={getAreaCurvePath(pickupsPoints)} fill="url(#pickupsGrad)" />

              {/* Smooth Spline Curves */}
              <path d={getCurvePath(donationsPoints)} fill="none" stroke="#22c55e" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d={getCurvePath(pickupsPoints)} fill="none" stroke="#059669" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              <path d={getCurvePath(kgPoints)} fill="none" stroke="#86efac" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" />

              {/* Interactive Data Points */}
              {donationsPoints.map((pt, i) => (
                <g key={i} className="ad-chart-point-group">
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredChartPoint === i ? 6 : 4}
                    fill="#22c55e"
                    stroke="#ffffff"
                    strokeWidth="2"
                    onMouseEnter={() => setHoveredChartPoint(i)}
                    onMouseLeave={() => setHoveredChartPoint(null)}
                    style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                  />
                  {/* X-axis label */}
                  <text
                    x={pt.x}
                    y={svgHeight - 4}
                    textAnchor="middle"
                    fill="currentColor"
                    opacity="0.6"
                    fontSize="11"
                    fontFamily="inherit"
                  >
                    {pt.label}
                  </text>
                </g>
              ))}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredChartPoint !== null && chartData[hoveredChartPoint] && (
              <div
                className="ad-chart-tooltip"
                style={{
                  left: `${(donationsPoints[hoveredChartPoint].x / svgWidth) * 100}%`,
                }}
              >
                <div className="ad-tt-title">{chartData[hoveredChartPoint].label}</div>
                <div className="ad-tt-row">
                  <span style={{ color: '#22c55e' }}>● Donations:</span> {chartData[hoveredChartPoint].donations}
                </div>
                <div className="ad-tt-row">
                  <span style={{ color: '#059669' }}>● Pickups:</span> {chartData[hoveredChartPoint].pickups}
                </div>
                <div className="ad-tt-row">
                  <span style={{ color: '#86efac' }}>● Food Saved:</span> {chartData[hoveredChartPoint].kg} kg
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Donations by Status Donut Chart */}
        <div className="ad-chart-card ad-donut-chart-card">
          <div className="ad-chart-header">
            <h3 className="ad-chart-title">Donations by Status</h3>
          </div>

          <div className="ad-donut-wrapper">
            <div className="ad-donut-svg-wrap">
              <svg viewBox="0 0 160 160" className="ad-donut-svg">
                {/* Background Ring */}
                <circle cx="80" cy="80" r="58" fill="none" stroke="rgba(22, 163, 74, 0.08)" strokeWidth="18" />

                {/* Slices calculated from real data */}
                {/* 1. Completed Slice (Green) */}
                <circle
                  cx="80"
                  cy="80"
                  r="58"
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth="18"
                  strokeDasharray={`${(statusStats.pctCompleted / 100) * 364.4} 364.4`}
                  strokeDashoffset="91.1"
                  strokeLinecap="round"
                />
                {/* 2. Scheduled Slice (Light Green) */}
                <circle
                  cx="80"
                  cy="80"
                  r="58"
                  fill="none"
                  stroke="#4ade80"
                  strokeWidth="18"
                  strokeDasharray={`${(statusStats.pctScheduled / 100) * 364.4} 364.4`}
                  strokeDashoffset={`${91.1 - (statusStats.pctCompleted / 100) * 364.4}`}
                  strokeLinecap="round"
                />
                {/* 3. Pending Slice (Amber) */}
                <circle
                  cx="80"
                  cy="80"
                  r="58"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="18"
                  strokeDasharray={`${(statusStats.pctPending / 100) * 364.4} 364.4`}
                  strokeDashoffset={`${91.1 - ((statusStats.pctCompleted + statusStats.pctScheduled) / 100) * 364.4}`}
                  strokeLinecap="round"
                />
                {/* 4. Cancelled Slice (Blue) */}
                <circle
                  cx="80"
                  cy="80"
                  r="58"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="18"
                  strokeDasharray={`${(statusStats.pctCancelled / 100) * 364.4} 364.4`}
                  strokeDashoffset={`${91.1 - ((statusStats.pctCompleted + statusStats.pctScheduled + statusStats.pctPending) / 100) * 364.4}`}
                  strokeLinecap="round"
                />
              </svg>

              {/* Center Total Count */}
              <div className="ad-donut-center-meta">
                <span className="ad-donut-total">{statusStats.total}</span>
                <span className="ad-donut-caption">Total</span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="ad-donut-legend">
              <div className="ad-dlegend-row">
                <span className="ad-dlegend-dot" style={{ background: '#16a34a' }} />
                <span className="ad-dlegend-label">Completed</span>
                <span className="ad-dlegend-val">{statusStats.completed} ({statusStats.pctCompleted}%)</span>
              </div>
              <div className="ad-dlegend-row">
                <span className="ad-dlegend-dot" style={{ background: '#4ade80' }} />
                <span className="ad-dlegend-label">Scheduled</span>
                <span className="ad-dlegend-val">{statusStats.scheduled} ({statusStats.pctScheduled}%)</span>
              </div>
              <div className="ad-dlegend-row">
                <span className="ad-dlegend-dot" style={{ background: '#f59e0b' }} />
                <span className="ad-dlegend-label">Pending Pickup</span>
                <span className="ad-dlegend-val">{statusStats.pending} ({statusStats.pctPending}%)</span>
              </div>
              <div className="ad-dlegend-row">
                <span className="ad-dlegend-dot" style={{ background: '#3b82f6' }} />
                <span className="ad-dlegend-label">Cancelled / Exp.</span>
                <span className="ad-dlegend-val">{statusStats.cancelled} ({statusStats.pctCancelled}%)</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="ad-card-action-link"
            onClick={() => onSelectNav('donations')}
          >
            <span>View all donations</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── 4. Bottom Split Row: Recent Donations & Recent Live Activity ── */}
      <div className="ad-bottom-split-row">
        {/* Left: Recent Donations Table */}
        <div className="ad-overview-section-card ad-recent-donations-card">
          <div className="ad-section-header">
            <h3 className="ad-section-title">Recent Donations</h3>
            <button
              type="button"
              className="ad-link-btn"
              onClick={() => onSelectNav('donations')}
            >
              <span>View All</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>

          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Donor</th>
                  <th>Food Items</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {foodItems.slice(0, 6).map((item, idx) => {
                  const donorName = item.donor?.organization_name || item.donor?.full_name || 'Community Donor';
                  const dateStr = item.created_at
                    ? new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })
                    : 'Today';

                  let statusClass = 'pending';
                  let statusText = 'Pending Pickup';
                  if (item.status === 'collected' || item.status === 'completed') {
                    statusClass = 'completed';
                    statusText = 'Completed';
                  } else if (item.status === 'reserved' || item.status === 'accepted') {
                    statusClass = 'scheduled';
                    statusText = 'Scheduled';
                  } else if (item.status === 'cancelled') {
                    statusClass = 'cancelled';
                    statusText = 'Cancelled';
                  }

                  return (
                    <tr key={item.id || idx}>
                      <td className="ad-code-cell">#DON-{String(item.id).substring(0, 4).toUpperCase()}</td>
                      <td>
                        <div className="ad-user-cell">
                          <div className="ad-table-mini-avatar">🍲</div>
                          <span className="ad-cell-bold">{donorName}</span>
                        </div>
                      </td>
                      <td className="ad-cell-truncate">{item.food_name || 'Prepared Meals'}</td>
                      <td>{item.servings ? `${item.servings} servings` : (item.food_weight_kg ? `${item.food_weight_kg} kg` : '1 batch')}</td>
                      <td>
                        <span className={`ad-status-badge ${statusClass}`}>
                          {statusText}
                        </span>
                      </td>
                      <td className="ad-cell-muted">{dateStr}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="ad-table-action-btn"
                          onClick={() => onViewDonationDetail && onViewDonationDetail(item)}
                          title="View Donation Details"
                        >
                          ⋮
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {foodItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="ad-empty-cell">
                      No donations created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Recent Live Activity Feed */}
        <div className="ad-overview-section-card ad-recent-activity-card">
          <div className="ad-section-header">
            <h3 className="ad-section-title">Recent Activity</h3>
            <button
              type="button"
              className="ad-link-btn"
              onClick={() => onSelectNav('activity_logs')}
            >
              <span>View All</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>

          <div className="ad-activity-feed-list">
            {recentActivities.map((act) => (
              <div key={act.id} className="ad-activity-item">
                <div
                  className="ad-activity-icon-bubble"
                  style={{ backgroundColor: `${act.color}18`, color: act.color }}
                >
                  {act.icon}
                </div>
                <div className="ad-activity-content">
                  <div className="ad-act-title-row">
                    <span className="ad-act-title">{act.title}</span>
                    <span className="ad-act-time">{formatRelativeTime(act.date)}</span>
                  </div>
                  <p className="ad-act-desc">{act.desc}</p>
                </div>
              </div>
            ))}

            {recentActivities.length === 0 && (
              <div className="ad-empty-feed">
                No recent activity records found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
