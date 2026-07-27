'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  Bell,
  CheckCheck,
  Trash2,
  Filter,
  Search,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Check,
  RefreshCw,
  BellRing,
  AlertCircle,
  Loader2,
  ArrowRight,
  Trophy,
  DollarSign,
  UserPlus,
  MessageSquare,
  Key,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useFCM } from '@/hooks/useFCM';
import { getNotificationIcon } from '@/components/NotificationToast';

export default function NotificationCenterPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { permission, requestPermission, loading: fcmLoading } = useFCM();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'MATCHES' | 'COMMUNITY' | 'PAYMENTS' | 'SYSTEM'>('ALL');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Redirect guest to login
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const fetchNotifications = useCallback(async (pageNum = 1, isRefresh = false) => {
    if (!user) return;

    if (isRefresh) setRefreshing(true);
    else if (pageNum === 1) setLoading(true);

    setError('');

    try {
      let statusQuery = 'all';
      if (activeTab === 'UNREAD') statusQuery = 'unread';

      let typeQuery = 'all';
      if (activeTab === 'MATCHES') typeQuery = 'ROOM_RELEASED';
      if (activeTab === 'PAYMENTS') typeQuery = 'PAYMENT_APPROVED';
      if (activeTab === 'COMMUNITY') typeQuery = 'FRIEND_REQUEST';

      const res = await api.get(`/notifications/my-notifications?page=${pageNum}&limit=15&status=${statusQuery}&type=${typeQuery}`);
      const data = res.data.data;

      let list: any[] = [];
      let totalPages = 1;
      let totalUnread = 0;

      if (data && data.notifications) {
        list = data.notifications;
        totalPages = data.pagination?.pages || 1;
        totalUnread = data.pagination?.unreadCount || 0;
      } else if (Array.isArray(data)) {
        list = data;
        totalUnread = list.filter((n: any) => !n.read).length;
      }

      setUnreadCount(totalUnread);

      if (pageNum === 1) {
        setNotifications(list);
      } else {
        setNotifications((prev) => [...prev, ...list]);
      }

      setHasMore(pageNum < totalPages);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load notifications');
    } fontFinally: {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, activeTab]);

  // Handle activeTab changes
  useEffect(() => {
    setPage(1);
    fetchNotifications(1);
  }, [activeTab, fetchNotifications]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {}
  };

  const handleMarkAsUnread = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/unread`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: false } : n))
      );
      setUnreadCount((prev) => prev + 1);
    } catch (err) {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {}
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {}
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete all notifications?')) return;
    try {
      await api.delete('/notifications/all');
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {}
  };

  const filteredNotifications = notifications.filter((n) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      n.title?.toLowerCase().includes(query) ||
      n.message?.toLowerCase().includes(query) ||
      n.type?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] selection:bg-[#DFE104] selection:text-black flex flex-col justify-between">
      <Navbar />

      <main className="w-full max-w-5xl mx-auto px-4 py-8 flex-1 space-y-6">
        
        {/* Top Header Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0D1117]/90 border-2 border-[#3F3F46] p-6 rounded-none shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#DFE104]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-1 z-10">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-[#DFE104]/15 border border-[#DFE104]/40 text-[#DFE104] text-[10px] font-mono font-bold uppercase rounded-full flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                REAL-TIME ALERTS HUB
              </span>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 bg-[#DFE104] text-black font-extrabold text-xs uppercase animate-pulse">
                  {unreadCount} UNREAD
                </span>
              )}
            </div>
            <h1 className="text-3xl lg:text-4xl font-display font-extrabold uppercase tracking-tight text-white flex items-center gap-3">
              <span>NOTIFICATION CENTER</span>
            </h1>
            <p className="text-xs text-[#94A3B8] font-mono uppercase">
              STAY UPDATED WITH LIVE MATCH ROOMS, PAYMENT APPROVALS, FRIEND REQUESTS & ANNOUNCEMENTS
            </p>
          </div>

          <div className="flex items-center gap-3 z-10">
            <button
              onClick={() => fetchNotifications(1, true)}
              disabled={refreshing}
              className="p-3 bg-white/5 border border-white/10 hover:border-[#DFE104] text-white hover:text-[#DFE104] font-bold text-xs uppercase transition-all flex items-center gap-2"
              title="Refresh Notifications"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-[#DFE104]' : ''}`} />
              <span className="hidden sm:inline">REFRESH</span>
            </button>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-3 bg-[#DFE104]/15 border border-[#DFE104]/50 text-[#DFE104] hover:bg-[#DFE104] hover:text-black font-extrabold text-xs uppercase transition-all flex items-center gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                <span>MARK ALL READ</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white font-bold text-xs uppercase transition-all flex items-center gap-2"
                title="Clear All Notifications"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">CLEAR ALL</span>
              </button>
            )}
          </div>
        </div>

        {/* Browser Push Permission Banner */}
        {permission !== 'granted' && (
          <div className="bg-[#DFE104]/10 border-2 border-[#DFE104]/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-[#DFE104] text-black shrink-0">
                <BellRing className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-sm font-display font-extrabold uppercase text-white">
                  ENABLE DESKTOP & MOBILE PUSH NOTIFICATIONS
                </h3>
                <p className="text-xs text-[#94A3B8] font-medium">
                  Get instant automated alerts when room IDs release 15 mins before match drop, payments verify, or friends challenge you.
                </p>
              </div>
            </div>

            <button
              onClick={requestPermission}
              disabled={fcmLoading}
              className="px-5 py-3 bg-[#DFE104] text-black font-extrabold text-xs uppercase hover:bg-white transition-all shrink-0 flex items-center justify-center gap-2 shadow-lg"
            >
              {fcmLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              <span>ENABLE PUSH ALERTS</span>
            </button>
          </div>
        )}

        {/* Filter Controls & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#0D1117] border-2 border-[#3F3F46] p-4">
          {/* Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {(['ALL', 'UNREAD', 'MATCHES', 'COMMUNITY', 'PAYMENTS', 'SYSTEM'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-heading font-extrabold uppercase tracking-tight transition-all shrink-0 border ${
                  activeTab === tab
                    ? 'bg-[#DFE104] text-black border-[#DFE104]'
                    : 'bg-white/5 border-white/10 text-[#A1A1AA] hover:text-white hover:border-white/30'
                }`}
              >
                {tab === 'UNREAD' ? `UNREAD (${unreadCount})` : tab}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="h-4 w-4 absolute left-3 top-3 text-[#A1A1AA]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH ALERTS..."
              className="w-full bg-white/5 border border-white/15 py-2 pl-9 pr-4 text-xs font-bold text-white placeholder-[#A1A1AA]/60 focus:outline-none focus:border-[#DFE104] uppercase"
            />
          </div>
        </div>

        {/* Notifications List */}
        {loading && page === 1 ? (
          <div className="py-20 text-center space-y-3 bg-[#0D1117] border-2 border-[#3F3F46]">
            <Loader2 className="h-8 w-8 animate-spin text-[#DFE104] mx-auto" />
            <p className="text-xs font-mono font-bold text-[#A1A1AA] uppercase">FETCHING NOTIFICATION HISTORY...</p>
          </div>
        ) : error ? (
          <div className="p-8 bg-red-500/10 border-2 border-red-500/30 text-center space-y-2">
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto" />
            <p className="text-xs font-bold text-red-400 uppercase">{error}</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-20 text-center space-y-4 bg-[#0D1117] border-2 border-[#3F3F46]">
            <Bell className="h-12 w-12 text-[#3F3F46] mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-display font-extrabold text-white uppercase">NO NOTIFICATIONS FOUND</h3>
              <p className="text-xs text-[#94A3B8] font-mono">You're all caught up! Match alerts and announcements will appear here.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif) => (
              <div
                key={notif._id}
                onClick={() => {
                  if (!notif.read) handleMarkAsRead(notif._id);
                  if (notif.link) router.push(notif.link);
                }}
                className={`p-5 border-2 transition-all cursor-pointer relative group flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  notif.read
                    ? 'bg-[#0D1117]/60 border-[#3F3F46] text-[#A1A1AA] hover:border-white/30'
                    : 'bg-[#0D1117] border-[#DFE104] text-white shadow-[0_0_25px_rgba(223,225,4,0.15)] hover:border-[#DFE104]'
                }`}
              >
                {/* Left Unread Indicator Strip */}
                {!notif.read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#DFE104]" />
                )}

                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-white/5 border border-white/10 shrink-0 mt-1">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-display font-extrabold uppercase tracking-tight text-white">
                        {notif.title}
                      </h4>
                      <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-[9px] font-mono font-bold text-[#A1A1AA] uppercase">
                        {notif.type}
                      </span>
                      {!notif.read && (
                        <span className="h-2 w-2 rounded-full bg-[#DFE104] animate-ping" />
                      )}
                    </div>

                    <p className="text-xs text-[#94A3B8] font-medium leading-relaxed">
                      {notif.message}
                    </p>

                    <span className="text-[10px] font-mono text-[#71717A] uppercase block pt-1">
                      {new Date(notif.createdAt).toLocaleString([], {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                </div>

                {/* Right Action Controls */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-center pt-2 md:pt-0 border-t md:border-t-0 border-white/10 w-full md:w-auto justify-between md:justify-end">
                  {notif.link && (
                    <Link
                      href={notif.link}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3.5 py-2 bg-[#DFE104]/15 border border-[#DFE104]/50 text-[#DFE104] hover:bg-[#DFE104] hover:text-black font-extrabold text-xs uppercase transition-all flex items-center gap-1.5"
                    >
                      <span>OPEN DETAILS</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}

                  <div className="flex items-center gap-2">
                    {notif.read ? (
                      <button
                        onClick={(e) => handleMarkAsUnread(notif._id, e)}
                        className="p-2 text-[#71717A] hover:text-[#DFE104] transition-colors"
                        title="Mark as Unread"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleMarkAsRead(notif._id, e)}
                        className="p-2 text-[#DFE104] hover:text-white transition-colors"
                        title="Mark as Read"
                      >
                        <Check className="h-4 w-4 stroke-[3]" />
                      </button>
                    )}

                    <button
                      onClick={(e) => handleDelete(notif._id, e)}
                      className="p-2 text-[#71717A] hover:text-red-400 transition-colors"
                      title="Delete Notification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="pt-4 text-center">
                <button
                  onClick={() => {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    fetchNotifications(nextPage);
                  }}
                  className="px-6 py-3 bg-white/5 border border-white/15 text-white hover:bg-[#DFE104] hover:text-black font-extrabold text-xs uppercase transition-all inline-flex items-center gap-2"
                >
                  <span>LOAD MORE NOTIFICATIONS</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
