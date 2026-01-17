import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, ChevronUp, ChevronDown } from 'lucide-react';
import type { LeaderboardEntry } from '@/lib/types';
import { cn } from '@/lib/utils';

// Mock data for development
const MOCK_LEADERBOARD: LeaderboardEntry[] = Array.from({ length: 20 }, (_, i) => ({
  rank: i + 1,
  userId: `user_${i}`,
  username: `Player${i + 1}`,
  score: 1000 - i * 35 + Math.floor(Math.random() * 20),
  gamesPlayed: Math.floor(Math.random() * 50) + 10,
}));

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'score' | 'gamesPlayed'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    // Simulate API call
    const loadLeaderboard = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setLeaderboard(MOCK_LEADERBOARD);
      setUserRank(42); // Mock user rank
      setIsLoading(false);
    };
    
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
            {sortedLeaderboard.map((entry) => (
              <tr 
                key={entry.userId} 
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
