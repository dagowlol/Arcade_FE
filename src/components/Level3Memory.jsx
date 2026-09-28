import React, { useState, useEffect, useRef } from 'react';
import { SpeechService } from '../services/speechService';
import { sounds } from '../services/soundEffects';
import Mascot from './Mascot';

/**
 * Level 3 - Nhớ & Gọi món (Remember & Order)
 * Cấp độ 3: Trẻ nghe yêu cầu → ghi nhớ → tự chọn món → nói câu gọi món bằng tiếng Anh.
 */
export default function Level3Memory({ challenge, onSubmit, loading }) {
  // Phases: 'LISTEN' -> 'SELECT' -> 'SPEAK'
  const [phase, setPhase] = useState('LISTEN');
  const [selectedFoods, setSelectedFoods] = useState([]); // Array of { foodId, foodName, quantity, price }
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechError, setSpeechError] = useState('');
  const recognitionRef = useRef(null);

  // Auto-play requirement speech on mount or challenge change
  useEffect(() => {
    setPhase('LISTEN');
    setSelectedFoods([]);
    setTranscript('');
    setSpeechError('');

    if (challenge?.promptText) {
      SpeechService.speakEnglish(challenge.promptText);
    }
  }, [challenge]);

  // Clean up speech recognition
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleReplayPrompt = () => {
    sounds.playPop();
    if (challenge?.promptText) {
      SpeechService.speakEnglish(challenge.promptText);
    }
  };

  const handleFinishListen = () => {
    sounds.playPop();
    SpeechService.stopSpeaking();
    setPhase('SELECT');
  };

  const handleAddFood = (food) => {
    sounds.playPop();
    setSelectedFoods(prev => {
      const existing = prev.find(item => item.foodId === food.foodId);
      if (existing) {
        return prev.map(item =>
          item.foodId === food.foodId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { foodId: food.foodId, foodName: food.englishName, quantity: 1, price: food.price || 0 }];
      }
    });
  };

  const handleRemoveFood = (foodId) => {
    sounds.playPop();
    setSelectedFoods(prev => {
      const existing = prev.find(item => item.foodId === foodId);
      if (!existing) return prev;
      if (existing.quantity > 1) {
        return prev.map(item =>
          item.foodId === foodId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter(item => item.foodId !== foodId);
    });
  };

  const handleProceedToSpeak = () => {
    sounds.playPop();
    setPhase('SPEAK');
  };

  const handleStartRecording = () => {
    sounds.playPop();
    setSpeechError('');
    setTranscript('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError('Trình duyệt không hỗ trợ thu âm. Đang dùng giả lập...');
      // Fallback fallback simulated speech input
      setTimeout(() => {
        const expected = challenge?.expectedSpeech || 'I would like a burger';
        setTranscript(expected);
      }, 1000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setSpeechError('Không nghe thấy giọng nói. Vui lòng bấm và nói lại nhé!');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
      setIsListening(false);
      setSpeechError('Lỗi khởi động micro. Thử lại nhé!');
    }
  };

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleSubmit = () => {
    const itemsPayload = selectedFoods.map(f => ({
      foodId: f.foodId,
      quantity: f.quantity,
    }));
    onSubmit(itemsPayload, transcript);
  };

  return (
    <div className="game-stage-content level-3-container">
      {/* Level Header */}
      <div className="level-badge-header">
        <span className="badge-tag">⭐ CẤP ĐỘ 3</span>
        <h2 className="level-title-text">Nhớ & Gọi món</h2>
      </div>

      {/* PHASE 1: LISTEN & REMEMBER */}
      {phase === 'LISTEN' && (
        <div className="phase-card phase-listen">
          <Mascot mood="talking" message="Lắng nghe câu yêu cầu và ghi nhớ các món ăn nhé!" />

          <div className="prompt-speaker-box">
            <button
              type="button"
              className="btn-speaker-big"
              onClick={handleReplayPrompt}
              title="Bấm để nghe lại"
            >
              <span className="speaker-icon">🔊</span>
              <span className="speaker-label">Nghe lại câu yêu cầu</span>
            </button>
            <div className="english-prompt-text">
              "{challenge?.promptText || 'Listen carefully...'}"
            </div>
          </div>

          <button
            type="button"
            className="btn-arcade-huge btn-next-phase"
            onClick={handleFinishListen}
          >
            <span>ĐÃ NHỚ XONG ➡️ TỰ CHỌN MÓN</span>
          </button>
        </div>
      )}

      {/* PHASE 2: SELECT FOODS */}
      {phase === 'SELECT' && (
        <div className="phase-card phase-select">
          <Mascot mood="thinking" message="Hãy chọn đúng các món ăn bạn đã nhớ nào!" />

          <div className="remember-hint-bar">
            <span>💡 Bạn có thể nghe lại: </span>
            <button type="button" className="btn-small-listen" onClick={handleReplayPrompt}>
              🔊 Nghe lại
            </button>
          </div>

          {/* Food Selection Grid */}
          <div className="food-grid">
            {challenge?.items?.map(item => {
              const selected = selectedFoods.find(f => f.foodId === item.foodId);
              const count = selected ? selected.quantity : 0;
              return (
                <div
                  key={item.foodId}
                  className={`food-select-card ${count > 0 ? 'is-selected' : ''}`}
                  onClick={() => handleAddFood(item)}
                >
                  <div className="food-image-wrapper">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.englishName} />
                    ) : (
                      <span className="food-emoji">🍔</span>
                    )}
                  </div>
                  <div className="food-card-info">
                    <span className="food-en-name">{item.englishName}</span>
                    <span className="food-vn-name">{item.vietnameseName}</span>
                    {item.price && (
                      <span className="food-price">{item.price.toLocaleString('vi-VN')} VNĐ</span>
                    )}
                  </div>

                  {count > 0 && (
                    <div className="food-counter-overlay" onClick={e => e.stopPropagation()}>
                      <button type="button" className="btn-count-minus" onClick={() => handleRemoveFood(item.foodId)}>
                        -
                      </button>
                      <span className="count-number">{count}</span>
                      <button type="button" className="btn-count-plus" onClick={() => handleAddFood(item)}>
                        +
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected Tray Summary */}
          {selectedFoods.length > 0 && (
            <div className="selected-summary-tray">
              <span className="tray-title">Món đã chọn:</span>
              <div className="tray-chips">
                {selectedFoods.map(f => (
                  <span key={f.foodId} className="food-chip">
                    {f.foodName} x{f.quantity}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="phase-actions">
            <button
              type="button"
              className="btn-arcade-huge btn-next-phase"
              disabled={selectedFoods.length === 0}
              onClick={handleProceedToSpeak}
            >
              <span>XÁC NHẬN MÓN ➡️ GỌI MÓN</span>
            </button>
          </div>
        </div>
      )}

      {/* PHASE 3: SPEAK */}
      {phase === 'SPEAK' && (
        <div className="phase-card phase-speak">
          <Mascot mood="excited" message="Giờ hãy nói câu gọi món bằng tiếng Anh nhé!" />

          <div className="speak-order-review">
            <div className="review-title">Món bạn đã chọn:</div>
            <div className="review-items-list">
              {selectedFoods.map(f => (
                <div key={f.foodId} className="review-item">
                  🍗 {f.foodName} x{f.quantity}
                </div>
              ))}
            </div>
          </div>

          {/* Speech Recording Section */}
          <div className="speech-box">
            <div className="speech-instruction">
              Bấm vào micro và đọc câu gọi món của bạn bằng tiếng Anh:
            </div>

            <div className="speech-mic-wrapper">
              <button
                type="button"
                className={`btn-mic-record ${isListening ? 'recording' : ''}`}
                onClick={isListening ? handleStopRecording : handleStartRecording}
              >
                <span className="mic-icon">{isListening ? '🛑' : '🎤'}</span>
                <span className="mic-text">
                  {isListening ? 'Đang lắng nghe... (Bấm để dừng)' : 'Bấm để nói tiếng Anh'}
                </span>
              </button>
            </div>

            {transcript && (
              <div className="transcript-box">
                <span className="transcript-label">Máy đã nghe:</span>
                <p className="transcript-text">"{transcript}"</p>
              </div>
            )}

            {speechError && (
              <div className="speech-error-msg">{speechError}</div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="action-buttons-row">
            <button
              type="button"
              className="btn-arcade-secondary"
              onClick={() => setPhase('SELECT')}
            >
              ⬅️ Chọn lại món
            </button>

            <button
              type="button"
              className="btn-arcade-huge btn-submit-answer"
              disabled={loading || selectedFoods.length === 0}
              onClick={handleSubmit}
            >
              {loading ? 'Đang kiểm tra...' : 'NỘP CÂU TRẢ LỜI 🚀'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
