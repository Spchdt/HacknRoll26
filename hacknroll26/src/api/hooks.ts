import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from './client';
import { useGameStore } from '../stores';
import type { GameCommand } from '../types';

// ============================================
// Query Keys
// ============================================

export const queryKeys = {
  stats: ['stats'] as const,
  leaderboard: ['leaderboard'] as const,
  archive: ['archive'] as const,
};

// ============================================
// Game Hooks
// ============================================

export function useStartGame() {
  const { setGameId, setGameState, setGameResult, setLoading, setError } = useGameStore();

  return useMutation({
    mutationFn: (puzzleId: string) => api.startGame(puzzleId),
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: (data) => {
      setGameId(data.gameId);
      setGameState(data.state);
      if (data.result) {
        setGameResult(data.result);
      }
    },
    onError: (error: Error) => {
      setError(error.message);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
}

export function useSendCommand() {
  const { gameId, setGameState, setGameResult, setLoading, setError } = useGameStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (command: GameCommand) => {
      if (!gameId) throw new Error('No active game');
      return api.sendCommand(gameId, command);
    },
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: (data) => {
      setGameState(data.state);
      if (data.result) {
        setGameResult(data.result);
        // Invalidate stats and leaderboard when game ends
        queryClient.invalidateQueries({ queryKey: queryKeys.stats });
        queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard });
      }
      if (data.error) {
        setError(data.error);
      }
    },
    onError: (error: Error) => {
      setError(error.message);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
}

// ============================================
// User Hooks
// ============================================

export function useSetUsername() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (username: string) => api.setUsername(username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard });
    },
  });
}

export function useStats() {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: api.getStats,
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: queryKeys.leaderboard,
    queryFn: api.getLeaderboard,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ============================================
// Archive Hooks
// ============================================

export function useArchive() {
  return useQuery({
    queryKey: queryKeys.archive,
    queryFn: api.getArchivePuzzles,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
