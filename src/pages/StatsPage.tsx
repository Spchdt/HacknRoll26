import { useState, useEffect } from 'react';
import { BarChart3, Flame, Target, Terminal, Trophy, AlertCircle, RefreshCw } from 'lucide-react';
import type { UserStats, RecentGame } from '@/lib/types';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useDarkMode } from '@/layouts/MainLayout';

export default function StatsPage() {
  const { isDarkMode } = useDarkMode();
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
            <div key={i} className={cn('h-24 rounded-lg', isDarkMode ? 'bg-gray-700' : 'bg-gray-100')} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Your Stats</h1>
        <div className={cn('text-center py-12 border rounded-lg', isDarkMode ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200')}>
          <AlertCircle className={cn('w-12 h-12 mx-auto mb-4', isDarkMode ? 'text-red-400' : 'text-red-500')} />
          <p className={cn('font-medium mb-2', isDarkMode ? 'text-red-400' : 'text-red-600')}>Failed to load stats</p>
          <p className={cn('text-sm mb-4', isDarkMode ? 'text-red-300' : 'text-red-500')}>{error}</p>
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
        <div className={cn('text-center py-12 rounded-lg', isDarkMode ? 'bg-gray-800' : 'bg-gray-50')}>
          <Target className={cn('w-12 h-12 mx-auto mb-4', isDarkMode ? 'text-gray-600' : 'text-gray-300')} />
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No stats yet. Play some games to see your progress!</p>
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
        <div className={cn('border rounded-lg p-4', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <Terminal size={18} />
            Recent Games
          </h2>
          <div className="space-y-2">
            {recentGames.map((game) => (
              <div key={game.id} className={cn('flex items-center justify-between py-2 border-b last:border-b-0', isDarkMode ? 'border-gray-700' : '')}>
                <div>
                  <span className={cn(
                    'text-sm font-medium px-2 py-1 rounded',
                    game.status === 'completed' 
                      ? isDarkMode ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700'
                      : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                  )}>
                    {game.status}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold">{game.score}</span>
                  <p className={cn('text-xs', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                    {new Date(Number(game.completedAt) * 1000).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={cn('border rounded-lg p-4', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
          <h3 className="font-bold mb-2">Games Won</h3>
          <p className="text-3xl font-mono font-bold text-green-600">{stats.totalGamesWon}</p>
          <p className={cn('text-sm mt-1', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
            out of {stats.totalGamesPlayed} played
          </p>
        </div>
        <div className={cn('border rounded-lg p-4', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
          <h3 className="font-bold mb-2">Total Commands</h3>
          <p className="text-3xl font-mono font-bold text-amber-600">{stats.totalCommandsUsed}</p>
          <p className={cn('text-sm mt-1', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
            commands executed
          </p>
        </div>
        <div className={cn('border rounded-lg p-4', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
          <h3 className="font-bold mb-2">Last Played</h3>
          <p className="text-lg font-medium">
            {stats.lastPlayedAt 
              ? new Date(Number(stats.lastPlayedAt) * 1000).toLocaleDateString()
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
  const { isDarkMode } = useDarkMode();
  return (
    <div className={cn('border rounded-lg p-4', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
      <div className={cn('flex items-center gap-2 mb-1', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className={cn('text-2xl font-bold', color)}>{value}</p>
      {subtext && <p className={cn('text-xs mt-1', isDarkMode ? 'text-gray-500' : 'text-gray-400')}>{subtext}</p>}
    </div>
  );
}
