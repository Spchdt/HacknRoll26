import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, GameResult } from '../types';

interface GameStore {
  // State
  gameId: string | null;
  gameState: GameState | null;
  gameResult: GameResult | null;
  isLoading: boolean;
  error: string | null;

  // UI State
  showTutorial: boolean;
  showResultPopup: boolean;
  selectedCommand: string | null;

  // Actions
  setGameId: (id: string | null) => void;
  setGameState: (state: GameState | null) => void;
  setGameResult: (result: GameResult | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setShowTutorial: (show: boolean) => void;
  setShowResultPopup: (show: boolean) => void;
  setSelectedCommand: (command: string | null) => void;
  reset: () => void;
}

const initialState = {
  gameId: null,
  gameState: null,
  gameResult: null,
  isLoading: false,
  error: null,
  showTutorial: false,
  showResultPopup: false,
  selectedCommand: null,
};

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      ...initialState,

      setGameId: (id) => set({ gameId: id }),
      setGameState: (state) => set({ gameState: state }),
      setGameResult: (result) => set({ gameResult: result, showResultPopup: result !== null }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setShowTutorial: (show) => set({ showTutorial: show }),
      setShowResultPopup: (show) => set({ showResultPopup: show }),
      setSelectedCommand: (command) => set({ selectedCommand: command }),
      reset: () => set(initialState),
    }),
    {
      name: 'hacknroll26-game',
      partialize: (state) => ({
        showTutorial: state.showTutorial,
      }),
    }
  )
);

// ============================================
// User Preferences Store
// ============================================

interface UserPrefsStore {
  hasSeenTutorial: boolean;
  username: string | null;
  setHasSeenTutorial: (seen: boolean) => void;
  setUsername: (name: string | null) => void;
}

export const useUserPrefsStore = create<UserPrefsStore>()(
  persist(
    (set) => ({
      hasSeenTutorial: false,
      username: null,
      setHasSeenTutorial: (seen) => set({ hasSeenTutorial: seen }),
      setUsername: (name) => set({ username: name }),
    }),
    {
      name: 'hacknroll26-user-prefs',
    }
  )
);

// ============================================
// UI Store
// ============================================

interface UIStore {
  activeTab: 'game' | 'leaderboard' | 'stats' | 'archive';
  isMobileMenuOpen: boolean;
  setActiveTab: (tab: 'game' | 'leaderboard' | 'stats' | 'archive') => void;
  setMobileMenuOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>()((set) => ({
  activeTab: 'game',
  isMobileMenuOpen: false,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
}));

// ============================================
// Theme Store
// ============================================

interface ThemeStore {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      isDarkMode: true,
      toggleTheme: () =>
        set((state) => {
          const newDarkMode = !state.isDarkMode;
          // Apply theme to document
          if (newDarkMode) {
            document.body.classList.remove('light-mode');
          } else {
            document.body.classList.add('light-mode');
          }
          return { isDarkMode: newDarkMode };
        }),
    }),
    {
      name: 'hacknroll26-theme',
    }
  )
);
