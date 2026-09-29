import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import Mascot from './Mascot';
import { sounds } from '../services/soundEffects';
import mascotImage from '../assets/mascot.png';

/**
 * ResultScreen - Màn hình kết quả tổng kết sau khi hoàn thành hoặc kết thúc lượt chơi.
 */
export default function ResultScreen({ result, onPlayAgain, onGoHome }) {
  const isPassed = result?.status === 'COMPLETED';

  useEffect(() => {
    if (isPassed) {
      sounds.playFanfare();
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5 },
      });
    } else {
      sounds.playRetry();
    }
  }, [isPassed]);

  return (
    <div className="screen-layout screen-result">
      <div className="result-header">
        <h2 className="result-title">
          {isPassed ? '🎉 XUẤT SẮC! BẠN ĐÃ CHIẾN THẮNG! 🎉' : '💪 CỐ GẮNG HƠN Ở LẦN SAU NHÉ!'}
        </h2>
        <div className="result-subtitle">
          {isPassed
            ? 'Bạn đã hoàn thành tất cả thử thách gọi món!'
            : 'Đừng nản lòng, hãy thử lại để đạt kết quả tốt hơn!'}
        </div>
      </div>

      <div className="result-mascot-row">
        <Mascot
          mood={isPassed ? 'excited' : 'thinking'}
          message={result?.feedback || (isPassed ? 'Thật tuyệt vời!' : 'Cùng luyện tập thêm nào!')}
        />
      </div>

      {/* Score and Stats Cards */}
      <div className="result-stats-grid">
        <div className="stat-card stat-score">
          <span className="stat-icon">⭐</span>
          <span className="stat-value">{result?.score || 0}</span>
          <span className="stat-label">Điểm số</span>
        </div>

        <div className="stat-card stat-progress">
          <span className="stat-icon">🎯</span>
          <span className="stat-value">
            {result?.completedChallenges || 0} / {result?.totalChallenges || 0}
          </span>
          <span className="stat-label">Thử thách</span>
        </div>

        {/* <div className="stat-card stat-coins">
          <span className="stat-icon">🪙</span>
          <span className="stat-value">+{result?.coinsEarned || 0}</span>
          <span className="stat-label">Xu nhận được</span>
        </div> */}
      </div>

      {/* Coupon reward (only when level is won) */}
      {isPassed && (
        <div className="result-coupon-card">
          <div className="coupon-percent">
            <span className="coupon-percent-value">-{result?.discountPercent ?? 0}%</span>
            <span className="coupon-percent-label">GIẢM GIÁ</span>
          </div>
          <div className="coupon-divider"></div>
          <div className="coupon-body">
            <img className="coupon-mascot-img" src={mascotImage} alt="Mascot KFC" />
            <div className="coupon-info">
              <span className="coupon-title">{result?.rewardTitle || 'Phiếu ưu đãi'}</span>
              <span className="coupon-code">Mã: {result?.rewardCode || ''}</span>
              <span className="coupon-note">Dùng khi gọi món tại quầy nhé!</span>
            </div>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="result-actions">
        <button type="button" className="btn-arcade-huge btn-play-again" onClick={onPlayAgain}>
          <span>CHƠI LẠI</span>
        </button>
        <button type="button" className="btn-arcade-secondary btn-home" onClick={onGoHome}>
          <span>VỀ TRANG CHỦ</span>
        </button>
      </div>
    </div>
  );
}
