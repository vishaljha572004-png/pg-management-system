import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AdminLayout } from './components/layout/AdminLayout';
import { StudentLayout } from './components/layout/StudentLayout';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import RoomManagement from './pages/RoomManagement';
import RentCollection from './pages/RentCollection';
import ElectricityBilling from './pages/ElectricityBilling';
import ComplaintManagement from './pages/ComplaintManagement';
import StudentComplaints from './pages/StudentComplaints';
import ReportsAnalytics from './pages/ReportsAnalytics';
import StudentDirectory from './pages/StudentDirectory';
import StudentPayments from './pages/StudentPayments';
import StudentProfile from './pages/StudentProfile';
import PaymentSettings from './pages/PaymentSettings';
import PaymentVerification from './pages/PaymentVerification';
import ProfileVerification from './pages/ProfileVerification';
import TenantVerificationDashboard from './pages/TenantVerificationDashboard';
import AdminNoticeBoard from './pages/AdminNoticeBoard';
import AdminLogin from './pages/AdminLogin';
import AdminRegister from './pages/AdminRegister';
import SuperAdminLogin from './pages/SuperAdminLogin';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/register" element={<AdminRegister />} />
            <Route path="/super-admin/login" element={<SuperAdminLogin />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Protected Student Routes */}
            <Route element={<ProtectedRoute allowedRoles={['Student']} />}>
              <Route element={<StudentLayout />}>
                <Route path="/verify-profile" element={<ProfileVerification />} />
                <Route path="/dashboard" element={<StudentDashboard />} />
                <Route path="/student/complaints" element={<StudentComplaints />} />
                <Route path="/student/payments" element={<StudentPayments />} />
                <Route path="/student/profile" element={<StudentProfile />} />
              </Route>
            </Route>

            {/* Protected Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/admin/rooms" element={<RoomManagement />} />
                <Route path="/admin/rent" element={<RentCollection />} />
                <Route path="/admin/electricity" element={<ElectricityBilling />} />
                <Route path="/admin/complaints" element={<ComplaintManagement />} />
                <Route path="/admin/reports" element={<ReportsAnalytics />} />
                <Route path="/admin/directory" element={<StudentDirectory />} />
                <Route path="/admin/payment-settings" element={<PaymentSettings />} />
                <Route path="/admin/payment-verification" element={<PaymentVerification />} />
                <Route path="/admin/tenant-verification" element={<TenantVerificationDashboard />} />
                <Route path="/admin/notice-board" element={<AdminNoticeBoard />} />
              </Route>
            </Route>

            {/* Protected Super Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['Super Admin']} />}>
              <Route path="/super-admin-dashboard" element={<SuperAdminDashboard />} />
            </Route>
            
            <Route path="*" element={<div>404 Not Found</div>} />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
