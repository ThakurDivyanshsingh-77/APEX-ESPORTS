'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  LogOut,
  Bell,
  Check,
  Sparkles,
  X,
  User as UserIcon,
  Gamepad2,
  Award,
  HelpCircle,
  Users,
  MessageSquare,
  UsersRound,
  ChevronDown,
  Menu,
  BellRing,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { io } from 'socket.io-client';
import api from '@/lib/api';
import { useFCM } from '@/hooks/useFCM';
import { getNotificationIcon } from '@/components/NotificationToast';

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCommunityMenu, setShowCommunityMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const { permission, requestPermission, removeTokenOnLogout } = useFCM();

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications/my-notifications?limit=10');
      const data = res.data.data;
      if (data && data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.pagination?.unreadCount || data.notifications.filter((n: any) => !n.read).length);
      } else if (Array.isArray(data)) {
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.read).length);
      }
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
      setNotifications((prev) => [notif, ...prev].slice(0, 10));
      setUnreadCount((prev) => prev + 1);
    };

    s.on('global_announcement', handleIncoming);
    s.on('new_notification', handleIncoming);
    s.on('user_notification', handleIncoming);

    return () => {
      s.disconnect();
    };
  }, []);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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

  const handleNotificationClick = (notif: any) => {
    if (!notif.read) {
      handleMarkAsRead(notif._id);
    }
    setShowNotifications(false);
    if (notif.link) {
      router.push(notif.link);
    } else {
      router.push('/notifications');
    }
  };

  const handleLogout = async () => {
    await removeTokenOnLogout();
    logout();
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

            {/* Community Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setShowCommunityMenu(!showCommunityMenu)}
                className="px-4 py-2 border-2 border-transparent hover:border-[#3F3F46] hover:text-[#DFE104] hover:bg-[#27272A] transition-all flex items-center gap-1.5"
              >
                <Users className="h-4 w-4 stroke-[2]" />
                <span>COMMUNITY</span>
                <ChevronDown className="h-3.5 w-3.5 stroke-[2]" />
              </button>

              {showCommunityMenu && (
                <div className="absolute left-0 mt-2 w-56 bg-[#0D1117] border-2 border-[#3F3F46] shadow-2xl p-2 z-50 space-y-1">
                  <Link
                    href="/community/players"
                    onClick={() => setShowCommunityMenu(false)}
                    className="flex items-center space-x-3 px-3 py-2 text-xs font-bold uppercase text-[#FAFAFA] hover:bg-[#DFE104] hover:text-black transition-all"
                  >
                    <Users className="h-4 w-4" />
                    <span>PLAYERS DIRECTORY</span>
                  </Link>
                  <Link
                    href="/community/friends"
                    onClick={() => setShowCommunityMenu(false)}
                    className="flex items-center space-x-3 px-3 py-2 text-xs font-bold uppercase text-[#FAFAFA] hover:bg-[#DFE104] hover:text-black transition-all"
                  >
                    <UsersRound className="h-4 w-4" />
                    <span>FRIENDS & REQUESTS</span>
                  </Link>
                  <Link
                    href="/community/chat"
                    onClick={() => setShowCommunityMenu(false)}
                    className="flex items-center space-x-3 px-3 py-2 text-xs font-bold uppercase text-[#FAFAFA] hover:bg-[#DFE104] hover:text-black transition-all"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>DIRECT CHAT</span>
                  </Link>
                  <Link
                    href="/community/teams"
                    onClick={() => setShowCommunityMenu(false)}
                    className="flex items-center space-x-3 px-3 py-2 text-xs font-bold uppercase text-[#FAFAFA] hover:bg-[#DFE104] hover:text-black transition-all"
                  >
                    <Trophy className="h-4 w-4" />
                    <span>TEAMS & CLANS</span>
                  </Link>
                  <Link
                    href="/community/team-leaderboard"
                    onClick={() => setShowCommunityMenu(false)}
                    className="flex items-center space-x-3 px-3 py-2 text-xs font-bold uppercase text-[#FAFAFA] hover:bg-[#DFE104] hover:text-black transition-all border-t border-white/10 pt-2"
                  >
                    <Award className="h-4 w-4 text-[#DFE104]" />
                    <span>TEAM LEADERBOARD</span>
                  </Link>
                </div>
              )}
            </div>

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
                className="p-2.5 bg-[#27272A] border-2 border-[#3F3F46] hover:border-[#DFE104] text-[#FAFAFA] transition-all relative group"
                title="Notifications"
              >
                <Bell className={`h-4 w-4 stroke-[2] ${unreadCount > 0 ? 'text-[#DFE104] animate-bounce' : ''}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 h-5 w-5 bg-[#DFE104] text-black font-extrabold text-[10px] flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Menu Drawer */}
              {showNotifications && (
                <div className="absolute right-[-70px] sm:right-0 mt-3 w-[92vw] max-w-sm sm:w-96 bg-[#09090B] border-2 border-[#3F3F46] p-4 z-50 max-h-[85vh] overflow-y-auto shadow-2xl">
                  {/* Push Permission Prompt Banner */}
                  {permission !== 'granted' && (
                    <div className="mb-3 p-3 bg-[#DFE104]/10 border border-[#DFE104]/40 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-[#DFE104] font-bold">
                        <BellRing className="h-4 w-4 shrink-0" />
                        <span>ENABLE PUSH ALERTS</span>
                      </div>
                      <button
                        onClick={requestPermission}
                        className="px-2.5 py-1 bg-[#DFE104] text-black font-extrabold text-[10px] uppercase rounded hover:bg-white transition-colors"
                      >
                        ENABLE
                      </button>
                    </div>
                  )}

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
                          MARK ALL READ
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
                    <div className="py-8 text-center text-xs text-[#A1A1AA] font-mono uppercase font-bold space-y-2">
                      <Bell className="h-8 w-8 mx-auto text-[#3F3F46]" />
                      <p>NO NOTIFICATIONS YET.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3 border text-xs transition-all cursor-pointer rounded-xl flex items-start space-x-3 ${
                            n.read
                              ? 'bg-[#18181B]/60 border-[#27272A] text-[#A1A1AA] hover:bg-[#27272A]/50'
                              : 'bg-[#18181B] text-white border-[#DFE104]/50 font-bold hover:border-[#DFE104] shadow-md'
                          }`}
                        >
                          <div className="p-2 rounded-lg bg-white/5 shrink-0 mt-0.5">
                            {getNotificationIcon(n.type)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-extrabold uppercase tracking-tight text-white truncate text-xs">
                                {n.title}
                              </span>
                              {!n.read && (
                                <button
                                  onClick={(e) => handleMarkAsRead(n._id, e)}
                                  className="text-[9px] font-mono uppercase font-bold text-[#DFE104] hover:underline shrink-0"
                                >
                                  READ
                                </button>
                              )}
                            </div>
                            <p className="leading-relaxed text-[11px] text-[#A1A1AA] line-clamp-2">{n.message}</p>
                            <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
                              <span className="text-[9px] font-mono text-[#71717A] uppercase">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {n.link && (
                                <span className="text-[9px] font-mono font-bold text-[#DFE104] uppercase flex items-center gap-0.5">
                                  OPEN <ExternalLink className="h-2.5 w-2.5" />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t-2 border-[#3F3F46] text-center">
                    <Link
                      href="/notifications"
                      onClick={() => setShowNotifications(false)}
                      className="inline-flex items-center justify-center gap-2 text-xs font-heading font-extrabold text-[#DFE104] hover:underline uppercase tracking-wide"
                    >
                      <span>VIEW ALL NOTIFICATIONS</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
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
              onClick={handleLogout}
              title="Logout"
              className="p-2.5 bg-[#27272A] border-2 border-[#3F3F46] text-[#FAFAFA] hover:bg-red-600 hover:border-red-600 transition-colors"
            >
              <LogOut className="h-4 w-4 stroke-[2]" />
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 bg-[#27272A] border-2 border-[#3F3F46] text-[#FAFAFA] hover:border-[#DFE104] transition-all"
              title="Toggle Mobile Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5 stroke-[2.5]" /> : <Menu className="h-5 w-5 stroke-[2.5]" />}
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
            {/* Mobile Hamburger Toggle for Guest */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 bg-[#27272A] border-2 border-[#3F3F46] text-[#FAFAFA] hover:border-[#DFE104] transition-all"
              title="Toggle Mobile Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5 stroke-[2.5]" /> : <Menu className="h-5 w-5 stroke-[2.5]" />}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[73px] bg-[#0D1117]/95 backdrop-blur-xl border-b-2 border-[#3F3F46] p-6 z-40 space-y-4 shadow-2xl animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col space-y-2 text-xs font-heading font-extrabold uppercase tracking-wider text-[#FAFAFA]">
            {user ? (
              <>
                <Link
                  href="/tournaments"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center space-x-3 hover:bg-[#DFE104] hover:text-black transition-all"
                >
                  <Gamepad2 className="h-5 w-5 text-[#DFE104]" />
                  <span>TOURNAMENTS & ARENA</span>
                </Link>
                <Link
                  href="/notifications"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center space-x-3 hover:bg-[#DFE104] hover:text-black transition-all"
                >
                  <Bell className="h-5 w-5 text-[#DFE104]" />
                  <span>NOTIFICATIONS CENTER ({unreadCount})</span>
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center space-x-3 hover:bg-[#DFE104] hover:text-black transition-all"
                >
                  <Trophy className="h-5 w-5 text-[#DFE104]" />
                  <span>MY MATCHES & PROFILE</span>
                </Link>
                <Link
                  href="/community/players"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center space-x-3 hover:bg-[#DFE104] hover:text-black transition-all"
                >
                  <Users className="h-5 w-5 text-[#DFE104]" />
                  <span>PLAYERS DIRECTORY</span>
                </Link>
                <Link
                  href="/community/friends"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center space-x-3 hover:bg-[#DFE104] hover:text-black transition-all"
                >
                  <UsersRound className="h-5 w-5 text-[#DFE104]" />
                  <span>FRIENDS & REQUESTS</span>
                </Link>
                <Link
                  href="/community/chat"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center space-x-3 hover:bg-[#DFE104] hover:text-black transition-all"
                >
                  <MessageSquare className="h-5 w-5 text-[#DFE104]" />
                  <span>DIRECT CHAT</span>
                </Link>
                <Link
                  href="/community/teams"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center space-x-3 hover:bg-[#DFE104] hover:text-black transition-all"
                >
                  <Trophy className="h-5 w-5 text-[#DFE104]" />
                  <span>TEAMS & CLANS</span>
                </Link>
                <Link
                  href="/community/team-leaderboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center space-x-3 hover:bg-[#DFE104] hover:text-black transition-all"
                >
                  <Award className="h-5 w-5 text-[#DFE104]" />
                  <span>TEAM LEADERBOARD</span>
                </Link>
                <Link
                  href="/leaderboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center space-x-3 hover:bg-[#DFE104] hover:text-black transition-all"
                >
                  <Award className="h-5 w-5 text-[#DFE104]" />
                  <span>GLOBAL LEADERBOARD</span>
                </Link>
                <Link
                  href="/support"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center space-x-3 hover:bg-[#DFE104] hover:text-black transition-all"
                >
                  <HelpCircle className="h-5 w-5 text-[#DFE104]" />
                  <span>SUPPORT & HELPDESK</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-[#DFE104] hover:text-black transition-all"
                >
                  HOME ARENA
                </Link>
                <Link
                  href="/leaderboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-[#DFE104] hover:text-black transition-all"
                >
                  GLOBAL LEADERBOARD
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-[#DFE104] hover:text-black transition-all"
                >
                  SIGN IN
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3 bg-[#DFE104] text-black font-extrabold rounded-xl hover:bg-white transition-all text-center"
                >
                  CREATE ATHLETE PROFILE
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
