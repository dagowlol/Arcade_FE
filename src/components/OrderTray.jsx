import React from 'react';
import { sounds } from '../services/soundEffects';

export default function OrderTray({ items = [], onRemoveItem, onClear }) {
  const activeItems = items.filter(it => it.quantity > 0);

  const handleClear = () => {
    sounds.playPop();
    if (onClear) onClear();
  };

  const handleRemove = (foodId) => {
    sounds.playPop();
    if (onRemoveItem) onRemoveItem(foodId);
  };

  return (
    <div className="order-tray-container">
      <div className="tray-header">
        <span className="tray-title">🛒 YOUR ORDER TRAY</span>
        {activeItems.length > 0 && (
          <button type="button" className="btn-clear-tray" onClick={handleClear}>
            Clear All ↺
          </button>
        )}
      </div>

      <div className="tray-body">
        {activeItems.length === 0 ? (
          <div className="tray-empty">
            <span className="empty-icon">🍽️</span>
            <span>Your tray is empty! Tap food items & quantities above.</span>
          </div>
        ) : (
          <div className="tray-items-grid">
            {activeItems.map((item) => (
              <div key={item.foodId} className="tray-item-chip">
                <span className="tray-item-emoji">{item.image || '🍔'}</span>
                <span className="tray-item-name">{item.displayName || item.foodName}</span>
                <span className="tray-item-qty">×{item.quantity}</span>
                <button
                  type="button"
                  className="btn-remove-chip"
                  onClick={() => handleRemove(item.foodId)}
                  title="Remove from tray"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
