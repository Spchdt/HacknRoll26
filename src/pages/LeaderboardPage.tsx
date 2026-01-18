import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, ChevronUp, ChevronDown, AlertCircle, RefreshCw } from 'lucide-react';
import type { LeaderboardEntry } from '@/lib/types';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useDarkMode } from '@/layouts/MainLayout';
import { useAuth } from '@/hooks/useAuth';

export default function LeaderboardPage() {
  const { isDarkMode } = useDarkMode();
  const { username } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'gamesPlayed'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Mock leaderboard data to show when API returns empty
  const mockLeaderboard: LeaderboardEntry[] = [
    { rank: 1, username: 'Marshall Wace', score: 2450, gamesPlayed: 15 },
    { rank: 2, username: 'Quacker', score: 2280, gamesPlayed: 67 },
    { rank: 3, username: 'Claude', score: 2150, gamesPlayed: 12 },
    { rank: 4, username: 'Gemini', score: 1980, gamesPlayed: 14 },
    { rank: 5, username: 'Jane', score: 1820, gamesPlayed: 10 },
  ];

  const loadLeaderboard = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.getLeaderboard();
      
      // API returns { entries, userRank?, userEntry? } directly
      // Use mock data if API returns empty entries
      if (response.entries && response.entries.length > 0) {
        setLeaderboard(response.entries);
        setUserRank(response.userRank ?? null);
        setUserEntry(response.userEntry ?? null);
      } else {
        // Use mock data
        setLeaderboard(mockLeaderboard);
        
        // Try to get real user stats for the user entry
        try {
          const statsResponse = await api.getStats();
          // Calculate accumulated score from average * total games
          const avgScore = statsResponse.stats?.averageScore ?? 0;
          const totalGames = statsResponse.stats?.totalGamesPlayed ?? 0;
          const userScore = Math.round(avgScore * totalGames);
          const userGames = totalGames || 3;
          setUserRank(67); // Mock rank outside top 50
          setUserEntry({ 
            rank: 67, 
            username: username || 'You', 
            score: userScore, 
            gamesPlayed: userGames 
          });
        } catch {
          // Fallback if stats API fails
          setUserRank(67);
          setUserEntry({ rank: 67, username: username || 'You', score: 850, gamesPlayed: 3 });
        }
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  // Update userEntry when username loads after initial fetch
  useEffect(() => {
    if (username && userEntry && userEntry.username === 'You') {
      setUserEntry(prev => prev ? { ...prev, username } : null);
    }
  }, [username, userEntry]);

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
  });

  const handleSort = (column: 'score' | 'gamesPlayed') => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className={cn('h-12 rounded-lg', isDarkMode ? 'bg-gray-700' : 'bg-gray-100')} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <div className={cn('text-center py-12 border rounded-lg', isDarkMode ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200')}>
          <AlertCircle className={cn('w-12 h-12 mx-auto mb-4', isDarkMode ? 'text-red-400' : 'text-red-500')} />
          <p className={cn('font-medium mb-2', isDarkMode ? 'text-red-400' : 'text-red-600')}>Failed to load leaderboard</p>
          <p className={cn('text-sm mb-4', isDarkMode ? 'text-red-300' : 'text-red-500')}>{error}</p>
          <button
            onClick={loadLeaderboard}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        {userRank && userRank > 50 && (
          <div className={cn('text-sm px-3 py-1 rounded-full', isDarkMode ? 'bg-gray-700' : 'bg-gray-100')}>
            Your rank: <span className="font-bold">#{userRank}</span>
          </div>
        )}
      </div>

      <div className={cn('border rounded-lg overflow-hidden', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
        <table className="w-full text-left">
          <thead className={cn('border-b', isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200')}>
            <tr>
              <th className="p-3 font-semibold w-16">Rank</th>
              <th className="p-3 font-semibold">Player</th>
              <th 
                className={cn('p-3 font-semibold cursor-pointer', isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100')}
                onClick={() => handleSort('score')}
              >
                <div className="flex items-center gap-1">
                  Score
                  {sortBy === 'score' && (
                    sortOrder === 'desc' ? <ChevronDown size={16} /> : <ChevronUp size={16} />
                  )}
                </div>
              </th>
              <th 
                className={cn('p-3 font-semibold cursor-pointer hidden sm:table-cell', isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100')}
                onClick={() => handleSort('gamesPlayed')}
              >
                <div className="flex items-center gap-1">
                  Games
                  {sortBy === 'gamesPlayed' && (
                    sortOrder === 'desc' ? <ChevronDown size={16} /> : <ChevronUp size={16} />
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedLeaderboard.map((entry, index) => (
              <tr 
                key={`${entry.rank}-${entry.username}-${index}`} 
                className={cn(
                  'border-t transition-colors',
                  isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50',
                  entry.rank <= 3 && (isDarkMode ? 'bg-amber-900/30' : 'bg-amber-50/50')
                )}
              >
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {getRankIcon(entry.rank)}
                    <span className={cn(
                      'font-mono',
                      entry.rank <= 3 && 'font-bold'
                    )}>
                      #{entry.rank}
                    </span>
                  </div>
                </td>
                <td className="p-3">
                  <span className="font-medium">{entry.username}</span>
                </td>
                <td className="p-3">
                  <span className="font-mono font-bold">{entry.score.toLocaleString()}</span>
                </td>
                <td className={cn('p-3 hidden sm:table-cell', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                  {entry.gamesPlayed}
                </td>
              </tr>
            ))}
          </tbody>
          {/* Show user's entry at bottom if outside top 50 */}
          {userEntry && userRank && userRank > 50 && (
            <tfoot>
              <tr className={cn('border-t-4', isDarkMode ? 'border-gray-600' : 'border-gray-300')}>
                <td colSpan={4} className="p-1"></td>
              </tr>
              <tr className={cn(
                'border-t transition-colors',
                isDarkMode ? 'border-gray-700 bg-blue-900/30' : 'border-gray-200 bg-blue-50'
              )}>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">#{userEntry.rank}</span>
                  </div>
                </td>
                <td className="p-3">
                  <span className="font-medium">
                    {userEntry.username === 'You' ? 'You' : `${userEntry.username} (You)`}
                  </span>
                </td>
                <td className="p-3">
                  <span className="font-mono font-bold">{userEntry.score.toLocaleString()}</span>
                </td>
                <td className={cn('p-3 hidden sm:table-cell', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                  {userEntry.gamesPlayed}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Bottom info */}
      <p className={cn('text-sm text-center', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
        Showing top 50 players. Leaderboard updates daily at midnight UTC.
      </p>
    </div>
  );
}
