import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (_) {
      console.error('Failed to load notifications');
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (_) {
      toast.error('Failed to mark read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
    } catch (_) {
      toast.error('Failed to mark all read');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
        <Bell className="w-6 h-6 text-slate-600 dark:text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 border-2 border-white dark:border-slate-900 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">No notifications</div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  onClick={() => !notif.is_read && markAsRead(notif.id)}
                  className={`p-4 border-b border-slate-100 dark:border-slate-700/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${notif.is_read ? 'opacity-70' : 'bg-indigo-50/50 dark:bg-indigo-900/20'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{notif.title}</h4>
                    {!notif.is_read && <span className="w-2 h-2 rounded-full bg-indigo-600"></span>}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{notif.message}</p>
                  <span className="text-[10px] text-slate-400 mt-2 block">
                    {new Date(notif.created_at).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
