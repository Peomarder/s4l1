//src/components/Logger.js


import { API_BASE } from '../components/Auth';

export const logAction = async (actionId, lockId = null) => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    await fetch(`${API_BASE}/log-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        action_id: actionId,
        lock_id: lockId
      })
    });
  } catch (error) {
    console.error('Error logging action:', error);
  }
};