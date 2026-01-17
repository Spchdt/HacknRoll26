import { motion } from 'framer-motion';
import type { GameResult, GameCommand } from '../types';

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
    if (scorePercentage >= 100) return '🏆';
    if (scorePercentage >= 80) return '🌟';
    if (scorePercentage >= 60) return '👍';
    return '💪';
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
    <div className="popup-overlay">
      <motion.div
        className="popup-modal result-popup"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="result-header">
          <span className="result-emoji">{getScoreEmoji()}</span>
          <h2>{result.won ? 'Puzzle Completed!' : 'Time\'s Up!'}</h2>
        </div>

        <div className="result-stats">
          <div className="stat-card">
            <span className="stat-value">{result.score}</span>
            <span className="stat-label">Score</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{result.commandsUsed}</span>
            <span className="stat-label">Commands</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{result.parScore}</span>
            <span className="stat-label">Par</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{timeMinutes}:{timeSeconds.toString().padStart(2, '0')}</span>
            <span className="stat-label">Time</span>
          </div>
        </div>

        {scorePercentage >= 100 && (
          <div className="result-badge">
            🎉 You matched the optimal solution!
          </div>
        )}

        {/* Optimal solution */}
        <div className="optimal-solution">
          <h3>Optimal Solution ({result.optimalSolution.length} commands)</h3>
          <div className="solution-commands">
            {result.optimalSolution.map((cmd, index) => (
              <code key={index} className="solution-command">
                {formatCommand(cmd)}
              </code>
            ))}
          </div>
        </div>

        {/* Username prompt for new users */}
        {showUsernamePrompt && (
          <div className="username-prompt">
            <h3>Join the Leaderboard?</h3>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={wantsLeaderboard}
                onChange={(e) => setWantsLeaderboard(e.target.checked)}
              />
              <span>Yes, add me to the leaderboard</span>
            </label>
            
            {wantsLeaderboard && (
              <input
                type="text"
                className="input"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
              />
            )}
          </div>
        )}

        <div className="popup-actions">
          <button className="btn btn-primary" onClick={handleSubmit}>
            {showUsernamePrompt ? 'Save & Close' : 'Close'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

import { useState } from 'react';
