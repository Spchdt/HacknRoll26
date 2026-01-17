import { useState } from 'react';
import { motion } from 'framer-motion';
import { Code } from 'lucide-react';

interface GitCommand {
  id: number;
  command: string;
  description: string;
}

const GIT_COMMANDS: GitCommand[] = [
  {
    id: 1,
    command: 'git init',
    description: 'Initialize a new git repository in the current directory.',
  },
  {
    id: 2,
    command: 'git clone <url>',
    description: 'Create a local copy of a remote repository.',
  },
  {
    id: 3,
    command: 'git add <file>',
    description: 'Stage specific files for commit.',
  },
  {
    id: 4,
    command: 'git add .',
    description: 'Stage all changes in the current directory for commit.',
  },
  {
    id: 5,
    command: 'git commit -m "<msg>"',
    description: 'Save staged changes with a descriptive message.',
  },
  {
    id: 6,
    command: 'git push',
    description: 'Upload local commits to the remote repository.',
  },
  {
    id: 7,
    command: 'git pull',
    description: 'Fetch and merge remote changes into your local branch.',
  },
  {
    id: 8,
    command: 'git branch',
    description: 'List all local branches or create a new branch.',
  },
  {
    id: 9,
    command: 'git checkout <branch>',
    description: 'Switch to a different branch.',
  },
  {
    id: 10,
    command: 'git merge <branch>',
    description: 'Combine changes from another branch into the current branch.',
  },
  {
    id: 11,
    command: 'git status',
    description: 'Display the current state of the working directory and staging area.',
  },
  {
    id: 12,
    command: 'git log',
    description: 'Show the commit history of the current branch.',
  },
  {
    id: 13,
    command: 'git diff',
    description: 'Show differences between files in the working directory and staging area.',
  },
  {
    id: 14,
    command: 'git reset <file>',
    description: 'Unstage a file from the staging area.',
  },
  {
    id: 15,
    command: 'git revert <commit>',
    description: 'Create a new commit that undoes changes from a previous commit.',
  },
  {
    id: 16,
    command: 'git stash',
    description: 'Temporarily save changes without committing them.',
  },
  {
    id: 17,
    command: 'git tag <name>',
    description: 'Create a named reference point for a specific commit.',
  },
  {
    id: 18,
    command: 'git remote -v',
    description: 'Display all remote repositories and their URLs.',
  },
];

export function GitCommandsPage() {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());

  const toggleFlip = (id: number) => {
    const newFlipped = new Set(flipped);
    if (newFlipped.has(id)) {
      newFlipped.delete(id);
    } else {
      newFlipped.add(id);
    }
    setFlipped(newFlipped);
  };

  return (
    <div className="git-commands-page">
      <div className="page-header">
        <h1 className="flex items-center gap-2">
          <Code size={28} /> Git Commands
        </h1>
        <p>Click on each card to reveal the command description</p>
      </div>

      <div className="flashcards-grid">
        {GIT_COMMANDS.map((cmd, index) => (
          <motion.div
            key={cmd.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
          >
            <div
              className="flashcard"
              onClick={() => toggleFlip(cmd.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  toggleFlip(cmd.id);
                }
              }}
            >
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
