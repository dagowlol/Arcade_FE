import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

const DIFFICULTY_LABEL = {
  1: 'Dễ',
  2: 'Trung bình',
  3: 'Khó',
};

const MODE_BADGE = {
  WORD_SCRAMBLE: { icon: '🔀', label: 'Xếp Từ Thành Câu' },
  FILL_BLANK: { icon: '🕳️', label: 'Điền Từ Còn Thiếu' },
  EXTRA_WORD: { icon: '🔍', label: 'Tìm Từ Thừa' },
};

const MODE_HINT = {
  WORD_SCRAMBLE: 'Chạm từ theo thứ tự đúng. Chạm lại vào ô đã xếp để bỏ ra nhé!',
  FILL_BLANK: 'Chọn một từ bên dưới để điền vào chỗ trống.',
  EXTRA_WORD: 'Chạm vào từ KHÔNG thuộc câu để xóa nó đi nào!',
};

/**
 * Level 2 - 3 rotating grammar puzzles, randomised by the backend:
 * 1. WORD_SCRAMBLE - rebuild a shuffled English sentence in the right word order
 * 2. FILL_BLANK    - drop the right key word into the blank
 * 3. EXTRA_WORD    - listen, then tap the intruder word to remove it
 *
 * Difficulty ramps up as the child advances through the session.
 */
