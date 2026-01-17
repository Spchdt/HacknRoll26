import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import GamePage from '@/pages/GamePage';
import LeaderboardPage from '@/pages/LeaderboardPage';
import ArchivePage from '@/pages/ArchivePage';
import StatsPage from '@/pages/StatsPage';
import HelpPage from '@/pages/HelpPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<GamePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
