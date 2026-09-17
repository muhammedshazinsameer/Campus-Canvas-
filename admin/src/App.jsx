import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminNavbar from './components/AdminNavbar';
import LoginPage from './pages/LoginPage';
import PendingQueuePage from './pages/PendingQueuePage';
import ArchivePage from './pages/ArchivePage';
import ReportsPage from './pages/ReportsPage';
import { getReportStats } from './api/client';

function ProtectedRoute({ children, pendingCount, pendingReportsCount }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf7f0] flex items-center justify-center text-sm font-serif italic text-[#787163]">
        Verifying editorial credentials...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7f0] text-[#1a1917]">
      <AdminNavbar pendingCount={pendingCount} pendingReportsCount={pendingReportsCount} />
      <main className="flex-1">{children}</main>
    </div>
  );
}

export default function App() {
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingReportsCount, setPendingReportsCount] = useState(0);

  useEffect(() => {
    // Fetch initial moderation reports count if token exists
    const token = localStorage.getItem('cs_editor_token');
    if (token) {
      getReportStats()
        .then((data) => {
          if (data && typeof data.pendingCount === 'number') {
            setPendingReportsCount(data.pendingCount);
          }
        })
        .catch(() => {});
    }
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute pendingCount={pendingCount} pendingReportsCount={pendingReportsCount}>
                <PendingQueuePage onPendingCountChange={setPendingCount} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/archive"
            element={
              <ProtectedRoute pendingCount={pendingCount} pendingReportsCount={pendingReportsCount}>
                <ArchivePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute pendingCount={pendingCount} pendingReportsCount={pendingReportsCount}>
                <ReportsPage onReportsCountChange={setPendingReportsCount} />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
