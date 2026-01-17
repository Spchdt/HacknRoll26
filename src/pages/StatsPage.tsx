import { useState, useEffect } from 'react';
import { BarChart3, Flame, Target, Terminal, Trophy, AlertCircle, RefreshCw } from 'lucide-react';
import type { UserStats, RecentGame } from '@/lib/types';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function StatsPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.getStats();
      
      // API returns { stats, recentGames } directly
      setStats(response.stats);
      setRecentGames(response.recentGames || []);
    } catch (err) {
      console.error('Failed to load stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Your Stats</h1>
        <div className="animate-pulse grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Your Stats</h1>
        <div className="text-center py-12 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 font-medium mb-2">Failed to load stats</p>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button
            onClick={loadStats}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Your Stats</h1>
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No stats yet. Play some games to see your progress!</p>
        </div>
      </div>
    );
  }

  const winRate = stats.totalGamesPlayed > 0 
    ? Math.round((stats.totalGamesWon / stats.totalGamesPlayed) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Your Stats</h1>

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Games Played"
          value={stats.totalGamesPlayed}
        />
        <StatCard
          icon={<Trophy className="w-5 h-5" />}
          label="Win Rate"
          value={`${winRate}%`}
          color="text-green-600"
        />
        <StatCard
          icon={<Flame className="w-5 h-5" />}
          label="Current Streak"
          value={stats.currentStreak}
          subtext={`Best: ${stats.maxStreak}`}
        />
        <StatCard
          icon={<BarChart3 className="w-5 h-5" />}
          label="Best Score"
          value={stats.bestScore ?? '-'}
          subtext={`Avg: ${stats.averageScore ?? '-'}`}
        />
      </div>

      {/* Recent Games */}
      {recentGames.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <Terminal size={18} />
            Recent Games
          </h2>
          <div className="space-y-2">
            {recentGames.map((game) => (
              <div key={game.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div>
                  <span className={cn(
                    'text-sm font-medium px-2 py-1 rounded',
                    game.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  )}>
                    {game.status}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold">{game.score}</span>
                  <p className="text-xs text-gray-500">
                    {new Date(game.completedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-bold mb-2">Games Won</h3>
          <p className="text-3xl font-mono font-bold text-green-600">{stats.totalGamesWon}</p>
          <p className="text-sm text-gray-500 mt-1">
            out of {stats.totalGamesPlayed} played
          </p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-bold mb-2">Total Commands</h3>
          <p className="text-3xl font-mono font-bold text-amber-600">{stats.totalCommandsUsed}</p>
          <p className="text-sm text-gray-500 mt-1">
            commands executed
          </p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-bold mb-2">Last Played</h3>
          <p className="text-lg font-medium">
            {stats.lastPlayedAt 
              ? new Date(stats.lastPlayedAt).toLocaleDateString()
              : 'Never'}
          </p>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
}

function StatCard({ icon, label, value, subtext, color }: StatCardProps) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center gap-2 text-gray-500 mb-1">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className={cn('text-2xl font-bold', color)}>{value}</p>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
  );
}
