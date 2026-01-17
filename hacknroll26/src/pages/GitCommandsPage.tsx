import { useState } from 'react';
import { motion } from 'framer-motion';
import { Code, Check } from 'lucide-react';

interface GitCommand {
  id: number;
  command: string;
  description: string;
  supported: boolean;
}

const SUPPORTED_COMMANDS = ['git init', 'git clone', 'git commit', 'git checkout', 'git merge', 'git rebase', 'git undo'];

const GIT_COMMANDS: GitCommand[] = [
  {
    id: 1,
    command: 'git init',
    description: 'Initialize a new git repository in the current directory.',
    supported: true,
  },
  {
    id: 2,
    command: 'git clone <url>',
    description: 'Create a local copy of a remote repository.',
    supported: true,
  },
  {
    id: 3,
    command: 'git add <file>',
    description: 'Stage specific files for commit.',
    supported: false,
  },
  {
    id: 4,
    command: 'git add .',
    description: 'Stage all changes in the current directory for commit.',
    supported: false,
  },
  {
    id: 5,
    command: 'git commit -m "<msg>"',
    description: 'Save staged changes with a descriptive message.',
    supported: true,
  },
  {
    id: 6,
    command: 'git push',
    description: 'Upload local commits to the remote repository.',
    supported: false,
  },
  {
    id: 7,
    command: 'git pull',
    description: 'Fetch and merge remote changes into your local branch.',
    supported: false,
  },
  {
    id: 8,
    command: 'git branch',
    description: 'List all local branches or create a new branch.',
    supported: false,
  },
  {
    id: 9,
    command: 'git checkout <branch>',
    description: 'Switch to a different branch.',
    supported: true,
  },
  {
    id: 10,
    command: 'git merge <branch>',
    description: 'Combine changes from another branch into the current branch.',
    supported: true,
  },
  {
    id: 11,
    command: 'git status',
    description: 'Display the current state of the working directory and staging area.',
    supported: false,
  },
  {
    id: 12,
    command: 'git log',
    description: 'Show the commit history of the current branch.',
    supported: false,
  },
  {
    id: 13,
    command: 'git diff',
    description: 'Show differences between files in the working directory and staging area.',
    supported: false,
  },
  {
    id: 14,
    command: 'git reset <file>',
    description: 'Unstage a file from the staging area.',
    supported: false,
  },
  {
    id: 15,
    command: 'git revert <commit>',
    description: 'Create a new commit that undoes changes from a previous commit.',
    supported: false,
  },
  {
    id: 16,
    command: 'git stash',
    description: 'Temporarily save changes without committing them.',
    supported: false,
  },
  {
    id: 17,
    command: 'git rebase <branch>',
    description: 'Reapply commits on top of another branch.',
    supported: true,
  },
  {
    id: 18,
    command: 'git undo',
    description: 'Undo the last commit.',
    supported: true,
  },
];

export function GitCommandsPage() {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [showUnsupported, setShowUnsupported] = useState(false);

  const toggleFlip = (id: number) => {
    const newFlipped = new Set(flipped);
    if (newFlipped.has(id)) {
      newFlipped.delete(id);
    } else {
      newFlipped.add(id);
    }
    setFlipped(newFlipped);
  };

  const displayedCommands = showUnsupported 
    ? GIT_COMMANDS 
    : GIT_COMMANDS.filter(cmd => cmd.supported);

  return (
    <div className="git-commands-page">
      <div className="page-header">
        <h1 className="flex items-center gap-2">
          <Code size={28} /> Git Commands
        </h1>
        <p>Click on each card to reveal the command description</p>
      </div>

      <div className="commands-filter">
        <label className="filter-label">
          <input
            type="checkbox"
            checked={showUnsupported}
            onChange={(e) => setShowUnsupported(e.target.checked)}
            className="filter-checkbox"
          />
          <span className="flex items-center gap-2">
            {showUnsupported ? 'Showing all commands' : 'Supported commands'}
          </span>
        </label>
        <span className="commands-count">
          {displayedCommands.length} command{displayedCommands.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flashcards-grid">
        {displayedCommands.map((cmd, index) => (
          <motion.div
            key={cmd.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
          >
            <div
              className={`flashcard ${cmd.supported ? 'supported' : 'unsupported'}`}
              onClick={() => toggleFlip(cmd.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  toggleFlip(cmd.id);
                }
              }}
            >
              {cmd.supported && (
                <div className="supported-badge">
                  <Check size={14} />
                </div>
              )}
              <motion.div
                className="flashcard-inner"
                animate={{ rotateY: flipped.has(cmd.id) ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  perspective: '1000px',
                  transformStyle: 'preserve-3d',
                }}
              >
                <div
                  className="flashcard-front"
                  style={{
                    backfaceVisibility: 'hidden',
                  }}
                >
                  <code>{cmd.command}</code>
                </div>
                <div
                  className="flashcard-back"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  <p>{cmd.description}</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
