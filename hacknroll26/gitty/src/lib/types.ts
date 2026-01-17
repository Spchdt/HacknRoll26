// Core game types for Gitty

export interface Commit {
  id: string;
  message: string;
  parentIds: string[];
  branch: string;
  depth: number;
  timestamp: number;
}

export interface Branch {
  name: string;
  tipCommitId: string;
  color: string;
}

export interface FileTarget {
  id: string;
  name: string;
  branch: string;
  depth: number;
  collected: boolean;
}

export interface GitGraph {
  commits: Map<string, Commit>;
  branches: Map<string, Branch>;
  headRef: string; // Either branch name or commit ID
  isDetached: boolean;
}

export interface GameState {
  id: string;
  puzzleId: string;
  graph: GitGraph;
  files: FileTarget[];
  commandHistory: GameCommand[];
  undoStack: GitGraph[];
  status: 'playing' | 'won' | 'abandoned';
  commandsUsed: number;
  parScore: number;
  startedAt: number;
  completedAt?: number;
}

export interface GameCommand {
  type: 'commit' | 'branch' | 'checkout' | 'merge' | 'rebase' | 'undo';
  args: string[];
  timestamp: number;
  success: boolean;
  message?: string;
}

export interface CommandResult {
  success: boolean;
  message: string;
  newState?: GitGraph;
  filesCollected?: FileTarget[];
  gameWon?: boolean;
}

export interface Puzzle {
  id: string;
  date?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  files: FileTarget[];
  initialGraph: GitGraph;
  solution: GameCommand[];
  parScore: number;
  constraints: PuzzleConstraints;
}

export interface PuzzleConstraints {
  maxCommits: number;
  maxCheckouts: number;
  maxBranches: number;
  allowedCommands: GameCommand['type'][];
}

export interface UserStats {
  totalGamesPlayed: number;
  totalGamesWon: number;
  totalCommandsUsed: number;
  bestScore: number;
  averageScore: number;
  currentStreak: number;
  maxStreak: number;
  commandDistribution: Record<GameCommand['type'], number>;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  score: number;
  gamesPlayed: number;
}

export interface User {
  id: string;
  username?: string;
  createdAt: number;
  lastActiveAt: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface GameStartResponse {
  gameId: string;
  puzzle: Puzzle;
  state: GameState;
  isResumed: boolean;
}

export interface GameCommandResponse {
  result: CommandResult;
  state: GameState;
  reward?: GameReward;
}

export interface GameReward {
  score: number;
  bonusPoints: number;
  commandsUnderPar: number;
  optimalSolution: GameCommand[];
}

// Branch colors for visualization
export const BRANCH_COLORS: Record<string, string> = {
  main: '#3b82f6',
  develop: '#22c55e',
  feature: '#f59e0b',
  hotfix: '#ef4444',
  release: '#8b5cf6',
  default: '#6b7280',
};

// Command aliases
export const COMMAND_ALIASES: Record<string, string> = {
  'git co': 'git checkout',
  'git ci': 'git commit',
  'git br': 'git branch',
  'git mg': 'git merge',
  'git rb': 'git rebase',
};
