import { useState, useEffect } from 'react';
import { Calendar, ArrowRight, Clock, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn, getDifficultyInfo, formatDate } from '@/lib/utils';

interface ArchivePuzzle {
  id: string;
  date: string;
  difficulty: 'easy' | 'medium' | 'hard';
  completed: boolean;
  score?: number;
}

// Mock data for development
const MOCK_ARCHIVE: ArchivePuzzle[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - i - 1);
  const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
  
  return {
    id: `puzzle-${i + 1}`,
    date: date.toISOString().split('T')[0],
    difficulty: difficulties[i % 7 < 2 ? 0 : i % 7 < 5 ? 1 : 2],
    completed: Math.random() > 0.3,
    score: Math.random() > 0.3 ? Math.floor(Math.random() * 100) + 50 : undefined,
  };
});

export default function ArchivePage() {
  const navigate = useNavigate();
  const [puzzles, setPuzzles] = useState<ArchivePuzzle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'incomplete'>('all');

  useEffect(() => {
    // Simulate API call
    const loadArchive = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setPuzzles(MOCK_ARCHIVE);
      setIsLoading(false);
    };
    
    loadArchive();
  }, []);

  const filteredPuzzles = puzzles.filter(puzzle => {
    if (filter === 'completed') return puzzle.completed;
    if (filter === 'incomplete') return !puzzle.completed;
    return true;
  });

  const handlePuzzleClick = (puzzleId: string) => {
    // In production, this would load the archive puzzle
    navigate(`/?puzzle=${puzzleId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Puzzle Archive</h1>
        <div className="animate-pulse grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Puzzle Archive</h1>
        
        {/* Filter tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['all', 'completed', 'incomplete'] as const).map((f) => (
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
        <span>{puzzles.length} total puzzles</span>
        <span>•</span>
        <span>{puzzles.filter(p => p.completed).length} completed</span>
        <span>•</span>
        <span>{puzzles.filter(p => !p.completed).length} remaining</span>
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
                'hover:border-gray-400 hover:shadow-sm',
                puzzle.completed && 'bg-green-50/50 border-green-200'
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
                {puzzle.completed ? (
                  <>
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      <Star size={14} />
                      Completed
                    </span>
                    {puzzle.score && (
                      <span className="text-sm font-mono font-bold">
                        {puzzle.score} pts
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-gray-400 flex items-center gap-1">
                    <Clock size={14} />
                    Not attempted
                  </span>
                )}
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
