import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { SpeechService } from '../services/speechService';
import { sounds } from '../services/soundEffects';
import man1 from '../assets/people/man1.png';
import man2 from '../assets/people/man2.png';
import woman1 from '../assets/people/woman1.png';

/**
 * Level 3 — Nhớ & Gọi món (Remember & Order)
 * Một trang duy nhất: nhân vật xuất hiện và nói câu yêu cầu -> menu với các tab
 * danh mục bên trái -> giỏ hàng cố định bên phải -> nút ORDER xác nhận.
 * 4 thử thách tăng dần Dễ -> Khó, không dùng micro:
 *   1. RẤT DỄ      -> 1 món, hiện chữ đầy đủ
 *   2. DỄ          -> 2 món / 2 danh mục, hiện chữ đầy đủ
 *   3. TRÍ NHỚ DỄ  -> 2 món, chữ tự động ẩn sau khi phát xong
 *   4. TRÍ NHỚ KHÓ -> 3 món + số lượng, chữ tự động ẩn
 */
const TIER_CONFIG = [
  {
    badge: 'THỬ THÁCH 1',
    name: 'RẤT DỄ',
    icon: '🌱',
    tip: 'Khách gọi 1 món. Tìm món đó trên menu và chọn nhé!',
  },
  {
    badge: 'THỬ THÁCH 2',
    name: 'DỄ',
    icon: '🍔',
    tip: 'Khách gọi 2 món ở 2 danh mục. Chọn đúng cả hai nhé!',
  },
  {
    badge: 'THỬ THÁCH 3',
    name: 'TRÍ NHỚ DỄ',
    icon: '🧠',
    tip: 'Nghe kỹ và ghi nhớ 2 món. Chữ sẽ ẩn khi hết tiếng nói!',
  },
  {
    badge: 'THỬ THÁCH 4',
    name: 'TRÍ NHỚ KHÓ',
    icon: '⭐',
    tip: 'Nghe thật kỹ! Nhớ đủ 3 món và cả số lượng nữa nhé!',
  },
];

const CUSTOMERS = [man1, woman1, man2, man1];
const CUSTOMER_NAMES = ['Bạn Tom', 'Bạn Anna', 'Chú David', 'Bạn Tom'];

const ALL_CATEGORY = '__all__';

const CATEGORY_META = {
  [ALL_CATEGORY]: { label: 'Tất cả', icon: '🍽️' },
  'Main Dish': { label: 'Món Chính', icon: '🍚' },
  'Fast Food': { label: 'Món Nhanh', icon: '🍔' },
  Snack: { label: 'Ăn Vặt', icon: '🍟' },
  Dessert: { label: 'Tráng Miệng', icon: '🍦' },
  'Nước uống': { label: 'Đồ Uống', icon: '🥤' },
};

const TAB_ORDER = ['Main Dish', 'Fast Food', 'Snack', 'Dessert', 'Nước uống'];

const INTRO_SEQUENCE = [
  { step: 'READY', text: 'SẴN SÀNG!', sub: 'Chuẩn bị vào trò chơi', sound: 'pop', duration: 800 },
  { step: '3', text: '3', sub: 'Chuẩn bị vào trò chơi', sound: 'pop', duration: 550 },
  { step: '2', text: '2', sub: 'Chuẩn bị vào trò chơi', sound: 'pop', duration: 550 },
  { step: '1', text: '1', sub: 'Chuẩn bị vào trò chơi', sound: 'pop', duration: 550 },
  { step: 'GO', text: 'CHƠI ĐI!', sub: 'Bé làm được nào!', sound: 'fanfare', duration: 800 },
];

