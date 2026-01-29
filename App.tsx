
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LiveMap from './pages/LiveMap';
import UsersPage from './pages/Users';
import SessionsPage from './pages/Sessions';
import SessionDetail from './pages/SessionDetail';
import MonitoringPage from './pages/Monitoring';
import { api } from './services/api';

const decodeJwtPayload = (token: string): any | null => {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  try {
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const hasAdminRole = (payload: any): boolean => {
  if (!payload) return false;
  const roles = payload.roles ?? payload.authorities ?? payload.role;
  const list = Array.isArray(roles) ? roles : roles ? [roles] : [];
  return list.some((role) => role === 'ADMIN' || role === 'ROLE_ADMIN');
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = api.getToken();
  if (!token) return <Navigate to="/login" replace />;
  const payload = decodeJwtPayload(token);
  if (!hasAdminRole(payload)) {
    api.setToken(null);
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/live" element={<ProtectedRoute><LiveMap /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
        <Route path="/sessions" element={<ProtectedRoute><SessionsPage /></ProtectedRoute>} />
        <Route path="/sessions/:sessionId" element={<ProtectedRoute><SessionDetail /></ProtectedRoute>} />
        <Route path="/monitoring" element={<ProtectedRoute><MonitoringPage /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
