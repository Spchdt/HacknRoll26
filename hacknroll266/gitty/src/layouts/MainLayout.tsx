import { Terminal, GitGraph, Trophy, Archive, Info, BarChart3 } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav className="border-t border-gray-200 bg-white fixed bottom-0 w-full md:top-0 md:bottom-auto md:border-b md:border-t-0 z-10">
            <div className="max-w-4xl mx-auto flex justify-around p-4">
                <NavLink to="/" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-black font-bold' : 'text-gray-500'}`}>
                    <Terminal size={24} />
                    <span className="text-xs">Game</span>
                </NavLink>
                <NavLink to="/leaderboard" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-black font-bold' : 'text-gray-500'}`}>
                    <Trophy size={24} />
                    <span className="text-xs">Leaderboard</span>
                </NavLink>
                <NavLink to="/archive" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-black font-bold' : 'text-gray-500'}`}>
                    <Archive size={24} />
                    <span className="text-xs">Archive</span>
                </NavLink>
                <NavLink to="/stats" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-black font-bold' : 'text-gray-500'}`}>
                    <BarChart3 size={24} />
                    <span className="text-xs">Stats</span>
                </NavLink>
                <NavLink to="/help" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-black font-bold' : 'text-gray-500'}`}>
                    <Info size={24} />
                    <span className="text-xs">Help</span>
                </NavLink>
            </div>
        </nav>
    );
};

const MainLayout = () => {
    return (
        <div className="min-h-screen bg-white pb-20 md:pb-0 md:pt-20">
            <Navbar />
            <main className="max-w-4xl mx-auto p-4">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
