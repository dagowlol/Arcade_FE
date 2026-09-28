import React, { useState } from 'react';
import { SpeechService } from '../services/speechService';
import { sounds } from '../services/soundEffects';

export default function ListenButton({ text, onPlaybackEnd, disabled = false }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleListen = () => {
    if (disabled || isPlaying || !text) return;
    sounds.playPop();
    setIsPlaying(true);

    SpeechService.speak(
      text,
      () => setIsPlaying(true),
      () => {
        setIsPlaying(false);
        if (onPlaybackEnd) onPlaybackEnd();
      }
    );
  };

  return (
    <button
      type="button"
      className={`listen-btn ${isPlaying ? 'playing' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={handleListen}
      disabled={disabled}
      title="Click to listen"
    >
      <span className="listen-icon">{isPlaying ? '🔊' : '🔈'}</span>
      <span className="listen-text">{isPlaying ? 'Listening...' : 'LISTEN'}</span>
      {isPlaying && (
        <span className="sound-waves">
          <span className="wave-bar"></span>
          <span className="wave-bar"></span>
          <span className="wave-bar"></span>
        </span>
      )}
    </button>
  );
}
