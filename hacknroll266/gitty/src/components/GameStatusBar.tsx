import { Gamepad2, Clock, Terminal } from 'lucide-react';
import type { GameState } from '@/lib/types';
import { cn } from '@/lib/utils';

interface GameStatusBarProps {
  gameState: GameState | null;
  className?: string;
}

export default function GameStatusBar({ gameState, className }: GameStatusBarProps) {
  if (!gameState) {
    return (
      <div className={cn('flex items-center gap-4 p-3 bg-gray-100 rounded-lg', className)}>
        <span className="text-gray-400">No active game</span>
      </div>
    );
  }

  const filesCollected = gameState.files.filter(f => f.collected).length;
  const totalFiles = gameState.files.length;
  const progress = totalFiles > 0 ? (filesCollected / totalFiles) * 100 : 0;

  return (
    <div className={cn('flex flex-wrap items-center gap-4 p-3 bg-white border rounded-lg', className)}>
      {/* Game status indicator */}
      <div className="flex items-center gap-2">
        <Gamepad2 size={18} className={gameState.status === 'playing' ? 'text-green-500' : 'text-gray-400'} />
        <span className={cn(
          'text-sm font-medium',
          gameState.status === 'playing' && 'text-green-600',
          gameState.status === 'won' && 'text-blue-600',
          gameState.status === 'abandoned' && 'text-gray-400'
        )}>
          {gameState.status === 'playing' && 'In Progress'}
          {gameState.status === 'won' && 'Completed!'}
          {gameState.status === 'abandoned' && 'Abandoned'}
        </span>
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-gray-300" />

      {/* Commands used */}
      <div className="flex items-center gap-2">
        <Terminal size={18} className="text-gray-400" />
        <span className="text-sm">
          <span className="font-mono font-bold">{gameState.commandsUsed}</span>
          <span className="text-gray-400"> / {gameState.parScore} par</span>
        </span>
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-gray-300" />

      {/* Files progress */}
      <div className="flex items-center gap-2 flex-1">
        <span className="text-sm font-mono">
          {filesCollected}/{totalFiles} files
        </span>
        <div className="flex-1 max-w-[100px] bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Undo available */}
      {gameState.undoStack.length > 0 && (
        <>
          <div className="h-4 w-px bg-gray-300" />
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Clock size={14} />
            <span>{gameState.undoStack.length} undo{gameState.undoStack.length !== 1 ? 's' : ''}</span>
          </div>
        </>
      )}
    </div>
  );
}
