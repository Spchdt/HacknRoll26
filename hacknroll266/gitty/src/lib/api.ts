import type {
  ApiResponse,
  GameStartResponse,
  GameCommandResponse,
  GameCommand,
  UserStats,
  LeaderboardEntry,
} from './types';
import { getStoredUserId, saveUserId } from './utils';

// API base URL - will be updated when backend is deployed
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  private baseUrl: string;
  private userId: string | null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.userId = getStoredUserId();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(this.userId && { 'X-User-ID': this.userId }),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Request failed',
        };
      }

      // If the response includes a user ID, save it
      if (data.userId && !this.userId) {
        this.userId = data.userId;
        saveUserId(data.userId);
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Game endpoints
  async startGame(puzzleId: string = 'daily'): Promise<ApiResponse<GameStartResponse>> {
    return this.request<GameStartResponse>('/game/start', {
      method: 'POST',
      body: JSON.stringify({ puzzleId }),
    });
  }

  async sendCommand(
    gameId: string,
    command: GameCommand['type'],
    args: string[]
  ): Promise<ApiResponse<GameCommandResponse>> {
    return this.request<GameCommandResponse>('/game/command', {
      method: 'POST',
      body: JSON.stringify({ gameId, command, args }),
    });
  }

  // User endpoints
  async setUsername(username: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>('/user/set-name', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  }

  async getStats(): Promise<ApiResponse<UserStats>> {
    return this.request<UserStats>('/stats', {
      method: 'GET',
    });
  }

  async getLeaderboard(): Promise<ApiResponse<{ entries: LeaderboardEntry[]; userRank?: number }>> {
    return this.request<{ entries: LeaderboardEntry[]; userRank?: number }>('/leaderboard', {
      method: 'GET',
    });
  }

  // Archive endpoints
  async getArchivePuzzles(): Promise<ApiResponse<{ puzzles: { id: string; date: string; difficulty: string }[] }>> {
    return this.request<{ puzzles: { id: string; date: string; difficulty: string }[] }>('/archive', {
      method: 'GET',
    });
  }

  async getPuzzle(puzzleId: string): Promise<ApiResponse<GameStartResponse>> {
    return this.request<GameStartResponse>('/game/start', {
      method: 'POST',
      body: JSON.stringify({ puzzleId }),
    });
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export class for testing
export { ApiClient };
