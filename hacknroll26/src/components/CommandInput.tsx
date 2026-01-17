import { useState } from 'react';
import { motion } from 'framer-motion';
import type { GameCommand, CommandType, PuzzleConstraints } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';

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
  const [typedCommand, setTypedCommand] = useState('');
  const [useTypingMode, setUseTypingMode] = useState(false);

  // Parse typed command and execute it
  const handleTypedCommandSubmit = () => {
    const input = typedCommand.trim();
    if (!input || isLoading || disabled) return;

    const parts = input.split(' ');
    if (parts[0] !== 'git') {
      setTypedCommand('');
      return;
    }

    const cmdType = parts[1]?.toLowerCase();
    let command: GameCommand | null = null;

    try {
      switch (cmdType) {
        case 'commit': {
          const msgMatch = input.match(/-m\s+['"](.*?)['"]/) || input.match(/-m\s+(.+)/);
          const message = msgMatch ? msgMatch[1] : 'commit';
          command = { type: 'commit', message };
          break;
        }
        case 'branch': {
          const branchName = parts[2];
          if (branchName) {
            command = { type: 'branch', name: branchName };
          }
          break;
        }
        case 'checkout': {
          const target = parts[2];
          if (target) {
            command = { type: 'checkout', target };
          }
          break;
        }
        case 'merge': {
          const branch = parts[2];
          if (branch) {
            command = { type: 'merge', branch };
          }
          break;
        }
        case 'rebase': {
          const onto = parts.slice(2).join(' ');
          if (onto) {
            command = { type: 'rebase', onto };
          }
          break;
        }
        case 'undo': {
          command = { type: 'undo' };
          break;
        }
      }

      if (command) {
        onCommand(command);
        setTypedCommand('');
      }
    } catch (e) {
      // Invalid command
    }
  };

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

      {/* Typing mode toggle */}
      <div className="input-mode-toggle">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={useTypingMode}
            onChange={(e) => setUseTypingMode(e.target.checked)}
            disabled={disabled}
          />
          <span>Typing Mode</span>
        </label>
      </div>

      {/* Typing mode input */}
      {useTypingMode ? (
        <motion.div
          className="typing-input-section"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="typing-hint">Type git commands directly (e.g., "git commit -m 'message'")</p>
          <div className="typing-input-group">
            <span className="terminal-prompt">$</span>
            <Input
              placeholder="git commit | git checkout | git merge | ..."
              value={typedCommand}
              onChange={(e) => setTypedCommand(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleTypedCommandSubmit();
                }
              }}
              disabled={isLoading || disabled}
              autoFocus
            />
          </div>
          <Button
            onClick={handleTypedCommandSubmit}
            disabled={isLoading || disabled || !typedCommand.trim()}
          >
            {isLoading ? 'Executing...' : 'Execute'}
          </Button>
        </motion.div>
      ) : (
        <>
          {/* Command buttons */}
          <div className="command-buttons">
            {['commit', 'checkout', 'merge', 'rebase', 'undo'].map((cmd) => (
              <motion.div
                key={cmd}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant={selectedCommand === cmd ? 'default' : 'outline'}
                  onClick={() => setSelectedCommand(cmd as CommandType)}
                  disabled={disabled}
                  className="w-full"
                >
                  <span>git {cmd}</span>
                </Button>
              </motion.div>
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
                <Input
                  placeholder="Commit message (optional)"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                />
              )}

              {['branch', 'checkout', 'merge', 'rebase'].includes(selectedCommand) && (
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                <Button
                  variant="outline"
                  onClick={() => setSelectedCommand(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!canExecute()}
                >
                  {isLoading ? 'Executing...' : 'Execute'}
                </Button>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
