const BASE_URL = "https://batalha-naval-9gfm.onrender.com";

function getToken() {
  return localStorage.getItem("token");
}

export function setToken(token) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
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
    // Token expirado ou inválido — limpa sessão e redireciona
    if (
      response.status === 401 &&
      endpoint !== "/auth/login" &&
      endpoint !== "/auth/register"
    ) {
      clearToken();
      window.location.href = "/login";
      throw new Error("Sessão expirada. Faça login novamente.");
    }

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
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function login(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function logout() {
  return request("/auth/logout", { method: "POST" });
}

// Player
export function getMe() {
  return request("/player/me");
}

export function getPlayer(playerId) {
  return request(`/player/${playerId}`);
}

export function updateMe(data) {
  return request("/player/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteMe() {
  return request("/player/me", { method: "DELETE" });
}

export function setNation(nation) {
  return request(`/player/me/nation?nation=${nation}`, { method: "POST" });
}

export function setPortrait(portrait) {
  return request(`/player/me/portrait?portrait=${portrait}`, {
    method: "PATCH",
  });
}

// Rooms
export function createRoom(hostName) {
  return request(`/rooms/create?hostName=${encodeURIComponent(hostName)}`, {
    method: "POST",
  });
}

export function joinRoom(roomId) {
  return request(`/rooms/${roomId}/join`, { method: "POST" });
}

export function joinRoomByCode(code) {
  return request(`/rooms/join-by-code?code=${encodeURIComponent(code)}`, {
    method: "POST",
  });
}

export function getRooms() {
  return request("/rooms");
}

export function getRoom(roomId) {
  return request(`/rooms/${roomId}`);
}

export function deleteRoom(roomId) {
  return request(`/rooms/${roomId}`, { method: "DELETE" });
}

// Game
export function getGameState(gameId) {
  return request(`/game/${gameId}/state`);
}

export async function getBoard(gameId, targetId) {
  const raw = await request(`/game/${gameId}/board/${targetId}`);
  // Backend retorna [{value, shipType}, ...] por célula — normalizar
  return parseBoard(raw);
}

/**
 * Parseia o board do backend.
 * Retorna { grid: number[][], shipTypes: Map<"row-col", string> }
 * - grid: matriz 10x10 com valores numéricos (0=água, 1=navio, 2=miss, 3=hit)
 * - shipTypes: mapa de coordenadas para o tipo do navio (ex: "CARRIER", "DESTROYER")
 */
export function parseBoard(raw) {
  const grid = [];
  const shipTypes = new Map();

  for (let r = 0; r < raw.length; r++) {
    const row = [];
    for (let c = 0; c < raw[r].length; c++) {
      const cell = raw[r][c];
      if (typeof cell === "object" && cell !== null) {
        row.push(cell.value);
        if (cell.shipType) {
          shipTypes.set(`${r}-${c}`, cell.shipType);
        }
      } else {
        // Fallback: se o backend ainda retornar número puro (compatibilidade)
        row.push(cell);
      }
    }
    grid.push(row);
  }

  return { grid, shipTypes };
}

// Ranking
export function getRanking(limit = 20, offset = 0) {
  return request(`/ranking?limit=${limit}&offset=${offset}`);
}

export function getMyRanking() {
  return request("/ranking/me");
}

// Match History
export function getMatches() {
  return request("/matches/me");
}
