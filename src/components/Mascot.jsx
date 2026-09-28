import React from 'react';

export default function Mascot({ message = 'Good luck!', mood = 'happy', action = '' }) {
  const getMascotEmoji = () => {
    switch (mood) {
      case 'excited':
        return '🐥';
      case 'cheering':
        return '🐣';
      case 'chef':
        return '👨‍🍳';
      default:
        return '🐥';
    }
  };

  return (
    <div className={`arcade-mascot-container ${action}`}>
      <div className="mascot-avatar-wrap">
        <div className="mascot-avatar-circle">
          <span className="mascot-avatar-img">{getMascotEmoji()}</span>
          <div className="mascot-cap">🍗</div>
        </div>
      </div>
      {message && (
        <div className="mascot-speech-bubble">
          <span className="mascot-bubble-text">{message}</span>
          <div className="bubble-pointer"></div>
        </div>
      )}
    </div>
  );
}
