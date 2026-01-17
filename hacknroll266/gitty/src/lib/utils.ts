import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BRANCH_COLORS } from './types';

// Tailwind class merge utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate a short unique ID (similar to git short hash)
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Generate a commit-like hash
export function generateCommitHash(): string {
  return Math.random().toString(16).substring(2, 10);
}

// Format timestamp to readable date
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Format relative time
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

// Get color for branch
export function getBranchColor(branchName: string): string {
  if (branchName === 'main' || branchName === 'master') {
    return BRANCH_COLORS.main;
  }
  if (branchName.startsWith('feature')) {
    return BRANCH_COLORS.feature;
  }
  if (branchName.startsWith('hotfix')) {
    return BRANCH_COLORS.hotfix;
  }
  if (branchName.startsWith('release')) {
    return BRANCH_COLORS.release;
  }
  if (branchName === 'develop' || branchName === 'dev') {
    return BRANCH_COLORS.develop;
  }
  return BRANCH_COLORS.default;
}

// Parse git command string
export function parseGitCommand(input: string): { command: string; args: string[] } | null {
  const trimmed = input.trim().toLowerCase();
  
  // Must start with 'git'
  if (!trimmed.startsWith('git ')) {
    return null;
  }
  
  const parts = trimmed.slice(4).split(/\s+/);
  const command = parts[0];
  const args = parts.slice(1);
  
  return { command, args };
}

// Validate branch name
export function isValidBranchName(name: string): boolean {
  // Git branch naming rules (simplified)
  const invalidPatterns = [
    /^\./,           // Can't start with dot
    /\.$/,           // Can't end with dot
    /\.\./,          // Can't have consecutive dots
    /[@{}[\]\\]/,    // Invalid characters
    /\s/,            // No spaces
    /^-/,            // Can't start with hyphen
  ];
  
  return name.length > 0 && 
         name.length <= 50 && 
         !invalidPatterns.some(p => p.test(name));
}

// Truncate text with ellipsis
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

// Deep clone an object (for state management)
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Calculate score based on commands used vs par
export function calculateScore(commandsUsed: number, parScore: number): number {
  const diff = parScore - commandsUsed;
  const baseScore = 100;
  
  if (diff >= 0) {
    // Under or at par: bonus points
    return baseScore + (diff * 20);
  } else {
    // Over par: deduct points (minimum 10)
    return Math.max(10, baseScore + (diff * 10));
  }
}

// Get difficulty label with color
export function getDifficultyInfo(difficulty: 'easy' | 'medium' | 'hard'): { label: string; color: string } {
  switch (difficulty) {
    case 'easy':
      return { label: 'Easy', color: 'text-green-600 bg-green-100' };
    case 'medium':
      return { label: 'Medium', color: 'text-yellow-600 bg-yellow-100' };
    case 'hard':
      return { label: 'Hard', color: 'text-red-600 bg-red-100' };
  }
}

// Local storage helpers
export function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.warn('Failed to save to localStorage');
  }
}

// Check if user has seen tutorial
export function hasSeenTutorial(): boolean {
  return getFromStorage('gitty_tutorial_seen', false);
}

export function markTutorialSeen(): void {
  saveToStorage('gitty_tutorial_seen', true);
}

// Get stored user ID
export function getStoredUserId(): string | null {
  return getFromStorage<string | null>('gitty_user_id', null);
}

export function saveUserId(userId: string): void {
  saveToStorage('gitty_user_id', userId);
}
