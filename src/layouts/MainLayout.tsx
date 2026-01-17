import { useState, createContext, useContext, useEffect } from 'react';
import { Terminal, Trophy, Archive, Info, BarChart3 } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Create Dark Mode Context
export const DarkModeContext = createContext<{
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}>({
  isDarkMode: false,
  toggleDarkMode: () => {},
});

export const useDarkMode = () => useContext(DarkModeContext);

const Navbar = () => {
    const { isDarkMode } = useDarkMode();
    
    return (
        <>
            {/* Logo - hidden on mobile, visible on desktop */}
            <div className="hidden md:block md:fixed top-2 left-2 z-20">
                <img src="/logo.svg" alt="Gitty" className={cn(
                  'h-14 w-20 md:h-14 md:w-25',
                  isDarkMode && 'invert'
                )} />
            </div>
            
            <nav className={cn(
              'border-t fixed bottom-0 w-full md:top-0 md:bottom-auto md:border-b md:border-t-0 z-10 transition-colors',
              isDarkMode
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            )}>
                <div className="max-w-4xl mx-auto flex justify-center gap-4 md:gap-8 lg:gap-12 items-center p-4">
                    <NavLink to="/" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? isDarkMode ? 'text-white font-bold' : 'text-black font-bold' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <Terminal size={24} />
                        <span className="text-xs">Game</span>
                    </NavLink>
                <NavLink to="/leaderboard" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? isDarkMode ? 'text-white font-bold' : 'text-black font-bold' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Trophy size={24} />
                    <span className="text-xs">Leaderboard</span>
                </NavLink>
                <NavLink to="/archive" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? isDarkMode ? 'text-white font-bold' : 'text-black font-bold' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Archive size={24} />
                    <span className="text-xs">Archive</span>
                </NavLink>
                <NavLink to="/stats" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? isDarkMode ? 'text-white font-bold' : 'text-black font-bold' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <BarChart3 size={24} />
                    <span className="text-xs">Stats</span>
                </NavLink>
                <NavLink to="/help" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? isDarkMode ? 'text-white font-bold' : 'text-black font-bold' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Info size={24} />
                    <span className="text-xs">Help</span>
                </NavLink>
            </div>
        </nav>
        </>
    );
};

const MainLayout = () => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
      const saved = localStorage.getItem('darkMode');
      return saved ? JSON.parse(saved) : false;
    });

    useEffect(() => {
      localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    }, [isDarkMode]);

    return (
        <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode: () => setIsDarkMode(!isDarkMode) }}>
            <div className={cn(
              'min-h-screen pb-20 md:pb-0 md:pt-20',
              isDarkMode ? 'bg-gray-900 text-white' : 'bg-white'
            )}>
                <Navbar />
                <main className="max-w-4xl mx-auto p-4">
                    <Outlet />
                </main>
            </div>
        </DarkModeContext.Provider>
    );
};

export default MainLayout;
