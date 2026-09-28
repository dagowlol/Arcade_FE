import React from 'react';
import { sounds } from '../services/soundEffects';

export default function FoodCard({
  food,
  selected = false,
  quantity = 0,
  showQuantity = false,
  disabled = false,
  onClick,
  onQuantityChange,
}) {
  const handleClick = () => {
    if (disabled) return;
    sounds.playPop();
    if (onClick) onClick(food);
  };

  const handleDecrease = (e) => {
    e.stopPropagation();
    if (disabled) return;
    sounds.playPop();
    if (onQuantityChange) {
      onQuantityChange(food, Math.max(0, quantity - 1));
    }
  };

  const handleIncrease = (e) => {
    e.stopPropagation();
    if (disabled) return;
    sounds.playPop();
    if (onQuantityChange) {
      onQuantityChange(food, Math.min(3, quantity + 1));
    }
  };

  const isSelected = selected || quantity > 0;

  return (
    <div
      className={`food-card ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      <div className="food-icon-wrap">
        <span className="food-icon">{food.image || '🍔'}</span>
      </div>
      <div className="food-name">{food.displayName || food.name}</div>

      {showQuantity && (
        <div className="quantity-controls" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="qty-btn minus"
            onClick={handleDecrease}
            disabled={disabled || quantity <= 0}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className={`qty-number ${quantity > 0 ? 'active' : ''}`}>{quantity}</span>
          <button
            type="button"
            className="qty-btn plus"
            onClick={handleIncrease}
            disabled={disabled || quantity >= 3}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      )}

      {isSelected && !showQuantity && (
        <div className="card-check-badge">✓</div>
      )}
    </div>
  );
}
