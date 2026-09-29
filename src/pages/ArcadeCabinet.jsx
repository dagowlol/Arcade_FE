import React, { useState, useEffect } from 'react';
import { foodChallengeApi } from '../services/foodChallengeApi';
import { SpeechService } from '../services/speechService';
import { sounds } from '../services/soundEffects';
import Mascot from '../components/Mascot';
import LevelSelector from '../components/LevelSelector';
import Level1Listen from '../components/Level1Listen';
import Level2Order from '../components/Level2Order';
import Level3Memory from '../components/Level3Memory';
import ResultScreen from '../components/ResultScreen';
import FeedbackOverlay from '../components/FeedbackOverlay';
import HeartDisplay from '../components/HeartDisplay';
import ChallengeProgress from '../components/ChallengeProgress';
import confetti from 'canvas-confetti';
import mascotImage from '../assets/mascot.png';

const LEVEL_BADGES = {
  EASY: { className: 'level-badge-easy', text: 'Cấp độ 1 — Bé học Từ Vựng' },
  MEDIUM: { className: 'level-badge-medium', text: '🔤 Cấp độ 2 — Xếp Từ & Điền Từ' },
  HARD: { className: 'level-badge-hard', text: '⭐ Cấp độ 3 — Nhớ & Gọi món' },
};