export default function Level3Memory({ challenge, foods = [], onSubmit, loading }) {
  const [selectedFoods, setSelectedFoods] = useState([]); // { foodId, displayName, image, quantity, price }
  const [activeCategory, setActiveCategory] = useState('');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [introVisible, setIntroVisible] = useState(true);
  const [introStep, setIntroStep] = useState(INTRO_SEQUENCE[0].step);
  const audioLockRef = useRef(false);

  const sequenceIndex = challenge?.sequenceIndex ?? 0;
  const tier = TIER_CONFIG[sequenceIndex] || TIER_CONFIG[0];
  const isMemory = challenge?.memory === true;
  const promptText = challenge?.promptAudioText || challenge?.promptText || '';
  const customerImage = CUSTOMERS[sequenceIndex % CUSTOMERS.length];
  const customerName = CUSTOMER_NAMES[sequenceIndex % CUSTOMER_NAMES.length];

  const availableFoods = challenge?.options?.length ? challenge.options : foods;

  // Build stable category tabs from the menu options, with "All" first
  const categories = [ALL_CATEGORY];
  const seen = new Set();
  availableFoods.forEach((item) => {
    const cat = item.category || 'Other';
    if (!seen.has(cat)) {
      seen.add(cat);
      categories.push(cat);
    }
  });
  categories.sort((a, b) => {
    if (a === ALL_CATEGORY) return -1;
    if (b === ALL_CATEGORY) return 1;
    const ia = TAB_ORDER.indexOf(a);
    const ib = TAB_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  const currentFoods =
    activeCategory === ALL_CATEGORY
      ? availableFoods
      : availableFoods.filter((item) => (item.category || 'Other') === activeCategory);

  const totalCount = selectedFoods.reduce((sum, f) => sum + f.quantity, 0);
  const totalPrice = selectedFoods.reduce((sum, f) => sum + f.quantity * (f.price || 0), 0);
  const isBusy = loading || submitting;

  const playPrompt = () => {
    if (!promptText || audioLockRef.current) return;
    audioLockRef.current = true;
    setIsAudioPlaying(true);
    // Only reveal the hidden text on the first playback. Once hidden, replay
    // speaks the order again without showing the sentence.
    const shouldReveal = !isMemory || textVisible || !hasPlayed;
    if (shouldReveal) {
      setTextVisible(true);
    }
    SpeechService.speak(
      promptText,
      () => setIsAudioPlaying(true),
      () => {
        audioLockRef.current = false;
        setIsAudioPlaying(false);
        setHasPlayed(true);
        if (isMemory) {
          setTextVisible(false);
        }
      }
    );
  };

  // Reset everything whenever a new challenge arrives
  useEffect(() => {
    audioLockRef.current = false;
    SpeechService.stopSpeaking();
    setSelectedFoods([]);
    setHasPlayed(false);
    setSubmitting(false);
    setSubmitted(false);
    setTextVisible(false);

    setActiveCategory(ALL_CATEGORY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge?.challengeId]);

  // Exciting "SẴN SÀNG -> 3 -> 2 -> 1 -> CHƠI ĐI!" countdown on entering Level 3
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
            // SpeechService.speak("Let's go!");
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

  // Auto-play the order prompt once the countdown is over, or when a new
  // challenge arrives.
  useEffect(() => {
    if (introVisible || !promptText) return;
    const timer = setTimeout(() => playPrompt(), 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge?.challengeId, introVisible]);

  const handleAddFood = (item) => {
    if (isBusy || submitted) return;
    sounds.playPop();
    const id = item.foodId || item.id;
    setSelectedFoods((prev) => {
      const existing = prev.find((f) => f.foodId === id);
      if (existing) {
        return prev.map((f) => (f.foodId === id ? { ...f, quantity: f.quantity + 1 } : f));
      }
      return [
        ...prev,
        {
          foodId: id,
          displayName: item.displayName || item.englishName || item.name,
          image: item.image || item.imageUrl || '🍔',
          price: item.price || 0,
          quantity: 1,
        },
      ];
    });
  };

  const handleRemoveFood = (foodId) => {
    if (isBusy || submitted) return;
    sounds.playPop();
    setSelectedFoods((prev) => {
      const existing = prev.find((f) => f.foodId === foodId);
      if (!existing) return prev;
      if (existing.quantity > 1) {
        return prev.map((f) => (f.foodId === foodId ? { ...f, quantity: f.quantity - 1 } : f));
      }
      return prev.filter((f) => f.foodId !== foodId);
    });
  };

  const handleOrder = async () => {
    if (selectedFoods.length === 0 || isBusy || submitted) return;
    sounds.playPop();
    setSubmitting(true);

    const itemsPayload = selectedFoods.map((f) => ({ foodId: f.foodId, quantity: f.quantity }));

    try {
      const result = await onSubmit(itemsPayload, '');
      if (result?.correct) {
        setSubmitted(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const showBubbleText = !isMemory || textVisible;

  return (
    <div className="game-level-container level-3-container l3-order-screen">
      {/* Top bar: tier badge + instruction tip */}
      <div className="l3-top-bar">
        <div className={`l3-tier-badge l3-tier-${sequenceIndex + 1}`}>
          <span>{tier.icon}</span>
          <span>
            {tier.badge} · {tier.name}
          </span>
        </div>
        <div className="l3-hint-bar">{tier.tip}</div>
      </div>

      {/* Main split: LEFT = character + menu | RIGHT = cart + order */}
      <div className="l3-main">
        {/* ---- LEFT ---- */}
        <div className="l3-left">
          {/* Customer appears and speaks */}
          <div className="l3-customer-area">
            <div className="l3-customer-avatar">
              <img src={customerImage} alt={customerName} />
              <span className="l3-customer-name">{customerName}</span>
            </div>

            <div
              className={`l3-speech-bubble ${isMemory ? 'is-memory' : ''} ${isAudioPlaying ? 'playing' : ''}`}
              onClick={playPrompt}
            >
              {isMemory && (
                <div className="l3-replay-row">
                  <button
                    type="button"
                    className="l3-replay-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      playPrompt();
                    }}
                    disabled={isAudioPlaying}
                    title="Nghe lại câu yêu cầu (không hiện chữ)"
                  >
                    {isAudioPlaying ? '🔊 Đang đọc...' : '🔈 Nghe lại'}
                  </button>
                </div>
              )}
              {showBubbleText ? (
                <span className="l3-bubble-text">{promptText}</span>
              ) : (
                <span className="l3-bubble-text is-hidden">🔒 Câu yêu cầu đã ẩn... Hãy nhớ thật kỹ!</span>
              )}
              <div className="l3-bubble-pointer"></div>
            </div>
          </div>

          {/* Menu with category tabs */}
          <div className="l3-menu-area">
            <div className="l3-tabs">
              {categories.map((cat) => {
                const meta = CATEGORY_META[cat] || { label: cat, icon: '🍽️' };
                return (
                  <button
                    key={cat}
                    type="button"
                    className={`l3-tab ${activeCategory === cat ? 'active' : ''}`}
                    onClick={() => {
                      sounds.playPop();
                      setActiveCategory(cat);
                    }}
                  >
                    <span>{meta.icon}</span>
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="l3-menu-scroll">
              <div className="food-grid l3-food-grid">
                {currentFoods.map((item) => {
                  const id = item.foodId || item.id;
                  const selected = selectedFoods.find((f) => f.foodId === id);
                  const count = selected ? selected.quantity : 0;
                  const name = item.displayName || item.englishName || item.name;
                  const image = item.image || item.imageUrl || '🍔';

                  return (
                    <div
                      key={id}
                      className={`food-select-card ${count > 0 ? 'is-selected' : ''}`}
                      onClick={() => handleAddFood(item)}
                    >
                      <div className="food-image-wrapper">
                        <span className="food-emoji">{image}</span>
                      </div>
                      <div className="food-card-info">
                        <span className="food-en-name">{name}</span>
                        {item.price ? <span className="food-price">{item.price.toLocaleString('vi-VN')}đ</span> : null}
                      </div>

                      {count > 0 && (
                        <div className="food-counter-overlay" onClick={(e) => e.stopPropagation()}>
                          <button type="button" className="btn-count-minus" onClick={() => handleRemoveFood(id)}>
                            −
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
            </div>
          </div>
        </div>

        {/* ---- RIGHT: cart + order ---- */}
        <div className="l3-cart-column">
          <div className="l3-cart-head">🛒 Giỏ hàng</div>

          <div className="l3-cart-items">
            {selectedFoods.length === 0 ? (
              <div className="l3-cart-empty">Bấm vào món trong menu để thêm vào giỏ nhé!</div>
            ) : (
              selectedFoods.map((f) => (
                <div key={f.foodId} className="l3-cart-item">
                  <span className="l3-cart-item-emoji">{f.image}</span>
                  <div className="l3-cart-item-info">
                    <span className="l3-cart-item-name">{f.displayName}</span>
                    <div className="l3-cart-item-ctrl">
                      <button
                        type="button"
                        className="l3-qty-btn"
                        onClick={() => handleRemoveFood(f.foodId)}
                        disabled={isBusy || submitted}
                      >
                        −
                      </button>
                      <span className="l3-qty-num">{f.quantity}</span>
                      <button
                        type="button"
                        className="l3-qty-btn"
                        onClick={() => {
                          const food = availableFoods.find((it) => (it.foodId || it.id) === f.foodId);
                          if (food) handleAddFood(food);
                        }}
                        disabled={isBusy || submitted}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <span className="l3-cart-item-price">{(f.price * f.quantity).toLocaleString('vi-VN')}đ</span>
                </div>
              ))
            )}
          </div>

          <div className="l3-cart-footer">
            <div className="l3-cart-total-row">
              <span className="l3-cart-total-label">
                Tổng ({totalCount}): <strong>{totalPrice.toLocaleString('vi-VN')}đ</strong>
              </span>
            </div>
            <button
              type="button"
              className="btn-arcade-huge btn-order"
              disabled={selectedFoods.length === 0 || isBusy || submitted}
              onClick={handleOrder}
            >
              <span>{submitting ? 'ĐANG GỬI...' : 'ORDER '}</span>
              {/* {totalCount > 0 && !submitting && <span className="l3-order-count">{totalCount}</span>} */}
            </button>
          </div>
        </div>
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