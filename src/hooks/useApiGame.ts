import { useState, useCallback } from 'react';
import type {
  ApiGameState,
  Puzzle,
  Command,
  GameRewards,
  CommandResponse,
  StartGameResponse,
  GitGraph,
  FileTarget,
} from '@/lib/types';
import { api } from '@/lib/api';

// Branch colors for UI
const BRANCH_COLORS: Record<string, string> = {
  main: '#F59E0B',
  master: '#3B82F6',
  feature: '#A855F7',
  develop: '#84CC16',
  'feature-a': '#A855F7',
  'feature-b': '#EC4899',
  'feature-c': '#14B8A6',
  hotfix: '#EF4444',
};

const DEFAULT_COLORS = ['#F59E0B', '#A855F7', '#3B82F6', '#84CC16', '#EC4899', '#14B8A6'];

/**
 * Transform API game state to the format expected by GitGraph component
 */
function transformApiGameState(apiState: any, apiPuzzle: any): { graph: GitGraph; files: FileTarget[] } {
  // Transform commits: API returns object, we need Map-like structure
  const commits = new Map();
  if (apiState.graph?.commits) {
    const commitsObj = apiState.graph.commits;
    Object.values(commitsObj).forEach((commit: any, idx: number) => {
      commits.set(commit.id, {
        id: commit.id,
        message: commit.message,
        parentIds: commit.parents || [],
        branch: commit.branch || 'main',
        depth: commit.depth ?? idx,
        timestamp: commit.timestamp || Date.now(),
      });
    });
  }

  // Transform branches: API returns object, we need Map-like structure
  const branches = new Map();
  if (apiState.graph?.branches) {
    const branchesObj = apiState.graph.branches;
    Object.entries(branchesObj).forEach(([name, branch]: [string, any], idx) => {
      branches.set(name, {
        name: branch.name || name,
        tipCommitId: branch.tipCommitId || branch,
        color: BRANCH_COLORS[name] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
      });
    });
  }

  // Determine head reference
  let headRef = 'main';
  let isDetached = false;
  if (apiState.graph?.head) {
    if (typeof apiState.graph.head === 'string') {
      headRef = apiState.graph.head;
    } else if (apiState.graph.head.type === 'attached') {
      headRef = apiState.graph.head.ref;
      isDetached = false;
    } else if (apiState.graph.head.type === 'detached') {
      headRef = apiState.graph.head.ref;
      isDetached = true;
    }
  }

  const graph: GitGraph = {
    commits,
    branches,
    headRef,
    isDetached,
  };

  // Transform file targets from puzzle
  const collectedSet = new Set(apiState.collectedFiles || []);
  const files: FileTarget[] = (apiPuzzle?.fileTargets || []).map((target: any, idx: number) => ({
    id: target.id || `file-${idx}`,
    name: target.fileName || target.name,
    branch: target.branch,
    depth: target.depth,
    collected: target.collected || collectedSet.has(target.fileName || target.name),
  }));

  return { graph, files };
}

interface TransformedGameState extends ApiGameState {
  graph: GitGraph;
  files: FileTarget[];
}

interface UseApiGameReturn {
  // State
  gameState: TransformedGameState | null;
  puzzle: Puzzle | null;
  isLoading: boolean;
  error: string | null;
  isCompleted: boolean;
  output: string[];

  // Actions
  startGame: (gameId?: string) => Promise<void>;
  executeCommand: (command: Command) => Promise<GameRewards | null>;
  executeCommandString: (commandString: string) => Promise<GameRewards | null>;
  resetGame: () => void;

  // Game end
  rewards: GameRewards | null;
  gameReward: GameRewards | null; // Alias for rewards
  isGameEnded: boolean; // Alias for isCompleted
}

/**
 * useApiGame - Hook for managing game state via the Gitty API
 * Uses IP-based authentication (no tokens required)
 * 
 * @param initialGameId - The game ID to use (default: "daily")
 */
