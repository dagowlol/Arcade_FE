import React from 'react';

export default function FeedbackModal({
  visible,
  type = 'SUCCESS', // 'SUCCESS', 'RETRY_FOOD', 'RETRY_SPEECH', 'GAME_OVER'
  message = '',
  expectedSpeech = '',
  spokenText = '',
  onClose,
  onRestart,
}) {
  if (!visible) return null;

  const isSuccess = type === 'SUCCESS';
  const isGameOver = type === 'GAME_OVER';

  return (
    <div className="feedback-overlay" onClick={onClose}>
      <div className={`feedback-modal ${isSuccess ? 'success' : isGameOver ? 'game-over' : 'retry'}`} onClick={e => e.stopPropagation()}>
        <div className="feedback-icon">
          {isSuccess ? '🎉' : isGameOver ? '💔' : '🌟'}
        </div>
        <h2 className="feedback-title">
          {isSuccess ? 'Super Great!' : isGameOver ? 'Game Over!' : 'Almost There!'}
        </h2>
        <p className="feedback-message">{message}</p>

        {spokenText && (
          <div className="feedback-speech-info">
            <div className="spoken-row">
              <span className="label">You said:</span>
              <span className="value">"{spokenText}"</span>
            </div>
            {!isSuccess && expectedSpeech && (
              <div className="expected-row">
                <span className="label">Expected:</span>
                <span className="value">"{expectedSpeech}"</span>
              </div>
            )}
          </div>
        )}

        <div className="feedback-actions">
          {isGameOver ? (
            <button type="button" className="btn-feedback-action restart" onClick={onRestart}>
              Play Again 🔄
            </button>
          ) : isSuccess ? (
            <button type="button" className="btn-feedback-action continue" onClick={onClose}>
              Next Challenge 🚀
            </button>
          ) : (
            <button type="button" className="btn-feedback-action try-again" onClick={onClose}>
              Try Again 💪
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
