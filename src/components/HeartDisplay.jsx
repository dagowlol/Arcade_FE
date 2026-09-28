import React from 'react';

export default function HeartDisplay({ hearts = 3, maxHearts = 3 }) {
  const heartElements = [];

  for (let i = 0; i < maxHearts; i++) {
    const isFull = i < hearts;
    heartElements.push(
      <span
        key={i}
        className={`heart-icon ${isFull ? 'heart-full' : 'heart-empty'}`}
        title={isFull ? 'Heart alive' : 'Lost heart'}
      >
        {isFull ? '❤️' : '🤍'}
      </span>
    );
  }

  return (
    <div className="hearts-container" aria-label={`Lives remaining: ${hearts} out of ${maxHearts}`}>
      {heartElements}
    </div>
  );
}
