import React, { useEffect, useState } from 'react';
import LevelCard from '../components/LevelCard';
import FoodCard from '../components/FoodCard';
import { foodChallengeApi } from '../services/foodChallengeApi';
import menuBanner from '../assets/menu.png';

export default function LevelSelection({ onStartLevel }) {
  const [levels, setLevels] = useState([]);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [levelsData, foodsData] = await Promise.all([
          foodChallengeApi.getLevels(),
          foodChallengeApi.getFoods(),
        ]);
        setLevels(levelsData);
        setFoods(foodsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        // Fallback default levels if backend is starting
        setLevels([
          {
            id: 'EASY',
            name: 'Food Finder',
            tag: 'Listen & Say',
            description: 'Listen to 1 food name, pick the right food card and say it!',
            icon: '🌱',
            difficulty: 'Easy',
          },
          {
            id: 'MEDIUM',
            name: 'Food Order',
            tag: 'Listen & Order',
            description: 'Listen to the order with quantity, add to tray and speak!',
            icon: '🍔',
            difficulty: 'Medium',
          },
          {
            id: 'HARD',
            name: 'Super Order',
            tag: 'Listen, Remember & Order',
            description: 'Listen carefully! Order disappears after playing. Remember & speak!',
            icon: '⭐',
            difficulty: 'Hard',
          },
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  return (
    <div className="page-container level-selection-page">
      {/* Food Booth Header */}
      <header className="booth-header">
        <div className="booth-awning">
          <div className="awning-stripes"></div>
        </div>
        <div className="header-title-card">
          <span className="chef-badge">👨‍🍳 ARCADE FOOD BOOTH 👩‍🍳</span>
          <h1 className="main-title">Food Ordering Challenge</h1>
          <p className="main-subtitle">
            Listen, pick yummy food, speak English & win delicious vouchers! 🎟️✨
          </p>
        </div>
      </header>

      {/* Level Selection Cards */}
      <section className="level-cards-section">
        <div className="section-heading">
          <h2>🎯 Select Your Challenge Level</h2>
        </div>
        <div className="levels-grid">
          {levels.map((lvl) => (
            <LevelCard key={lvl.id} level={lvl} onStart={onStartLevel} />
          ))}
        </div>
      </section>

      {/* Food Booth Menu Showcase */}
      <section className="booth-menu-showcase">
        <div className="menu-board-header">
          <span className="menu-icon">📋</span>
          <h2>Today's Fresh Booth Menu</h2>
          <span className="menu-pill">9 Tasty Foods</span>
        </div>

        {menuBanner && (
          <div className="booth-menu-image-container">
            <img src={menuBanner} alt="Food Menu" className="booth-menu-image" />
          </div>
        )}

        {foods.length > 0 && (
          <div className="menu-preview-grid">
            {foods.map((food) => (
              <FoodCard key={food.id} food={food} disabled={true} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
