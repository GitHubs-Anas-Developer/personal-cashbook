'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice.js';
import { setTheme, showToast } from '../../store/slices/uiSlice.js';
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useLogoutUserMutation
} from '../../store/services/api.js';
import {
  Bell,
  Sun,
  Moon,
  LogOut,
  User,
  CheckCheck
} from 'lucide-react';
import Link from 'next/link';

export function Header() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const theme = useSelector((state) => state.ui.theme);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const { data: notifData } = useGetNotificationsQuery(undefined, {
    pollingInterval: 30000
  });
  const [markAllRead] = useMarkAllNotificationsReadMutation();
  const [logoutApi] = useLogoutUserMutation();

  const notifications = notifData?.data || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch {
      // Ignore
    }
    dispatch(logout());
    dispatch(showToast({ type: 'info', message: 'You have been signed out.' }));
    router.push('/login');
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    dispatch(setTheme(nextTheme));
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      {/* Title */}
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 hidden sm:block">
          Personal Cashbook
        </h2>
        <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Private Ledger ({user?.preferences?.currency || 'INR'})
        </span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title="Toggle Light/Dark Theme"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead()}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No notifications right now.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`p-3 text-xs transition-colors ${
                        notif.isRead ? 'opacity-70 bg-transparent' : 'bg-indigo-50/40 dark:bg-indigo-950/20'
                      }`}
                    >
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {notif.title}
                      </div>
                      <p className="mt-0.5 text-slate-600 dark:text-slate-400 text-[11px]">
                        {notif.message}
                      </p>
                      <span className="mt-1 block text-[10px] text-slate-400">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 pl-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center shadow-xs">
              {initials}
            </div>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-200 hidden md:block max-w-[120px] truncate">
              {user?.name || 'Account'}
            </span>
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {user?.name}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>

              <Link
                href="/settings"
                onClick={() => setIsUserMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <User className="w-3.5 h-3.5" />
                Profile & Settings
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
