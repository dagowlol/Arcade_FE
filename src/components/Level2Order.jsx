import React, { useState, useEffect, useRef } from 'react';
import { SpeechService } from '../services/speechService';
import { sounds } from '../services/soundEffects';
import Mascot from './Mascot';

/**
 * Level 2 - Nghe & Gọi món (Listen & Order)
 * Child hears an order → selects the correct food(s) with quantities → speaks the food name(s) in English.
 */
export default function Level2Order({ challenge, session, foods, onSubmit, loading }) {
  const [tray, setTray] = useState({}); // { foodId: quantity }
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [phase, setPhase] = useState('LISTEN'); // LISTEN → SELECT → SPEAK
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');

  // Auto-play prompt on mount
  useEffect(() => {
    setTray({});
    setPhase('LISTEN');
    setSpokenText('');
    if (challenge?.promptAudioText) {
      const timer = setTimeout(() => playPrompt(), 500);
      return () => clearTimeout(timer);
    }
  }, [challenge?.challengeId]);

  const playPrompt = () => {
    if (!challenge?.promptAudioText) return;
    setIsAudioPlaying(true);
    SpeechService.speak(
      challenge.promptAudioText,
      () => setIsAudioPlaying(true),
      () => {
        setIsAudioPlaying(false);
        setHasPlayed(true);
        setPhase('SELECT');
      }
    );
  };

  const addToTray = (food) => {
    sounds.playPop();
    setTray(prev => ({
      ...prev,
      [food.id]: (prev[food.id] || 0) + 1,
    }));
  };

  const removeFromTray = (foodId) => {
    sounds.playPop();
    setTray(prev => {
      const newTray = { ...prev };
      if (newTray[foodId] > 1) {
        newTray[foodId] -= 1;
      } else {
        delete newTray[foodId];
      }
      return newTray;
    });
  };

  const handleConfirmTray = () => {
    sounds.playPop();
    setPhase('SPEAK');
  };

  const handleStartSpeech = async () => {
    sounds.playPop();
    setIsListening(true);
    setSpokenText('');

    try {
      const result = await SpeechService.recognizeSpeech({
        onStart: () => setIsListening(true),
        onRecognized: (text) => {
          setIsListening(false);
          setSpokenText(text);
          submitWithSpeech(text);
        },
        onError: () => {
          setIsListening(false);
          setSpokenText('');
        },
      });

      if (result && !spokenText) {
        setSpokenText(result);
        submitWithSpeech(result);
      }
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const submitWithSpeech = (spoken) => {
    const selectedItems = Object.entries(tray).map(([foodId, qty]) => {
      const food = (challenge?.options || foods || []).find(f => f.id === Number(foodId));
      return {
        foodId: Number(foodId),
        foodName: food?.name || '',
        displayName: food?.displayName || '',
        quantity: qty,
      };
    });

    onSubmit(selectedItems, spoken);
  };

  const options = challenge?.options || [];
  const trayItems = Object.entries(tray);
  const trayTotal = trayItems.reduce((sum, [, qty]) => sum + qty, 0);

  // Calculate total price
  const trayTotalPrice = trayItems.reduce((sum, [foodId, qty]) => {
    const food = options.find(f => f.id === Number(foodId));
    return sum + (food?.price || 0) * qty;
  }, 0);

  return (
    <div className="game-level-container">
      {/* Level Badge */}
      <div className="level-badge level-badge-medium">
        <span>🍔 Cấp độ 2 — Nghe & Gọi món</span>
      </div>

      {/* Listen Box */}
      <div
        className={`listen-prompt-box ${isAudioPlaying ? 'playing' : ''}`}
        onClick={playPrompt}
      >
        <span className="listen-icon">{isAudioPlaying ? '🔊' : '🔈'}</span>
        <div className="listen-prompt-text">
          {isAudioPlaying
            ? 'Đang nghe...'
            : hasPlayed
              ? 'Bấm để nghe lại'
              : 'Bấm để nghe yêu cầu'}
        </div>
      </div>

      {/* Phase Indicator */}
      <div className="phase-indicator">
        <span className={`phase-dot ${phase === 'LISTEN' ? 'active' : phase !== 'LISTEN' ? 'done' : ''}`}>1. Nghe</span>
        <span className="phase-arrow">→</span>
        <span className={`phase-dot ${phase === 'SELECT' ? 'active' : phase === 'SPEAK' ? 'done' : ''}`}>2. Chọn</span>
        <span className="phase-arrow">→</span>
        <span className={`phase-dot ${phase === 'SPEAK' ? 'active' : ''}`}>3. Nói</span>
      </div>

      {/* SELECT Phase: Food Menu */}
      {(phase === 'SELECT' || phase === 'LISTEN') && (
        <>
          <div className="game-instruction">
            <span className="instruction-emoji">🍽️</span>
            <span>{phase === 'LISTEN' ? 'Nghe yêu cầu trước nhé!' : 'Chọn đúng món và số lượng!'}</span>
          </div>

          <div className="food-menu-grid">
            {options.map((food) => (
              <button
                key={food.id}
                type="button"
                className={`food-menu-item ${tray[food.id] ? 'in-tray' : ''}`}
                onClick={() => addToTray(food)}
                disabled={phase === 'LISTEN' || loading}
              >
                <span className="menu-item-emoji">{food.image}</span>
                <span className="menu-item-name">{food.displayName}</span>
                <span className="menu-item-price">{food.price?.toLocaleString('vi-VN')}đ</span>
                {tray[food.id] && (
                  <span className="tray-count-badge">×{tray[food.id]}</span>
                )}
              </button>
            ))}
          </div>

          {/* Order Tray */}
          {trayTotal > 0 && (
            <div className="order-tray">
              <div className="tray-header">
                <span>🛒 Khay đặt hàng ({trayTotal} món)</span>
                <span className="tray-total-price">{trayTotalPrice.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="tray-items-row">
                {trayItems.map(([foodId, qty]) => {
                  const food = options.find(f => f.id === Number(foodId));
                  return (
                    <div key={foodId} className="tray-item-chip">
                      <span>{food?.image} {food?.displayName} ×{qty}</span>
                      <button
                        type="button"
                        className="tray-remove-btn"
                        onClick={(e) => { e.stopPropagation(); removeFromTray(Number(foodId)); }}
                      >✕</button>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                className="btn-confirm-tray"
                onClick={handleConfirmTray}
                disabled={loading}
              >
                ✅ Xác nhận đơn hàng
              </button>
            </div>
          )}
        </>
      )}

      {/* SPEAK Phase */}
      {phase === 'SPEAK' && (
        <div className="speak-phase-container">
          <div className="game-instruction">
            <span className="instruction-emoji">🎤</span>
            <span>Bây giờ hãy nói tên món bằng tiếng Anh nhé!</span>
          </div>

          {/* Show target sentence hint */}
          <div className="speech-hint-box" onClick={playPrompt}>
            <span className="hint-label">💡 Gợi ý câu nói:</span>
            <p className="hint-sentence">"{challenge?.speechTarget}"</p>
            <span className="hint-listen">🔊 Bấm để nghe lại</span>
          </div>

          <button
            type="button"
            className={`btn-arcade-mic ${isListening ? 'listening' : ''}`}
            onClick={handleStartSpeech}
            disabled={loading || isListening}
          >
            <span className="mic-icon">{isListening ? '🎙️' : '🎤'}</span>
            <span>{isListening ? 'Đang nghe... Nói đi nào!' : 'Bấm để nói'}</span>
          </button>

          {spokenText && (
            <div className="transcript-pill">Bạn đã nói: "{spokenText}"</div>
          )}
        </div>
      )}

      {/* Mascot */}
      <div className="game-mascot-row">
        <Mascot
          mood={phase === 'SPEAK' ? 'excited' : 'happy'}
          message={
            phase === 'LISTEN'
              ? 'Nghe kỹ yêu cầu nhé! 👂'
              : phase === 'SELECT'
                ? 'Chọn đúng món và số lượng!'
                : 'Nói thật rõ bằng tiếng Anh nào! 🗣️'
          }
        />
      </div>
    </div>
  );
}
