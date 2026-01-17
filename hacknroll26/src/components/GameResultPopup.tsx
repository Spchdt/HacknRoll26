import { useState } from 'react';
import { motion } from 'framer-motion';
import { type GameResult, type GameCommand } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Trophy, Star, ThumbsUp, Zap, Sparkles } from 'lucide-react';

interface GameResultPopupProps {
  result: GameResult;
  onClose: () => void;
  onSetUsername?: (username: string) => void;
  showUsernamePrompt: boolean;
}

export function GameResultPopup({
  result,
  onClose,
  onSetUsername,
  showUsernamePrompt,
}: GameResultPopupProps) {
  const [username, setUsername] = useState('');
  const [wantsLeaderboard, setWantsLeaderboard] = useState(true);

  const scorePercentage = Math.round((result.parScore / result.commandsUsed) * 100);
  const timeMinutes = Math.floor(result.timeElapsed / 60000);
  const timeSeconds = Math.floor((result.timeElapsed % 60000) / 1000);

  const handleSubmit = () => {
    if (wantsLeaderboard && username.trim() && onSetUsername) {
      onSetUsername(username.trim());
    }
    onClose();
  };

  const getScoreEmoji = () => {
    if (scorePercentage >= 100) return <Trophy className="w-10 h-10" />;
    if (scorePercentage >= 80) return <Star className="w-10 h-10" />;
    if (scorePercentage >= 60) return <ThumbsUp className="w-10 h-10" />;
    return <Zap className="w-10 h-10" />;
  };

  const formatCommand = (cmd: GameCommand): string => {
    switch (cmd.type) {
      case 'commit':
        return `git commit -m "${cmd.message}"`;
      case 'branch':
        return `git branch ${cmd.name}`;
      case 'checkout':
        return `git checkout ${cmd.target}`;
      case 'merge':
        return `git merge ${cmd.branch}`;
      case 'rebase':
        return `git rebase ${cmd.onto}`;
      case 'undo':
        return 'undo';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        className="bg-card text-card-foreground rounded-lg border border-border shadow-lg max-w-md w-full mx-4 p-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="text-center mb-6">
          <div className="text-center">{getScoreEmoji()}</div>
          <h2 className="text-2xl font-bold mt-2">{result.won ? 'Puzzle Completed!' : 'Time\'s Up!'}</h2>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-primary">{result.score}</div>
              <div className="text-xs text-muted-foreground">Score</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-primary">{result.commandsUsed}</div>
              <div className="text-xs text-muted-foreground">Commands</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-primary">{result.parScore}</div>
              <div className="text-xs text-muted-foreground">Par</div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mb-6 p-4 bg-muted rounded-lg text-sm">
          <span className="font-mono">{timeMinutes}:{timeSeconds.toString().padStart(2, '0')}</span>
          <div className="text-muted-foreground text-xs mt-1">Elapsed Time</div>
        </div>

        {scorePercentage >= 100 && (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-6 text-center">
            <span className="flex items-center justify-center gap-2 text-sm font-semibold text-green-900 dark:text-green-100">
              <Sparkles size={18} className="text-yellow-500" /> You matched the optimal solution!
            </span>
          </div>
        )}

        {/* Optimal solution */}
        <div className="mb-6">
          <h3 className="font-semibold text-sm mb-3">Optimal Solution ({result.optimalSolution.length} commands)</h3>
          <div className="space-y-2 bg-slate-50 dark:bg-slate-900 rounded-lg p-3 border border-border">
            {result.optimalSolution.map((cmd, index) => (
              <code key={index} className="text-xs block text-foreground font-mono">
                {formatCommand(cmd)}
              </code>
            ))}
          </div>
        </div>

        {/* Username prompt for new users */}
        {showUsernamePrompt && (
          <div className="bg-muted rounded-lg p-4 mb-6 space-y-3">
            <h3 className="font-semibold">Join the Leaderboard?</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={wantsLeaderboard}
                onChange={(e) => setWantsLeaderboard(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Yes, add me to the leaderboard</span>
            </label>
            
            {wantsLeaderboard && (
              <Input
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
              />
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button className="w-full" onClick={handleSubmit}>
            {showUsernamePrompt ? 'Save & Close' : 'Close'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
