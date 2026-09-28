import React from 'react';

export default function ChallengeProgress({ current = 1, total = 4 }) {
  const percentage = Math.min(100, Math.round(((current) / total) * 100));

  return (
    <div className="progress-wrapper">
      <div className="progress-info">
        <span className="progress-badge">🌟 Thử thách {current} / {total}</span>
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
