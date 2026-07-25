'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, LogOut, Bell, Check, Sparkles, X, User as UserIcon, Gamepad2, Award, HelpCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { io } from 'socket.io-client';
import api from '@/lib/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications/my-notifications');
      setNotifications(res.data.data);
      setUnreadCount(res.data.data.filter((n: any) => !n.read).length);
    } catch (err) {}
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  useEffect(() => {
    const s = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });

    const handleIncoming = (notif: any) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    s.on('global_announcement', handleIncoming);
    s.on('new_notification', handleIncoming);
    s.on('user_notification', handleIncoming);

    return () => {
      s.disconnect();
    };
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {}
  };

  return (
    <header className="sticky top-0 z-50 bg-[#09090B] border-b-2 border-[#3F3F46] px-6 py-4 flex items-center justify-between">
      {/* Logo */}
      <Link href={user ? '/tournaments' : '/'} className="flex items-center space-x-3 group">
        <div className="h-10 w-10 bg-[#DFE104] text-black rounded-none flex items-center justify-center font-bold transition-transform duration-200 group-hover:scale-105">
          <Trophy className="h-5 w-5 text-black stroke-[2.5]" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-heading font-extrabold tracking-tighter text-[#FAFAFA] uppercase group-hover:text-[#DFE104] transition-colors flex items-center gap-2">
            APEX ESPORTS
            <span className="h-2 w-2 bg-[#DFE104] animate-pulse"></span>
          </span>
          <span className="text-[10px] font-mono text-[#A1A1AA] tracking-widest uppercase -mt-1">KINETIC DEFI CIRCUIT</span>
        </div>
      </Link>

      {/* Dynamic Nav Links */}
      <nav className="hidden md:flex items-center space-x-2 text-xs font-heading font-bold uppercase tracking-tighter text-[#A1A1AA]">
        {user ? (
          <>
            <Link
              href="/tournaments"
              className="px-4 py-2 border-2 border-transparent hover:border-[#3F3F46] hover:text-[#DFE104] hover:bg-[#27272A] transition-all flex items-center gap-2"
            >
              <Gamepad2 className="h-4 w-4 stroke-[2]" />
              <span>TOURNAMENTS</span>
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 border-2 border-transparent hover:border-[#3F3F46] hover:text-[#DFE104] hover:bg-[#27272A] transition-all flex items-center gap-2"
            >
              <Trophy className="h-4 w-4 stroke-[2]" />
              <span>MY MATCHES</span>
            </Link>
            <Link
              href="/leaderboard"
              className="px-4 py-2 border-2 border-transparent hover:border-[#3F3F46] hover:text-[#DFE104] hover:bg-[#27272A] transition-all flex items-center gap-2"
            >
              <Award className="h-4 w-4 stroke-[2]" />
              <span>LEADERBOARD</span>
            </Link>
            <Link
              href="/support"
              className="px-4 py-2 border-2 border-transparent hover:border-[#3F3F46] hover:text-[#DFE104] hover:bg-[#27272A] transition-all flex items-center gap-2"
            >
              <HelpCircle className="h-4 w-4 stroke-[2]" />
              <span>SUPPORT & HELPDESK</span>
            </Link>
          </>
        ) : (
          <>
            <Link href="/" className="px-4 py-2 border-2 border-transparent hover:border-[#3F3F46] hover:text-[#DFE104] hover:bg-[#27272A] transition-all">HOME</Link>
            <Link href="/#features" className="px-4 py-2 border-2 border-transparent hover:border-[#3F3F46] hover:text-[#DFE104] hover:bg-[#27272A] transition-all">FEATURES</Link>
            <Link href="/leaderboard" className="px-4 py-2 border-2 border-transparent hover:border-[#3F3F46] hover:text-[#DFE104] hover:bg-[#27272A] transition-all">LEADERBOARD</Link>
          </>
        )}
      </nav>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {user ? (
          <div className="flex items-center space-x-3 relative">
            {/* Notification Bell Button */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 bg-[#27272A] border-2 border-[#3F3F46] hover:border-[#DFE104] text-[#FAFAFA] transition-all relative"
                title="Notifications"
              >
                <Bell className="h-4 w-4 stroke-[2]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 h-5 w-5 bg-[#DFE104] text-black font-extrabold text-[10px] flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Menu */}
              {showNotifications && (
                <div className="absolute right-[-70px] sm:right-0 mt-3 w-[92vw] max-w-sm sm:w-96 bg-[#09090B] border-2 border-[#3F3F46] p-4 z-50 max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b-2 border-[#3F3F46] pb-3 mb-3">
                    <span className="text-xs font-heading font-extrabold uppercase tracking-tighter text-[#DFE104] flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 stroke-[2]" />
                      NOTIFICATIONS ({unreadCount})
                    </span>

                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-[10px] font-heading uppercase font-bold text-[#DFE104] hover:underline"
                        >
                          CLEAR ALL
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-[#A1A1AA] hover:text-[#FAFAFA]"
                      >
                        <X className="h-4 w-4 stroke-[2]" />
                      </button>
                    </div>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#A1A1AA] font-mono uppercase font-bold">
                      NO NOTIFICATIONS.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {notifications.map((n) => (
                        <div
                          key={n._id}
                          className={`p-3 border text-xs transition-colors ${
                            n.read
                              ? 'bg-[#27272A]/40 border-[#3F3F46] text-[#A1A1AA]'
                              : 'bg-[#27272A] text-white border-[#DFE104] font-bold'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold uppercase tracking-tight text-white flex items-center gap-1">
                              {n.type === 'PAYMENT_APPROVED' && '🎉 '}
                              {n.type === 'ROOM_RELEASED' && '🗝️ '}
                              {n.type === 'MATCH_WIN' && '🏆 '}
                              {n.title}
                            </span>
                            {!n.read && (
                              <button
                                onClick={() => handleMarkAsRead(n._id)}
                                className="text-[10px] font-mono uppercase font-bold text-[#DFE104] underline hover:opacity-80 flex items-center gap-0.5"
                              >
                                <Check className="h-3 w-3" />
                                <span>READ</span>
                              </button>
                            )}
                          </div>
                          <p className="leading-relaxed text-[11px] text-[#A1A1AA]">{n.message}</p>
                          <span className="block mt-2 text-[9px] font-mono text-[#A1A1AA] uppercase">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Avatar Button */}
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 px-4 py-2 border-2 border-[#3F3F46] bg-[#27272A] hover:bg-[#DFE104] hover:text-black hover:border-[#DFE104] text-xs font-heading font-extrabold uppercase tracking-tighter text-[#FAFAFA] transition-all group"
            >
              <img
                src={user.profileImage || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80'}
                alt={user.name}
                className="h-6 w-6 rounded-none object-cover border border-black"
              />
              <span className="hidden sm:inline font-heading">{user.name}</span>
            </Link>

            {/* Logout Button */}
            <button
              onClick={logout}
              title="Logout"
              className="p-2.5 bg-[#27272A] border-2 border-[#3F3F46] text-[#FAFAFA] hover:bg-red-600 hover:border-red-600 transition-colors"
            >
              <LogOut className="h-4 w-4 stroke-[2]" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-heading font-extrabold uppercase tracking-tighter text-[#A1A1AA] hover:text-[#DFE104] transition-all"
            >
              SIGN IN
            </Link>
            <Link
              href="/signup"
              className="kt-btn-primary text-xs !py-2.5 !px-5"
            >
              REGISTER PROFILE
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
