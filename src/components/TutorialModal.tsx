import { useState } from 'react';
import { GitBranch, GitCommit, GitMerge, RotateCcw, ChevronRight, X } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TUTORIAL_STEPS = [
  {
    title: 'Welcome to Gitty',
    content:
      'Gitty is a puzzle game where you use git commands to collect files scattered across branches and merge them to main.',
    icon: GitBranch,
  },
  {
    title: 'The Goal',
    content:
      'Collect all target files by creating commits at specific branch/depth locations, then merge everything to the main branch to win!',
    icon: GitCommit,
  },
  {
    title: 'Basic Commands',
    content: `Use these git commands:
• git commit -m "message" - Create a commit
• git branch <name> - Create a new branch
• git checkout <target> - Switch branches
• git merge <branch> - Merge a branch
• git rebase <branch> - Rebase onto a branch
• undo - Undo last command`,
    icon: GitMerge,
  },
  {
    title: 'Collecting Files',
    content:
      'Files appear at specific positions (branch + depth). When you commit at that exact position, you collect the file!',
    icon: GitBranch,
  },
  {
    title: 'Par Score',
    content:
      'Each puzzle has a "par" score - the minimum commands needed. Beat par for bonus points! Use the undo command to try different strategies.',
    icon: RotateCcw,
  },
];

export default function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const currentStep = TUTORIAL_STEPS[step];
  const isLast = step === TUTORIAL_STEPS.length - 1;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {TUTORIAL_STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === step ? 'bg-black' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
            <currentStep.icon className="w-8 h-8 text-gray-700" />
          </div>
          <h2 className="text-xl font-bold mb-3">{currentStep.title}</h2>
          <p className="text-gray-600 whitespace-pre-line text-left text-sm">
            {currentStep.content}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex gap-2">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={() => {
              if (isLast) {
                onClose();
              } else {
                setStep(step + 1);
              }
            }}
            className="flex-1 py-2 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            {isLast ? "Let's Play!" : 'Next'}
            {!isLast && <ChevronRight size={16} />}
          </button>
        </div>

        {/* Skip */}
        {!isLast && (
          <button
            onClick={onClose}
            className="w-full mt-2 py-2 text-gray-400 text-sm hover:text-gray-600"
          >
            Skip tutorial
          </button>
        )}
      </div>
    </div>
  );
}
