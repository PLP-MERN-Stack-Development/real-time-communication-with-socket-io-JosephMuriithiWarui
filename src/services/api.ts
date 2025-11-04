const API_URL = 'http://localhost:3001/api';

export const api = {
  async register(username: string, email: string, password: string) {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    return response.json();
  },

  async login(email: string, password: string) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },

  async getMe(token: string) {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.json();
  },

  async getUsers(token: string) {
    const response = await fetch(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.json();
  },

  async getRoomMessages(token: string, room: string, page = 1) {
    const response = await fetch(`${API_URL}/messages/room/${room}?page=${page}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.json();
  },

  async getPrivateMessages(token: string, userId: string, page = 1) {
    const response = await fetch(`${API_URL}/messages/private/${userId}?page=${page}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.json();
  },

  async searchMessages(token: string, query: string, room: string) {
    const response = await fetch(
      `${API_URL}/messages/search?query=${encodeURIComponent(query)}&room=${room}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.json();
  },

  async getUnreadCount(token: string, userId: string) {
    const response = await fetch(`${API_URL}/users/${userId}/unread`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.json();
  }
};
