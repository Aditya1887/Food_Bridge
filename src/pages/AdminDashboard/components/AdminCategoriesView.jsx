import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export default function AdminCategoriesView({
  foodItems = [],
  onSelectNav,
}) {
  const CATEGORY_DEFINITIONS = [
    {
      id: 'Cooked Meals',
      name: 'Cooked Meals',
      icon: '🍲',
      color: '#16a34a',
      bgLight: 'rgba(22, 163, 74, 0.1)',
      desc: 'Freshly prepared dishes from restaurants, banquets, catering, and home kitchens.',
    },
    {
      id: 'Bakery & Breads',
      name: 'Bakery & Breads',
      icon: '🥖',
      color: '#d97706',
      bgLight: 'rgba(217, 119, 6, 0.1)',
      desc: 'Fresh breads, buns, croissants, pastries, and baked goods.',
    },
    {
      id: 'Fresh Produce',
      name: 'Fresh Produce',
      icon: '🥬',
      color: '#059669',
      bgLight: 'rgba(5, 150, 105, 0.1)',
      desc: 'Raw vegetables, seasonal fruits, and organic surplus farm harvests.',
    },
    {
      id: 'Dairy & Groceries',
      name: 'Dairy & Groceries',
      icon: '🥛',
      color: '#2563eb',
      bgLight: 'rgba(37, 99, 235, 0.1)',
      desc: 'Milk, cheese, yogurt, grains, pulses, and pantry essentials.',
    },
    {
      id: 'Packaged Food',
      name: 'Packaged Food',
      icon: '📦',
      color: '#7c3aed',
      bgLight: 'rgba(124, 58, 237, 0.1)',
      desc: 'Sealed snacks, canned goods, breakfast cereals, and beverage packs.',
    },
  ];

  const categoryStats = useMemo(() => {
    const map = {};
    CATEGORY_DEFINITIONS.forEach((cat) => {
      map[cat.id] = {
        count: 0,
        servings: 0,
        weightKg: 0,
        activeListings: 0,
      };
    });

    foodItems.forEach((f) => {
      const cat = f.category || 'Cooked Meals';
      const key = Object.keys(map).find(k => k.toLowerCase() === cat.toLowerCase()) || 'Cooked Meals';
      if (!map[key]) {
        map[key] = { count: 0, servings: 0, weightKg: 0, activeListings: 0 };
      }
      map[key].count++;
      map[key].servings += Number(f.servings) || 0;
      map[key].weightKg += Number(f.food_weight_kg) || 0;
      if (f.status === 'available') map[key].activeListings++;
    });

    return map;
  }, [foodItems]);

  const totalAllItems = foodItems.length || 1;

  return (
    <div className="ad-view-container">
      {/* Header */}
      <div className="ad-view-header">
        <div>
          <h2 className="ad-view-title">Meal & Food Categories Breakdown</h2>
          <p className="ad-view-subtitle">
            Categorized distribution of all surplus food contributions and zero-waste rescue metrics.
          </p>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="ad-categories-grid">
        {CATEGORY_DEFINITIONS.map((cat) => {
          const st = categoryStats[cat.id] || { count: 0, servings: 0, weightKg: 0, activeListings: 0 };
          const sharePct = Math.round((st.count / totalAllItems) * 100);

          return (
            <motion.div
              key={cat.id}
              className="ad-category-card"
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div className="ad-cat-card-header">
                <div className="ad-cat-icon-badge" style={{ backgroundColor: cat.bgLight }}>
                  <span style={{ fontSize: '24px' }}>{cat.icon}</span>
                </div>
                <span className="ad-cat-share-pill" style={{ color: cat.color }}>
                  {sharePct}% of total
                </span>
              </div>

              <h3 className="ad-cat-name">{cat.name}</h3>
              <p className="ad-cat-desc">{cat.desc}</p>

              {/* Stats row */}
              <div className="ad-cat-metrics-row">
                <div className="ad-cat-metric">
                  <span className="ad-cat-metric-val">{st.count}</span>
                  <span className="ad-cat-metric-lbl">Listings</span>
                </div>
                <div className="ad-cat-metric">
                  <span className="ad-cat-metric-val">{st.servings}</span>
                  <span className="ad-cat-metric-lbl">Servings</span>
                </div>
                <div className="ad-cat-metric">
                  <span className="ad-cat-metric-val">{st.weightKg.toFixed(1)}</span>
                  <span className="ad-cat-metric-lbl">KG Rescued</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="ad-cat-progress-track">
                <div
                  className="ad-cat-progress-fill"
                  style={{
                    width: `${Math.max(8, sharePct)}%`,
                    backgroundColor: cat.color,
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
