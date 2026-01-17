import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useArchive } from '../api/hooks';
import { Star, Archive } from 'lucide-react';

export function ArchivePage() {
  const { data: puzzles, isLoading, error } = useArchive();
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
        <p>Loading archive...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-error">
        <p>Failed to load archive</p>
        <p className="error-message">{error.message}</p>
      </div>
    );
  }

  // Group puzzles by month
  const puzzlesByMonth = puzzles?.reduce((acc, puzzle) => {
    const month = puzzle.date.substring(0, 7); // YYYY-MM
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(puzzle);
    return acc;
  }, {} as Record<string, typeof puzzles>);

  const months = puzzlesByMonth ? Object.keys(puzzlesByMonth).sort().reverse() : [];

  const handlePlayPuzzle = (puzzleDate: string) => {
    // Navigate to game page with date parameter for git clone
    navigate(`/?date=${puzzleDate}`);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getDifficultyStars = (difficulty: number) => {
    return Array.from({ length: difficulty }).map((_, i) => (
      <Star key={i} size={18} className="fill-yellow-400 text-yellow-400 inline mr-1" />
    ));
  };

  return (
    <div className="archive-page">
      <div className="page-header">
        <h1 className="flex items-center gap-2"><Archive size={28} /> Puzzle Archive</h1>
        <p>Practice with past puzzles (progress won't affect leaderboard)</p>
      </div>

      {months.length === 0 ? (
        <div className="empty-state">
          <p>No archived puzzles yet. Check back after playing the daily puzzle!</p>
        </div>
      ) : (
        <div className="archive-content">
          {/* Month selector */}
          <div className="month-selector">
            {months.map((month) => (
              <button
                key={month}
                className={`month-btn ${selectedMonth === month ? 'active' : ''}`}
                onClick={() => setSelectedMonth(month === selectedMonth ? null : month)}
              >
                {formatMonth(month)}
                <span className="puzzle-count">
                  ({puzzlesByMonth?.[month]?.length || 0})
                </span>
              </button>
            ))}
          </div>

          {/* Puzzle grid */}
          <div className="puzzle-grid">
            {(selectedMonth ? puzzlesByMonth?.[selectedMonth] : puzzles)?.map(
              (puzzle, index) => (
                <motion.div
                  key={puzzle.id}
                  className={`puzzle-card ${puzzle.completed ? 'completed' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <div className="puzzle-date">
                    {new Date(puzzle.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="puzzle-difficulty">
                    {getDifficultyStars(puzzle.difficulty)}
                  </div>
                  {puzzle.completed && (
                    <div className="puzzle-score">
                      Score: {puzzle.score}
                    </div>
                  )}
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => handlePlayPuzzle(puzzle.date)}
                  >
                    {puzzle.completed ? 'Replay' : 'Play'}
                  </button>
                </motion.div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
