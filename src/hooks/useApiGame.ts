import { useState, useCallback } from 'react';
import type { 
  ApiGameState, 
  Puzzle, 
  Command, 
  GameRewards,
  CommandResponse,
  StartGameResponse,
} from '@/lib/types';
import { api } from '@/lib/api';

interface UseApiGameReturn {
  // State
  gameState: ApiGameState | null;
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
  const [gameState, setGameState] = useState<ApiGameState | null>(null);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [rewards, setRewards] = useState<GameRewards | null>(null);
  const [output, setOutput] = useState<string[]>([
    '🎮 Welcome to Gitty!',
    'Type "git init" to start the daily puzzle.',
    '',
  ]);

  /**
   * Start a new game session
   * @param id - Use "daily" for daily challenge or a specific puzzle ID
   */
  const startGame = useCallback(async (id: string = 'daily') => {
    setIsLoading(true);
    setError(null);
    setGameId(id);
    setRewards(null);
    
    setOutput(prev => [...prev, `$ git init`, `🔄 Initializing game session...`]);
    
    try {
      const response: StartGameResponse = await api.startGame(id);
      
      if (response.success && response.gameState && response.puzzle) {
        setGameState(response.gameState);
        setPuzzle(response.puzzle);
        setIsCompleted(response.isCompleted ?? false);
        
        setOutput(prev => [
          ...prev,
          `✅ Initialized git repository`,
          '',
          `📋 Puzzle: ${response.puzzle!.title}`,
          `📝 ${response.puzzle!.description}`,
          `⭐ Par: ${response.puzzle!.parScore} commands`,
          `🎯 Difficulty: ${response.puzzle!.difficulty}`,
          '',
        ]);
        
        // If already completed, set rewards
        if (response.isCompleted && response.rewards) {
          setRewards(response.rewards);
          setOutput(prev => [...prev, `🏆 You've already completed this puzzle!`, '']);
        }
      } else {
        setError(response.error || 'Failed to start game');
        setOutput(prev => [...prev, `❌ Error: ${response.error || 'Failed to start game'}`, '']);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start game';
      setError(errorMsg);
      setOutput(prev => [...prev, `❌ Error: ${errorMsg}`, '']);
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
    setOutput([
      '🎮 Welcome to Gitty!',
      'Type "git init" to start the daily puzzle.',
      '',
    ]);
  }, []);

  /**
   * Execute a git command
   * @param command - The command object (discriminated union)
   * @returns The rewards if the game is completed, null otherwise
   */
  const executeCommand = useCallback(async (command: Command): Promise<GameRewards | null> => {
    if (!gameState) {
      throw new Error('No active game session. Type "git init" to start.');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response: CommandResponse = await api.sendCommand(gameId, command);
      
      if (response.success && response.gameState) {
        setGameState(response.gameState);
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
  }, [gameState, gameId]);

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
        `❌ Error: No active game session. Type "git init" to start.`,
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
        `❌ Error: Unknown command. Supported: commit, branch, checkout, merge, rebase, undo`,
        '',
      ]);
      return null;
    }
    
    setOutput(prev => [...prev, `$ ${commandString}`]);
    
    try {
      const result = await executeCommand(command);
      
      // Build success message based on command type
      let successMsg = '✅ ';
      switch (command.type) {
        case 'commit':
          successMsg += `Created commit: "${command.message}"`;
          break;
        case 'branch':
          successMsg += `Created branch: ${command.name}`;
          break;
        case 'checkout':
          successMsg += `Switched to: ${command.target}`;
          break;
        case 'merge':
          successMsg += `Merged branch: ${command.branch}`;
          break;
        case 'rebase':
          successMsg += `Rebased onto: ${command.onto}`;
          break;
        case 'undo':
          successMsg += `Undid last command`;
          break;
      }
      
      setOutput(prev => [...prev, successMsg, '']);
      
      // If completed, show reward
      if (result) {
        setOutput(prev => [
          ...prev,
          '🎉 Congratulations! Puzzle completed!',
          `📊 Score: ${result.score} points`,
          `⌨️ Commands used: ${result.commandsUsed} (par: ${result.parScore})`,
          `${result.performance === 'under_par' ? '🏆 Under par!' : result.performance === 'at_par' ? '✨ At par!' : '📈 Over par'}`,
          '',
        ]);
      }
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Command failed';
      setOutput(prev => [...prev, `❌ Error: ${errorMsg}`, '']);
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
  const trimmed = commandString.trim().toLowerCase();
  
  // Remove "git " prefix if present
  const withoutGit = trimmed.startsWith('git ') ? trimmed.slice(4) : trimmed;
  const parts = withoutGit.split(/\s+/);
  const cmd = parts[0];
  
  switch (cmd) {
    case 'commit': {
      // Extract message from -m "message" or -m 'message'
      const messageMatch = commandString.match(/-m\s+["'](.+?)["']/i);
      const message = messageMatch ? messageMatch[1] : 'Commit';
      return createCommitCommand(message);
    }
    
    case 'branch': {
      const name = parts[1];
      if (!name) return null;
      return createBranchCommand(name);
    }
    
    case 'checkout':
    case 'co': {
      const target = parts[1];
      if (!target) return null;
      return createCheckoutCommand(target);
    }
    
    case 'merge':
    case 'mg': {
      const branch = parts[1];
      if (!branch) return null;
      return createMergeCommand(branch);
    }
    
    case 'rebase':
    case 'rb': {
      const onto = parts[1];
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
