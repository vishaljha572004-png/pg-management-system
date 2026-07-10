import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { 
  LayoutDashboard, 
  Users, 
  BedDouble, 
  Wallet, 
  Zap, 
  MessageSquareWarning, 
  BarChart3, 
  Settings, 
  CheckCircle, 
  Bell 
} from 'lucide-react';

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { label: 'Dashboard', path: '/admin-dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Students', path: '/admin/directory', icon: <Users size={20} /> },
    { label: 'Rooms', path: '/admin/rooms', icon: <BedDouble size={20} /> },
    { label: 'Rent', path: '/admin/rent', icon: <Wallet size={20} /> },
    { label: 'Electricity', path: '/admin/electricity', icon: <Zap size={20} /> },
    { label: 'Complaints', path: '/admin/complaints', icon: <MessageSquareWarning size={20} /> },
    { label: 'Reports', path: '/admin/reports', icon: <BarChart3 size={20} /> },
    { label: 'Tenant Verification', path: '/admin/tenant-verification', icon: <Users size={20} /> },
    { label: 'Verify Payments', path: '/admin/payment-verification', icon: <CheckCircle size={20} /> },
    { label: 'Notice Board', path: '/admin/notice-board', icon: <Bell size={20} /> },
    { label: 'PG Settings', path: '/admin/payment-settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-900/50">
      <Sidebar menuItems={menuItems} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      
      <div className="flex w-full flex-col lg:pl-[260px] transition-all duration-300">
        <TopNav setMobileOpen={setMobileOpen} />
        
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
