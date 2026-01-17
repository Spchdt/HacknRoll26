import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, useUserPrefsStore } from '../stores';
import { useStartGame, useSendCommand, useSetUsername } from '../api/hooks';
import { GitGraphView } from '../components/GitGraph';
import { CommandInput } from '../components/CommandInput';
import { Tutorial } from '../components/Tutorial';
import { GameResultPopup } from '../components/GameResultPopup';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Gamepad2, Package, AlertCircle, Star } from 'lucide-react';
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
  const [cloneInput, setCloneInput] = useState('');
  const [cloneError, setCloneError] = useState('');

  const startGame = useStartGame();
  const sendCommand = useSendCommand();
  const setUsernameMutation = useSetUsername();

  const [searchParams] = useSearchParams();
  const archiveDate = searchParams.get('date'); // e.g., "2026-01-15" from archive
  
  const showTutorial = !hasSeenTutorial;

  // Get today's date
  const today = new Date().toISOString().split('T')[0]; // "2026-01-17"
  const isToday = !archiveDate || archiveDate === today;
  
  // Expected command based on whether it's today or archive
  const expectedCommand = isToday 
    ? 'git init' 
    : `git clone https://hacknroll26.io/${archiveDate}`;

  const handleCloneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = cloneInput.trim().toLowerCase();
    const expected = expectedCommand.toLowerCase();
    if (input === expected) {
      setCloneError('');
      startGame.mutate(isToday ? 'daily' : `puzzle-${archiveDate}`);
    } else {
      setCloneError(`Hint: ${expectedCommand}`);
    }
  };

  const handleCommand = (command: GameCommand) => {
    sendCommand.mutate(command);
  };

  const handleTutorialComplete = () => {
    // Don't auto-start, wait for git clone
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
          <span className="flex items-center gap-2"><AlertCircle size={20} /> {error}</span>
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
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>
                    {puzzle.date ? `Daily Puzzle - ${puzzle.date}` : `Puzzle #${puzzle.id}`}
                  </span>
                  <span className="text-xl flex gap-1">
                    {Array.from({ length: puzzle.difficulty }).map((_, i) => (
                      <Star key={i} size={20} className="fill-yellow-400 text-yellow-400" />
                    ))}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Files Collected</span>
                  <strong className="text-primary">
                    {gameState.collectedFiles.length}/{puzzle.fileTargets.length}
                  </strong>
                </div>
              </CardContent>
            </Card>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Command History</CardTitle>
              </CardHeader>
              <CardContent>
                {gameState.commandHistory.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No commands executed yet</p>
                ) : (
                  <div className="space-y-2">
                    {gameState.commandHistory.map((cmd, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm font-mono bg-muted p-2 rounded">
                        <span className="text-muted-foreground min-w-6">{index + 1}.</span>
                        <code className="text-foreground break-all">
                          git {cmd.type}
                          {cmd.type === 'commit' && ` -m "${cmd.message}"`}
                          {cmd.type === 'branch' && ` ${cmd.name}`}
                          {cmd.type === 'checkout' && ` ${cmd.target}`}
                          {cmd.type === 'merge' && ` ${cmd.branch}`}
                          {cmd.type === 'rebase' && ` ${cmd.onto}`}
                        </code>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Game completed message */}
          {gameState.status === 'completed' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-center"
            >
              <Card className="max-w-md text-center">
                <CardHeader>
                  <CardTitle className="text-3xl">🎉 Puzzle Completed!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-muted-foreground text-sm mb-1">Final Score</p>
                    <p className="text-3xl font-bold text-primary">{gameState.score}</p>
                  </div>
                  <Button
                    onClick={() => setShowResultPopup(true)}
                    className="w-full"
                  >
                    View Full Results
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      )}

      {/* Start game prompt (when not started) */}
      {!gameState && !isLoading && hasSeenTutorial && (
        <div className="start-game-container flex items-center justify-center min-h-[80vh] px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle className="text-center">
                  {isToday ? (
                    <div className="flex items-center justify-center gap-2">
                      <Gamepad2 size={24} />
                      <span>Today's Puzzle</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Package size={24} />
                      <span>Archive Puzzle: {archiveDate}</span>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-sm text-muted-foreground">
                  {isToday 
                    ? 'Initialize a new repository to start:' 
                    : 'Clone the puzzle repository to start:'}
                </p>
                {!isToday && (
                  <p className="text-center text-xs font-mono bg-muted p-2 rounded">
                    https://hacknroll26.io/{archiveDate}
                  </p>
                )}
                <form onSubmit={handleCloneSubmit} className="space-y-3">
                  <div className="flex items-center gap-2 bg-muted p-2 rounded">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      value={cloneInput}
                      onChange={(e) => setCloneInput(e.target.value)}
                      placeholder={isToday ? 'git init' : 'git clone https://...'}
                      className="border-0 bg-transparent focus-visible:ring-0"
                      autoFocus
                    />
                  </div>
                  {cloneError && (
                    <motion.p
                      className="text-sm text-destructive"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {cloneError}
                    </motion.p>
                  )}
                  <Button type="submit" className="w-full">
                    Execute
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
