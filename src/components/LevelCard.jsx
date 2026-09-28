import React from 'react';
import { sounds } from '../services/soundEffects';

export default function LevelCard({ level, onStart }) {
  const handleStart = () => {
    sounds.playPop();
    if (onStart) onStart(level.id);
  };

  const getThemeClass = () => {
    if (level.id === 'EASY') return 'theme-easy';
    if (level.id === 'MEDIUM') return 'theme-medium';
    return 'theme-hard';
  };

  return (
    <div className={`level-card ${getThemeClass()}`}>
      <div className="level-badge">{level.difficulty || 'Fun'}</div>
      <div className="level-icon">{level.icon}</div>
      <h3 className="level-title">{level.name}</h3>
      <div className="level-tag">{level.tag}</div>
      <p className="level-desc">{level.description}</p>
      <button
        type="button"
        className="btn-start-level"
        onClick={handleStart}
      >
        <span>Play Now</span>
        <span className="btn-arrow">▶</span>
      </button>
    </div>
  );
}
