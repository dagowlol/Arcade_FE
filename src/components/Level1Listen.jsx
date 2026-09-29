import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { SpeechService } from '../services/speechService';
import { sounds } from '../services/soundEffects';
import Mascot from './Mascot';

const INTRO_SEQUENCE = [
  { step: 'READY', text: 'SẴN SÀNG!', sub: 'Chuẩn bị vào trò chơi', sound: 'pop', duration: 800 },
  { step: '3', text: '3', sub: 'Chuẩn bị vào trò chơi', sound: 'pop', duration: 550 },
  { step: '2', text: '2', sub: 'Chuẩn bị vào trò chơi', sound: 'pop', duration: 550 },
  { step: '1', text: '1', sub: 'Chuẩn bị vào trò chơi', sound: 'pop', duration: 550 },
  { step: 'GO', text: 'CHƠI ĐI!', sub: 'Bé làm được nào!', sound: 'fanfare', duration: 800 },
];

const PROMPT_AUTOPLAY_DELAY_MS = 1200;

/**
 * Level 1 - 3 Mini-Challenges for Kids:
 * 1. VISUAL_MATCH: Nhìn hình -> Chọn từ tiếng Anh
 * 2. LISTENING: Nghe âm thanh -> Chọn món tương ứng
 * 3. SPEAKING: Nhìn hình -> Bấm Micro phát âm tiếng Anh
 *
 * Includes randomized challenge order & rich interactive feedback.
 */
