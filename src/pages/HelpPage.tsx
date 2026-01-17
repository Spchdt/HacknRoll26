import { useState } from 'react';
import { 
  GitBranch, 
  GitCommit, 
  GitMerge, 
  RotateCcw, 
  ChevronRight,
  Terminal,
  Target,
  Trophy,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'overview',
    title: 'Game Overview',
    icon: <HelpCircle size={20} />,
    content: (
      <div className="space-y-3">
        <p>
          <strong>Gitty</strong> is a puzzle game where you use git commands to collect files 
          scattered across branches and merge them to the main branch.
        </p>
        <p>
          Each puzzle places files at specific positions (branch + depth). Your goal is to 
          navigate the git graph, collect all files, and merge everything back to main.
        </p>
        <p>
          Try to complete each puzzle in as few commands as possible to beat the par score 
          and earn bonus points!
        </p>
      </div>
    ),
  },
  {
    id: 'commands',
    title: 'Git Commands',
    icon: <Terminal size={20} />,
    content: (
      <div className="space-y-4">
        <CommandHelp
          command="git commit -m 'message'"
          description="Create a new commit at your current position. This is how you move forward on a branch and collect files."
          example="git commit -m 'Add feature'"
        />
        <CommandHelp
          command="git branch <name>"
          description="Create a new branch at your current position. The branch will point to your current commit."
          example="git branch feature"
        />
        <CommandHelp
          command="git checkout <target>"
          description="Switch to a different branch or commit. Use branch names or commit hashes (first 4+ characters)."
          example="git checkout feature"
        />
        <CommandHelp
          command="git merge <branch>"
          description="Merge another branch into your current branch. Creates a merge commit with two parents."
          example="git merge feature"
        />
        <CommandHelp
          command="git rebase <branch>"
          description="Replay your commits on top of another branch. Useful for keeping a linear history."
          example="git rebase main"
        />
        <CommandHelp
          command="git undo"
          description="Undo your last command. You can undo multiple times to go back further."
          example="git undo"
        />
      </div>
    ),
  },
  {
    id: 'collecting',
    title: 'Collecting Files',
    icon: <Target size={20} />,
    content: (
      <div className="space-y-3">
        <p>
          Files are placed at specific positions defined by a <strong>branch</strong> and 
          <strong> depth</strong> (number of commits from the initial commit).
        </p>
        <p>
          When you create a commit at the exact position where a file is located, you 
          automatically collect that file.
        </p>
        <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
          <p>File: README.md @ main, depth 2</p>
          <p className="text-gray-500">→ Commit twice on main branch to collect</p>
        </div>
        <p>
          The file tracker on the right shows all files and their locations. Collected 
          files are marked with a checkmark.
        </p>
      </div>
    ),
  },
  {
    id: 'winning',
    title: 'Winning & Scoring',
    icon: <Trophy size={20} />,
    content: null, // Will be handled specially in HelpPage
  },
  {
    id: 'tips',
    title: 'Tips & Strategies',
    icon: <GitMerge size={20} />,
    content: (
      <div className="space-y-3">
        <div className="flex gap-2">
          <ChevronRight className="flex-shrink-0 mt-0.5 text-gray-400" size={16} />
          <p>
            <strong>Plan ahead:</strong> Look at all file positions before starting. 
            Think about which branches you'll need.
          </p>
        </div>
        <div className="flex gap-2">
          <ChevronRight className="flex-shrink-0 mt-0.5 text-gray-400" size={16} />
          <p>
            <strong>Use undo liberally:</strong> Experiment with different approaches. 
            Undo doesn't count against your score.
          </p>
        </div>
        <div className="flex gap-2">
          <ChevronRight className="flex-shrink-0 mt-0.5 text-gray-400" size={16} />
          <p>
            <strong>Merge vs Rebase:</strong> Merging creates a merge commit but preserves 
            history. Rebasing replays commits for a cleaner history.
          </p>
        </div>
        <div className="flex gap-2">
          <ChevronRight className="flex-shrink-0 mt-0.5 text-gray-400" size={16} />
          <p>
            <strong>Fast-forward merges:</strong> If the target branch is ahead of your 
            current branch, merging won't create a new commit.
          </p>
        </div>
        <div className="flex gap-2">
          <ChevronRight className="flex-shrink-0 mt-0.5 text-gray-400" size={16} />
          <p>
            <strong>Keyboard shortcuts:</strong> Use ↑/↓ arrows to navigate command 
            history. Press Tab to autocomplete suggestions.
          </p>
        </div>
      </div>
    ),
  },
];

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState<string>('overview');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">How to Play</h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Navigation */}
        <div className="md:w-48 flex-shrink-0">
          <nav className="space-y-1">
            {HELP_SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors',
                  activeSection === section.id
                    ? 'bg-black text-white'
                    : 'hover:bg-gray-100'
                )}
              >
                {section.icon}
                <span className="text-sm font-medium">{section.title}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white border rounded-lg p-6">
          {HELP_SECTIONS.map((section) => (
            <div
              key={section.id}
              className={cn(
                activeSection === section.id ? 'block' : 'hidden'
              )}
            >
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                {section.icon}
                {section.title}
              </h2>
              <div className="prose prose-sm max-w-none">
                {section.id === 'winning' ? (
                  <WinningContent onNavigateToCollecting={() => setActiveSection('collecting')} />
                ) : (
                  section.content
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick reference */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-bold mb-3">Quick Command Reference</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm font-mono">
          <div className="flex items-center gap-2">
            <GitCommit size={14} className="text-gray-400" />
            <span>git commit -m ""</span>
          </div>
          <div className="flex items-center gap-2">
            <GitBranch size={14} className="text-gray-400" />
            <span>git branch &lt;name&gt;</span>
          </div>
          <div className="flex items-center gap-2">
            <GitBranch size={14} className="text-gray-400" />
            <span>git checkout &lt;ref&gt;</span>
          </div>
          <div className="flex items-center gap-2">
            <GitMerge size={14} className="text-gray-400" />
            <span>git merge &lt;branch&gt;</span>
          </div>
          <div className="flex items-center gap-2">
            <GitMerge size={14} className="text-gray-400" />
            <span>git rebase &lt;branch&gt;</span>
          </div>
          <div className="flex items-center gap-2">
            <RotateCcw size={14} className="text-gray-400" />
            <span>git undo</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CommandHelpProps {
  command: string;
  description: string;
  example: string;
}

function WinningContent({ onNavigateToCollecting }: { onNavigateToCollecting: () => void }) {
  return (
    <div className="space-y-3">
      <p>
        To win, you must:
      </p>
      <ol className="list-decimal list-inside space-y-1 pl-2">
        <li>
          <button
            onClick={onNavigateToCollecting}
            className="text-black hover:underline font-medium"
          >
            Collect all target files
          </button>
        </li>
        <li>Merge or rebase everything back to the main branch</li>
      </ol>
      <p>
        Your score is based on how many commands you used compared to the <strong>par score</strong> 
        (the minimum commands needed according to the solver).
      </p>
      <div className="bg-gray-50 p-3 rounded-lg">
        <p className="font-bold">Scoring:</p>
        <ul className="text-sm space-y-1 mt-2">
          <li>• Base score: 100 points</li>
          <li>• Under par: +20 points per command saved</li>
          <li>• Over par: -10 points per extra command (min 10 points)</li>
        </ul>
      </div>
    </div>
  );
}

function CommandHelp({ command, description, example }: CommandHelpProps) {
  return (
    <div className="border-l-2 border-gray-200 pl-3">
      <p className="font-mono font-bold text-sm">{command}</p>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
      <p className="text-xs font-mono text-gray-400 mt-1">Example: {example}</p>
    </div>
  );
}
