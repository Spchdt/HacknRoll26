import { motion } from 'framer-motion';
import { useLeaderboard } from '../api/hooks';

export function LeaderboardPage() {
  const { data: leaderboard, isLoading, error } = useLeaderboard();

  if (isLoading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
        <p>Loading leaderboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-error">
        <p>Failed to load leaderboard</p>
        <p className="error-message">{error.message}</p>
      </div>
    );
  }

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '';
    }
  };

  return (
    <div className="leaderboard-page">
      <div className="page-header">
        <h1>🏆 Leaderboard</h1>
        <p>Top 50 players this season</p>
      </div>

      {leaderboard && (
        <>
          {/* User's rank if not in top 50 */}
          {leaderboard.userEntry && leaderboard.userRank && leaderboard.userRank > 50 && (
            <motion.div
              className="user-rank-banner"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span>Your Rank: </span>
              <strong>#{leaderboard.userRank}</strong>
              <span> • Score: {leaderboard.userEntry.score}</span>
            </motion.div>
          )}

          {/* Leaderboard table */}
          <div className="leaderboard-table">
            <div className="table-header">
              <span className="col-rank">Rank</span>
              <span className="col-player">Player</span>
              <span className="col-score">Score</span>
              <span className="col-games">Games</span>
            </div>

            <div className="table-body">
              {leaderboard.entries.map((entry, index) => (
                <motion.div
                  key={entry.userId}
                  className={`table-row ${
                    leaderboard.userEntry?.userId === entry.userId ? 'current-user' : ''
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <span className="col-rank">
                    {getRankEmoji(entry.rank)}
                    <span className="rank-number">#{entry.rank}</span>
                  </span>
                  <span className="col-player">
                    <span className="player-name">{entry.username || 'Anonymous'}</span>
                  </span>
                  <span className="col-score">{entry.score.toLocaleString()}</span>
                  <span className="col-games">{entry.gamesPlayed}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {leaderboard.entries.length === 0 && (
            <div className="empty-state">
              <p>No entries yet. Be the first!</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
