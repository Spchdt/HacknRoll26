import { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUIStore, useThemeStore } from '../stores';
import { Button } from './ui/button';
import { Gamepad2, Trophy, BarChart3, Archive, Sun, Moon, Menu, X, Leaf, Heart } from 'lucide-react';

export function Layout() {
  const { isMobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const { isDarkMode, toggleTheme } = useThemeStore();

  // Apply theme on mount
  useEffect(() => {
    if (!isDarkMode) {
      document.body.classList.add('light-mode');
    }
  }, []);

  const navItems = [
    { path: '/', label: 'Play', icon: Gamepad2 },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { path: '/stats', label: 'Stats', icon: BarChart3 },
    { path: '/archive', label: 'Archive', icon: Archive },
  ];

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1 className="logo">
            <Leaf className="logo-icon" size={24} />
            HacknRoll26
          </h1>
          
          <nav className="desktop-nav">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                >
                  <IconComponent size={18} />
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
              className="mobile-menu-btn"
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </Button>
          </div>
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
        <p className="flex items-center gap-1">HacknRoll 2026 • Built with <Heart size={16} className="text-red-500" /></p>
      </footer>
    </div>
  );
}
