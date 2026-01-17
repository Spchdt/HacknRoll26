import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface UseAuthReturn {
  userId: string | null;
  username: string | null;
  isLoading: boolean;
  error: string | null;
  setUsername: (username: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsernameState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile on mount (IP-based authentication)
  const refreshProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const profile = await api.getProfile();
      setUserId(profile.id);
      setUsernameState(profile.username);
    } catch (err) {
      // User may not exist yet, which is fine
      console.log('Profile not found, will be created on first action');
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  // Set username for leaderboard
  const setUsername = useCallback(async (newUsername: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.setUsername(newUsername);
      
      if (response.success) {
        setUsernameState(newUsername);
        return true;
      } else {
        setError(response.error || 'Failed to set username');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set username';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    userId,
    username,
    isLoading,
    error,
    setUsername,
    refreshProfile,
  };
}
