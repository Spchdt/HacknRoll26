import { useState, useEffect } from 'react';
import { RefreshCw, HelpCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useApiGame } from '@/hooks/useApiGame';
import { useAuth } from '@/hooks/useAuth';
import { useDarkMode } from '@/layouts/MainLayout';
import {
  GitGraph,
  GitGraphSkeleton,
  CommandInput,
  CommandHistory,
  GameEndModal,
  TutorialModal,
  SetNameModal,
} from '@/components';
import { cn, hasSeenTutorial, markTutorialSeen } from '@/lib/utils';

export default function GamePage() {
  const [searchParams] = useSearchParams();
  const { setUsername: setUsernameApi } = useAuth();
  const { isDarkMode } = useDarkMode();
  
  const {
    gameState,
    puzzle,
    isLoading,
    output,
    startGame,
    executeCommandString,
    resetGame,
    gameReward,
    isGameEnded,
  } = useApiGame();

  const [showTutorial, setShowTutorial] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [isSettingUsername, setIsSettingUsername] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);

  // Check for archive puzzle in URL params
  useEffect(() => {
    const puzzleId = searchParams.get('puzzle');
    if (puzzleId && !gameState) {
      startGame(puzzleId);
    }
  }, [searchParams, gameState, startGame]);

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

  // Handle command submission - now uses string parsing including 'git init'
  const handleCommand = (command: string) => {
    setCommandHistory(prev => [...prev, command]);
    executeCommandString(command);
  };

  // Handle tutorial close - user will type 'git init' to start
  const handleTutorialClose = () => {
    setShowTutorial(false);
    markTutorialSeen();
  };

  // Handle game start
  const handleStartGame = () => {
    resetGame();
    startGame();
  };

  // Handle share
  const handleShare = () => {
    if (!gameState || !gameReward) return;
    
    const text = `Gitty - Daily Puzzle
Score: ${gameReward.score}
Commands: ${gameState.commandsUsed ?? 0}/${gameState.parScore ?? '?'} par
${(gameReward.commandsUnderPar ?? 0) > 0 ? `${gameReward.commandsUnderPar} under par!` : ''}

Play at: [your-url]`;
    
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Result copied to clipboard!');
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] gap-3">
      {/* Left sidebar - Game info */}
      {gameState && (
        <div className="w-44 shrink-0 flex flex-col gap-3">
          {/* Game Status */}
          <div className="bg-white border rounded-lg p-3 space-y-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-2 h-2 rounded-full',
                gameState.status === 'playing' ? 'bg-green-500' : 'bg-gray-400'
              )} />
              <span className={cn(
                'text-sm font-medium',
                gameState.status === 'playing' && 'text-green-600',
                gameState.status === 'won' && 'text-blue-600'
              )}>
                {gameState.status === 'playing' && 'Playing'}
                {gameState.status === 'won' && 'Completed!'}
                {gameState.status === 'abandoned' && 'Abandoned'}
              </span>
            </div>
            
            <div className="text-sm">
              <span className="text-gray-500">Commands:</span>
              <span className={cn(
                'font-mono font-bold ml-1',
                puzzle?.constraints && gameState.commandsUsed && gameState.commandsUsed >= puzzle.constraints.maxCommands && 'text-red-600'
              )}>{gameState.commandsUsed ?? 0}</span>
              <span className="text-gray-400">/{puzzle?.constraints?.maxCommands ?? '?'}</span>
              <span className="text-gray-300 ml-1">(par: {gameState.parScore ?? '?'})</span>
            </div>

            {(gameState.undoStack ?? []).length > 0 && (
              <div className="text-xs text-gray-500">
                {gameState.undoStack?.length ?? 0} undo available
              </div>
            )}
          </div>

          {/* Files to collect */}
          <div className="bg-white border rounded-lg p-3 flex-1 overflow-y-auto">
            <div className="text-sm font-bold mb-2">
              Files ({(gameState.files ?? []).filter((f: any) => f.collected).length}/{(gameState.files ?? []).length})
            </div>
            <div className="space-y-1.5">
              {(gameState.files ?? []).map((file: any) => (
                <div
                  key={file.id}
                  className={cn(
                    'flex items-center gap-1.5 text-xs p-1.5 rounded',
                    file.collected ? 'bg-green-50 text-green-700' : 'bg-gray-50'
                  )}
                >
                  <span className={file.collected ? 'line-through' : ''}>
                    {file.collected ? '✓' : '○'} {file.name}
                  </span>
                </div>
              ))}
            </div>
            {(gameState.files ?? []).every((f: any) => f.collected) && (
              <div className="mt-2 text-xs text-amber-600 font-medium">
                Merge to main!
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="bg-white border rounded-lg px-3 py-2 text-xs space-y-1">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              Collected
            </span>
            <span className="flex items-center gap-2">
              <svg width="12" height="14" viewBox="0 0 12 14" className="text-amber-500">
                <rect x="1" y="1" width="10" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3,2" />
              </svg>
              Target
            </span>
            <span className="flex items-center gap-2">
              <span className="text-[10px] font-bold">HEAD</span>
              Current
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-1">
            <button
              onClick={() => setShowTutorial(true)}
              className="flex-1 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md border text-xs"
              title="Help"
            >
              <HelpCircle size={16} className="mx-auto" />
            </button>
            <button
              onClick={handleStartGame}
              className="flex-1 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md border text-xs"
              title="New Game"
            >
              <RefreshCw size={16} className="mx-auto" />
            </button>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className={cn(
        "flex-1 flex flex-col gap-3 min-w-0",
        !gameState && "justify-center"
      )}>
        {/* Git Graph Visualization */}
        {(isLoading || gameState?.graph) && (
          <div className="flex-1 min-h-[120px]">
            {isLoading ? (
              <GitGraphSkeleton className="h-full" />
            ) : gameState?.graph ? (
              <GitGraph
                graph={gameState.graph}
                files={gameState.files ?? []}
                className="h-full"
              />
            ) : null}
          </div>
        )}

        {/* Command terminal area */}
        <div className="space-y-2 shrink-0">
          <CommandHistory
            commands={gameState?.commandHistory ?? []}
            output={output}
            className="h-32 md:h-40"
          />
          <CommandInput
            onSubmit={handleCommand}
            disabled={gameState?.status === 'won' || gameState?.status === 'abandoned'}
            history={commandHistory}
          />
        </div>
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
        isLoading={isSettingUsername}
        onSubmit={async (username) => {
          setIsSettingUsername(true);
          try {
            const success = await setUsernameApi(username);
            if (success) {
              setShowNameModal(false);
            }
          } finally {
            setIsSettingUsername(false);
          }
        }}
      />
    </div>
  );
}
