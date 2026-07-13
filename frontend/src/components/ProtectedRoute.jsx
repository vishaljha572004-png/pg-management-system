import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    const role = user.role?.toString().trim().toLowerCase();
    const normalizedAllowed = allowedRoles.map(r => r.toString().trim().toLowerCase());
    if (!normalizedAllowed.includes(role)) {
      
      if (role === 'admin') return <Navigate to="/admin-dashboard" replace />;
      if (role === 'super admin') return <Navigate to="/super-admin-dashboard" replace />;
      return <Navigate to="/dashboard" replace />;
    }
  }


  return <Outlet />;
};

export default ProtectedRoute;
