import { useState } from 'react';
import { Calendar, ArrowRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn, getDifficultyInfo, formatDate } from '@/lib/utils';
import { useDarkMode } from '@/layouts/MainLayout';

interface ArchivePuzzle {
  id: string;
  date: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Generate archive puzzle dates for past 30 days
// The puzzle ID format is the date (YYYY-MM-DD)
const generateArchiveDates = (): ArchivePuzzle[] => {
  const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
  
  return Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i - 1);
    const dateStr = date.toISOString().split('T')[0];
    
    return {
      id: dateStr, // Use date as puzzle ID
      date: dateStr,
      // Cycle through difficulties based on day
      difficulty: difficulties[i % 7 < 2 ? 0 : i % 7 < 5 ? 1 : 2],
    };
  });
};

export default function ArchivePage() {
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();
  const [puzzles] = useState<ArchivePuzzle[]>(generateArchiveDates());
  const [filter, setFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  const filteredPuzzles = puzzles.filter(puzzle => {
    if (filter === 'all') return true;
    return puzzle.difficulty === filter;
  });

  const handlePuzzleClick = (puzzleId: string) => {
    // Navigate to game page with puzzle ID
    navigate(`/?puzzle=${puzzleId}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Puzzle Archive</h1>
        
        {/* Filter tabs by difficulty */}
        <div className={cn('flex rounded-lg p-1', isDarkMode ? 'bg-gray-700' : 'bg-gray-100')}>
          {(['all', 'easy', 'medium', 'hard'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1 text-sm rounded-md transition-colors capitalize',
                filter === f
                  ? isDarkMode
                    ? 'bg-gray-600 shadow-sm'
                    : 'bg-white shadow-sm'
                  : isDarkMode
                  ? 'hover:bg-gray-600'
                  : 'hover:bg-gray-200'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Stats summary */}
      <div className={cn('flex gap-4 text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
        <span>{puzzles.length} total puzzles available</span>
      </div>

      {/* Puzzle grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPuzzles.map((puzzle) => {
          const diffInfo = getDifficultyInfo(puzzle.difficulty);
          
          return (
            <button
              key={puzzle.id}
              onClick={() => handlePuzzleClick(puzzle.id)}
              className={cn(
                'text-left border rounded-lg p-4 transition-all',
                isDarkMode
                  ? 'border-gray-700 hover:border-gray-600 hover:shadow-sm hover:bg-gray-800'
                  : 'border-gray-200 hover:border-gray-400 hover:shadow-sm hover:bg-gray-50'
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className={cn('font-bold flex items-center gap-2', isDarkMode ? 'text-white' : '')}>
                    <Calendar size={16} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                    {formatDate(new Date(puzzle.date).getTime())}
                  </div>
                  <span className={cn(
                    'inline-block text-xs px-2 py-0.5 rounded mt-1',
                    diffInfo.color
                  )}>
                    {diffInfo.label}
                  </span>
                </div>
                <ArrowRight size={16} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
              </div>
              
              <div className={cn('flex items-center justify-between mt-3 pt-2 border-t', isDarkMode ? 'border-gray-700' : 'border-gray-100')}>
                <span className={cn('text-sm flex items-center gap-1', isDarkMode ? 'text-gray-400' : 'text-gray-400')}>
                  <Clock size={14} />
                  Play puzzle
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {filteredPuzzles.length === 0 && (
        <div className={cn('text-center py-12 rounded-lg', isDarkMode ? 'bg-gray-800' : 'bg-gray-50')}>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No puzzles match your filter.</p>
        </div>
      )}

      {/* Info note */}
      <p className={cn('text-sm text-center pt-4', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
        Archive puzzles don't affect your leaderboard ranking.
      </p>
    </div>
  );
}
