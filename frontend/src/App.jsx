import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import PublicStandingsHub from './pages/public/PublicStandingsHub';
import DrawsBoard from './pages/public/DrawsBoard';
import JudgePortalPlaceholder from './pages/JudgePortalPlaceholder';
import AdminDashboardPlaceholder from './pages/AdminDashboardPlaceholder';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<PublicStandingsHub />} />
          <Route path="/standings" element={<PublicStandingsHub />} />
          <Route path="/draws" element={<DrawsBoard />} />
          <Route path="/judge" element={<JudgePortalPlaceholder />} />
          <Route path="/admin" element={<AdminDashboardPlaceholder />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
