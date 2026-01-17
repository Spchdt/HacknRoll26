// Core game types for Gitty
// Based on the Gitty API TypeScript Types Reference

// ============================================
// API Game State (matches backend response)
// ============================================

export interface ApiCommit {
  id: string;
  message: string;
  parents: string[]; // List of parent commit IDs
  timestamp: number; // Unix timestamp
}

export interface ApiGameState {
  commits: ApiCommit[];
  /** Mapping of branch names to their target commit IDs */
  branches: Record<string, string>;
  /** The current commit ID pointed to by HEAD */
  head: string;
  /** The currently active branch name, or null if in detached HEAD state */
  currentBranch: string | null;
  
  // Local game state properties (added on client-side)
  commandsUsed?: number;
  parScore?: number;
  status?: 'playing' | 'won' | 'abandoned';
  undoStack?: any[];
  files?: any[];
  graph?: any;
  commandHistory?: string[];
}

// ============================================
// API Command Types (Discriminated Union)
// ============================================

export type Command =
  | CommitCommand
  | BranchCommand
  | CheckoutCommand
  | MergeCommand
  | RebaseCommand
  | UndoCommand;

export interface CommitCommand {
  type: 'commit';
  message: string;
}

export interface BranchCommand {
  type: 'branch';
  name: string;
}

export interface CheckoutCommand {
  type: 'checkout';
  target: string;
}

export interface MergeCommand {
  type: 'merge';
  branch: string;
}

export interface RebaseCommand {
  type: 'rebase';
  onto: string;
}

export interface UndoCommand {
  type: 'undo';
}

// ============================================
// API Request & Response Types
// ============================================

export interface UserProfileResponse {
  id: string;
  username: string | null;
  createdAt: string;
}

export interface SetNameRequest {
  username: string;
}

export interface StartGameRequest {
  gameId: string; // Use "daily" for daily challenge or a specific puzzle ID
}

export interface StartGameResponse {
  success: boolean;
  gameState?: ApiGameState;
  puzzle?: Puzzle;
  isCompleted?: boolean;
  rewards?: GameRewards;
  error?: string;
}

export interface CommandRequest {
  gameId: string;
  command: Command;
}

export interface CommandResponse {
  success: boolean;
  gameState?: ApiGameState;
  isCompleted?: boolean;
  rewards?: GameRewards;
  error?: string;
}

export interface GameRewards {
  score: number;
  parScore: number;
  commandsUsed: number;
  commandsUnderPar: number; // Number of commands under par
  performance: 'under_par' | 'at_par' | 'over_par';
  bonusPoints: number;
  optimalSolution: {
    commands: Command[];
    explanation: string;
  };
}

export interface Puzzle {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  initialState: ApiGameState;
  targetState: ApiGameState;
  parScore: number;
  hints: string[];
  solution?: PuzzleSolution;
  createdAt: string; // ISO 8601
  constraints?: PuzzleConstraints;
}

export interface PuzzleSolution {
  commands: Command[];
  explanation: string;
}

// ============================================
// Stats & Leaderboard Types
// ============================================

export interface UserStats {
  id: string;
  userId: string;
  averageScore: number | null;
  bestScore: number | null;
  currentStreak: number;
  maxStreak: number;
  totalCommandsUsed: number;
  totalGamesPlayed: number;
  totalGamesWon: number;
  lastPlayedAt: string | null;
}

export interface StatsResponse {
  stats: UserStats;
  recentGames: RecentGame[];
}

export interface RecentGame {
  id: string;
  status: 'completed' | 'abandoned';
  score: number;
  completedAt: string;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  userRank?: number;
  userEntry?: LeaderboardEntry;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  gamesPlayed: number;
}

// ============================================
// Common Response Pattern
// ============================================

export interface BaseResponse {
  success: boolean;
  error?: string;
  message?: string;
}

// ============================================
// Local Client-Side Types (for UI/Engine)
// ============================================

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

export interface UndoState {
  graph: GitGraph;
  files: FileTarget[];
}

export interface GameState {
  id: string;
  puzzleId: string;
  graph: GitGraph;
  files: FileTarget[];
  commandHistory: GameCommand[];
  undoStack: UndoState[];
  status: 'playing' | 'won' | 'abandoned';
  commandsUsed: number;
  checkoutsUsed: number;
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

// Local Puzzle type for client-side engine (extended from API Puzzle)
export interface LocalPuzzle {
  id: string;
  title?: string;
  description?: string;
  date?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  files: FileTarget[];
  initialGraph: GitGraph;
  solution: GameCommand[];
  parScore: number;
  constraints: PuzzleConstraints;
}

export interface PuzzleConstraints {
  maxCommands: number;  // Maximum total commands allowed
  maxCommits: number;
  maxCheckouts: number;
  maxBranches: number;
  allowedCommands: GameCommand['type'][];
}

// Legacy types for backwards compatibility
export interface LegacyUserStats {
  totalGamesPlayed: number;
  totalGamesWon: number;
  totalCommandsUsed: number;
  bestScore: number;
  averageScore: number;
  currentStreak: number;
  maxStreak: number;
  commandDistribution: Record<GameCommand['type'], number>;
}

export interface User {
  id: string;
  username?: string;
  createdAt: number;
  lastActiveAt: number;
}

// Legacy response types (for backwards compatibility with existing code)
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
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
