import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { foodChallengeApi } from '../services/foodChallengeApi';
import { sounds } from '../services/soundEffects';

export default function Reward({ sessionId, onPlayAgain, onBackToMenu }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fire confetti celebration!
    sounds.playFanfare();
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
    });

    const timer = setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });
    }, 400);

    async function fetchResult() {
      try {
        const data = await foodChallengeApi.getSessionResult(sessionId);
        setResult(data);
      } catch (e) {
        console.error('Error fetching result:', e);
        setResult({
          level: 'EASY',
          score: 400,
          heartsRemaining: 3,
          rewardTitle: 'Free Ice Cream Voucher',
          rewardCode: 'FOOD-CHEF99',
          rewardIcon: '🍦',
          congratulationMessage: '🎉 Great job! You completed Food Ordering Challenge!',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchResult();
    return () => clearTimeout(timer);
  }, [sessionId]);

  const hearts = result?.heartsRemaining || 3;
  const starIcons = Array.from({ length: 3 }).map((_, i) => (
    <span key={i} className={`star-badge ${i < hearts ? 'star-gold' : 'star-dim'}`}>
      ⭐
    </span>
  ));

  return (
    <div className="page-container reward-page">
      <div className="reward-card-wrapper">
        <div className="celebration-badge">🏆 LEVEL COMPLETED! 🏆</div>

        <div className="stars-row">{starIcons}</div>

        <h1 className="reward-congrats-title">
          {result?.congratulationMessage || '🎉 Great Job, Little Chef!'}
        </h1>

        <p className="reward-congrats-subtitle">
          You listened carefully, spoke great English, and completed all food challenges!
        </p>

        {/* Voucher Ticket UI */}
        <div className="voucher-ticket">
          <div className="voucher-left">
            <span className="voucher-icon">{result?.rewardIcon || '🎟️'}</span>
          </div>
          <div className="voucher-divider">
            <div className="notch notch-top"></div>
            <div className="dashed-line"></div>
            <div className="notch notch-bottom"></div>
          </div>
          <div className="voucher-right">
            <span className="voucher-tag">OFFICIAL FOOD BOOTH REWARD</span>
            <h3 className="voucher-title">{result?.rewardTitle || 'Free Food Voucher'}</h3>
            <div className="voucher-code-box">
              <span className="code-label">CODE:</span>
              <span className="code-value">{result?.rewardCode || 'FOOD-2026'}</span>
            </div>
            <span className="voucher-note">Show this to the counter to claim your treat! 🎁</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="reward-actions">
          <button type="button" className="btn-reward-action primary" onClick={onPlayAgain}>
            Play Again 🔄
          </button>
          <button type="button" className="btn-reward-action secondary" onClick={onBackToMenu}>
            Choose Level 🏠
          </button>
        </div>
      </div>
    </div>
  );
}
