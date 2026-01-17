import { Trophy, GitBranch, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameEndModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: any | null; // GameRewards from API or GameReward for legacy
  commandsUsed: number;
  parScore: number;
  onShare?: () => void;
  onSetUsername?: () => void;
}

export default function GameEndModal({
  isOpen,
  onClose,
  reward,
  commandsUsed,
  parScore,
  onShare,
  onSetUsername,
}: GameEndModalProps) {
  if (!isOpen || !reward) return null;

  const underPar = commandsUsed <= parScore;
  const diff = parScore - commandsUsed;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div
            className={cn(
              'w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4',
              underPar ? 'bg-green-100' : 'bg-amber-100'
            )}
          >
            {underPar ? (
              <Trophy className="w-8 h-8 text-green-600" />
            ) : (
              <Star className="w-8 h-8 text-amber-600" />
            )}
          </div>
          <h2 className="text-2xl font-bold">
            {underPar ? '🎉 Excellent!' : '✨ Well Done!'}
          </h2>
          <p className="text-gray-600 mt-1">
            {underPar
              ? `You beat par by ${diff} command${diff !== 1 ? 's' : ''}!`
              : 'You completed the puzzle!'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold">{reward.score}</div>
            <div className="text-xs text-gray-500">Score</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold">{commandsUsed}</div>
            <div className="text-xs text-gray-500">Commands</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold">{parScore}</div>
            <div className="text-xs text-gray-500">Par</div>
          </div>
        </div>

        {/* Optimal Solution */}
        {reward.optimalSolution && reward.optimalSolution.length > 0 && (
          <div className="mb-6">
            <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
              <GitBranch size={16} />
              Optimal Solution ({reward.optimalSolution.length} commands)
            </h3>
            <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-xs max-h-32 overflow-y-auto">
              {reward.optimalSolution.map((cmd: GameCommand, i: number) => (
                <div key={i}>
                  $ git {cmd.type} {cmd.args.join(' ')}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {onShare && (
            <button
              onClick={onShare}
              className="w-full py-2 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors"
            >
              Share Result
            </button>
          )}
          {onSetUsername && (
            <button
              onClick={onSetUsername}
              className="w-full py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Join Leaderboard
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
