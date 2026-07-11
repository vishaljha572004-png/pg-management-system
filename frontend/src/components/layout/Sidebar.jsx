import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../utils/tw-merge';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight, LogOut } from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';
import api from '../../services/api';

export function Sidebar({ menuItems, mobileOpen, setMobileOpen }) {
  const { logout, user } = React.useContext(AuthContext);
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [pgName, setPgName] = useState('');

  useEffect(() => {
    if (user) {
      api.get('/settings').then(res => {
        if (res.data?.pg_name) setPgName(res.data.pg_name);
      }).catch(err => console.error(err));
    }
  }, [user]);

  // Prevent background scrolling on mobile when sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileOpen]);

  const toggleCollapse = () => setCollapsed(!collapsed);

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-background transition-all duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "w-[80px]" : "w-[260px]"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 font-bold text-lg text-primary truncate"
            >
              <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
                {pgName ? pgName.charAt(0).toUpperCase() : 'P'}
              </div>
              <span className="truncate">{pgName || 'PG System'}</span>
            </motion.div>
          )}
          {collapsed && (
            <div className="mx-auto h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
              {pgName ? pgName.charAt(0).toUpperCase() : 'P'}
            </div>
          )}
          <button onClick={toggleCollapse} className="hidden lg:flex p-1 rounded-md hover:bg-accent text-muted-foreground flex-shrink-0">
            <Menu size={20} />
          </button>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 rounded-md hover:bg-accent text-muted-foreground flex-shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin">
          <nav className="space-y-1 px-3">
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              return (
                <NavLink
                  key={index}
                  to={item.path}
                  onClick={() => setMobileOpen(false)} // Fixed: Close sidebar on mobile navigation
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors relative group",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  title={collapsed ? item.label : ""}
                >
                  <span className={cn("flex-shrink-0", isActive ? "text-primary" : "")}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <motion.span 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      className="flex-1 truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                  {isActive && !collapsed && (
                    <motion.div layoutId="active-nav" className="absolute right-2">
                      <ChevronRight size={16} />
                    </motion.div>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="border-t p-4">
          <button
            onClick={() => {
              setMobileOpen(false);
              logout();
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors",
              collapsed ? "justify-center" : ""
            )}
            title={collapsed ? "Logout" : ""}
          >
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
