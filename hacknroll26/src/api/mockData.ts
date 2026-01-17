import type {
  StartGameResponse,
  CommandResponse,
  SetNameResponse,
  UserStats,
  LeaderboardData,
  ArchivePuzzle,
  GameCommand,
  GameState,
  GitGraph,
  Puzzle,
  GameResult,
} from '../types';

// ============================================
// Mock Data
// ============================================

const mockPuzzle: Puzzle = {
  id: 'puzzle-2026-01-17',
  date: '2026-01-17',
  difficulty: 3,
  branches: ['main', 'feature-a', 'feature-b', 'hotfix'],
  maxDepth: 5,
  fileTargets: [
    { id: 'file-1', name: 'README.md', branch: 'main', depth: 2, collected: false },
    { id: 'file-2', name: 'index.ts', branch: 'feature-a', depth: 3, collected: false },
    { id: 'file-3', name: 'utils.ts', branch: 'feature-b', depth: 2, collected: false },
    { id: 'file-4', name: 'config.json', branch: 'hotfix', depth: 1, collected: false },
  ],
  constraints: {
    maxCommands: 15,
    maxCheckouts: 5,
    maxConsecutiveCommits: 3,
  },
};

const mockGraph: GitGraph = {
  commits: {
    'commit-0': {
      id: 'commit-0',
      message: 'Initial commit',
      parents: [],
      branch: 'main',
      depth: 0,
      timestamp: Date.now() - 100000,
    },
    'commit-1': {
      id: 'commit-1',
      message: 'Add feature A base',
      parents: ['commit-0'],
      branch: 'feature-a',
      depth: 1,
      timestamp: Date.now() - 90000,
    },
    'commit-2': {
      id: 'commit-2',
      message: 'Add feature B base',
      parents: ['commit-0'],
      branch: 'feature-b',
      depth: 1,
      timestamp: Date.now() - 80000,
    },
  },
  branches: {
    'main': { name: 'main', tipCommitId: 'commit-0' },
    'feature-a': { name: 'feature-a', tipCommitId: 'commit-1' },
    'feature-b': { name: 'feature-b', tipCommitId: 'commit-2' },
    'hotfix': { name: 'hotfix', tipCommitId: 'commit-0' },
  },
  head: { type: 'attached', ref: 'main' },
  rootCommitId: 'commit-0',
};

const mockGameState: GameState = {
  puzzleId: mockPuzzle.id,
  puzzle: mockPuzzle,
  graph: mockGraph,
  collectedFiles: [],
  commandHistory: [],
  commandCount: 0,
  checkoutCount: 0,
  consecutiveCommits: 0,
  status: 'in_progress',
  score: null,
  startedAt: Date.now(),
  completedAt: null,
};

const mockUserStats: UserStats = {
  totalGamesPlayed: 42,
  totalGamesWon: 38,
  totalCommandsUsed: 287,
  bestScore: 100,
  averageScore: 85,
  currentStreak: 7,
  maxStreak: 14,
};

const mockLeaderboard: LeaderboardData = {
  entries: [
    { rank: 1, userId: 'user-1', username: 'GitMaster', score: 2450, gamesPlayed: 30 },
    { rank: 2, userId: 'user-2', username: 'BranchWizard', score: 2380, gamesPlayed: 28 },
    { rank: 3, userId: 'user-3', username: 'MergeKing', score: 2290, gamesPlayed: 31 },
    { rank: 4, userId: 'user-4', username: 'RebaseQueen', score: 2150, gamesPlayed: 27 },
    { rank: 5, userId: 'user-5', username: 'CommitLord', score: 2080, gamesPlayed: 29 },
    { rank: 6, userId: 'user-6', username: 'HeadHunter', score: 1950, gamesPlayed: 25 },
    { rank: 7, userId: 'user-7', username: 'CheckoutChamp', score: 1890, gamesPlayed: 26 },
    { rank: 8, userId: 'user-8', username: 'PushPro', score: 1820, gamesPlayed: 24 },
    { rank: 9, userId: 'user-9', username: 'PullPal', score: 1750, gamesPlayed: 23 },
    { rank: 10, userId: 'user-10', username: 'StashStar', score: 1680, gamesPlayed: 22 },
  ],
  userRank: 15,
  userEntry: { rank: 15, userId: 'current-user', username: 'You', score: 1200, gamesPlayed: 12 },
};

const mockArchive: ArchivePuzzle[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date('2026-01-17');
  date.setDate(date.getDate() - i - 1);
  const dateStr = date.toISOString().split('T')[0];
  const completed = Math.random() > 0.3;
  return {
    id: `puzzle-${dateStr}`,
    date: dateStr,
    difficulty: (i % 7) + 1,
    completed,
    score: completed ? Math.floor(Math.random() * 30) + 70 : null,
  };
});

// ============================================
// Mock API Implementation
// ============================================

let currentGameState = { ...mockGameState };
let commitCounter = 3;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateCommitId(): string {
  return `commit-${commitCounter++}`;
}

// Deep clone the state to ensure React detects changes
function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state));
}

