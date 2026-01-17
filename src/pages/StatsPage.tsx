import { useState, useEffect } from 'react';
import { BarChart3, Flame, Target, Terminal, Trophy } from 'lucide-react';
import type { UserStats, GameCommand } from '@/lib/types';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

// Mock data for development (fallback when API is unavailable)
const MOCK_STATS: UserStats = {
  totalGamesPlayed: 42,
  totalGamesWon: 38,
  totalCommandsUsed: 456,
  bestScore: 180,
  averageScore: 95,
  currentStreak: 7,
  maxStreak: 14,
  commandDistribution: {
    commit: 156,
    checkout: 89,
    branch: 45,
    merge: 78,
    rebase: 34,
    undo: 54,
  },
};

export default function StatsPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      
      try {
        const response = await api.getStats();
        
        if (response.success && response.data) {
          setStats(response.data);
        } else {
          // Fall back to mock data for development
          console.warn('API unavailable, using mock data');
          setStats(MOCK_STATS);
        }
      } catch (err) {
        console.warn('API error, using mock data:', err);
        setStats(MOCK_STATS);
      } finally {
        setIsLoading(false);
      }
    };
    
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

  const maxCommands = Math.max(...Object.values(stats.commandDistribution));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Your Stats</h1>

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Played"
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
          subtext={`Max: ${stats.maxStreak}`}
        />
        <StatCard
          icon={<BarChart3 className="w-5 h-5" />}
          label="Best Score"
          value={stats.bestScore}
          subtext={`Avg: ${stats.averageScore}`}
        />
      </div>

      {/* Command distribution */}
      <div className="bg-white border rounded-lg p-4">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <Terminal size={18} />
          Command Usage
        </h2>
        <div className="space-y-3">
          {(Object.entries(stats.commandDistribution) as [GameCommand['type'], number][])
            .sort(([, a], [, b]) => b - a)
            .map(([command, count]) => (
              <div key={command} className="flex items-center gap-3">
                <span className="w-20 text-sm font-mono text-gray-600">{command}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      command === 'commit' && 'bg-blue-500',
                      command === 'checkout' && 'bg-purple-500',
                      command === 'branch' && 'bg-green-500',
                      command === 'merge' && 'bg-amber-500',
                      command === 'rebase' && 'bg-red-500',
                      command === 'undo' && 'bg-gray-500'
                    )}
                    style={{ width: `${(count / maxCommands) * 100}%` }}
                  />
                </div>
                <span className="w-12 text-right text-sm font-mono">{count}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Additional stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-bold mb-2">Total Commands</h3>
          <p className="text-3xl font-mono font-bold">{stats.totalCommandsUsed.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">
            Avg per game: {Math.round(stats.totalCommandsUsed / stats.totalGamesPlayed)}
          </p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-bold mb-2">Games Won</h3>
          <p className="text-3xl font-mono font-bold text-green-600">{stats.totalGamesWon}</p>
          <p className="text-sm text-gray-500 mt-1">
            out of {stats.totalGamesPlayed} played
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