export default function Level2Order({ challenge, onSubmit, loading }) {
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [answerState, setAnswerState] = useState(null); // null | 'pending' | 'right' | 'wrong'
  const [introVisible, setIntroVisible] = useState(true);
  const [introStep, setIntroStep] = useState(INTRO_SEQUENCE[0].step);

  // WORD_SCRAMBLE state
  const [placedWords, setPlacedWords] = useState([]); // tokens in the answer slot
  const [poolWords, setPoolWords] = useState([]); // tokens left in the bubble tray

  // FILL_BLANK / EXTRA_WORD state
  const [chosenWord, setChosenWord] = useState(null); // word shown inside the blank
  const [tappedWord, setTappedWord] = useState(null); // intruder the child tapped

  const mode = MODE_BADGE[challenge?.type] ? challenge.type : 'WORD_SCRAMBLE';
  const badge = MODE_BADGE[mode];
  const difficulty = challenge?.difficulty ?? 1;
  const isBusy = loading || submitting;
  const isGraded = answerState === 'right' || answerState === 'wrong';
  const isLocked = isBusy || isGraded || introVisible;

  // FILL_BLANK: split into plain words + exactly one blank slot, punctuation kept outside the slot
  const blankParts = useMemo(() => {
    const words = (challenge?.blankSentence || '').trim().split(/\s+/).filter(Boolean);
    const blankAt = words.findIndex((t) => t.startsWith('_'));
    return {
      words,
      blankAt,
      trailing: blankAt === -1 ? '' : words[blankAt].replace(/^_+/, ''),
    };
  }, [challenge?.blankSentence]);

  const playPrompt = useCallback(() => {
    const line = challenge?.promptAudioText;
    if (!line) return;
    setIsAudioPlaying(true);
    SpeechService.speak(
      line,
      () => setIsAudioPlaying(true),
      () => {
        setIsAudioPlaying(false);
        setHasPlayed(true);
      }
    );
  }, [challenge?.promptAudioText]);

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

  // Reset local puzzle state whenever a new challenge arrives
  useEffect(() => {
    setAnswerState(null);
    setChosenWord(null);
    setTappedWord(null);
    setPlacedWords([]);
    setPoolWords(challenge?.scrambledWords || []);
    setHasPlayed(false);
  }, [challenge]);

  // Auto-play the model sentence once the countdown is over
  useEffect(() => {
    if (introVisible) return;
    const timer = setTimeout(() => playPrompt(), PROMPT_AUTOPLAY_DELAY_MS);
    return () => clearTimeout(timer);
  }, [challenge?.challengeId, introVisible]);

  const submitAnswer = async (answerText) => {
    if (isLocked) return;
    setSubmitting(true);
    setAnswerState('pending');
    const result = await onSubmit([], '', answerText);
    setSubmitting(false);

    if (result?.correct) {
      setAnswerState('right');
      return;
    }

    setAnswerState('wrong');
    // Let the child read the correction, then hand the puzzle back fresh
    setTimeout(() => {
      if (mode === 'WORD_SCRAMBLE') {
        setPlacedWords([]);
        setPoolWords(challenge?.scrambledWords || []);
      }
      setChosenWord(null);
      setTappedWord(null);
      setAnswerState(null);
    }, 1500);
  };

  // ---------------- WORD_SCRAMBLE ----------------
  const placeWord = (word, fromPool) => {
    if (isLocked) return;
    sounds.playPop();

    if (fromPool !== null) {
      setPoolWords((prev) => prev.filter((_, i) => i !== fromPool));
      setPlacedWords((prev) => [...prev, word]);
    } else {
      setPlacedWords((prev) => prev.filter((_, i) => i !== word));
      setPoolWords((prev) => [...prev, word]);
    }
  };

  const submitScramble = () => {
    if (placedWords.length === 0 || isLocked) return;
    submitAnswer(placedWords.join(' '));
  };

  // ---------------- FILL_BLANK ----------------
  const chooseBlankWord = (word) => {
    if (isLocked) return;
    sounds.playPop();
    setChosenWord(word);
    submitAnswer(word);
  };

  // ---------------- EXTRA_WORD ----------------
  const tapSentenceWord = (word) => {
    if (isLocked) return;
    sounds.playPop();
    setTappedWord(word);
    submitAnswer(word);
  };

  const slotClass = ['blank-slot'];
  if (answerState === 'pending') slotClass.push('is-pending');
  if (answerState === 'right') slotClass.push('is-right');
  if (answerState === 'wrong') slotClass.push('is-wrong');

  return (
    <div className="game-level-container level2-grammar">
      <div className="game-instruction">
        <span className="instruction-emoji">{badge.icon}</span>
        <span>{challenge?.instruction || badge.label}</span>
      </div>

      <div className="mode-badge-row">
        <span className="mode-badge">
          {badge.icon} {badge.label}
        </span>
        <span className={`mode-difficulty mode-difficulty-${difficulty}`}>
          {DIFFICULTY_LABEL[difficulty] || 'Dễ'}
        </span>
      </div>

      {/* Model sentence + audio hint */}
      <div
        className={`listen-prompt-box ${isAudioPlaying ? 'playing' : ''}`}
        onClick={() => playPrompt()}
      >
        <span className="listen-icon">{isAudioPlaying ? '🔊' : '🔈'}</span>
        <div className="listen-prompt-text">
          {isAudioPlaying
            ? 'Đang nghe câu mẫu...'
            : hasPlayed
              ? 'Bấm để nghe lại 🔄'
              : 'Bấm để nghe câu mẫu'}
        </div>
      </div>

      {/* ---------------- WORD SCRAMBLE ---------------- */}
      {mode === 'WORD_SCRAMBLE' && (
        <>
          <div className="scramble-answer-slot">
            {placedWords.length === 0 ? (
              <span className="scramble-placeholder">Chạm các từ bên dưới theo thứ tự…</span>
            ) : (
              placedWords.map((text, i) => (
                <button
                  key={`placed-${i}-${text}`}
                  type="button"
                  className="scramble-word is-placed"
                  onClick={() => placeWord(text, null)}
                  disabled={isLocked}
                >
                  {text}
                </button>
              ))
            )}
          </div>

          <div className="scramble-pool">
            {poolWords.map((text, i) => (
              <button
                key={`pool-${i}-${text}`}
                type="button"
                className="scramble-word"
                onClick={() => placeWord(text, i)}
                disabled={isLocked}
              >
                {text}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn-arcade-huge btn-submit-answer"
            onClick={submitScramble}
            disabled={placedWords.length === 0 || isLocked}
          >
            <span>🚀 NỘP CÂU TRẢ LỜI</span>
          </button>
        </>
      )}

      {/* ---------------- FILL IN THE BLANK ---------------- */}
      {mode === 'FILL_BLANK' && (
        <>
          <div className="blank-sentence-box">
            {blankParts.words.map((token, i) =>
              i === blankParts.blankAt ? (
                <React.Fragment key={`blank-${i}`}>
                  <span className={slotClass.join(' ')}>{chosenWord || '?'}</span>
                  {blankParts.trailing && <span className="blank-word">{blankParts.trailing}</span>}
                </React.Fragment>
              ) : (
                <span key={`word-${i}`} className="blank-word">
                  {token}
                </span>
              )
            )}
          </div>

          <div className="blank-options-row">
            {(challenge?.blankOptions || []).map((option, i) => (
              <button
                key={`${option}-${i}`}
                type="button"
                className={`blank-option ${chosenWord === option ? 'is-chosen' : ''}`}
                onClick={() => chooseBlankWord(option)}
                disabled={isLocked}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ---------------- EXTRA WORD ---------------- */}
      {mode === 'EXTRA_WORD' && (
        <div className="extra-word-chain">
          {(challenge?.sentenceWords || []).map((word, i) => {
            const tapped = tappedWord === word;
            const cls = ['extra-word'];
            if (tapped) cls.push('is-removed');
            if (tapped && answerState === 'right') cls.push('is-right');
            if (tapped && answerState === 'wrong') cls.push('is-wrong');
            return (
              <button
                key={`${word}-${i}`}
                type="button"
                className={cls.join(' ')}
                onClick={() => tapSentenceWord(word)}
                disabled={isLocked}
              >
                {word}
              </button>
            );
          })}
        </div>
      )}

      <div className="game-mascot-row">
        <Mascot
          mood={answerState === 'right' ? 'excited' : 'happy'}
          message={
            answerState === 'right'
              ? 'Giỏi lắm! Câu của bạn chính xác rồi! 🎉'
              : submitting
                ? 'Đang kiểm tra câu trả lời...'
                : `${badge.label} — ${MODE_HINT[mode]}`
          }
        />
      </div>

      {/* Countdown overlay: SẴN SÀNG -> 3 -> 2 -> 1 -> CHƠI ĐI! */}
      {introVisible && (
        <div className="intro-overlay">
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