export default function Level1Listen({ challenge, session, onSubmit, loading }) {
  const [selectedId, setSelectedId] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [introVisible, setIntroVisible] = useState(true);
  const [introStep, setIntroStep] = useState(INTRO_SEQUENCE[0].step);

  const targetItem = challenge?.items?.[0];
  const options = challenge?.options || [];

  // Determine sub-challenge mode: VISUAL_MATCH, LISTENING, or SPEAKING
  const challengeType = (() => {
    if (['VISUAL_MATCH', 'LISTENING', 'SPEAKING'].includes(challenge?.type)) {
      return challenge.type;
    }
    // Fallback if backend returns FINDER or generic level 1 type
    const modes = ['VISUAL_MATCH', 'LISTENING', 'SPEAKING'];
    const idx = challenge?.sequenceIndex ?? 0;
    return modes[idx % modes.length];
  })();

  const targetFood = options.find((f) => f.id === targetItem?.foodId) || {
    id: targetItem?.foodId,
    name: targetItem?.foodName || 'Food',
    displayName: targetItem?.displayName || targetItem?.foodName || 'Món ăn',
    image: '🍗',
  };

  // Exciting "SẴN SÀNG -> 3 -> 2 -> 1 -> CHƠI ĐI!" countdown on entering the stage
  useEffect(() => {
    const timers = [];
    let elapsed = 0;

    INTRO_SEQUENCE.forEach((beat) => {
      timers.push(
        setTimeout(() => {
          setIntroStep(beat.step);
          if (beat.sound === 'fanfare') {
            sounds.playFanfare();
            confetti({ particleCount: 90, spread: 70, origin: { y: 0.5 } });
            SpeechService.speak("Let's go!");
          } else {
            sounds.playPop();
          }
        }, elapsed)
      );
      elapsed += beat.duration;
    });

    timers.push(setTimeout(() => setIntroVisible(false), elapsed));

    return () => {
      timers.forEach(clearTimeout);
      SpeechService.stopSpeaking();
    };
  }, []);

  // Reset local states when challenge changes
  useEffect(() => {
    setSelectedId(null);
    setHasPlayed(false);
    setIsAudioPlaying(false);
    setIsListeningMic(false);
    setTranscript('');
    setSubmitting(false);
  }, [challenge?.challengeId, challengeType]);

  // Auto-play audio prompt for LISTENING mode (waits until the countdown is over)
  useEffect(() => {
    if (challengeType !== 'LISTENING' || introVisible) return;
    const timer = setTimeout(() => playPromptAudio(), PROMPT_AUTOPLAY_DELAY_MS);
    return () => clearTimeout(timer);
  }, [challenge?.challengeId, challengeType, introVisible]);

  // Audio Playback helper
  const playPromptAudio = (textToPlay) => {
    const text = textToPlay || challenge?.promptAudioText || targetFood.name;
    if (!text) return;

    setIsAudioPlaying(true);
    SpeechService.speak(
      text,
      () => setIsAudioPlaying(true),
      () => {
        setIsAudioPlaying(false);
        setHasPlayed(true);
      }
    );
  };

  // ----------------------------------------------------
  // Challenge 1: VISUAL_MATCH (Click English Text Button)
  // ----------------------------------------------------
  const handleSelectVisualWord = async (food) => {
    if (loading || submitting || selectedId || introVisible) return;
    sounds.playPop();
    setSelectedId(food.id);
    setSubmitting(true);

    const isCorrect = food.id === targetItem?.foodId || food.name.toLowerCase() === targetFood.name.toLowerCase();

    if (isCorrect) {
      // Speak the English word to reinforce learning
      SpeechService.speak(food.name);

      const selectedItems = [{
        foodId: targetFood.id,
        foodName: targetFood.name,
        displayName: targetFood.displayName,
        quantity: 1,
      }];

      setTimeout(async () => {
        await onSubmit(selectedItems, '');
        setSubmitting(false);
      }, 1000);
    } else {
      sounds.playRetry();
      const selectedItems = [{
        foodId: food.id,
        foodName: food.name,
        displayName: food.displayName,
        quantity: 1,
      }];

      const result = await onSubmit(selectedItems, '');
      setSubmitting(false);
      if (result && !result.correct) {
        setTimeout(() => {
          setSelectedId(null);
        }, 1200);
      }
    }
  };

  // ----------------------------------------------------
  // Challenge 2: LISTENING (Click Food Image Card)
  // ----------------------------------------------------
  const handleSelectListeningFood = async (food) => {
    if (loading || submitting || selectedId || introVisible) return;
    sounds.playPop();
    setSelectedId(food.id);
    setSubmitting(true);

    const selectedItems = [{
      foodId: food.id,
      foodName: food.name,
      displayName: food.displayName,
      quantity: 1,
    }];

    const result = await onSubmit(selectedItems, '');
    setSubmitting(false);

    if (result && !result.correct) {
      setTimeout(() => {
        setSelectedId(null);
      }, 1200);
    }
  };

  // ----------------------------------------------------
  // Challenge 3: SPEAKING (Tap Mic & Speak English Word)
  // ----------------------------------------------------
  const handleStartMic = async () => {
    if (loading || submitting || isListeningMic || introVisible) return;
    sounds.playPop();
    setIsListeningMic(true);
    setTranscript('');

    try {
      const recognizedText = await SpeechService.recognizeSpeech({
        onStart: () => setIsListeningMic(true),
        onError: () => setIsListeningMic(false),
      });

      setIsListeningMic(false);
      if (!recognizedText) return;

      setTranscript(recognizedText);
      await processSpeakingSubmission(recognizedText);
    } catch (err) {
      console.error('Speech recognition failed:', err);
      setIsListeningMic(false);
    }
  };

  const processSpeakingSubmission = async (spokenText) => {
    setSubmitting(true);
    const selectedItems = [{
      foodId: targetFood.id,
      foodName: targetFood.name,
      displayName: targetFood.displayName,
      quantity: 1,
    }];

    await onSubmit(selectedItems, spokenText);
    setSubmitting(false);
  };

  // ====================================================
  // RENDER SUB-CHALLENGE UI
  // ====================================================
  return (
    <div className="game-level-container level1-mini-challenges">
      {/* ====================================================
          CHALLENGE 1: VISUAL MATCHING (Nhìn hình -> Chọn từ)
         ==================================================== */}
      {challengeType === 'VISUAL_MATCH' && (
        <>
          <div className="game-instruction">
            <span>Nhìn món ăn bên dưới và chọn từ tiếng Anh tương ứng!</span>
          </div>

          {/* Target Food Showcase Card */}
          <div className="visual-match-hero-card">
            <span className="visual-hero-emoji">{targetFood.image || '🍗'}</span>
            <div className="visual-hero-question">Món này tiếng Anh là gì?</div>
          </div>

          {/* 3-4 English Text Buttons */}
          <div className="text-options-grid">
            {options.map((food) => {
              const isSelected = selectedId === food.id;
              const isCorrect = isSelected && (food.id === targetItem?.foodId || food.name.toLowerCase() === targetFood.name.toLowerCase());
              const isWrong = isSelected && !isCorrect;

              return (
                <button
                  key={food.id}
                  type="button"
                  className={`text-option-btn ${isSelected ? (isCorrect ? 'correct' : 'wrong') : ''}`}
                  onClick={() => handleSelectVisualWord(food)}
                  disabled={loading || submitting || !!selectedId || introVisible}
                >
                  <span className="btn-word-text">{food.name}</span>
                  {/* {food.pronunciationText && (
                    <span className="btn-word-sub">({food.pronunciationText})</span>
                  )} */}
                </button>
              );
            })}
          </div>

          <div className="game-mascot-row">
            <Mascot
              mood="excited"
              message={
                selectedId
                  ? 'Giỏi lắm! Đang kiểm tra câu trả lời...'
                  : 'Đọc kỹ các từ tiếng Anh bên dưới nhé! '
              }
            />
          </div>
        </>
      )}

      {/* ====================================================
          CHALLENGE 2: LISTENING COMPREHENSION (Nghe sound -> Chọn món)
         ==================================================== */}
      {challengeType === 'LISTENING' && (
        <>
          <div className="game-instruction">
            <span className="instruction-emoji">👂</span>
            <span>Nghe âm thanh và chọn đúng hình món ăn nhé!</span>
          </div>

          {/* Interactive Speaker Box */}
          <div
            className={`listen-prompt-box ${isAudioPlaying ? 'playing' : ''}`}
            onClick={() => playPromptAudio()}
          >
            <span className="listen-icon">{isAudioPlaying ? '🔊' : '🔈'}</span>
            <div className="listen-prompt-text">
              {isAudioPlaying
                ? 'Đang nghe âm thanh...'
                : hasPlayed
                  ? 'Bấm để nghe lại '
                  : 'Bấm để nghe câu tiếng Anh'}
            </div>
          </div>

          {/* Food Options Image Grid */}
          <div className="food-options-grid four-cols">
            {options.map((food) => {
              const isSelected = selectedId === food.id;
              const isTarget = food.id === targetItem?.foodId;
              const isCorrect = isSelected && isTarget;

              return (
                <button
                  key={food.id}
                  type="button"
                  className={`food-option-card ${isSelected ? (isCorrect ? 'correct' : 'wrong') : ''}`}
                  onClick={() => handleSelectListeningFood(food)}
                  disabled={loading || submitting || !!selectedId || introVisible}
                >
                  <span className="food-option-emoji">{food.image || '🍗'}</span>
                  <span className="food-option-name">{food.displayName || food.name}</span>
                </button>
              );
            })}
          </div>

          <div className="game-mascot-row">
            <Mascot
              mood="happy"
              message={
                isAudioPlaying
                  ? 'Lắng nghe thật kỹ nhé! '
                  : 'Chọn hình món ăn đúng với âm thanh vừa nghe nào!'
              }
            />
          </div>
        </>
      )}

      {/* ====================================================
          CHALLENGE 3: SPEAKING & PRONUNCIATION (Nhìn hình -> Nói)
         ==================================================== */}
      {challengeType === 'SPEAKING' && (
        <>
          <div className="game-instruction">
            <span className="instruction-emoji">🎙️</span>
            <span>Nhìn hình, bấm Micro và đọc to từ tiếng Anh!</span>
          </div>

          {/* Target Food Picture + English Word Hint */}
          <div className="speaking-hero-card">
            <span className="speaking-hero-emoji">{targetFood.image || '🍗'}</span>
            <div className="speaking-hero-text-row">
              <span className="speaking-word-title">{targetFood.name}</span>
              <button
                type="button"
                className="btn-audio-hint"
                onClick={() => playPromptAudio(targetFood.name)}
                title="Nghe phát âm mẫu"
              >
                🔊
              </button>
            </div>
            <span className="speaking-word-vi">{targetFood.displayName}</span>
          </div>

          {/* Interactive Mic Area */}
          <div className="speaking-mic-container">
            <button
              type="button"
              className={`mic-btn-huge ${isListeningMic ? 'listening' : ''} ${submitting ? 'disabled' : ''}`}
              onClick={handleStartMic}
              disabled={submitting || isListeningMic || introVisible}
            >
              <span className="mic-icon-large">{isListeningMic ? '🎙️' : '🎤'}</span>
              <span className="mic-label-main">
                {isListeningMic ? 'ĐANG LẮNG NGHE... NÓI NGAY!' : 'BẤM ĐỂ NÓI'}
              </span>
              {isListeningMic && <div className="mic-pulse-ring"></div>}
            </button>

            {transcript && (
              <div className="speech-transcript-box">
                <span className="transcript-label">Bé vừa nói:</span>
                <span className="transcript-quote">“{transcript}”</span>
              </div>
            )}
          </div>

          <div className="game-mascot-row">
            <Mascot
              mood={isListeningMic ? 'excited' : 'chef'}
              message={
                isListeningMic
                  ? 'Hãy đọc to từ tiếng Anh rõ ràng nhé! 🎙️'
                  : transcript
                    ? 'Đang chấm điểm phát âm...'
                    : `Hãy bấm micro và đọc to "${targetFood.name}" nào!`
              }
            />
          </div>
        </>
      )}

      {/* ====================================================
          COUNTDOWN OVERLAY: SẴN SÀNG -> 3 -> 2 -> 1 -> CHƠI ĐI!
         ==================================================== */}
      {introVisible && (
        <div className="level1-intro-overlay">
          <div className={`intro-burst ${introStep === 'GO' ? 'is-go' : ''}`} key={introStep}>
            <span className="intro-burst-main">
              {INTRO_SEQUENCE.find((b) => b.step === introStep)?.text}
            </span>
            <span className="intro-burst-sub">
              {INTRO_SEQUENCE.find((b) => b.step === introStep)?.sub}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
