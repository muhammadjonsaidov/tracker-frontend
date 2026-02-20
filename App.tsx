
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/features/auth/pages/LoginPage';
import ProtectedRoute from '@/features/auth/components/ProtectedRoute';
import Dashboard from '@/features/dashboard/pages/DashboardPage';
import LiveMap from '@/features/map/pages/LiveMapPage';
import UsersPage from '@/features/users/pages/UsersPage';
import SessionsPage from '@/features/sessions/pages/SessionsPage';
import SessionDetail from '@/features/sessions/pages/SessionDetailPage';
import MonitoringPage from '@/features/monitoring/pages/MonitoringPage';
import AuditLogsPage from '@/features/admin/pages/AuditLogsPage';

const App: React.FC = () => (
  <HashRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/live" element={<ProtectedRoute><LiveMap /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
      <Route path="/sessions" element={<ProtectedRoute><SessionsPage /></ProtectedRoute>} />
      <Route path="/sessions/:sessionId" element={<ProtectedRoute><SessionDetail /></ProtectedRoute>} />
      <Route path="/monitoring" element={<ProtectedRoute><MonitoringPage /></ProtectedRoute>} />
      <Route path="/audit-logs" element={<ProtectedRoute><AuditLogsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </HashRouter>
);

export default App;
