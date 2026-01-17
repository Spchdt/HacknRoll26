import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, useUserPrefsStore } from '../stores';
import { useStartGame, useSendCommand, useSetUsername } from '../api/hooks';
import { GitGraphView } from '../components/GitGraph';
import { CommandInput } from '../components/CommandInput';
import { Tutorial } from '../components/Tutorial';
import { GameResultPopup } from '../components/GameResultPopup';
import type { GameCommand } from '../types';

export function GamePage() {
  const {
    gameState,
    gameResult,
    isLoading,
    error,
    showResultPopup,
    setShowResultPopup,
  } = useGameStore();
  const { hasSeenTutorial, username } = useUserPrefsStore();

  const startGame = useStartGame();
  const sendCommand = useSendCommand();
  const setUsernameMutation = useSetUsername();

  const showTutorial = !hasSeenTutorial;

  // Auto-start daily game
  useEffect(() => {
    if (!gameState && hasSeenTutorial && !isLoading) {
      startGame.mutate('daily');
    }
  }, [hasSeenTutorial]);

  const handleCommand = (command: GameCommand) => {
    sendCommand.mutate(command);
  };

  const handleTutorialComplete = () => {
    startGame.mutate('daily');
  };

  const handleSetUsername = (newUsername: string) => {
    setUsernameMutation.mutate(newUsername);
  };

  const puzzle = gameState?.puzzle;
  const isGameActive = gameState?.status === 'in_progress';

  return (
    <div className="game-page">
      {/* Tutorial overlay */}
      <AnimatePresence>
        {showTutorial && <Tutorial onComplete={handleTutorialComplete} />}
      </AnimatePresence>

      {/* Game result popup */}
      <AnimatePresence>
        {showResultPopup && gameResult && (
          <GameResultPopup
            result={gameResult}
            onClose={() => setShowResultPopup(false)}
            onSetUsername={handleSetUsername}
            showUsernamePrompt={!username}
          />
        )}
      </AnimatePresence>

      {/* Error display */}
      {error && (
        <motion.div
          className="error-banner"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span>⚠️ {error}</span>
        </motion.div>
      )}

      {/* Loading state */}
      {isLoading && !gameState && (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading puzzle...</p>
        </div>
      )}

      {/* Game content */}
      {gameState && puzzle && (
        <div className="game-content">
          {/* Game header */}
          <div className="game-header">
            <div className="puzzle-info">
              <h2>
                {puzzle.date ? `Daily Puzzle - ${puzzle.date}` : `Puzzle #${puzzle.id}`}
              </h2>
              <span className="difficulty">
                {'⭐'.repeat(puzzle.difficulty)}
              </span>
            </div>
            <div className="file-progress">
              <span>Files Collected: </span>
              <strong>
                {gameState.collectedFiles.length}/{puzzle.fileTargets.length}
              </strong>
            </div>
          </div>

          {/* Git graph visualization */}
          <div className="graph-section">
            <GitGraphView
              graph={gameState.graph}
              fileTargets={puzzle.fileTargets}
              branches={puzzle.branches}
              maxDepth={puzzle.maxDepth}
            />
          </div>

          {/* Command input */}
          <div className="command-section">
            <CommandInput
              onCommand={handleCommand}
              isLoading={isLoading}
              constraints={puzzle.constraints}
              commandCount={gameState.commandCount}
              checkoutCount={gameState.checkoutCount}
              consecutiveCommits={gameState.consecutiveCommits}
              availableBranches={puzzle.branches}
              disabled={!isGameActive}
            />
          </div>

          {/* Command history */}
          <div className="history-section">
            <h3>Command History</h3>
            <div className="command-history">
              {gameState.commandHistory.length === 0 ? (
                <p className="empty-history">No commands yet</p>
              ) : (
                gameState.commandHistory.map((cmd, index) => (
                  <div key={index} className="history-item">
                    <span className="history-index">{index + 1}.</span>
                    <code className="history-command">
                      git {cmd.type}
                      {cmd.type === 'commit' && ` -m "${cmd.message}"`}
                      {cmd.type === 'branch' && ` ${cmd.name}`}
                      {cmd.type === 'checkout' && ` ${cmd.target}`}
                      {cmd.type === 'merge' && ` ${cmd.branch}`}
                      {cmd.type === 'rebase' && ` ${cmd.onto}`}
                    </code>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Game completed message */}
          {gameState.status === 'completed' && (
            <motion.div
              className="game-completed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h3>🎉 Puzzle Completed!</h3>
              <p>Score: {gameState.score}</p>
              <button
                className="btn btn-primary"
                onClick={() => setShowResultPopup(true)}
              >
                View Results
              </button>
            </motion.div>
          )}
        </div>
      )}

      {/* Start game button (when not started) */}
      {!gameState && !isLoading && hasSeenTutorial && (
        <div className="start-game-container">
          <motion.button
            className="btn btn-primary btn-large"
            onClick={() => startGame.mutate('daily')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Today's Puzzle
          </motion.button>
        </div>
      )}
    </div>
  );
}
