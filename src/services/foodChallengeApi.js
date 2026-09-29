const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/food-challenge';

export const foodChallengeApi = {
  async getFoods() {
    const res = await fetch(`${API_BASE}/foods`);
    if (!res.ok) throw new Error('Failed to fetch food items');
    return res.json();
  },

  async getLevels() {
    const res = await fetch(`${API_BASE}/levels`);
    if (!res.ok) throw new Error('Failed to fetch levels');
    return res.json();
  },

  async startSession(level = 'EASY') {
    const res = await fetch(`${API_BASE}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level }),
    });
    if (!res.ok) throw new Error('Failed to start session');
    return res.json();
  },

  async submitAnswer(sessionId, challengeId, selectedItems, spokenText, answerText) {
    const res = await fetch(`${API_BASE}/${sessionId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challengeId,
        selectedItems,
        spokenText,
        answerText,
      }),
    });
    if (!res.ok) throw new Error('Failed to submit answer');
    return res.json();
  },

  async getSession(sessionId) {
    const res = await fetch(`${API_BASE}/${sessionId}`);
    if (!res.ok) throw new Error('Failed to get session');
    return res.json();
  },

  async getSessionResult(sessionId) {
    const res = await fetch(`${API_BASE}/${sessionId}/result`);
    if (!res.ok) throw new Error('Failed to get session result');
    return res.json();
  },
};
