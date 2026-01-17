import { useState, useEffect } from 'react';
import { Calendar, ArrowRight, Clock, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn, getDifficultyInfo, formatDate } from '@/lib/utils';

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
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['all', 'easy', 'medium', 'hard'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1 text-sm rounded-md transition-colors capitalize',
                filter === f ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Stats summary */}
      <div className="flex gap-4 text-sm text-gray-500">
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
                'hover:border-gray-400 hover:shadow-sm'
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-bold flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    {formatDate(new Date(puzzle.date).getTime())}
                  </div>
                  <span className={cn(
                    'inline-block text-xs px-2 py-0.5 rounded mt-1',
                    diffInfo.color
                  )}>
                    {diffInfo.label}
                  </span>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
              </div>
              
              <div className="flex items-center justify-between mt-3 pt-2 border-t">
                <span className="text-sm text-gray-400 flex items-center gap-1">
                  <Clock size={14} />
                  Play puzzle
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {filteredPuzzles.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No puzzles match your filter.</p>
        </div>
      )}

      {/* Info note */}
      <p className="text-sm text-gray-500 text-center pt-4">
        Archive puzzles don't affect your leaderboard ranking.
      </p>
    </div>
  );
}
