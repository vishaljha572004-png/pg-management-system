import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on role if unauthorized
    if (user.role === 'Admin') return <Navigate to="/admin-dashboard" replace />;
    if (user.role === 'Super Admin') return <Navigate to="/super-admin-dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }


  return <Outlet />;
};

export default ProtectedRoute;
