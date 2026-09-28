import React, { useState, useEffect } from 'react';
import { SpeechService } from '../services/speechService';
import { sounds } from '../services/soundEffects';
import Mascot from './Mascot';

/**
 * Level 1 - Nghe & Chọn (Listen & Choose)
 * Child hears an English sentence, then picks the correct food from 4 options.
 * No speech required.
 */
export default function Level1Listen({ challenge, session, onSubmit, loading }) {
  const [selectedFoodId, setSelectedFoodId] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  // Auto-play prompt when challenge loads
  useEffect(() => {
    if (challenge?.promptAudioText) {
      const timer = setTimeout(() => {
        playPrompt();
      }, 500);
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
      }
    );
  };

  const handleSelectFood = (food) => {
    if (loading || selectedFoodId) return;
    sounds.playPop();
    setSelectedFoodId(food.id);

    // Build the selected items for submission
    const selectedItems = [{
      foodId: food.id,
      foodName: food.name,
      displayName: food.displayName,
      quantity: 1,
    }];

    // Submit to backend (no speech needed for level 1)
    onSubmit(selectedItems, '');
  };

  const targetFood = challenge?.items?.[0];
  const options = challenge?.options || [];

  return (
    <div className="game-level-container">
      {/* Level Badge */}
      <div className="level-badge level-badge-easy">
        <span>🌱 Cấp độ 1 — Nghe & Chọn</span>
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
              : 'Bấm để nghe câu tiếng Anh'}
        </div>
        <div className="listen-replay-hint">
          {hasPlayed && !isAudioPlaying && '🔄'}
        </div>
      </div>

      {/* Instruction */}
      <div className="game-instruction">
        <span className="instruction-emoji">👆</span>
        <span>Chọn đúng món ăn được nhắc đến nhé!</span>
      </div>

      {/* Food Options Grid */}
      <div className="food-options-grid four-cols">
        {options.map((food) => {
          const isSelected = selectedFoodId === food.id;
          const isCorrect = isSelected && targetFood?.foodId === food.id;
          const isWrong = isSelected && targetFood?.foodId !== food.id;

          return (
            <button
              key={food.id}
              type="button"
              className={`food-option-card ${isSelected ? (isCorrect ? 'correct' : 'wrong') : ''}`}
              onClick={() => handleSelectFood(food)}
              disabled={loading || !!selectedFoodId}
            >
              <span className="food-option-emoji">{food.image}</span>
              <span className="food-option-name">{food.displayName}</span>
              {food.price && (
                <span className="food-option-price">
                  {food.price.toLocaleString('vi-VN')}đ
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mascot */}
      <div className="game-mascot-row">
        <Mascot
          mood="happy"
          message={
            isAudioPlaying
              ? 'Lắng nghe thật kỹ nhé! 👂'
              : hasPlayed
                ? 'Chọn đúng món ăn nào!'
                : 'Bấm nút nghe để bắt đầu!'
          }
        />
      </div>
    </div>
  );
}
