import { useState, useEffect } from 'react';
import { RefreshCw, HelpCircle } from 'lucide-react';
import { useGame } from '@/hooks/useGame';
import {
  GitGraph,
  GitGraphSkeleton,
  CommandInput,
  CommandHistory,
  FileTracker,
  GameStatusBar,
  GameEndModal,
  TutorialModal,
  SetNameModal,
} from '@/components';
import { hasSeenTutorial, markTutorialSeen } from '@/lib/utils';

export default function GamePage() {
  const {
    gameState,
    isLoading,
    output,
    startGame,
    executeCommand,
    resetGame,
    gameReward,
    isGameEnded,
  } = useGame();

  const [showTutorial, setShowTutorial] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);

  // Show tutorial on first visit
  useEffect(() => {
    if (!hasSeenTutorial()) {
      setShowTutorial(true);
    }
  }, []);

  // Show end modal when game is won
  useEffect(() => {
    if (isGameEnded && gameReward) {
      setShowEndModal(true);
    }
  }, [isGameEnded, gameReward]);

  // Handle command submission
  const handleCommand = (command: string) => {
    setCommandHistory(prev => [...prev, command]);
    executeCommand(command);
  };

  // Handle tutorial close
  const handleTutorialClose = () => {
    setShowTutorial(false);
    markTutorialSeen();
    if (!gameState) {
      startGame();
    }
  };

  // Handle game start
  const handleStartGame = () => {
    resetGame();
    startGame();
  };

  // Handle share
  const handleShare = () => {
    if (!gameState || !gameReward) return;
    
    const text = `🎮 Gitty - Daily Puzzle
📊 Score: ${gameReward.score}
⌨️ Commands: ${gameState.commandsUsed}/${gameState.parScore} par
${gameReward.commandsUnderPar > 0 ? `🏆 ${gameReward.commandsUnderPar} under par!` : ''}

Play at: [your-url]`;
    
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Result copied to clipboard!');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] gap-4">
      {/* Top bar with game status */}
      <div className="flex items-center justify-between gap-4">
        <GameStatusBar gameState={gameState} className="flex-1" />
        <div className="flex gap-2">
          <button
            onClick={() => setShowTutorial(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
            title="Help"
          >
            <HelpCircle size={20} />
          </button>
          <button
            onClick={handleStartGame}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
            title="New Game"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Main game area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Git Graph Visualization */}
        <div className="flex-1 min-h-[200px] lg:min-h-0">
          {isLoading ? (
            <GitGraphSkeleton className="h-full" />
          ) : gameState ? (
            <GitGraph
              graph={gameState.graph}
              files={gameState.files}
              className="h-full"
            />
          ) : (
            <div className="h-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-8">
              <p className="text-gray-500 text-center mb-4">
                Ready to start a new puzzle?
              </p>
              <button
                onClick={() => startGame()}
                className="px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800"
              >
                Start Daily Puzzle
              </button>
            </div>
          )}
        </div>

        {/* Sidebar with file tracker */}
        {gameState && (
          <div className="lg:w-64 flex-shrink-0">
            <FileTracker files={gameState.files} />
          </div>
        )}
      </div>

      {/* Command terminal area */}
      <div className="space-y-2">
        <CommandHistory
          commands={gameState?.commandHistory || []}
          output={output}
          className="h-36 md:h-44"
        />
        <CommandInput
          onSubmit={handleCommand}
          disabled={!gameState || gameState.status !== 'playing'}
          history={commandHistory}
        />
      </div>

      {/* Modals */}
      <TutorialModal
        isOpen={showTutorial}
        onClose={handleTutorialClose}
      />
      
      <GameEndModal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        reward={gameReward}
        commandsUsed={gameState?.commandsUsed || 0}
        parScore={gameState?.parScore || 0}
        onShare={handleShare}
        onSetUsername={() => {
          setShowEndModal(false);
          setShowNameModal(true);
        }}
      />
      
      <SetNameModal
        isOpen={showNameModal}
        onClose={() => setShowNameModal(false)}
        onSubmit={(username) => {
          console.log('Setting username:', username);
          // In production, this would call the API
          setShowNameModal(false);
        }}
      />
    </div>
  );
}
