import React, { useState } from 'react';
import { SpeechService } from '../services/speechService';
import { sounds } from '../services/soundEffects';

export default function MicButton({ onSpeechResult, disabled = false, placeholder = 'Say your food!' }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const startListening = async () => {
    if (disabled || isListening) return;
    sounds.playPop();
    setIsListening(true);
    setTranscript('');

    try {
      const recognizedText = await SpeechService.recognizeSpeech({
        onStart: () => setIsListening(true),
        onError: () => setIsListening(false),
      });

      if (!recognizedText) return;
      setTranscript(recognizedText);
      if (onSpeechResult) onSpeechResult(recognizedText);
    } catch (e) {
      console.error(e);
    } finally {
      setIsListening(false);
    }
  };

  return (
    <div className="mic-wrapper">
      <button
        type="button"
        className={`mic-btn ${isListening ? 'listening' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={startListening}
        disabled={disabled || isListening}
      >
        <span className="mic-icon">{isListening ? '🎙️' : '🎤'}</span>
        <span className="mic-label">
          {isListening ? 'Listening... Speak now!' : 'TAP & SAY'}
        </span>
        {isListening && <div className="mic-pulse-ring"></div>}
      </button>

      {transcript && (
        <div className="mic-transcript-bubble">
          <span className="speech-quote">“{transcript}”</span>
        </div>
      )}

      {!transcript && !isListening && (
        <div className="mic-hint-text">{placeholder}</div>
      )}
    </div>
  );
}
