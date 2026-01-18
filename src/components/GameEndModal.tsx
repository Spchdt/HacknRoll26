import { useState, useRef } from 'react';
import { Trophy, GitBranch, Star, Share2, X } from 'lucide-react';
import { toPng } from 'html-to-image';
import { cn } from '@/lib/utils';

interface GameEndModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: any | null; // GameRewards from API or GameReward for legacy
  commandsUsed: number;
  parScore: number;
  onSetUsername?: () => void;
}

// Share card component - shows stats without revealing solution
function ShareCard({ 
  date,
  score, 
  commandsUsed, 
  parScore, 
  bonusPoints,
  underPar 
}: { 
  score: number; 
  commandsUsed: number; 
  parScore: number;
  date?: string;
  bonusPoints: number;
  underPar: boolean;
}) {
  const diff = parScore - commandsUsed;
  
  return (
    <div className="w-64 bg-gray-800 rounded-lg p-4 text-white">
      {/* Date */}
      {date && (
        <div className="text-center text-xs text-gray-400 mb-2">{date}</div>
      )}
      
      {/* Result */}
      <div className="text-center py-4">
        <div className={cn(
          "text-5xl font-bold mb-1",
          underPar ? "text-green-400" : "text-amber-400"
        )}>
          {score}
        </div>
        <div className="text-gray-400 text-sm">points</div>
      </div>
      
      {/* Stats bar */}
      <div className="flex justify-center gap-6 py-3 border-t border-white/10">
        <div className="text-center">
          <div className="font-mono font-bold">{commandsUsed}/{parScore}</div>
          <div className="text-xs text-gray-500">commands</div>
        </div>
        {underPar && (
          <div className="text-center">
            <div className="font-bold text-green-400">-{diff}</div>
            <div className="text-xs text-gray-500">under par</div>
          </div>
        )}
        {bonusPoints > 0 && (
          <div className="text-center">
            <div className="font-bold text-amber-400">+{bonusPoints}</div>
            <div className="text-xs text-gray-500">bonus</div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="text-center text-xs text-gray-500 mt-3">
        gitty.phanuphats.com
      </div>
    </div>
  );
}

export default function GameEndModal({
  isOpen,
  onClose,
  reward,
  commandsUsed,
  parScore,
  onSetUsername,
}: GameEndModalProps) {
  const [showSharePreview, setShowSharePreview] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);
  
  if (!isOpen || !reward) return null;

  const underPar = commandsUsed <= parScore;
  const diff = parScore - commandsUsed;
  const bonusPoints = reward.bonusPoints ?? 0;

  const handleShare = async () => {
    if (!shareCardRef.current) return;
    
    setIsSharing(true);
    try {
      const dataUrl = await toPng(shareCardRef.current, { 
        backgroundColor: '#1f2937',
        pixelRatio: 2 
      });
      
      const text = `Gitty - Daily Git Puzzle
Score: ${reward.score}
Commands: ${commandsUsed}/${parScore} par
${diff > 0 ? `${diff} under par! 🎉` : ''}

Play at: https://gitty.phanuphats.com`;
      
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'gitty-result.png', { type: 'image/png' });
      
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ text, files: [file] });
      } else if (navigator.share) {
        await navigator.share({ text });
      } else {
        // Fallback: download image
        const link = document.createElement('a');
        link.download = 'gitty-result.png';
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Share preview modal
  if (showSharePreview) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-sm w-full p-4 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Share Preview</h3>
            <button 
              onClick={() => setShowSharePreview(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Preview */}
          <div className="flex justify-center mb-4" ref={shareCardRef}>
            <ShareCard 
              date={new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              score={reward.score}
              commandsUsed={commandsUsed}
              parScore={parScore}
              bonusPoints={bonusPoints}
              underPar={underPar}
            />
          </div>
          
          {/* Share button */}
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="w-full py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Share2 size={18} />
            {isSharing ? 'Sharing...' : 'Share'}
          </button>
        </div>
      </div>
    );
  }

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
        <div className="grid grid-cols-3 gap-4 mb-4">
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

        {/* Bonus Points */}
        {bonusPoints > 0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
            <div className="text-amber-600 font-bold text-lg">+{bonusPoints} Bonus Points!</div>
            <div className="text-xs text-amber-500">For completing under par</div>
          </div>
        )}

        {/* Optimal Solution */}
        {reward.optimalSolution && reward.optimalSolution.length > 0 && (
          <div className="mb-6">
            <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
              <GitBranch size={16} />
              Optimal Solution ({reward.optimalSolution.length} commands)
            </h3>
            <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-xs max-h-32 overflow-y-auto">
              {reward.optimalSolution.map((cmd: any, i: number) => (
                <div key={i}>
                  $ git {cmd.type} {cmd.args.join(' ')}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={() => setShowSharePreview(true)}
            className="w-full py-2 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            <Share2 size={18} />
            Share Result
          </button>
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
