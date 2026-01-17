import { motion, AnimatePresence } from 'framer-motion';
import { useUserPrefsStore } from '../stores';

interface TutorialProps {
  onComplete: () => void;
}

const tutorialSteps = [
  {
    title: 'Welcome to HacknRoll26! 🌿',
    content: `This is a daily puzzle game where you use Git commands to collect files 
              and merge them to the main branch. Think of it like Wordle, but for Git!`,
    icon: '👋',
  },
  {
    title: 'The Goal 🎯',
    content: `Collect all the files scattered across different branches and depths, 
              then merge everything back to the main branch. You win when all files 
              are collected and merged!`,
    icon: '🎯',
  },
  {
    title: 'Git Commands 💻',
    content: `You can use these commands:
              • commit - Create a new commit (may collect a file)
              • branch - Create a new branch at current position
              • checkout - Move to a different branch or commit
              • merge - Merge another branch into current
              • rebase - Rebase current branch onto another`,
    icon: '💻',
  },
  {
    title: 'Constraints ⚠️',
    content: `Each puzzle has limits:
              • Maximum total commands allowed
              • Maximum checkouts allowed
              • Maximum consecutive commits (encourages rebasing!)
              Try to solve it in as few commands as possible!`,
    icon: '⚠️',
  },
  {
    title: 'Scoring 🏆',
    content: `Your score is based on how close you are to the optimal solution. 
              The fewer commands you use, the better your score. Compete on the 
              daily leaderboard!`,
    icon: '🏆',
  },
];

export function Tutorial({ onComplete }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { setHasSeenTutorial } = useUserPrefsStore();

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setHasSeenTutorial(true);
      onComplete();
    }
  };

  const handleSkip = () => {
    setHasSeenTutorial(true);
    onComplete();
  };

  const step = tutorialSteps[currentStep];

  return (
    <div className="tutorial-overlay">
      <motion.div
        className="tutorial-modal"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            className="tutorial-content"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="tutorial-icon">{step.icon}</div>
            <h2 className="tutorial-title">{step.title}</h2>
            <p className="tutorial-text">{step.content}</p>
          </motion.div>
        </AnimatePresence>

        <div className="tutorial-progress">
          {tutorialSteps.map((_, index) => (
            <div
              key={index}
              className={`progress-dot ${index === currentStep ? 'active' : ''} ${
                index < currentStep ? 'completed' : ''
              }`}
            />
          ))}
        </div>

        <div className="tutorial-actions">
          <button className="btn btn-secondary" onClick={handleSkip}>
            Skip
          </button>
          <button className="btn btn-primary" onClick={handleNext}>
            {currentStep < tutorialSteps.length - 1 ? 'Next' : 'Start Playing!'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

import { useState } from 'react';
