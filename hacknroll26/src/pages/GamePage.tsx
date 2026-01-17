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
import { Gamepad2, Package, AlertCircle, Star, Terminal, History } from 'lucide-react';
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
  const archiveDate = searchParams.get('date');
  
  const showTutorial = !hasSeenTutorial;

  const today = new Date().toISOString().split('T')[0];
  const isToday = !archiveDate || archiveDate === today;
  
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
    // Don't auto-start
  };

  const handleSetUsername = (newUsername: string) => {
    setUsernameMutation.mutate(newUsername);
  };

  const puzzle = gameState?.puzzle;
  const isGameActive = gameState?.status === 'in_progress';

  return (
    <div className="game-page-container">
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
          className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-4 py-2 rounded-lg backdrop-blur-md border border-white/20"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="flex items-center gap-2"><AlertCircle size={20} /> {error}</span>
        </motion.div>
      )}

      {/* 1. Header / Toolbar */}
      <header className="game-toolbar">
        <div className="toolbar-title text-gradient">
          {puzzle ? (
             <>
               <span className="text-xl">
                 {puzzle.date ? `Daily Protocol ${puzzle.date}` : `Protocol #${puzzle.id}`}
               </span>
               <div className="flex gap-1 ml-4">
                 {Array.from({ length: puzzle.difficulty }).map((_, i) => (
                   <Star key={i} size={16} className="fill-blue-400 text-blue-400" />
                 ))}
               </div>
             </>
          ) : (
             <span className="text-xl">System Standby</span>
          )}
        </div>
        
        {gameState && puzzle && (
          <div className="toolbar-stats">
            <div className="stat-pill">
              <Package size={14} className="text-primary" />
              <span>
                Files: <strong className="text-white">{gameState.collectedFiles.length}/{puzzle.fileTargets.length}</strong>
              </span>
            </div>
            <div className="stat-pill">
              <Terminal size={14} className="text-secondary" />
              <span>Ops: {gameState.commandCount}</span>
            </div>
          </div>
        )}
      </header>

      {/* 2. Graph Area (Middle) */}
      <main className="game-graph-area bg-slate-900/50 relative">
        {gameState && puzzle ? (
          <GitGraphView
            graph={gameState.graph}
            fileTargets={puzzle.fileTargets}
            branches={puzzle.branches}
            maxDepth={puzzle.maxDepth}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500">
            Waiting for initialization...
          </div>
        )}

        {/* Start Game Overlay (Centered in graph area) */}
        {!gameState && !isLoading && hasSeenTutorial && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
             <motion.div
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="start-game-card"
             >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2 text-white">
                    {isToday ? "Initialize Sequence" : `Archive Access: ${archiveDate}`}
                  </h2>
                  <p className="text-slate-400">Enter command to begin protocol</p>
                </div>
                
                <form onSubmit={handleCloneSubmit} className="space-y-4">
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-mono">$</span>
                    <input
                      type="text"
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-8 pr-4 text-white font-mono focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                      value={cloneInput}
                      onChange={(e) => setCloneInput(e.target.value)}
                      placeholder={expectedCommand}
                      autoFocus
                    />
                  </div>
                  {cloneError && (
                    <p className="text-red-400 text-sm">{cloneError}</p>
                  )}
                  <Button type="submit" className="w-full btn-primary h-12 text-lg">
                    EXECUTE
                  </Button>
                </form>
             </motion.div>
          </div>
        )}
        
        {/* Loading Overlay */}
        {isLoading && (
           <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm">
             <div className="loading-spinner mb-4" />
             <p className="text-primary font-mono animate-pulse">ESTABLISHING CONNECTION...</p>
           </div>
        )}
      </main>

      {/* 3. Command Area (Bottom) */}
      <section className="game-command-area">
        {gameState && (
          <div className="w-full max-w-4xl mx-auto flex gap-6">
            <div className="flex-1">
              <CommandInput
                onCommand={handleCommand}
                isLoading={isLoading}
                constraints={puzzle?.constraints || null}
                commandCount={gameState.commandCount}
                checkoutCount={gameState.checkoutCount}
                consecutiveCommits={gameState.consecutiveCommits}
                availableBranches={puzzle?.branches || []}
                disabled={!isGameActive}
              />
            </div>
            
            {/* Mini History Log - Only visible on desktop/large screens */}
            <div className="hidden lg:block w-64 h-32 overflow-y-auto bg-slate-950/30 rounded-lg p-3 border border-white/5 font-mono text-xs">
               <div className="flex items-center gap-2 text-slate-400 mb-2 pb-2 border-b border-white/5 sticky top-0 bg-slate-950/0 backdrop-blur-sm">
                 <History size={12} /> <span>LOGS</span>
               </div>
               <div className="space-y-1">
                 {gameState.commandHistory.map((cmd, idx) => (
                   <div key={idx} className="text-slate-300">
                     <span className="text-slate-600 mr-2">{idx + 1}</span>
                     git {cmd.type}
                   </div>
                 ))}
                 {gameState.commandHistory.length === 0 && <span className="text-slate-600">No logs...</span>}
               </div>
            </div>
          </div>
        )}
        
        {!gameState && (
           <div className="text-center text-slate-500 font-mono text-sm w-full">
             AWAITING SYSTEM INITIALIZATION
           </div>
        )}
      </section>
    </div>
  );
}

