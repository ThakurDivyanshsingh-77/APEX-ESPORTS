'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import PacmanLoader from '@/components/PacmanLoader';
import {
  Users,
  Search,
  Filter,
  Trophy,
  Award,
  Flame,
  ShieldCheck,
  UserPlus,
  UserCheck,
  Clock,
  MessageSquare,
  Globe,
  Gamepad2,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export interface Player {
  _id: string;
  name: string;
  email: string;
  phone: string;
  gameName: string;
  gameUID: string;
  profileImage: string;
  preferredGame: string;
  preferredRole: string;
  country: string;
  isOnline: boolean;
  matchesPlayed: number;
  wins: number;
  winRate: string;
  totalPrize: number;
  kills: number;
  rank: string;
  level: number;
  friendStatus?: string;
}

export default function PlayersDirectoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [gameFilter, setGameFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('wins');

  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const fetchPlayers = async () => {
    try {
      const res = await api.get(
        `/community/players?search=${encodeURIComponent(
          searchTerm
        )}&game=${gameFilter}&role=${roleFilter}&sortBy=${sortBy}`
      );
      setPlayers(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch players', err);
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
    fetchPlayers();
  }, [searchTerm, gameFilter, roleFilter, sortBy]);

  const handleConnect = async (targetUserId: string, targetName: string) => {
    setActionSuccess('');
    setActionError('');
    try {
      await api.post('/community/friends/request', { recipientId: targetUserId });
      setActionSuccess(`Friend request sent to ${targetName}!`);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to send friend request');
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-[#FAFAFA] pb-20 selection:bg-[#DFE104] selection:text-black">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header Hero Section */}
        <div className="bg-[#0D1117]/90 border border-white/10 rounded-3xl p-8 shadow-xl backdrop-blur-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-mono font-bold text-[#DFE104] uppercase tracking-widest block">
              APEX ESPORTS COMMUNITY HUB
            </span>
            <h1 className="text-3xl md:text-5xl font-display font-extrabold uppercase tracking-tight text-[#FAFAFA] flex items-center justify-center md:justify-start gap-3">
              <Users className="h-8 w-8 text-[#DFE104] stroke-[2]" />
              <span>PLAYER DIRECTORY</span>
            </h1>
            <p className="text-xs text-[#94A3B8] font-medium max-w-xl">
              Discover competitive esports athletes, view verified gaming statistics, send friend requests, and invite teammates into your squad.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/community/friends" className="kt-btn-outline text-xs">
              MY FRIENDS & REQUESTS
            </Link>
            <Link href="/community/teams" className="kt-btn-primary text-xs">
              CREATE / JOIN TEAM
            </Link>
          </div>
        </div>

        {/* Action Banners */}
        {actionSuccess && (
          <div className="p-4 rounded-2xl border border-[#DFE104]/40 bg-[#DFE104]/10 text-[#DFE104] text-xs font-bold uppercase tracking-wide flex items-center gap-2">
            <CheckCircle className="h-5 w-5 shrink-0 stroke-[2]" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="p-4 rounded-2xl border border-red-500/40 bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-wide flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0 stroke-[2]" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Search & Filter Controls */}
        <div className="bg-[#0D1117]/80 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="h-4 w-4 absolute left-3.5 top-3.5 text-[#94A3B8]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="SEARCH BY NAME, IGN, OR UID..."
                className="w-full bg-white/5 border border-white/15 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-[#FAFAFA] placeholder-[#94A3B8] focus:outline-none focus:border-[#DFE104] uppercase transition-all"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={gameFilter}
                onChange={(e) => setGameFilter(e.target.value)}
                className="bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#DFE104] uppercase cursor-pointer"
              >
                <option value="ALL" className="bg-[#0D1117]">ALL GAMES</option>
                <option value="Free Fire" className="bg-[#0D1117]">FREE FIRE</option>
                <option value="BGMI" className="bg-[#0D1117]">BGMI</option>
              </select>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#DFE104] uppercase cursor-pointer"
              >
                <option value="ALL" className="bg-[#0D1117]">ALL ROLES</option>
                <option value="Assaulter" className="bg-[#0D1117]">ASSAULTER</option>
                <option value="Sniper" className="bg-[#0D1117]">SNIPER</option>
                <option value="IGL" className="bg-[#0D1117]">IGL (LEADER)</option>
                <option value="Support" className="bg-[#0D1117]">SUPPORT</option>
                <option value="Rusher" className="bg-[#0D1117]">RUSHER</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-[#DFE104] focus:outline-none focus:border-[#DFE104] uppercase cursor-pointer"
              >
                <option value="wins" className="bg-[#0D1117]">SORT BY WINS</option>
                <option value="prize" className="bg-[#0D1117]">SORT BY PRIZE (₹)</option>
                <option value="matches" className="bg-[#0D1117]">SORT BY MATCHES</option>
              </select>
            </div>
          </div>
        </div>

        {/* Players Cards Grid */}
        {loading ? (
          <div className="py-20">
            <PacmanLoader text="LOADING PLAYER DIRECTORY..." />
          </div>
        ) : players.length === 0 ? (
          <div className="bg-[#0D1117]/80 border border-white/10 rounded-3xl p-16 text-center space-y-4">
            <Users className="h-12 w-12 text-[#94A3B8]/40 mx-auto" />
            <h3 className="text-xl font-display font-bold uppercase text-[#FAFAFA]">NO PLAYERS FOUND</h3>
            <p className="text-xs text-[#94A3B8]">Try adjusting your search terms or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {players.map((player) => {
              const isSelf =
                String(player._id) === String(user?._id || user?.id) ||
                (user?.email && player.email === user.email) ||
                String(player._id) === String(user?.email);

              if (isSelf) return null;

              return (
                <div
                  key={player._id}
                  className="bg-[#0D1117]/80 border border-white/10 rounded-3xl p-6 shadow-xl hover:border-[#DFE104]/40 transition-all flex flex-col justify-between space-y-5 relative overflow-hidden group"
                >
                  <div className="space-y-4">
                    {/* Header Row: Avatar & Name */}
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <img
                          src={player.profileImage}
                          alt={player.name}
                          className="h-16 w-16 rounded-2xl object-cover border-2 border-[#DFE104]"
                        />
                        <span
                          className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-[#0D1117] ${
                            player.isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                          }`}
                          title={player.isOnline ? 'Online' : 'Offline'}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-heading font-extrabold text-base uppercase text-[#FAFAFA] truncate">
                            {player.name}
                          </h3>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[#DFE104]/10 text-[#DFE104] border border-[#DFE104]/20">
                            LVL {player.level}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-[#DFE104] font-bold uppercase truncate">
                          {player.gameName}
                        </p>
                        <p className="text-[10px] font-mono text-[#94A3B8] uppercase">
                          UID: {player.gameUID} • {player.country}
                        </p>
                      </div>
                    </div>

                    {/* Gaming Badges Row */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/10 text-[10px] font-bold uppercase">
                      <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-white flex items-center gap-1">
                        <Gamepad2 className="h-3 w-3 text-[#DFE104]" />
                        {player.preferredGame}
                      </span>
                      <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[#94A3B8]">
                        {player.preferredRole}
                      </span>
                      <span className="px-2.5 py-1 bg-[#DFE104]/15 text-[#DFE104] border border-[#DFE104]/30 rounded-lg ml-auto">
                        {player.rank}
                      </span>
                    </div>

                    {/* Stats Matrix Grid */}
                    <div className="grid grid-cols-3 gap-2 bg-white/5 p-3 rounded-2xl border border-white/5 text-center text-xs font-bold uppercase">
                      <div>
                        <span className="text-[#94A3B8] text-[9px] block">MATCHES</span>
                        <span className="text-[#FAFAFA] font-extrabold">{player.matchesPlayed}</span>
                      </div>
                      <div>
                        <span className="text-[#94A3B8] text-[9px] block">WINS</span>
                        <span className="text-[#DFE104] font-extrabold">{player.wins}</span>
                      </div>
                      <div>
                        <span className="text-[#94A3B8] text-[9px] block">PRIZE (₹)</span>
                        <span className="text-emerald-400 font-extrabold">₹{player.totalPrize.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <Link
                      href={`/community/players/${player._id}`}
                      className="flex-1 text-center py-2 px-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase text-white transition-all"
                    >
                      VIEW PROFILE
                    </Link>

                    {player.friendStatus === 'ACCEPTED' ? (
                      <span className="px-3 py-2 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-bold uppercase rounded-xl flex items-center gap-1.5" title="You are already friends">
                        <UserCheck className="h-4 w-4 stroke-[2.5]" />
                        <span>FRIENDS</span>
                      </span>
                    ) : player.friendStatus === 'PENDING_SENT' ? (
                      <span className="px-3 py-2 bg-[#DFE104]/15 border border-[#DFE104]/40 text-[#DFE104] text-xs font-bold uppercase rounded-xl flex items-center gap-1.5" title="Request Sent">
                        <Clock className="h-4 w-4 stroke-[2]" />
                        <span>PENDING</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleConnect(player._id, player.name)}
                        className="p-2 rounded-xl border border-[#DFE104] bg-[#DFE104] text-black hover:bg-white transition-all"
                        title="Connect / Send Friend Request"
                      >
                        <UserPlus className="h-4 w-4 stroke-[2.5]" />
                      </button>
                    )}

                    <Link
                      href={`/community/chat?friend=${player._id}`}
                      className="p-2 rounded-xl border border-white/15 bg-white/5 hover:bg-[#DFE104] hover:text-black transition-all"
                      title="Direct Message"
                    >
                      <MessageSquare className="h-4 w-4 stroke-[2]" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
