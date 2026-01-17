import { motion } from 'framer-motion';
import { useStats } from '../api/hooks';
import { useUserPrefsStore } from '../stores';

export function StatsPage() {
  const { data: stats, isLoading, error } = useStats();
  const { username } = useUserPrefsStore();

  if (isLoading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
        <p>Loading stats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-error">
        <p>Failed to load stats</p>
        <p className="error-message">{error.message}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="empty-state">
        <p>No stats yet. Play some games to see your stats!</p>
      </div>
    );
  }

  const winRate =
    stats.totalGamesPlayed > 0
      ? Math.round((stats.totalGamesWon / stats.totalGamesPlayed) * 100)
      : 0;

  const statCards = [
    {
      label: 'Games Played',
      value: stats.totalGamesPlayed,
      icon: '🎮',
    },
    {
      label: 'Games Won',
      value: stats.totalGamesWon,
      icon: '✅',
    },
    {
      label: 'Win Rate',
      value: `${winRate}%`,
      icon: '📊',
    },
    {
      label: 'Total Commands',
      value: stats.totalCommandsUsed,
      icon: '💻',
    },
    {
      label: 'Best Score',
      value: stats.bestScore,
      icon: '🏆',
    },
    {
      label: 'Average Score',
      value: Math.round(stats.averageScore),
      icon: '📈',
    },
    {
      label: 'Current Streak',
      value: `${stats.currentStreak} days`,
      icon: '🔥',
    },
    {
      label: 'Max Streak',
      value: `${stats.maxStreak} days`,
      icon: '⚡',
    },
  ];

  return (
    <div className="stats-page">
      <div className="page-header">
        <h1>📊 Your Stats</h1>
        {username && <p className="username-display">Playing as: {username}</p>}
      </div>

      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <span className="stat-icon">{stat.icon}</span>
            <span className="stat-value">{stat.value}</span>
            <span className="stat-label">{stat.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Win rate progress bar */}
      <div className="win-rate-section">
        <h3>Win Rate</h3>
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${winRate}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="progress-labels">
          <span>0%</span>
          <span>{winRate}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Streak info */}
      {stats.currentStreak > 0 && (
        <motion.div
          className="streak-banner"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <span className="streak-icon">🔥</span>
          <div className="streak-content">
            <strong>{stats.currentStreak} day streak!</strong>
            <p>Keep it up! Play today to continue your streak.</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
