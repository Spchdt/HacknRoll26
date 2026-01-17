import { useState, useEffect, useCallback } from 'react';
import { getStoredUserId, saveUserId, generateShortId } from '@/lib/utils';
import { api } from '@/lib/api';

interface UseAuthReturn {
  userId: string | null;
  username: string | null;
  isLoading: boolean;
  error: string | null;
  setUsername: (username: string) => Promise<boolean>;
  generateUserId: () => string;
}

export function useAuth(): UseAuthReturn {
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsernameState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize user ID on mount
  useEffect(() => {
    let storedId = getStoredUserId();
    
    if (!storedId) {
      // Generate a new user ID
      // In production, this would be done server-side using IP + device info
      storedId = `user_${generateShortId()}`;
      saveUserId(storedId);
    }
    
    setUserId(storedId);
    setIsLoading(false);
  }, []);

  // Generate a new user ID (for testing/reset)
  const generateUserId = useCallback((): string => {
    const newId = `user_${generateShortId()}`;
    saveUserId(newId);
    setUserId(newId);
    return newId;
  }, []);

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
      setError(err instanceof Error ? err.message : 'Failed to set username');
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
    generateUserId,
  };
}