export const mockApi = {
  async startGame(puzzleId: string): Promise<StartGameResponse> {
    await delay(300);
    
    // Reset commit counter
    commitCounter = 3;
    
    // Reset game state for a fresh start
    currentGameState = {
      ...mockGameState,
      puzzleId: puzzleId === 'daily' ? mockPuzzle.id : puzzleId,
      puzzle: JSON.parse(JSON.stringify(mockPuzzle)),
      graph: JSON.parse(JSON.stringify(mockGraph)),
      collectedFiles: [],
      commandHistory: [],
      commandCount: 0,
      checkoutCount: 0,
      consecutiveCommits: 0,
      status: 'in_progress',
      score: null,
      startedAt: Date.now(),
      completedAt: null,
    };
    
    return {
      gameId: `game-${Date.now()}`,
      state: cloneState(currentGameState),
    };
  },

  async sendCommand(_gameId: string, command: GameCommand): Promise<CommandResponse> {
    await delay(150);
    
    const state = currentGameState;
    const graph = state.graph!;
    const puzzle = state.puzzle!;
    
    // Handle undo
    if (command.type === 'undo') {
      if (state.commandHistory.length === 0) {
        return { state: cloneState(state), error: 'Nothing to undo' };
      }
      state.commandHistory.pop();
      state.commandCount = Math.max(0, state.commandCount - 1);
      return { state: cloneState(state) };
    }
    
    // Add command to history
    state.commandHistory.push(command);
    state.commandCount++;
    
    // Process command
    switch (command.type) {
      case 'commit': {
        const currentBranch = graph.head.type === 'attached' ? graph.head.ref : null;
        const currentCommitId = currentBranch 
          ? graph.branches[currentBranch].tipCommitId 
          : graph.head.ref;
        
        const newCommitId = generateCommitId();
        const currentCommit = graph.commits[currentCommitId];
        const newDepth = currentCommit.depth + 1;
        
        graph.commits[newCommitId] = {
          id: newCommitId,
          message: command.message,
          parents: [currentCommitId],
          branch: currentBranch || 'detached',
          depth: newDepth,
          timestamp: Date.now(),
        };
        
        if (currentBranch) {
          graph.branches[currentBranch].tipCommitId = newCommitId;
        } else {
          graph.head.ref = newCommitId;
        }
        
        // Check for file collection
        const collectedFile = puzzle.fileTargets.find(
          (f) => f.branch === currentBranch && f.depth === newDepth && !f.collected
        );
        if (collectedFile) {
          collectedFile.collected = true;
          state.collectedFiles.push(collectedFile.id);
        }
        
        state.consecutiveCommits++;
        break;
      }
      
      case 'checkout': {
        if (graph.branches[command.target]) {
          graph.head = { type: 'attached', ref: command.target };
        } else if (graph.commits[command.target]) {
          graph.head = { type: 'detached', ref: command.target };
        }
        state.checkoutCount++;
        state.consecutiveCommits = 0;
        break;
      }
      
      case 'merge': {
        const currentBranch = graph.head.type === 'attached' ? graph.head.ref : null;
        if (!currentBranch) {
          return { state: cloneState(state), error: 'Cannot merge in detached HEAD state' };
        }
        
        const targetBranch = graph.branches[command.branch];
        if (!targetBranch) {
          return { state: cloneState(state), error: `Branch ${command.branch} not found` };
        }
        
        const currentTip = graph.branches[currentBranch].tipCommitId;
        const targetTip = targetBranch.tipCommitId;
        
        const newCommitId = generateCommitId();
        const currentDepth = graph.commits[currentTip].depth;
        const targetDepth = graph.commits[targetTip].depth;
        
        graph.commits[newCommitId] = {
          id: newCommitId,
          message: `Merge ${command.branch} into ${currentBranch}`,
          parents: [currentTip, targetTip],
          branch: currentBranch,
          depth: Math.max(currentDepth, targetDepth) + 1,
          timestamp: Date.now(),
        };
        
        graph.branches[currentBranch].tipCommitId = newCommitId;
        state.consecutiveCommits = 0;
        
        // Check win condition: all files collected and merged to main
        const allCollected = puzzle.fileTargets.every((f) => f.collected);
        if (allCollected && currentBranch === 'main') {
          state.status = 'completed';
          state.completedAt = Date.now();
          state.score = Math.max(0, 100 - (state.commandCount - 8) * 5);
          
          const result: GameResult = {
            won: true,
            score: state.score,
            parScore: 8,
            commandsUsed: state.commandCount,
            optimalSolution: [
              { type: 'checkout', target: 'hotfix' },
              { type: 'commit', message: 'collect config' },
              { type: 'checkout', target: 'main' },
              { type: 'commit', message: 'collect readme' },
              { type: 'merge', branch: 'hotfix' },
              { type: 'checkout', target: 'feature-a' },
              { type: 'commit', message: 'collect index' },
              { type: 'checkout', target: 'feature-b' },
              { type: 'commit', message: 'collect utils' },
              { type: 'checkout', target: 'main' },
              { type: 'merge', branch: 'feature-a' },
              { type: 'merge', branch: 'feature-b' },
            ],
            timeElapsed: state.completedAt - state.startedAt!,
          };
          
          return { state: cloneState(state), result };
        }
        break;
      }
      
      case 'rebase': {
        // Simplified rebase - just reset consecutive commits
        state.consecutiveCommits = 0;
        break;
      }
      
      case 'branch': {
        const currentCommitId = graph.head.type === 'attached'
          ? graph.branches[graph.head.ref].tipCommitId
          : graph.head.ref;
        
        graph.branches[command.name] = {
          name: command.name,
          tipCommitId: currentCommitId,
        };
        break;
      }
    }
    
    return { state: cloneState(state) };
  },

  async setUsername(username: string): Promise<SetNameResponse> {
    await delay(200);
    return { success: true, username };
  },

  async getStats(): Promise<UserStats> {
    await delay(300);
    return mockUserStats;
  },

  async getLeaderboard(): Promise<LeaderboardData> {
    await delay(300);
    return mockLeaderboard;
  },

  async getArchivePuzzles(): Promise<ArchivePuzzle[]> {
    await delay(300);
    return mockArchive;
  },
};
