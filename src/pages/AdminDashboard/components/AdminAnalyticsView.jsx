import React from 'react';
import { motion } from 'framer-motion';
import { CountUp } from '../../../components/AnimatedUI';

export default function AdminAnalyticsView({
  stats = {},
  users = [],
  foodItems = [],
  pickups = [],
}) {
  const totalMeals = stats.totalMeals || foodItems.reduce((acc, f) => acc + (Number(f.servings) || 0), 0);
  const totalKg = stats.totalKg || foodItems.reduce((acc, f) => acc + (Number(f.food_weight_kg) || 0), 0);
  const co2Saved = stats.co2Saved || parseFloat((totalKg * 2.98).toFixed(1));
  const waterSavedLiters = Math.round(totalKg * 1050);
  const treeEquivalent = Math.round(totalKg * 0.12);

  const completedPickupsCount = pickups.filter(p => p.status === 'completed').length;
  const handoverRate = pickups.length > 0
    ? `${((completedPickupsCount / pickups.length) * 100).toFixed(1)}%`
    : (foodItems.length > 0 ? '100%' : '—');
  const availableListingsCount = foodItems.filter(f => (f.status || 'available') === 'available').length;

  const handleExportCSV = () => {
    const rows = [
      ['ID', 'Food Name', 'Category', 'Servings', 'Weight (KG)', 'Status', 'Created At'],
      ...foodItems.map((f) => [
        f.id,
        `"${(f.food_name || '').replace(/"/g, '""')}"`,
        f.category || 'Cooked Meals',
        f.servings || 0,
        f.food_weight_kg || 0,
        f.status || 'available',
        f.created_at || '',
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `foodbridge_audit_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="ad-view-container">
      {/* Header */}
      <div className="ad-view-header">
        <div>
          <h2 className="ad-view-title">Analytics & Environmental Impact</h2>
          <p className="ad-view-subtitle">
            Ecological footprint calculations, greenhouse gas offsets, and audit reporting data.
          </p>
        </div>

        <button
          type="button"
          className="ad-btn-export-csv"
          onClick={handleExportCSV}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ width: '18px', height: '18px' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export CSV Audit Report
        </button>
      </div>

      {/* Hero Environmental Impact Banners */}
      <div className="ad-analytics-cards-grid">
        <motion.div
          className="ad-impact-big-card card-co2"
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
        >
          <div className="ad-impact-big-icon">🌍</div>
          <div className="ad-impact-big-meta">
            <span className="ad-impact-big-label">CO2 Emissions Prevented</span>
            <div className="ad-impact-big-num">
              <CountUp to={parseFloat(co2Saved) || 0} decimals={1} duration={1.5} suffix=" kg" />
            </div>
            <p className="ad-impact-big-desc">Methane avoidance through zero-landfill diversion.</p>
          </div>
        </motion.div>

        <motion.div
          className="ad-impact-big-card card-water"
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
        >
          <div className="ad-impact-big-icon">💧</div>
          <div className="ad-impact-big-meta">
            <span className="ad-impact-big-label">Virtual Water Saved</span>
            <div className="ad-impact-big-num">
              <CountUp to={waterSavedLiters} duration={1.5} suffix=" L" />
            </div>
            <p className="ad-impact-big-desc">Agricultural and embedded processing water conserved.</p>
          </div>
        </motion.div>

        <motion.div
          className="ad-impact-big-card card-trees"
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
        >
          <div className="ad-impact-big-icon">🌳</div>
          <div className="ad-impact-big-meta">
            <span className="ad-impact-big-label">Tree Offset Equivalent</span>
            <div className="ad-impact-big-num">
              <CountUp to={treeEquivalent} duration={1.5} suffix=" trees" />
            </div>
            <p className="ad-impact-big-desc">Equivalent carbon absorption capacity preserved.</p>
          </div>
        </motion.div>
      </div>

      {/* Breakdown Metrics Grid */}
      <div className="ad-analytics-subgrid">
        <div className="ad-analytics-panel">
          <h3 className="ad-panel-title">Operational Efficiency</h3>
          <div className="ad-panel-stat-row">
            <span className="ad-panel-stat-label">Total Verified Handover Rate</span>
            <span className="ad-panel-stat-val">{handoverRate}</span>
          </div>
          <div className="ad-panel-stat-row">
            <span className="ad-panel-stat-label">Active Available Food Listings</span>
            <span className="ad-panel-stat-val">{availableListingsCount} listings</span>
          </div>
          <div className="ad-panel-stat-row">
            <span className="ad-panel-stat-label">Active Partner Network</span>
            <span className="ad-panel-stat-val">{users.length} Active Nodes</span>
          </div>
        </div>

        <div className="ad-analytics-panel">
          <h3 className="ad-panel-title">Distribution Reach</h3>
          <div className="ad-panel-stat-row">
            <span className="ad-panel-stat-label">Total Meals Distributed</span>
            <span className="ad-panel-stat-val">{totalMeals} meals</span>
          </div>
          <div className="ad-panel-stat-row">
            <span className="ad-panel-stat-label">Total Weight Diverted</span>
            <span className="ad-panel-stat-val">{totalKg.toFixed(1)} kg</span>
          </div>
          <div className="ad-panel-stat-row">
            <span className="ad-panel-stat-label">Completed Delivery Runs</span>
            <span className="ad-panel-stat-val">{pickups.filter(p => p.status === 'completed').length} runs</span>
          </div>
        </div>
      </div>
    </div>
  );
}
