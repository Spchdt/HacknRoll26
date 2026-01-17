import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, ChevronUp, ChevronDown, AlertCircle, RefreshCw } from 'lucide-react';
import type { LeaderboardEntry } from '@/lib/types';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [, setUserEntry] = useState<LeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'gamesPlayed'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const loadLeaderboard = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.getLeaderboard();
      
      // API returns { entries, userRank?, userEntry? } directly
      setLeaderboard(response.entries);
      setUserRank(response.userRank ?? null);
      setUserEntry(response.userEntry ?? null);
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
            <div key={i} className="h-12 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <div className="text-center py-12 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 font-medium mb-2">Failed to load leaderboard</p>
          <p className="text-red-500 text-sm mb-4">{error}</p>
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
          <div className="text-sm bg-gray-100 px-3 py-1 rounded-full">
            Your rank: <span className="font-bold">#{userRank}</span>
          </div>
        )}
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-3 font-semibold w-16">Rank</th>
              <th className="p-3 font-semibold">Player</th>
              <th 
                className="p-3 font-semibold cursor-pointer hover:bg-gray-100"
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
                className="p-3 font-semibold cursor-pointer hover:bg-gray-100 hidden sm:table-cell"
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
                  'border-t hover:bg-gray-50 transition-colors',
                  entry.rank <= 3 && 'bg-amber-50/50'
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
                <td className="p-3 hidden sm:table-cell text-gray-500">
                  {entry.gamesPlayed}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom info */}
      <p className="text-sm text-gray-500 text-center">
        Showing top 50 players. Leaderboard updates daily at midnight UTC.
      </p>
    </div>
  );
}
