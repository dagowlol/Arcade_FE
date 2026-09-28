import React, { useState, useEffect } from 'react';
import HeartDisplay from '../components/HeartDisplay';
import ChallengeProgress from '../components/ChallengeProgress';
import FoodCard from '../components/FoodCard';
import ListenButton from '../components/ListenButton';
import MicButton from '../components/MicButton';
import OrderTray from '../components/OrderTray';
import FeedbackModal from '../components/FeedbackModal';
import { foodChallengeApi } from '../services/foodChallengeApi';
import { sounds } from '../services/soundEffects';

export default function ChallengeGame({ session, onExit, onFinishGame, onRestartSession }) {
  const [currentSession, setCurrentSession] = useState(session);
  const [allFoods, setAllFoods] = useState([]);
  const [selectedFoodId, setSelectedFoodId] = useState(null); // For EASY mode
  const [trayItems, setTrayItems] = useState({}); // For MEDIUM & HARD mode: { [foodId]: { foodId, foodName, displayName, image, quantity } }
  const [isAudioPlayed, setIsAudioPlayed] = useState(false);
  const [feedback, setFeedback] = useState({
    visible: false,
    type: 'SUCCESS',
    message: '',
    expectedSpeech: '',
    spokenText: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentChallenge = currentSession?.currentChallenge || currentSession?.challenges?.[currentSession?.currentChallengeIndex];
  const level = currentSession?.level || 'EASY';
  const isEasy = level === 'EASY';
  const isHard = level === 'HARD';

  // Load all foods for fixed menu
  useEffect(() => {
    async function fetchFoods() {
      try {
        const foods = await foodChallengeApi.getFoods();
        setAllFoods(foods);
      } catch (e) {
        console.error('Error fetching foods:', e);
      }
    }
    fetchFoods();
  }, []);

  // Reset local state when challenge changes
  useEffect(() => {
    setSelectedFoodId(null);
    setTrayItems({});
    setIsAudioPlayed(false);
    setIsSubmitting(false);
  }, [currentChallenge?.challengeId]);

  // Handle single food selection (EASY Mode)
  const handleFoodClickEasy = (food) => {
    setSelectedFoodId(food.id);
  };

  // Handle quantity adjustments (MEDIUM & HARD Modes)
  const handleQuantityChange = (food, newQuantity) => {
    setTrayItems((prev) => {
      const updated = { ...prev };
      if (newQuantity <= 0) {
        delete updated[food.id];
      } else {
        updated[food.id] = {
          foodId: food.id,
          foodName: food.name,
          displayName: food.displayName,
          image: food.image,
          quantity: newQuantity,
        };
      }
      return updated;
    });
  };

  const handleRemoveTrayItem = (foodId) => {
    setTrayItems((prev) => {
      const updated = { ...prev };
      delete updated[foodId];
      return updated;
    });
  };

  const handleClearTray = () => {
    setTrayItems({});
  };

  // Audio Playback End handler (important for HARD mode disappearing hint)
  const handleAudioPlaybackEnd = () => {
    setIsAudioPlayed(true);
  };

  // Build items array to send to backend
  const getSelectedItemsForSubmit = () => {
    if (isEasy) {
      if (!selectedFoodId) return [];
      const f = allFoods.find((x) => x.id === selectedFoodId);
      return [{ foodId: selectedFoodId, foodName: f?.name, quantity: 1 }];
    } else {
      return Object.values(trayItems).map((it) => ({
        foodId: it.foodId,
        foodName: it.foodName,
        displayName: it.displayName,
        quantity: it.quantity,
      }));
    }
  };

  // Handle child spoken speech result
  const handleSpeechResult = async (spokenText) => {
    if (isSubmitting || !currentChallenge) return;
    setIsSubmitting(true);

    const selectedItems = getSelectedItemsForSubmit();

    try {
      const result = await foodChallengeApi.submitAnswer(
        currentSession.sessionId,
        currentChallenge.challengeId,
        selectedItems,
        spokenText
      );

      // Sound and visual feedback
      if (result.correct) {
        sounds.playSuccess();
      } else {
        sounds.playRetry();
      }

      setFeedback({
        visible: true,
        type: result.feedbackType || (result.correct ? 'SUCCESS' : 'RETRY_FOOD'),
        message: result.message,
        expectedSpeech: result.expectedSpeech || currentChallenge.speechTarget,
        spokenText: spokenText,
      });

      // Update session state locally
      setCurrentSession((prev) => ({
        ...prev,
        hearts: result.hearts,
        status: result.sessionStatus,
        currentChallengeIndex: result.progress,
        currentChallenge: result.nextChallenge || prev.currentChallenge,
      }));
    } catch (err) {
      console.error('Error submitting answer:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseFeedback = () => {
    setFeedback((prev) => ({ ...prev, visible: false }));

    // If game was completed, trigger reward page
    if (currentSession.status === 'COMPLETED') {
      if (onFinishGame) onFinishGame(currentSession.sessionId);
    }
  };

  const handleRestart = () => {
    setFeedback((prev) => ({ ...prev, visible: false }));
    if (onRestartSession) onRestartSession(level);
  };

  // In EASY mode, options might be limited to 4 cards; in MEDIUM & HARD, full 9-menu grid
  const menuFoodsToDisplay = isEasy && currentChallenge?.options?.length
    ? currentChallenge.options
    : allFoods;

  const audioPromptText = currentChallenge?.promptAudioText || currentChallenge?.speechTarget || '';

  return (
    <div className="page-container game-page">
      {/* Game Header: Hearts, Title & Progress */}
      <header className="game-top-bar">
        <button type="button" className="btn-exit-game" onClick={onExit} title="Exit to Menu">
          🚪 Exit
        </button>
        <HeartDisplay hearts={currentSession.hearts} maxHearts={currentSession.maxHearts || 3} />
        <ChallengeProgress
          current={currentSession.currentChallengeIndex || 0}
          total={currentSession.totalChallenges || 4}
        />
      </header>

      {/* Main Game Arena */}
      <main className="game-arena">
        {/* Step 1: Listen Section */}
        <section className="arena-section listen-section">
          <div className="section-label-chip">Step 1: Listen to the order 👂</div>
          <ListenButton
            text={audioPromptText}
            onPlaybackEnd={handleAudioPlaybackEnd}
            disabled={isSubmitting}
          />
          {isHard && isAudioPlayed && (
            <div className="hard-mode-notice">
              <span className="notice-icon">🧠</span>
              <span>Memory Mode: Order is hidden! Pick from memory & speak.</span>
            </div>
          )}
        </section>

        {/* Step 2: Fixed Food Menu */}
        <section className="arena-section menu-section">
          <div className="menu-header-bar">
            <span className="menu-header-title">🍽️ FOOD COUNTER MENU</span>
            <span className="menu-header-hint">
              {isEasy
                ? '👉 Tap 1 food card you heard'
                : '👉 Tap + / − to choose items and quantities'}
            </span>
          </div>

          <div className={`game-foods-grid ${isEasy ? 'easy-grid' : 'standard-grid'}`}>
            {menuFoodsToDisplay.map((food) => {
              const selectedInEasy = isEasy && selectedFoodId === food.id;
              const qtyInTray = trayItems[food.id]?.quantity || 0;

              return (
                <FoodCard
                  key={food.id}
                  food={food}
                  selected={selectedInEasy}
                  quantity={qtyInTray}
                  showQuantity={!isEasy}
                  disabled={isSubmitting}
                  onClick={isEasy ? handleFoodClickEasy : undefined}
                  onQuantityChange={!isEasy ? handleQuantityChange : undefined}
                />
              );
            })}
          </div>
        </section>

        {/* Step 3: Order Tray (MEDIUM & HARD) */}
        {!isEasy && (
          <section className="arena-section tray-section">
            <OrderTray
              items={Object.values(trayItems)}
              onRemoveItem={handleRemoveTrayItem}
              onClear={handleClearTray}
            />
          </section>
        )}

        {/* Step 4: Microphone Section */}
        <section className="arena-section speech-section">
          <div className="section-label-chip">
            {isEasy
              ? 'Step 2: Say the food name! 🎙️'
              : 'Step 3: Say your full order! 🎙️'}
          </div>
          <MicButton
            onSpeechResult={handleSpeechResult}
            disabled={isSubmitting}
            placeholder={
              isEasy
                ? 'Tap mic and say the food name!'
                : 'Tap mic and say your order, e.g. "Two burgers, please."'
            }
          />
        </section>
      </main>

      {/* Encouraging Feedback Modal */}
      <FeedbackModal
        visible={feedback.visible}
        type={feedback.type}
        message={feedback.message}
        expectedSpeech={feedback.expectedSpeech}
        spokenText={feedback.spokenText}
        onClose={handleCloseFeedback}
        onRestart={handleRestart}
      />
    </div>
  );
}
