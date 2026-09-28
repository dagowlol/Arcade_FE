import React from 'react';

/**
 * FeedbackOverlay - Popup banner overlay showing feedback for correct / retry / error state.
 */
export default function FeedbackOverlay({ type, message, expectedSpeech }) {
  const isSuccess = type === 'success';
  const isRetry = type === 'retry';

  return (
    <div className={`feedback-overlay-backdrop ${type}`}>
      <div className={`feedback-card-content animate-pop ${type}`}>
        <div className="feedback-banner-icon">
          {isSuccess && '🎉'}
          {isRetry && '💡'}
          {!isSuccess && !isRetry && '⚠️'}
        </div>

        <h3 className="feedback-headline">
          {isSuccess && 'ĐÚNG RỒI! GIỎI KHÁM PHÁ!'}
          {isRetry && 'CHƯA CHÍNH XÁC RỒI!'}
          {!isSuccess && !isRetry && 'CÓ LỖI XẢY RA!'}
        </h3>

        <p className="feedback-message-text">{message}</p>

        {expectedSpeech && (
          <div className="expected-speech-hint">
            <span className="hint-label">Gợi ý nói:</span>
            <span className="hint-text">"{expectedSpeech}"</span>
          </div>
        )}
      </div>
    </div>
  );
}
