// ============================================
// Git Engine Types
// ============================================

export interface Commit {
  id: string;
  message: string;
  parents: string[];
  branch: string;
  depth: number;
  timestamp: number;
}

export interface Branch {
  name: string;
  tipCommitId: string;
}

export interface HeadState {
  type: 'attached' | 'detached';
  ref: string; // branch name if attached, commit id if detached
}

export interface GitGraph {
  commits: Record<string, Commit>;
  branches: Record<string, Branch>;
  head: HeadState;
  rootCommitId: string;
}

// ============================================
// File & Puzzle Types
// ============================================

export interface FileTarget {
  id: string;
  name: string;
  branch: string;
  depth: number;
  collected: boolean;
}

export interface PuzzleConstraints {
  maxCommands: number;
  maxCheckouts: number;
  maxConsecutiveCommits: number;
}

export interface Puzzle {
  id: string;
  date: string | null;
  difficulty: number;
  fileTargets: FileTarget[];
  constraints: PuzzleConstraints;
  branches: string[];
  maxDepth: number;
}

export interface PuzzleSolution {
  commands: GameCommand[];
  parScore: number;
}

// ============================================
// Game Command Types
// ============================================

export type CommandType = 'commit' | 'branch' | 'checkout' | 'merge' | 'rebase' | 'undo';

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
  target: string; // branch name or commit id
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

export type GameCommand =
  | CommitCommand
  | BranchCommand
  | CheckoutCommand
  | MergeCommand
  | RebaseCommand
  | UndoCommand;

// ============================================
// Game State Types
// ============================================

export type GameStatus = 'not_started' | 'in_progress' | 'completed' | 'abandoned';

export interface GameState {
  puzzleId: string;
  puzzle: Puzzle | null;
  graph: GitGraph | null;
  collectedFiles: string[];
  commandHistory: GameCommand[];
  commandCount: number;
  checkoutCount: number;
  consecutiveCommits: number;
  status: GameStatus;
  score: number | null;
  startedAt: number | null;
  completedAt: number | null;
}

export interface GameResult {
  won: boolean;
  score: number;
  parScore: number;
  commandsUsed: number;
  optimalSolution: GameCommand[];
  timeElapsed: number;
}

// ============================================
// User & Stats Types
// ============================================

export interface User {
  id: string;
  username: string | null;
  createdAt: number;
  lastActiveAt: number;
}

export interface UserStats {
  totalGamesPlayed: number;
  totalGamesWon: number;
  totalCommandsUsed: number;
  bestScore: number;
  averageScore: number;
  currentStreak: number;
  maxStreak: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  score: number;
  gamesPlayed: number;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  userRank: number | null;
  userEntry: LeaderboardEntry | null;
}

// ============================================
// API Request/Response Types
// ============================================

export interface StartGameRequest {
  puzzleId: string; // "daily" or specific puzzle ID
}

export interface StartGameResponse {
  gameId: string;
  state: GameState;
  result?: GameResult; // Present if game already ended
}

export interface CommandRequest {
  gameId: string;
  command: GameCommand;
}

export interface CommandResponse {
  state: GameState;
  result?: GameResult; // Present if game ended with this command
  error?: string;
}

export interface SetNameRequest {
  username: string;
}

export interface SetNameResponse {
  success: boolean;
  username: string;
}

// ============================================
// Archive Types
// ============================================

export interface ArchivePuzzle {
  id: string;
  date: string;
  difficulty: number;
  completed: boolean;
  score: number | null;
}
