import React from 'react';
import mascotImage from '../assets/mascot.png';

export default function Mascot({ message = 'Good luck!', mood = 'happy', action = '' }) {
  return (
    <div className={`arcade-mascot-container mascot-mood-${mood} ${action}`}>
      <div className="mascot-avatar-wrap">
        <div className="mascot-avatar-circle">
          <img className="mascot-avatar-img" src={mascotImage} alt="Mascot" />
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
