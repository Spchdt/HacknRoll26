import { useState, useCallback, useEffect } from 'react';
import type { GameState, GameCommand, CommandResult, GameReward, Puzzle, UndoState, GitGraph } from '@/lib/types';
import { GitEngine, createTestPuzzle, serializeGraph, deserializeGraph } from '@/lib/gitEngine';
import { cloneGitGraph, deepClone, calculateScore, getFromStorage, saveToStorage, parseGitCommand } from '@/lib/utils';

interface UseGameReturn {
  // State
  gameState: GameState | null;
  puzzle: Puzzle | null;
  isLoading: boolean;
  error: string | null;
  output: string[];
  
  // Actions
  startGame: (puzzleId?: string) => void;
  executeCommand: (commandString: string) => CommandResult;
  undo: () => boolean;
  resetGame: () => void;
  
  // Game end
  gameReward: GameReward | null;
  isGameEnded: boolean;
}

const STORAGE_KEY = 'gitty_game_state';

export function useGame(): UseGameReturn {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [engine, setEngine] = useState<GitEngine | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<string[]>([]);
  const [gameReward, setGameReward] = useState<GameReward | null>(null);

  // Load saved game on mount
  useEffect(() => {
    const saved = getFromStorage<{ state: GameState; puzzle: Puzzle } | null>(STORAGE_KEY, null);
    if (saved && saved.state.status === 'playing') {
      // Restore game
      const savedPuzzle = saved.puzzle;
      const newEngine = new GitEngine(savedPuzzle);
      
      // Deserialize the graph from saved state
      const graph = deserializeGraph(saved.state.graph as unknown as ReturnType<typeof serializeGraph>);
      newEngine.restoreState(graph, saved.state.files);
      
      // Convert old undoStack format (GitGraph[]) to new format (UndoState[]) for backwards compatibility
      const undoStack: UndoState[] = saved.state.undoStack.map((item: UndoState | GitGraph) => {
        if ('graph' in item && 'files' in item) {
          // Already in new format
          return item as UndoState;
        }
        // Old format: just a GitGraph, convert to new format with empty files
        return {
          graph: item as unknown as GitGraph,
          files: saved.state.files.map(f => ({ ...f, collected: false })),
        };
      });
      
      setPuzzle(savedPuzzle);
      setEngine(newEngine);
      setGameState({
        ...saved.state,
        graph,
        undoStack,
        // Ensure checkoutsUsed exists for backwards compatibility
        checkoutsUsed: saved.state.checkoutsUsed ?? 0,
      });
      setOutput(['Game restored from previous session.']);
    }
  }, []);

  // Save game state when it changes
  useEffect(() => {
    if (gameState && puzzle) {
      const toSave = {
        state: {
          ...gameState,
          graph: serializeGraph(gameState.graph),
        },
        puzzle,
      };
      saveToStorage(STORAGE_KEY, toSave);
    }
  }, [gameState, puzzle]);

  // Start a new game
  const startGame = useCallback((puzzleId?: string) => {
    setIsLoading(true);
    setError(null);
    setGameReward(null);
    
    try {
      // For now, use test puzzle. In production, fetch from API
      const newPuzzle = createTestPuzzle();
      const newEngine = new GitEngine(newPuzzle);
      
      const initialState: GameState = {
        id: `game-${Date.now()}`,
        puzzleId: puzzleId || newPuzzle.id,
        graph: newEngine.getGraph(),
        files: newEngine.getFiles(),
        commandHistory: [],
        undoStack: [],
        status: 'playing',
        commandsUsed: 0,
        checkoutsUsed: 0,
        parScore: newPuzzle.parScore,
        startedAt: Date.now(),
      };
      
      setPuzzle(newPuzzle);
      setEngine(newEngine);
      setGameState(initialState);
      setOutput([
        '🎮 New game started!',
        `📁 Collect ${newPuzzle.files.length} files and merge to main.`,
        `⭐ Par: ${newPuzzle.parScore} commands`,
        '',
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Execute a command
  const executeCommand = useCallback((commandString: string): CommandResult => {
    if (!gameState || !engine) {
      return { success: false, message: 'No active game' };
    }

    if (gameState.status !== 'playing') {
      return { success: false, message: 'Game has ended' };
    }

    // Parse the command
    const parsed = parseGitCommand(commandString);
    if (!parsed) {
      const errorMsg = "Commands must start with 'git'";
      setOutput(prev => [...prev, `$ ${commandString}`, `Error: ${errorMsg}`]);
      return { success: false, message: errorMsg };
    }

    // Handle undo specially
    if (parsed.command === 'undo') {
      const undoResult = undo();
      const msg = undoResult ? '✓ Undid last command' : '⚠ Nothing to undo';
      setOutput(prev => [...prev, `$ ${commandString}`, msg]);
      return { success: undoResult, message: msg };
    }

    // Check maxCommands constraint
    if (puzzle && gameState.commandsUsed >= puzzle.constraints.maxCommands) {
      const errorMsg = `Maximum commands (${puzzle.constraints.maxCommands}) reached. Use undo or restart.`;
      setOutput(prev => [...prev, `$ ${commandString}`, `Error: ${errorMsg}`]);
      return { success: false, message: errorMsg };
    }

    // Map command string to type
    const commandTypeMap: Record<string, GameCommand['type']> = {
      commit: 'commit',
      checkout: 'checkout',
      branch: 'branch',
      merge: 'merge',
      rebase: 'rebase',
    };

    const commandType = commandTypeMap[parsed.command];
    if (!commandType) {
      const errorMsg = `Unknown command: git ${parsed.command}`;
      setOutput(prev => [...prev, `$ ${commandString}`, `Error: ${errorMsg}`]);
      return { success: false, message: errorMsg };
    }

    // Check maxCheckouts constraint
    if (commandType === 'checkout' && puzzle) {
      if (gameState.checkoutsUsed >= puzzle.constraints.maxCheckouts) {
        const errorMsg = `Maximum checkouts (${puzzle.constraints.maxCheckouts}) reached`;
        setOutput(prev => [...prev, `$ ${commandString}`, `Error: ${errorMsg}`]);
        return { success: false, message: errorMsg };
      }
    }

    // Extract arguments
    let args = parsed.args;
    
    // Special handling for commit -m "message"
    if (commandType === 'commit') {
      const messageMatch = commandString.match(/-m\s+["'](.+?)["']/);
      if (messageMatch) {
        args = [messageMatch[1]];
      } else if (parsed.args.includes('-m')) {
        const mIndex = parsed.args.indexOf('-m');
        args = [parsed.args.slice(mIndex + 1).join(' ')];
      } else {
        args = ['Commit'];
      }
    }

    // Save current state for undo (both graph and files)
    const previousState: UndoState = {
      graph: cloneGitGraph(gameState.graph),
      files: deepClone(gameState.files),
    };

    // Execute command
    const command: GameCommand = {
      type: commandType,
      args,
      timestamp: Date.now(),
      success: false,
    };

    const result = engine.executeCommand(command);
    command.success = result.success;
    command.message = result.message;

    // Update output
    setOutput(prev => [
      ...prev,
      `$ ${commandString}`,
      result.success ? `✓ ${result.message}` : `Error: ${result.message}`,
    ]);

    if (!result.success) {
      return result;
    }

    // Update state
    setGameState(prev => {
      if (!prev) return null;
      
      const newState: GameState = {
        ...prev,
        graph: engine.getGraph(),
        files: engine.getFiles(),
        commandHistory: [...prev.commandHistory, command],
        undoStack: [...prev.undoStack, previousState],
        commandsUsed: prev.commandsUsed + 1,
        checkoutsUsed: commandType === 'checkout' ? prev.checkoutsUsed + 1 : prev.checkoutsUsed,
      };

      // Check for game win
      if (result.gameWon) {
        newState.status = 'won';
        newState.completedAt = Date.now();
        
        const score = calculateScore(newState.commandsUsed, newState.parScore);
        const reward: GameReward = {
          score,
          bonusPoints: Math.max(0, (newState.parScore - newState.commandsUsed) * 20),
          commandsUnderPar: newState.parScore - newState.commandsUsed,
          optimalSolution: [], // Would come from backend
        };
        
        setGameReward(reward);
        setOutput(prev => [
          ...prev,
          '',
          '🎉 Congratulations! You won!',
          `📊 Score: ${score} points`,
        ]);
      }

      // Report collected files
      if (result.filesCollected && result.filesCollected.length > 0) {
        setOutput(prev => [
          ...prev,
          `📁 Collected: ${result.filesCollected!.map(f => f.name).join(', ')}`,
        ]);
      }

      return newState;
    });

    return result;
  }, [gameState, engine, puzzle]);

  // Undo last command
  const undo = useCallback((): boolean => {
    if (!gameState || !engine || gameState.undoStack.length === 0) {
      return false;
    }

    const previousState = gameState.undoStack[gameState.undoStack.length - 1];
    const lastCommand = gameState.commandHistory[gameState.commandHistory.length - 1];
    
    // Restore both graph and files from the saved state
    engine.restoreState(previousState.graph, previousState.files);
    
    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        graph: engine.getGraph(),
        files: engine.getFiles(),
        commandHistory: prev.commandHistory.slice(0, -1),
        undoStack: prev.undoStack.slice(0, -1),
        commandsUsed: Math.max(0, prev.commandsUsed - 1),
        checkoutsUsed: lastCommand?.type === 'checkout' 
          ? Math.max(0, prev.checkoutsUsed - 1) 
          : prev.checkoutsUsed,
      };
    });

    return true;
  }, [gameState, engine]);

  // Reset game
  const resetGame = useCallback(() => {
    setGameState(null);
    setPuzzle(null);
    setEngine(null);
    setOutput([]);
    setGameReward(null);
    setError(null);
    saveToStorage(STORAGE_KEY, null);
  }, []);

  return {
    gameState,
    puzzle,
    isLoading,
    error,
    output,
    startGame,
    executeCommand,
    undo,
    resetGame,
    gameReward,
    isGameEnded: gameState?.status === 'won' || gameState?.status === 'abandoned',
  };
}