export default function ArcadeCabinet() {
  // App screens: ATTRACT → LEVEL_SELECT → PLAYING → RESULT → END
  const [screen, setScreen] = useState('ATTRACT');
  const [session, setSession] = useState(null);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type, message, expectedSpeech }
  const [result, setResult] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [foods, setFoods] = useState([]);

  // Load foods from backend on mount
  useEffect(() => {
    foodChallengeApi.getFoods()
      .then(setFoods)
      .catch(err => console.error('Failed to load foods:', err));
  }, []);

  // Clean up speech on screen change
  useEffect(() => {
    SpeechService.stopSpeaking();
    setFeedback(null);
  }, [screen]);

  // ========================
  // NAVIGATION
  // ========================
  const handleTapToPlay = () => {
    sounds.playPop();
    setScreen('LEVEL_SELECT');
  };

  const handleSelectLevel = async (level) => {
    sounds.playPop();
    setSelectedLevel(level);
    setLoading(true);
    try {
      const sessionData = await foodChallengeApi.startSession(level);
      setSession(sessionData);
      setCurrentChallenge(sessionData.currentChallenge);
      setScreen('PLAYING');
    } catch (err) {
      console.error('Failed to start session:', err);
      setFeedback({ type: 'error', message: 'Không thể kết nối máy chủ. Thử lại nhé!' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (selectedItems, spokenText = '', answerText = null) => {
    if (!session || !currentChallenge) return;

    setLoading(true);
    try {
      const result = await foodChallengeApi.submitAnswer(
        session.sessionId,
        currentChallenge.challengeId,
        selectedItems,
        spokenText,
        answerText
      );

      if (result.correct) {
        sounds.playSuccess();
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        setFeedback({ type: 'success', message: result.message });

        // Update session state
        setSession(prev => ({
          ...prev,
          currentChallengeIndex: result.progress,
          hearts: result.hearts,
          score: (prev?.score || 0) + 100,
          status: result.sessionStatus,
        }));

        setTimeout(() => {
          setFeedback(null);
          if (result.sessionStatus === 'COMPLETED') {
            sounds.playFanfare();
            confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
            fetchResult();
          } else if (result.nextChallenge) {
            setCurrentChallenge(result.nextChallenge);
          }
        }, 1500);
      } else {
        sounds.playRetry();
        setFeedback({
          type: 'retry',
          message: result.message,
          expectedSpeech: result.expectedSpeech,
        });

        setSession(prev => ({
          ...prev,
          hearts: result.hearts,
          status: result.sessionStatus,
        }));

        if (result.sessionStatus === 'FAILED') {
          setTimeout(() => {
            setFeedback(null);
            fetchResult();
          }, 2000);
        } else {
          setTimeout(() => setFeedback(null), 3000);
        }
      }
      return result;
    } catch (err) {
      console.error('Submit error:', err);
      setFeedback({ type: 'error', message: 'Lỗi kết nối. Thử lại nhé!' });
      setTimeout(() => setFeedback(null), 2000);
      return { correct: false };
    } finally {
      setLoading(false);
    }
  };

  const fetchResult = async () => {
    if (!session) return;
    try {
      const res = await foodChallengeApi.getSessionResult(session.sessionId);
      setResult(res);
      setScreen('RESULT');
    } catch (err) {
      console.error('Failed to fetch result:', err);
      setScreen('END');
    }
  };

  const handlePlayAgain = () => {
    setSession(null);
    setCurrentChallenge(null);
    setResult(null);
    setFeedback(null);
    setScreen('LEVEL_SELECT');
  };

  const handleGoHome = () => {
    setSession(null);
    setCurrentChallenge(null);
    setResult(null);
    setFeedback(null);
    setScreen('ATTRACT');
  };

  // ========================
  // RENDER GAME SCREEN
  // ========================
  const renderGameScreen = () => {
    if (!session || !currentChallenge) return null;

    const commonProps = {
      challenge: currentChallenge,
      session,
      foods,
      onSubmit: handleSubmitAnswer,
      loading,
    };

    switch (session.level) {
      case 'EASY':
        return <Level1Listen {...commonProps} />;
      case 'MEDIUM':
        return <Level2Order {...commonProps} />;
      case 'HARD':
        return <Level3Memory {...commonProps} />;
      default:
        return <Level1Listen {...commonProps} />;
    }
  };

  return (
    <div className="arcade-cabinet-wrapper">
      {/* Arcade Marquee Header */}
      <div className="arcade-marquee">
        <div className="marquee-bulb-row">
          {Array.from({ length: 16 }).map((_, i) => (
            <span key={i} className="arcade-bulb" style={{ animationDelay: `${(i % 4) * 0.25}s` }}></span>
          ))}
        </div>
        <div className="marquee-title-box">
          <span className="marquee-tag">🍗 ARCADE BOOTH 🍟</span>
          <h1 className="marquee-logo">CHICKEN ADVENTURE</h1>
          <span className="marquee-sub">CHƠI · HỌC · NHẬN THƯỞNG</span>
        </div>
      </div>

      {/* Main Screen */}
      <div className="arcade-screen-bezel">
        <div className="arcade-screen-inner">

          {/* ATTRACT SCREEN */}
          {screen === 'ATTRACT' && (
            <div className="screen-layout screen-attract">
              <div className="attract-header-banner">
                <div className="kfc-badge">KFC</div>
                <h2 className="attract-hero-title">CHICKEN ADVENTURE</h2>
                <div className="attract-tagline">CHƠI · HỌC · NHẬN THƯỞNG</div>
              </div>

              <div className="attract-hero-scene">
                <div className="attract-mascot-hero">
                  <img className="hero-chick" src={mascotImage} alt="Mascot con gà" />
                  <div className="hero-speech-bubble">BẤM ĐỂ CHƠI NÀO! 🎟️</div>
                </div>
              </div>

              <button type="button" className="btn-arcade-huge btn-tap-to-play" onClick={handleTapToPlay}>
                <span className="btn-glow-pulse"></span>
                <span>BẤM ĐỂ CHƠI</span>
              </button>

              <div className="attract-rewards-ribbon">
                <span className="ribbon-label">CHƠI ĐỂ NHẬN NHỮNG PHIẾU GIẢM GIÁ MIỄN PHÍ !</span>
                {/* <div className="ribbon-items">
                  <span>5% </span>
                  <span>,</span>
                  <span>10%</span>
                  <span>,</span>
                  <span>20%</span>
                </div> */}
              </div>
            </div>
          )}

          {/* LEVEL SELECT SCREEN */}
          {screen === 'LEVEL_SELECT' && (
            <LevelSelector onSelectLevel={handleSelectLevel} loading={loading} />
          )}

          {/* PLAYING SCREEN */}
          {screen === 'PLAYING' && session && currentChallenge && (
            <div className="screen-layout screen-game-stage">
              {/* Level Badge Ribbon (above the challenge progress + hearts) */}
              <div className="level1-header-ribbon">
                <div className={`level-badge ${LEVEL_BADGES[session.level]?.className || 'level-badge-easy'}`}>
                  <span>{LEVEL_BADGES[session.level]?.text || 'Cấp độ 1 — Bé học Từ Vựng'}</span>
                </div>
              </div>

              {/* HUD Bar */}
              <div className="stage-top-hud">
                <ChallengeProgress
                  current={session.currentChallengeIndex + 1}
                  total={session.totalChallenges}
                />
                <HeartDisplay hearts={session.hearts} maxHearts={session.maxHearts} />
              </div>

              {renderGameScreen()}

              {/* Feedback Overlay */}
              {feedback && (
                <FeedbackOverlay
                  type={feedback.type}
                  message={feedback.message}
                  expectedSpeech={feedback.expectedSpeech}
                />
              )}
            </div>
          )}

          {/* RESULT SCREEN */}
          {screen === 'RESULT' && result && (
            <ResultScreen
              result={result}
              onPlayAgain={handlePlayAgain}
              onGoHome={handleGoHome}
            />
          )}

          {/* END SCREEN */}
          {screen === 'END' && (
            <div className="screen-layout screen-end">
              <div className="kfc-top-logo">KFC</div>
              <h2 className="end-title">Tuyệt vời! 🌟</h2>
              <p className="end-subtitle">Bạn có muốn chơi lại không?</p>

              <div className="end-mascot-hero">
                <Mascot mood="excited" message="Chơi lại để nhận thêm phần thưởng nhé!" />
              </div>

              <div className="end-buttons-stack">
                <button type="button" className="btn-arcade-huge btn-play-again" onClick={handlePlayAgain}>
                  <span>🔄 CHƠI LẠI</span>
                </button>
                <button type="button" className="btn-arcade-huge btn-exit-cabinet" onClick={handleGoHome}>
                  <span>🏠 VỀ TRANG CHỦ</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      <div className="arcade-cabinet-footer">
        <div className="footer-speakers">
          <span className="speaker-grill"></span>
          <span className="speaker-grill"></span>
        </div>
        <div className="footer-brand">ARCADE KIOSK SYSTEM v2.0 · AZURE SPEECH</div>
        <div className="footer-coin-slot">
          <span className="coin-slot-light">🪙 MIỄN PHÍ</span>
        </div>
      </div>
    </div>
  );
}
