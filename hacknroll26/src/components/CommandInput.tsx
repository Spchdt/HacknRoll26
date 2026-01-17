import { useState } from 'react';
import { motion } from 'framer-motion';
import type { GameCommand, CommandType, PuzzleConstraints } from '../types';

interface CommandInputProps {
  onCommand: (command: GameCommand) => void;
  isLoading: boolean;
  constraints: PuzzleConstraints | null;
  commandCount: number;
  checkoutCount: number;
  consecutiveCommits: number;
  availableBranches: string[];
  disabled: boolean;
}

const commandDescriptions: Record<CommandType, string> = {
  commit: 'Create a new commit at the current position',
  branch: 'Create a new branch at the current HEAD',
  checkout: 'Move HEAD to a branch or commit',
  merge: 'Merge another branch into the current branch',
  rebase: 'Rebase current branch onto another branch',
  undo: 'Undo the last command',
};

export function CommandInput({
  onCommand,
  isLoading,
  constraints,
  commandCount,
  checkoutCount,
  consecutiveCommits,
  availableBranches,
  disabled,
}: CommandInputProps) {
  const [selectedCommand, setSelectedCommand] = useState<CommandType | null>(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [targetBranch, setTargetBranch] = useState('');

  const handleSubmit = () => {
    if (!selectedCommand || isLoading || disabled) return;

    let command: GameCommand;

    switch (selectedCommand) {
      case 'commit':
        command = { type: 'commit', message: commitMessage || 'commit' };
        break;
      case 'branch':
        if (!targetBranch) return;
        command = { type: 'branch', name: targetBranch };
        break;
      case 'checkout':
        if (!targetBranch) return;
        command = { type: 'checkout', target: targetBranch };
        break;
      case 'merge':
        if (!targetBranch) return;
        command = { type: 'merge', branch: targetBranch };
        break;
      case 'rebase':
        if (!targetBranch) return;
        command = { type: 'rebase', onto: targetBranch };
        break;
      case 'undo':
        command = { type: 'undo' };
        break;
      default:
        return;
    }

    onCommand(command);
    setSelectedCommand(null);
    setCommitMessage('');
    setTargetBranch('');
  };

  const canExecute = () => {
    if (!selectedCommand || isLoading || disabled) return false;
    if (!constraints) return true;

    switch (selectedCommand) {
      case 'commit':
        return (
          commandCount < constraints.maxCommands &&
          consecutiveCommits < constraints.maxConsecutiveCommits
        );
      case 'checkout':
        return (
          commandCount < constraints.maxCommands &&
          checkoutCount < constraints.maxCheckouts &&
          !!targetBranch
        );
      case 'branch':
      case 'merge':
      case 'rebase':
        return commandCount < constraints.maxCommands && !!targetBranch;
      case 'undo':
        return true;
      default:
        return false;
    }
  };

  const commandButtons: CommandType[] = ['commit', 'checkout', 'merge', 'rebase', 'undo'];

  return (
    <div className="command-input">
      {/* Constraints display */}
      {constraints && (
        <div className="constraints-display">
          <div className="constraint">
            <span className="constraint-label">Commands</span>
            <span className={`constraint-value ${commandCount >= constraints.maxCommands ? 'limit' : ''}`}>
              {commandCount}/{constraints.maxCommands}
            </span>
          </div>
          <div className="constraint">
            <span className="constraint-label">Checkouts</span>
            <span className={`constraint-value ${checkoutCount >= constraints.maxCheckouts ? 'limit' : ''}`}>
              {checkoutCount}/{constraints.maxCheckouts}
            </span>
          </div>
          <div className="constraint">
            <span className="constraint-label">Consecutive Commits</span>
            <span className={`constraint-value ${consecutiveCommits >= constraints.maxConsecutiveCommits ? 'limit' : ''}`}>
              {consecutiveCommits}/{constraints.maxConsecutiveCommits}
            </span>
          </div>
        </div>
      )}

      {/* Command buttons */}
      <div className="command-buttons">
        {commandButtons.map((cmd) => (
          <motion.button
            key={cmd}
            className={`command-btn ${selectedCommand === cmd ? 'selected' : ''}`}
            onClick={() => setSelectedCommand(cmd)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={disabled}
          >
            <span className="command-name">git {cmd}</span>
          </motion.button>
        ))}
      </div>

      {/* Command-specific inputs */}
      {selectedCommand && (
        <motion.div
          className="command-params"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="command-description">{commandDescriptions[selectedCommand]}</p>

          {selectedCommand === 'commit' && (
            <input
              type="text"
              className="input"
              placeholder="Commit message (optional)"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
            />
          )}

          {['branch', 'checkout', 'merge', 'rebase'].includes(selectedCommand) && (
            <select
              className="select"
              value={targetBranch}
              onChange={(e) => setTargetBranch(e.target.value)}
            >
              <option value="">Select a branch...</option>
              {availableBranches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          )}

          <div className="command-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setSelectedCommand(null)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!canExecute()}
            >
              {isLoading ? 'Executing...' : 'Execute'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