export function useApiGame(initialGameId: string = 'daily'): UseApiGameReturn {
  const [gameId, setGameId] = useState<string>(initialGameId);
  const [gameState, setGameState] = useState<TransformedGameState | null>(null);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [rewards, setRewards] = useState<GameRewards | null>(null);
  const [output, setOutput] = useState<string[]>([]);

  /**
   * Start a new game session
   * @param id - Use "daily" for daily challenge or a specific puzzle ID
   */
  const startGame = useCallback(async (id: string = 'daily') => {
    setIsLoading(true);
    setError(null);
    setGameId(id);
    setRewards(null);

    setOutput(prev => [...prev, `$ git init`, `Initializing game session...`]);

    try {
      const response: StartGameResponse = await api.startGame(id);

      if (response.success && response.gameState && response.puzzle) {
        // Transform API response to frontend format
        const { graph, files } = transformApiGameState(response.gameState, response.puzzle);
        const transformedState: TransformedGameState = {
          ...response.gameState,
          graph,
          files,
          commandsUsed: response.gameState.commandHistory?.length || 0,
          parScore: response.puzzle.parScore,
          status: (response.gameState as any).status === 'in_progress' ? 'playing' :
            (response.gameState as any).status === 'completed' ? 'won' : 'playing',
        };

        setGameState(transformedState);
        setPuzzle(response.puzzle);
        setIsCompleted(response.isCompleted ?? false);

        setOutput(prev => [
          ...prev,
          `Initialized git repository`,
          '',
          `Puzzle: ${response.puzzle!.id}`,
          `Date: ${response.puzzle!.date || 'Daily'}`,
          `Par: ${response.puzzle!.parScore} commands`,
          `Difficulty: Level ${response.puzzle!.difficultyLevel || response.puzzle!.difficulty}`,
          '',
        ]);

        // If already completed, set rewards
        if (response.isCompleted && response.rewards) {
          setRewards(response.rewards);
          setOutput(prev => [...prev, `You've already completed this puzzle!`, '']);
        }
      } else {
        setError(response.error || 'Failed to start game');
        setOutput(prev => [...prev, `Error: ${response.error || 'Failed to start game'}`, '']);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start game';
      setError(errorMsg);
      setOutput(prev => [...prev, `Error: ${errorMsg}`, '']);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Reset the game state
   */
  const resetGame = useCallback(() => {
    setGameState(null);
    setPuzzle(null);
    setIsCompleted(false);
    setRewards(null);
    setError(null);
    setOutput([]);
  }, []);

  /**
   * Execute a git command
   * @param command - The command object (discriminated union)
   * @returns The rewards if the game is completed, null otherwise
   */
  const executeCommand = useCallback(async (command: Command): Promise<GameRewards | null> => {
    if (!gameState || !puzzle) {
      throw new Error('No active game session. Type "git init" to start.');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response: CommandResponse = await api.sendCommand(gameId, command);

      if (response.success && response.gameState) {
        // Transform API response to frontend format
        const { graph, files } = transformApiGameState(response.gameState, puzzle);
        const transformedState: TransformedGameState = {
          ...response.gameState,
          graph,
          files,
          commandsUsed: response.gameState.commandHistory?.length || 0,
          parScore: puzzle.parScore,
          status: (response.gameState as any).status === 'in_progress' ? 'playing' :
            (response.gameState as any).status === 'completed' ? 'won' : 'playing',
        };

        setGameState(transformedState);
        setIsCompleted(response.isCompleted ?? false);

        // Check for completion
        if (response.isCompleted && response.rewards) {
          setRewards(response.rewards);
          return response.rewards;
        }
      } else {
        throw new Error(response.error || 'Command failed');
      }

      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Command failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [gameState, gameId, puzzle]);

  /**
   * Execute a git command from a string (parses the command)
   * @param commandString - e.g., "git commit -m 'message'" or "git checkout main"
   */
  const executeCommandString = useCallback(async (commandString: string): Promise<GameRewards | null> => {
    const trimmed = commandString.trim().toLowerCase();

    // Handle git init specially - starts the game
    if (trimmed === 'git init') {
      await startGame(gameId);
      return null;
    }

    // Check if game is started
    if (!gameState) {
      setOutput(prev => [
        ...prev,
        `$ ${commandString}`,
        `Error: No active game session. Type "git init" to start.`,
        '',
      ]);
      return null;
    }

    // Parse the command
    const command = parseCommandString(commandString);
    if (!command) {
      setOutput(prev => [
        ...prev,
        `$ ${commandString}`,
        `Error: Unknown command. Supported: commit, branch, checkout, merge, rebase, undo`,
        '',
      ]);
      return null;
    }

    setOutput(prev => [...prev, `$ ${commandString}`]);

    try {
      const result = await executeCommand(command);

      // Build success message based on command type
      let successMsg = '';
      switch (command.type) {
        case 'commit':
          successMsg = `Created commit: "${command.message}"`;
          break;
        case 'branch':
          successMsg = `Created branch: ${command.name}`;
          break;
        case 'checkout':
          successMsg = `Switched to: ${command.target}`;
          break;
        case 'merge':
          successMsg = `Merged branch: ${command.branch}`;
          break;
        case 'rebase':
          successMsg = `Rebased onto: ${command.onto}`;
          break;
        case 'undo':
          successMsg = `Undid last command`;
          break;
      }

      setOutput(prev => [...prev, successMsg, '']);

      // If completed, show reward
      if (result) {
        setOutput(prev => [
          ...prev,
          'Congratulations! Puzzle completed!',
          `Score: ${result.score} points`,
          `Commands used: ${result.commandsUsed} (par: ${result.parScore})`,
          `${result.performance === 'under_par' ? 'Under par!' : result.performance === 'at_par' ? 'At par!' : 'Over par'}`,
          '',
        ]);
      }

      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Command failed';
      setOutput(prev => [...prev, `Error: ${errorMsg}`, '']);
      return null;
    }
  }, [gameState, gameId, startGame, executeCommand]);

  return {
    gameState,
    puzzle,
    isLoading,
    error,
    isCompleted,
    output,
    startGame,
    executeCommand,
    executeCommandString,
    resetGame,
    rewards,
    gameReward: rewards,
    isGameEnded: isCompleted,
  };
}

// ============================================
// Helper functions for building commands
// ============================================

export function createCommitCommand(message: string): Command {
  return { type: 'commit', message };
}

export function createBranchCommand(name: string): Command {
  return { type: 'branch', name };
}

export function createCheckoutCommand(target: string): Command {
  return { type: 'checkout', target };
}

export function createMergeCommand(branch: string): Command {
  return { type: 'merge', branch };
}

export function createRebaseCommand(onto: string): Command {
  return { type: 'rebase', onto };
}

export function createUndoCommand(): Command {
  return { type: 'undo' };
}

/**
 * Parse a git command string into a Command object
 * @param commandString - e.g., "git commit -m 'message'" or "git checkout main"
 */
export function parseCommandString(commandString: string): Command | null {
  const trimmed = commandString.trim();

  // Remove "git " prefix if present (case-insensitive check)
  const withoutGit = trimmed.toLowerCase().startsWith('git ') ? trimmed.slice(4) : trimmed;
  const parts = withoutGit.split(/\s+/);
  const cmd = parts[0].toLowerCase(); // Only lowercase the command name

  switch (cmd) {
    case 'commit': {
      // Extract message from -m "message" or -m 'message'
      const messageMatch = commandString.match(/-m\s+["'](.+?)["']/i);
      const message = messageMatch ? messageMatch[1] : 'Commit';
      return createCommitCommand(message);
    }

    case 'branch': {
      const name = parts[1]; // Keep original case
      if (!name) return null;
      return createBranchCommand(name);
    }

    case 'checkout':
    case 'co': {
      const target = parts[1]; // Keep original case for commit hashes
      if (!target) return null;
      return createCheckoutCommand(target);
    }

    case 'merge':
    case 'mg': {
      const branch = parts[1]; // Keep original case
      if (!branch) return null;
      return createMergeCommand(branch);
    }

    case 'rebase':
    case 'rb': {
      const onto = parts[1]; // Keep original case
      if (!onto) return null;
      return createRebaseCommand(onto);
    }

    case 'undo': {
      return createUndoCommand();
    }

    default:
      return null;
  }
}
