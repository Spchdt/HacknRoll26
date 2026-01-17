import type {
  Command,
  StartGameResponse,
  CommandResponse,
  StatsResponse,
  LeaderboardResponse,
  UserProfileResponse,
  BaseResponse,
  ArchiveResponse,
} from './types';

// API base URL from documentation
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://gitty-api.phanuphats.com';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    console.log(`🔌 API Client initialized: ${this.baseUrl}`);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const method = options.method || 'GET';
    
    console.log(`[${method}] Connecting to ${endpoint}...`);
    if (options.body) {
      console.log('Request body:', JSON.parse(options.body as string));
    }
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`[${method}] ${endpoint} failed: ${response.status} ${data.error || 'Unknown error'}`);
        console.log('Response data:', data);
        throw new Error(data.error || 'Request failed');
      }

      console.log(`[${method}] ${endpoint} success`);
      console.log('Response data:', data);
      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error(`[${method}] ${endpoint} - Network error: Unable to connect to server`);
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  // ============================================
  // Health Check
  // ============================================

  async checkHealth(): Promise<{ status: string; service: string }> {
    console.log('🏥 Checking API health...');
    return this.request('/health');
  }

  // ============================================
  // User Endpoints
  // ============================================

  async getProfile(): Promise<UserProfileResponse> {
    console.log('👤 Fetching user profile...');
    return this.request('/user/profile');
  }

  async setUsername(username: string): Promise<BaseResponse> {
    console.log(`✏️ Setting username to "${username}"...`);
    return this.request('/user/set-name', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  }

  // ============================================
  // Game Endpoints
  // ============================================

  /**
   * Start a new game session
   * @param gameId - Use "daily" for daily challenge or a specific puzzle ID
   */
  async startGame(gameId: string = 'daily'): Promise<StartGameResponse> {
    console.log(`🎮 Starting game session: ${gameId}...`);
    return this.request('/game/start', {
      method: 'POST',
      body: JSON.stringify({ gameId }),
    });
  }

  /**
   * Execute a git command in the active game session
   * @param gameId - The game ID (use "daily" for daily challenge)
   * @param command - The command object (discriminated union)
   */
  async sendCommand(gameId: string, command: Command): Promise<CommandResponse> {
    console.log(`⚡ Executing command: ${command.type}`, command);
    return this.request('/game/command', {
      method: 'POST',
      body: JSON.stringify({ gameId, command }),
    });
  }

  // ============================================
  // Stats & Leaderboard Endpoints
  // ============================================

  async getStats(): Promise<StatsResponse> {
    console.log('📊 Fetching user stats...');
    return this.request('/stats');
  }

  async getLeaderboard(): Promise<LeaderboardResponse> {
    console.log('Fetching leaderboard...');
    return this.request('/leaderboard');
  }

  // ============================================
  // Archive Endpoints
  // ============================================

  async getArchive(): Promise<ArchiveResponse> {
    console.log('Fetching puzzle archive...');
    return this.request('/game/archive');
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export class for testing
export { ApiClient };
