import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { 
  LayoutDashboard, 
  MessageSquareWarning, 
  User, 
  WalletCards,
  CheckSquare
} from 'lucide-react';

export function StudentLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'My Profile', path: '/student/profile', icon: <User size={20} /> },
    { label: 'My Payments', path: '/student/payments', icon: <WalletCards size={20} /> },
    { label: 'My Complaints', path: '/student/complaints', icon: <MessageSquareWarning size={20} /> },
    { label: 'Verification', path: '/verify-profile', icon: <CheckSquare size={20} /> },
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
