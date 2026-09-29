import React from 'react';

const LEVELS = [
  {
    id: 'EASY',
    number: 1,
    icon: '🌱',
    title: 'Nghe & Chọn',
    subtitle: 'Cấp độ 1',
    description: 'Nghe câu tiếng Anh → chọn đúng món ăn',
    difficulty: 'Dễ',
    color: '#00C853',
    bgColor: '#E8F5E9',
    borderColor: '#66BB6A',
  },
  {
    id: 'MEDIUM',
    number: 2,
    icon: '🔤',
    title: 'Xếp Từ & Điền Từ',
    subtitle: 'Cấp độ 2',
    description: 'Nghe câu → xếp từ, điền từ, tìm từ thừa',
    difficulty: 'Trung bình',
    color: '#FF9800',
    bgColor: '#FFF3E0',
    borderColor: '#FFA726',
  },
  {
    id: 'HARD',
    number: 3,
    icon: '⭐',
    title: 'Nhớ & Gọi món',
    subtitle: 'Cấp độ 3',
    description: 'Nghe → ghi nhớ → chọn → nói câu gọi món',
    difficulty: 'Khó',
    color: '#E91E63',
    bgColor: '#FCE4EC',
    borderColor: '#EC407A',
  },
];

export default function LevelSelector({ onSelectLevel, loading }) {
  return (
    <div className="screen-layout screen-choose-challenge">
      <div className="kfc-top-logo">KFC</div>
      <h2 className="arcade-screen-title">Chọn thử thách</h2>
      <p className="level-select-hint">Chọn một cấp độ để bắt đầu chơi nhé!</p>

      <div className="level-cards-column">
        {LEVELS.map((level) => (
          <button
            key={level.id}
            type="button"
            className="level-card-btn"
            disabled={loading}
            onClick={() => onSelectLevel(level.id)}
            style={{
              '--level-color': level.color,
              '--level-bg': level.bgColor,
              '--level-border': level.borderColor,
            }}
          >
            <div className="level-card-icon-wrap">
              <span className="level-card-icon">{level.icon}</span>
            </div>

            <div className="level-card-info">
              <div className="level-card-title">{level.title}</div>
              <div className="level-card-subtitle">{level.subtitle} · {level.difficulty}</div>
              <div className="level-card-desc">{level.description}</div>
            </div>

            <div className="level-card-arrow">▶</div>
          </button>
        ))}
      </div>

      {loading && (
        <div className="level-loading-indicator">
          <span className="loading-spinner">⏳</span>
          <span>Đang tạo thử thách...</span>
        </div>
      )}
    </div>
  );
}
