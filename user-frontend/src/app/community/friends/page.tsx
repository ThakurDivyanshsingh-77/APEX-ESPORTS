'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import PacmanLoader from '@/components/PacmanLoader';
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  Gamepad2,
  User,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function FriendsHubPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [friendsData, setFriendsData] = useState<{
    incoming: any[];
    outgoing: any[];
    accepted: any[];
  }>({ incoming: [], outgoing: [], accepted: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ACCEPTED' | 'INCOMING' | 'OUTGOING'>('ACCEPTED');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchFriends = async () => {
    try {
      const res = await api.get('/community/friends');
      setFriendsData(res.data.data);
    } catch (err) {
      console.error('Failed to fetch friends data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleRespond = async (requestId: string, action: 'ACCEPT' | 'REJECT') => {
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await api.post('/community/friends/respond', { requestId, action });
      setSuccessMsg(`Friend request ${action.toLowerCase()}ed!`);
      fetchFriends();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Action failed');
    }
  };

  const handleRemove = async (friendId: string) => {
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await api.post('/community/friends/remove', { friendId });
      setSuccessMsg('Friend removed');
      fetchFriends();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to remove friend');
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-[#FAFAFA] pb-20 selection:bg-[#DFE104] selection:text-black">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="bg-[#0D1117]/90 border border-white/10 rounded-3xl p-8 shadow-xl backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xs font-mono font-bold text-[#DFE104] uppercase tracking-widest block mb-1">
              FRIEND NETWORK
            </span>
            <h1 className="text-3xl md:text-4xl font-display font-extrabold uppercase tracking-tight text-[#FAFAFA] flex items-center gap-3">
              <Users className="h-7 w-7 text-[#DFE104]" />
              <span>FRIENDS & REQUESTS</span>
            </h1>
          </div>
          <Link href="/community/players" className="kt-btn-primary text-xs">
            FIND MORE PLAYERS
          </Link>
        </div>

        {successMsg && (
          <div className="p-4 rounded-2xl border border-[#DFE104]/40 bg-[#DFE104]/10 text-[#DFE104] text-xs font-bold uppercase tracking-wide flex items-center gap-2">
            <CheckCircle className="h-5 w-5 shrink-0 stroke-[2]" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 rounded-2xl border border-red-500/40 bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-wide flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0 stroke-[2]" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex items-center space-x-3 bg-white/5 p-1.5 rounded-2xl border border-white/10 w-fit">
          <button
            onClick={() => setActiveTab('ACCEPTED')}
            className={`px-5 py-2 text-xs font-bold uppercase rounded-xl transition-all ${
              activeTab === 'ACCEPTED'
                ? 'bg-[#DFE104] text-black shadow-md shadow-[#DFE104]/20'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            FRIENDS LIST ({friendsData.accepted.length})
          </button>
          <button
            onClick={() => setActiveTab('INCOMING')}
            className={`px-5 py-2 text-xs font-bold uppercase rounded-xl transition-all ${
              activeTab === 'INCOMING'
                ? 'bg-[#DFE104] text-black shadow-md shadow-[#DFE104]/20'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            INCOMING ({friendsData.incoming.length})
          </button>
          <button
            onClick={() => setActiveTab('OUTGOING')}
            className={`px-5 py-2 text-xs font-bold uppercase rounded-xl transition-all ${
              activeTab === 'OUTGOING'
                ? 'bg-[#DFE104] text-black shadow-md shadow-[#DFE104]/20'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            OUTGOING ({friendsData.outgoing.length})
          </button>
        </div>

        {/* Content Views */}
        {loading ? (
          <div className="py-20">
            <PacmanLoader text="LOADING FRIENDS NETWORK..." />
          </div>
        ) : activeTab === 'ACCEPTED' ? (
          friendsData.accepted.length === 0 ? (
            <div className="bg-[#0D1117]/80 border border-white/10 rounded-3xl p-12 text-center text-[#94A3B8]">
              <Users className="h-10 w-10 mx-auto mb-3 text-[#94A3B8]/40" />
              <p className="text-sm font-bold uppercase text-white mb-2">NO FRIENDS ADDED YET</p>
              <p className="text-xs">Browse the Player Directory to connect with competitive gamers.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {friendsData.accepted.map((item) => (
                <div
                  key={item._id}
                  className="bg-[#0D1117]/90 border border-white/10 rounded-3xl p-6 shadow-xl hover:border-[#DFE104]/40 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-4">
                    {/* Header Row */}
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.friend.profileImage || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80'}
                        alt={item.friend.name}
                        className="h-14 w-14 rounded-2xl object-cover border-2 border-[#DFE104] shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-heading font-extrabold text-base uppercase text-[#FAFAFA] truncate">
                            {item.friend.name}
                          </h4>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[#DFE104]/10 text-[#DFE104] border border-[#DFE104]/20">
                            LVL {item.friend.level || 1}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-[#DFE104] font-bold uppercase truncate">
                          {item.friend.gameName || item.friend.name}
                        </p>
                        <p className="text-[10px] font-mono text-[#94A3B8] uppercase">
                          UID: {item.friend.gameUID || 'N/A'} • {item.friend.country || 'India 🇮🇳'}
                        </p>
                      </div>
                    </div>

                    {/* Gaming Badges */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/10 text-[10px] font-bold uppercase">
                      <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-white flex items-center gap-1">
                        <Gamepad2 className="h-3 w-3 text-[#DFE104]" />
                        {item.friend.preferredGame || 'FREE FIRE'}
                      </span>
                      <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[#94A3B8]">
                        {item.friend.preferredRole || 'ASSAULTER'}
                      </span>
                      <span className="px-2.5 py-1 bg-[#DFE104]/15 text-[#DFE104] border border-[#DFE104]/30 rounded-lg ml-auto">
                        {item.friend.rank || 'Heroic'}
                      </span>
                    </div>

                    {/* Stats Matrix Grid */}
                    <div className="grid grid-cols-3 gap-2 bg-white/5 p-2.5 rounded-2xl border border-white/5 text-center text-xs font-bold uppercase">
                      <div>
                        <span className="text-[#94A3B8] text-[9px] block">MATCHES</span>
                        <span className="text-[#FAFAFA] font-extrabold">{item.friend.matchesPlayed || 0}</span>
                      </div>
                      <div>
                        <span className="text-[#94A3B8] text-[9px] block">WINS</span>
                        <span className="text-[#DFE104] font-extrabold">{item.friend.wins || 0}</span>
                      </div>
                      <div>
                        <span className="text-[#94A3B8] text-[9px] block">PRIZE (₹)</span>
                        <span className="text-emerald-400 font-extrabold">₹{(item.friend.totalPrize || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <Link
                      href={`/community/players/${item.friend._id}`}
                      className="p-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase text-white transition-all"
                      title="View Full Profile"
                    >
                      <User className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/community/chat?friend=${item.friend._id}`}
                      className="flex-1 py-2 px-3 bg-[#DFE104] text-black rounded-xl text-xs font-bold uppercase hover:bg-white transition-all shadow-lg shadow-[#DFE104]/20 flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="h-4 w-4 stroke-[2]" />
                      <span>DIRECT CHAT</span>
                    </Link>
                    <button
                      onClick={() => handleRemove(item.friend._id)}
                      className="p-2.5 bg-white/5 border border-white/10 hover:bg-red-500 hover:text-white rounded-xl transition-all text-[#94A3B8]"
                      title="Remove Friend"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'INCOMING' ? (
          friendsData.incoming.length === 0 ? (
            <div className="bg-[#0D1117]/80 border border-white/10 rounded-3xl p-12 text-center text-[#94A3B8]">
              <Clock className="h-10 w-10 mx-auto mb-3 text-[#94A3B8]/40" />
              <p className="text-sm font-bold uppercase text-white">NO INCOMING REQUESTS</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {friendsData.incoming.map((item) => (
                <div
                  key={item._id}
                  className="bg-[#0D1117]/90 border border-white/10 rounded-3xl p-6 shadow-xl hover:border-[#DFE104]/40 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-4">
                    {/* Header Row: Avatar & Info */}
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.user.profileImage || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80'}
                        alt={item.user.name}
                        className="h-14 w-14 rounded-2xl object-cover border-2 border-[#DFE104] shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-heading font-extrabold text-base uppercase text-[#FAFAFA] truncate">
                            {item.user.name}
                          </h4>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[#DFE104]/10 text-[#DFE104] border border-[#DFE104]/20">
                            LVL {item.user.level || 1}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-[#DFE104] font-bold uppercase truncate">
                          {item.user.gameName || item.user.name}
                        </p>
                        <p className="text-[10px] font-mono text-[#94A3B8] uppercase">
                          UID: {item.user.gameUID || 'N/A'} • {item.user.country || 'India 🇮🇳'}
                        </p>
                      </div>
                    </div>

                    {/* Gaming Badges */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/10 text-[10px] font-bold uppercase">
                      <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-white flex items-center gap-1">
                        <Gamepad2 className="h-3 w-3 text-[#DFE104]" />
                        {item.user.preferredGame || 'FREE FIRE'}
                      </span>
                      <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[#94A3B8]">
                        {item.user.preferredRole || 'ASSAULTER'}
                      </span>
                      <span className="px-2.5 py-1 bg-[#DFE104]/15 text-[#DFE104] border border-[#DFE104]/30 rounded-lg ml-auto">
                        {item.user.rank || 'Heroic'}
                      </span>
                    </div>

                    {/* Stats Matrix Grid */}
                    <div className="grid grid-cols-3 gap-2 bg-white/5 p-2.5 rounded-2xl border border-white/5 text-center text-xs font-bold uppercase">
                      <div>
                        <span className="text-[#94A3B8] text-[9px] block">MATCHES</span>
                        <span className="text-[#FAFAFA] font-extrabold">{item.user.matchesPlayed || 0}</span>
                      </div>
                      <div>
                        <span className="text-[#94A3B8] text-[9px] block">WINS</span>
                        <span className="text-[#DFE104] font-extrabold">{item.user.wins || 0}</span>
                      </div>
                      <div>
                        <span className="text-[#94A3B8] text-[9px] block">PRIZE (₹)</span>
                        <span className="text-emerald-400 font-extrabold">₹{(item.user.totalPrize || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <Link
                      href={`/community/players/${item.user._id}`}
                      className="p-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase text-white transition-all"
                      title="View Full Profile"
                    >
                      <User className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleRespond(item._id, 'ACCEPT')}
                      className="flex-1 py-2 px-3 bg-[#DFE104] text-black rounded-xl text-xs font-bold uppercase hover:bg-white transition-all shadow-lg shadow-[#DFE104]/20 flex items-center justify-center gap-1.5"
                    >
                      <UserCheck className="h-4 w-4 stroke-[2.5]" />
                      <span>ACCEPT REQUEST</span>
                    </button>
                    <button
                      onClick={() => handleRespond(item._id, 'REJECT')}
                      className="py-2 px-3 bg-white/10 text-white rounded-xl text-xs font-bold uppercase hover:bg-red-500 transition-all flex items-center justify-center gap-1.5"
                    >
                      <UserX className="h-4 w-4 stroke-[2]" />
                      <span>REJECT</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          friendsData.outgoing.length === 0 ? (
            <div className="bg-[#0D1117]/80 border border-white/10 rounded-3xl p-12 text-center text-[#94A3B8]">
              <Clock className="h-10 w-10 mx-auto mb-3 text-[#94A3B8]/40" />
              <p className="text-sm font-bold uppercase text-white">NO OUTGOING REQUESTS</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {friendsData.outgoing.map((item) => (
                <div
                  key={item._id}
                  className="bg-[#0D1117]/90 border border-white/10 rounded-3xl p-6 shadow-xl hover:border-[#DFE104]/40 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-4">
                    {/* Header Row: Avatar & Info */}
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.user.profileImage || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80'}
                        alt={item.user.name}
                        className="h-14 w-14 rounded-2xl object-cover border-2 border-[#DFE104] shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-heading font-extrabold text-base uppercase text-[#FAFAFA] truncate">
                            {item.user.name}
                          </h4>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[#DFE104]/10 text-[#DFE104] border border-[#DFE104]/20">
                            LVL {item.user.level || 1}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-[#DFE104] font-bold uppercase truncate">
                          {item.user.gameName || item.user.name}
                        </p>
                        <p className="text-[10px] font-mono text-[#94A3B8] uppercase">
                          UID: {item.user.gameUID || 'N/A'} • {item.user.country || 'India 🇮🇳'}
                        </p>
                      </div>
                    </div>

                    {/* Gaming Badges */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/10 text-[10px] font-bold uppercase">
                      <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-white flex items-center gap-1">
                        <Gamepad2 className="h-3 w-3 text-[#DFE104]" />
                        {item.user.preferredGame || 'FREE FIRE'}
                      </span>
                      <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[#94A3B8]">
                        {item.user.preferredRole || 'ASSAULTER'}
                      </span>
                      <span className="px-2.5 py-1 bg-[#DFE104]/15 text-[#DFE104] border border-[#DFE104]/30 rounded-lg ml-auto">
                        {item.user.rank || 'Heroic'}
                      </span>
                    </div>

                    {/* Stats Matrix Grid */}
                    <div className="grid grid-cols-3 gap-2 bg-white/5 p-2.5 rounded-2xl border border-white/5 text-center text-xs font-bold uppercase">
                      <div>
                        <span className="text-[#94A3B8] text-[9px] block">MATCHES</span>
                        <span className="text-[#FAFAFA] font-extrabold">{item.user.matchesPlayed || 0}</span>
                      </div>
                      <div>
                        <span className="text-[#94A3B8] text-[9px] block">WINS</span>
                        <span className="text-[#DFE104] font-extrabold">{item.user.wins || 0}</span>
                      </div>
                      <div>
                        <span className="text-[#94A3B8] text-[9px] block">PRIZE (₹)</span>
                        <span className="text-emerald-400 font-extrabold">₹{(item.user.totalPrize || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <Link
                      href={`/community/players/${item.user._id}`}
                      className="p-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase text-white transition-all"
                      title="View Full Profile"
                    >
                      <User className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleRespond(item._id, 'REJECT')}
                      className="flex-1 py-2 px-3 bg-white/10 text-white rounded-xl text-xs font-bold uppercase hover:bg-red-500 transition-all flex items-center justify-center gap-1.5"
                    >
                      <UserX className="h-4 w-4 stroke-[2]" />
                      <span>CANCEL REQUEST</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
}
