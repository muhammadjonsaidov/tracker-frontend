import React from 'react';
import { Navigate } from 'react-router-dom';
import Layout from '@/shared/components/Layout';
import { api } from '@/shared/services/api';
import { decodeJwtPayload, hasAdminRole } from '@/shared/utils/auth';

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

export default ProtectedRoute;
