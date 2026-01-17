import { useState, useEffect } from 'react';
import { Clock, RefreshCw, AlertCircle, Calendar, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useDarkMode } from '@/layouts/MainLayout';
import { api } from '@/lib/api';

interface FileTarget {
  branch: string;
  depth: number;
  fileName: string;
  collected: boolean;
}

interface Constraints {
  maxCommits: number;
  maxCheckouts: number;
  maxBranches: number;
  allowedBranches: string[];
}

interface ArchivedGame {
  id: string;
  date: string;
  difficultyLevel: number;
  fileTargets: FileTarget[];
  constraints: Constraints;
  parScore: number;
  createdAt: number;
}

export default function ArchivePage() {
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();
  const [games, setGames] = useState<ArchivedGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<number | 'all'>('all');

  const fetchArchive = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getArchive();
      setGames(response.data || []);
    } catch (err) {
      console.error('Failed to load archive:', err);
      setError(err instanceof Error ? err.message : 'Failed to load archive');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArchive();
  }, []);

  const filteredGames = games.filter(game => {
    if (filter === 'all') return true;
    return game.difficultyLevel === filter;
  });

  const handlePuzzleClick = (puzzleId: string) => {
    navigate(`/?puzzle=${puzzleId}`);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Puzzle Archive</h1>
        <div className="animate-pulse grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={cn('h-32 rounded-lg', isDarkMode ? 'bg-gray-800' : 'bg-gray-100')} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Puzzle Archive</h1>
        <div className={cn('text-center py-12 border rounded-lg', isDarkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200')}>
          <AlertCircle className={cn('w-12 h-12 mx-auto mb-4', isDarkMode ? 'text-red-400' : 'text-red-400')} />
          <p className={cn('font-medium mb-2', isDarkMode ? 'text-red-400' : 'text-red-600')}>Failed to load archive</p>
          <p className={cn('text-sm mb-4', isDarkMode ? 'text-red-300' : 'text-red-500')}>{error}</p>
          <button
            onClick={fetchArchive}
            className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors', isDarkMode ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-600 text-white hover:bg-red-700')}
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Puzzle Archive</h1>
        
        {/* Filter dropdown by difficulty level */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className={cn(
            'px-3 py-2 text-sm rounded-lg border transition-colors cursor-pointer',
            isDarkMode 
              ? 'bg-gray-800 border-gray-600 text-white hover:border-gray-500' 
              : 'bg-white border-gray-300 hover:border-gray-400'
          )}
        >
          <option value="all">All Levels</option>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
            <option key={level} value={level}>
              Level {level}
            </option>
          ))}
        </select>
      </div>

      {/* Stats summary */}
      <div className={cn('flex gap-4 text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
        <span>{games.length} puzzles available</span>
      </div>

      {/* Puzzle grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredGames.map((game) => {
          
          return (
            <button
              key={game.id}
              onClick={() => handlePuzzleClick(game.id)}
              className={cn(
                'text-left border rounded-lg p-3 transition-all',
                isDarkMode
                  ? 'border-gray-700 hover:border-gray-600 hover:shadow-sm hover:bg-gray-800'
                  : 'border-gray-200 hover:border-gray-400 hover:shadow-sm hover:bg-gray-50'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                  <span className={cn('font-medium', isDarkMode ? 'text-white' : '')}>
                    {formatDate(game.date)}
                  </span>
                </div>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded font-medium',
                  isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                )}>
                  Lv.{game.difficultyLevel}
                </span>
              </div>
              
              {/* File targets */}
              <div className={cn('flex flex-wrap gap-1 mt-2')}>
                {game.fileTargets.slice(0, 3).map((target, idx) => (
                  <span
                    key={idx}
                    className={cn(
                      'text-xs px-1.5 py-0.5 rounded font-mono',
                      isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {target.fileName}
                  </span>
                ))}
                {game.fileTargets.length > 3 && (
                  <span className={cn('text-xs px-1.5 py-0.5', isDarkMode ? 'text-gray-500' : 'text-gray-400')}>
                    +{game.fileTargets.length - 3}
                  </span>
                )}
              </div>
              
              <div className={cn('flex items-center gap-4 mt-2 text-xs', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                <span className="flex items-center gap-1">
                  <FileText size={12} />
                  {game.fileTargets.length} file{game.fileTargets.length > 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  Par {game.parScore}
                </span>
                <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>
                  {game.constraints.maxBranches} branches
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {filteredGames.length === 0 && (
        <div className={cn('text-center py-12 rounded-lg', isDarkMode ? 'bg-gray-800' : 'bg-gray-50')}>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
            {games.length === 0 ? 'No puzzles available yet.' : 'No puzzles match your filter.'}
          </p>
        </div>
      )}

      {/* Info note */}
      <p className={cn('text-sm text-center pt-4', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
        Click any puzzle to play it.
      </p>
    </div>
  );
}
