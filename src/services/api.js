const BASE_URL = 'http://localhost:8080';

function getToken() {
  return localStorage.getItem('token');
}

export function setToken(token) {
  localStorage.setItem('token', token);
}

export function clearToken() {
  localStorage.removeItem('token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || `Erro ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.errors = data?.errors || null;
    throw error;
  }

  return data;
}

// Auth
export function register(name, email, password) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export function login(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// Player
export function getMe() {
  return request('/player/me');
}

export function updateMe(data) {
  return request('/player/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteMe() {
  return request('/player/me', { method: 'DELETE' });
}

export function setNation(nation) {
  return request(`/player/me/nation?nation=${nation}`, { method: 'POST' });
}

export function setPortrait(portrait) {
  return request(`/player/me/portrait?portrait=${portrait}`, { method: 'PATCH' });
}

// Rooms
export function createRoom(hostName) {
  return request(`/rooms/create?hostName=${encodeURIComponent(hostName)}`, { method: 'POST' });
}

export function joinRoom(roomId) {
  return request(`/rooms/${roomId}/join`, { method: 'POST' });
}

export function joinRoomByCode(code) {
  return request(`/rooms/join-by-code?code=${encodeURIComponent(code)}`, { method: 'POST' });
}

export function getRooms() {
  return request('/rooms');
}

export function getRoom(roomId) {
  return request(`/rooms/${roomId}`);
}

export function deleteRoom(roomId) {
  return request(`/rooms/${roomId}`, { method: 'DELETE' });
}

// Game
export function getGameState(gameId) {
  return request(`/game/${gameId}/state`);
}

export function getBoard(gameId, targetId) {
  return request(`/game/${gameId}/board/${targetId}`);
}

// Ranking
export function getRanking(limit = 20, offset = 0) {
  return request(`/ranking?limit=${limit}&offset=${offset}`);
}

export function getMyRanking() {
  return request('/ranking/me');
}

// Match History
export function getMatches() {
  return request('/matches/me');
}
