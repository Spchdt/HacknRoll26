import type {
  StartGameResponse,
  CommandResponse,
  SetNameResponse,
  UserStats,
  LeaderboardData,
  ArchivePuzzle,
  GameCommand,
} from '../types';

// ============================================
// API Provider Interface (Dependency Injection)
// ============================================

export interface ApiProvider {
  startGame(puzzleId: string): Promise<StartGameResponse>;
  sendCommand(gameId: string, command: GameCommand): Promise<CommandResponse>;
  setUsername(username: string): Promise<SetNameResponse>;
  getStats(): Promise<UserStats>;
  getLeaderboard(): Promise<LeaderboardData>;
  getArchivePuzzles(): Promise<ArchivePuzzle[]>;
}

// ============================================
// Real API Implementation
// ============================================

const API_BASE = '/api';

export const realApi: ApiProvider = {
  async startGame(puzzleId: string): Promise<StartGameResponse> {
    const response = await fetch(`${API_BASE}/game/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ puzzleId }),
    });
    if (!response.ok) {
      throw new Error(`Failed to start game: ${response.statusText}`);
    }
    return response.json();
  },

  async sendCommand(gameId: string, command: GameCommand): Promise<CommandResponse> {
    const response = await fetch(`${API_BASE}/game/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, command }),
    });
    if (!response.ok) {
      throw new Error(`Failed to send command: ${response.statusText}`);
    }
    return response.json();
  },

  async setUsername(username: string): Promise<SetNameResponse> {
    const response = await fetch(`${API_BASE}/user/set-name`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    if (!response.ok) {
      throw new Error(`Failed to set username: ${response.statusText}`);
    }
    return response.json();
  },

  async getStats(): Promise<UserStats> {
    const response = await fetch(`${API_BASE}/stats`, { method: 'GET' });
    if (!response.ok) {
      throw new Error(`Failed to fetch stats: ${response.statusText}`);
    }
    return response.json();
  },

  async getLeaderboard(): Promise<LeaderboardData> {
    const response = await fetch(`${API_BASE}/leaderboard`, { method: 'GET' });
    if (!response.ok) {
      throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
    }
    return response.json();
  },

  async getArchivePuzzles(): Promise<ArchivePuzzle[]> {
    const response = await fetch(`${API_BASE}/archive`, { method: 'GET' });
    if (!response.ok) {
      throw new Error(`Failed to fetch archive: ${response.statusText}`);
    }
    return response.json();
  },
};

// ============================================
// API Provider Singleton with DI
// ============================================

let currentProvider: ApiProvider = realApi;

export function setApiProvider(provider: ApiProvider): void {
  currentProvider = provider;
}

export function getApiProvider(): ApiProvider {
  return currentProvider;
}

// ============================================
// Exported API Functions (use current provider)
// ============================================

export function startGame(puzzleId: string): Promise<StartGameResponse> {
  return currentProvider.startGame(puzzleId);
}

export function sendCommand(gameId: string, command: GameCommand): Promise<CommandResponse> {
  return currentProvider.sendCommand(gameId, command);
}

export function setUsername(username: string): Promise<SetNameResponse> {
  return currentProvider.setUsername(username);
}

export function getStats(): Promise<UserStats> {
  return currentProvider.getStats();
}

export function getLeaderboard(): Promise<LeaderboardData> {
  return currentProvider.getLeaderboard();
}

export function getArchivePuzzles(): Promise<ArchivePuzzle[]> {
  return currentProvider.getArchivePuzzles();
}
