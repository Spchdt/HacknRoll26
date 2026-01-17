import { NavLink, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUIStore } from '../stores';

export function Layout() {
  const { isMobileMenuOpen, setMobileMenuOpen } = useUIStore();

  const navItems = [
    { path: '/', label: 'Play', icon: '🎮' },
    { path: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
    { path: '/stats', label: 'Stats', icon: '📊' },
    { path: '/archive', label: 'Archive', icon: '📚' },
  ];

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1 className="logo">
            <span className="logo-icon">🌿</span>
            HacknRoll26
          </h1>
          
          <nav className="desktop-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className="hamburger">{isMobileMenuOpen ? '✕' : '☰'}</span>
          </button>
        </div>

        {isMobileMenuOpen && (
          <motion.nav
            className="mobile-nav"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
          </motion.nav>
        )}
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        <p>HacknRoll 2026 • Built with 💚</p>
      </footer>
    </div>
  );
}
