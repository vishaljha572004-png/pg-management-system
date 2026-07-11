import React, { useContext, useEffect } from 'react';
import { Menu, Moon, Sun, User } from 'lucide-react';
import NotificationBell from '../NotificationBell';
import { AuthContext } from '../../contexts/AuthContext';
import { useLocation, Link } from 'react-router-dom';

export function TopNav({ setMobileOpen }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [theme, setTheme] = React.useState('light');

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setTheme('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      document.documentElement.classList.add('dark');
      setTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      setTheme('light');
    }
  };

  // Generate breadcrumb from pathname
  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumb = pathParts.map(part => part.charAt(0).toUpperCase() + part.slice(1).replace('-', ' ')).join(' / ');

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 rounded-md hover:bg-accent text-muted-foreground"
        >
          <Menu size={20} />
        </button>
        <div className="hidden md:flex flex-col">
          <span className="text-sm font-medium text-muted-foreground">Pages / {breadcrumb || 'Dashboard'}</span>
          <h2 className="text-lg font-bold capitalize text-foreground">{pathParts[pathParts.length - 1]?.replace('-', ' ') || 'Dashboard'}</h2>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        
        <NotificationBell />

        <div className="flex items-center gap-3 pl-4 border-l">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-semibold">{user?.name || 'User'}</span>
            <span className="text-xs text-muted-foreground capitalize">{user?.role || 'Role'}</span>
          </div>
          {user?.role === 'Student' ? (
            <Link to="/student/profile" className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold hover:bg-primary/20 transition-colors cursor-pointer">
              <User size={18} />
            </Link>
          ) : (
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              <User size={18} />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
