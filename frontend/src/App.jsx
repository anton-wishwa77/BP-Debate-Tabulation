import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import PublicStandingsHub from './pages/public/PublicStandingsHub';
import DrawsBoard from './pages/public/DrawsBoard';
import JudgeLogin from './pages/judge/JudgeLogin';
import JudgeDashboard from './pages/judge/JudgeDashboard';
import BallotForm from './pages/judge/BallotForm';
import AdminDashboard from './pages/admin/AdminDashboard';

// Ensure root element never retains dark mode and clear legacy storage
if (typeof window !== 'undefined') {
  document.documentElement.classList.remove('dark');
  try {
    localStorage.removeItem('forum_aeterna_theme');
  } catch (e) {
    // Ignore storage errors
  }
}

function App() {
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<PublicStandingsHub />} />
          <Route path="/standings" element={<PublicStandingsHub />} />
          <Route path="/draws" element={<DrawsBoard />} />
          <Route path="/judge" element={<JudgeLogin />} />
          <Route path="/judge/login" element={<JudgeLogin />} />
          <Route path="/judge/dashboard" element={<JudgeDashboard />} />
          <Route path="/judge/matches/:matchId/ballot" element={<BallotForm />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
