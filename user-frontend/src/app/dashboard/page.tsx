'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import StatusTimeline from '@/components/StatusTimeline';
import {
  User,
  Trophy,
  Shield,
  Clock,
  Camera,
  CheckCircle,
  AlertCircle,
  Edit3,
  Loader2,
  Flame,
  Award,
  DollarSign,
  Gamepad2,
  Crosshair,
  Medal,
  Calendar,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';

interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress: string;
  badgeColor: string;
}

interface TournamentHistoryItem {
  tournamentId: string;
  title: string;
  game: string;
  mode: string;
  finalPosition: string;
  prizeWon: number;
  date: string;
}

interface GamingStats {
  totalMatchesPlayed: number;
  totalWins: number;
  winRate: string;
  totalPrize: number;
  totalKills: number;
  totalPoints: number;
  bestPosition: string;
  leaderboardRank: string;
  achievements: Achievement[];
  recentHistory: TournamentHistoryItem[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, updateUser } = useAuth();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Game Filter & Player Statistics State
  const [activeGameFilter, setActiveGameFilter] = useState<'ALL' | 'Free Fire' | 'BGMI'>('ALL');
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<GamingStats>({
    totalMatchesPlayed: 0,
    totalWins: 0,
    winRate: '0.0%',
    totalPrize: 0,
    totalKills: 0,
    totalPoints: 0,
    bestPosition: 'N/A',
    leaderboardRank: '#1',
    achievements: [],
    recentHistory: [],
  });

  // Profile Edit State
  const [gameName, setGameName] = useState(user?.gameName || '');
  const [gameUID, setGameUID] = useState(user?.gameUID || '');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [idProof, setIdProof] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  const handleDirectAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setProfileSuccess('');
    setProfileError('');
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await api.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfileSuccess('Avatar photo updated successfully!');
      if (res.data.data?.user) {
        updateUser(res.data.data.user);
      } else if (res.data.data?.profileImage && user) {
        updateUser({ ...user, profileImage: res.data.data.profileImage });
      }
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Failed to upload avatar image');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const [regRes, payRes] = await Promise.all([
        api.get('/registrations/my-registrations'),
        api.get('/payments/my-payments'),
      ]);
      setRegistrations(regRes.data.data);
      setPayments(payRes.data.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGamingStats = async (game = activeGameFilter) => {
    setStatsLoading(true);
    try {
      const res = await api.get(`/results/my-stats?game=${encodeURIComponent(game)}`);
      setStats(res.data.data);
    } catch (err) {
      console.error('Failed to fetch gaming stats', err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetchUserData();
    fetchGamingStats(activeGameFilter);

    // Socket.io real-time listener for result announcements
    const s = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });

    s.on('results_published', () => {
      fetchUserData();
      fetchGamingStats(activeGameFilter);
    });

    const interval = setInterval(() => {
      fetchUserData();
      fetchGamingStats(activeGameFilter);
    }, 10000);

    return () => {
      s.disconnect();
      clearInterval(interval);
    };
  }, [activeGameFilter]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess('');
    setProfileError('');

    const formData = new FormData();
    formData.append('gameName', gameName);
    formData.append('gameUID', gameUID);
    if (profileImage) formData.append('profileImage', profileImage);
    if (idProof) formData.append('idProof', idProof);

    try {
      const res = await api.put('/auth/update-profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfileSuccess('Profile updated successfully!');
      const updatedUser = res.data.data;
      updateUser(updatedUser);
      fetchGamingStats(activeGameFilter);
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#090D16] text-[#FAFAFA] flex flex-col justify-center items-center px-4">
        <AlertCircle className="h-12 w-12 text-[#DFE104] mb-4 stroke-[2]" />
        <h2 className="text-2xl font-display font-bold uppercase mb-2">ACCESS RESTRICTED</h2>
        <p className="text-[#94A3B8] text-xs font-bold uppercase mb-6">PLEASE SIGN IN TO VIEW YOUR MATCH DASHBOARD.</p>
        <Link href="/login" className="kt-btn-primary text-xs">
          SIGN IN NOW
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030304] text-white pb-20 selection:bg-[#F7931A] selection:text-black">
      <Navbar />

      <main className="w-full px-4 sm:px-8 md:px-12 lg:px-16 py-8 space-y-12">
        {/* Profile Summary Card */}
        <div className="bg-[#0F1115] border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-[0_0_40px_-10px_rgba(247,147,26,0.15)] relative overflow-hidden corner-border-accent">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            <div
              className="relative group cursor-pointer"
              onClick={() => avatarInputRef.current?.click()}
              title="Click to change profile avatar photo"
            >
              <img
                src={user.profileImage || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80'}
                alt={user.name}
                className="h-28 w-28 rounded-full object-cover border-4 border-[#F7931A] shadow-[0_0_25px_-5px_rgba(247,147,26,0.6)]"
              />
              <div className="absolute inset-0 rounded-full bg-black/75 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity cursor-pointer text-center p-1">
                {uploadingAvatar ? (
                  <Loader2 className="h-6 w-6 text-[#F7931A] animate-spin" />
                ) : (
                  <>
                    <Camera className="h-6 w-6 text-[#FFD600]" />
                    <span className="text-[9px] font-mono font-extrabold uppercase text-white mt-1 leading-tight">
                      UPLOAD PHOTO
                    </span>
                  </>
                )}
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleDirectAvatarUpload}
                className="hidden"
              />
            </div>

            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-heading font-extrabold uppercase tracking-tight text-white">{user.name}</h1>
                  <p className="text-xs font-mono text-[#F7931A] font-bold uppercase tracking-wider mt-1">{user.email} • ROLE: {user.role}</p>
                </div>
                <span className="px-4 py-1.5 text-xs font-mono font-bold uppercase bg-[#F7931A]/15 text-[#F7931A] border border-[#F7931A]/40 rounded-full w-fit mx-auto md:mx-0 shadow-[0_0_15px_-3px_rgba(247,147,26,0.3)]">
                  VERIFIED DEFI PLAYER
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10 text-xs font-mono font-bold uppercase">
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                  <span className="text-[#94A3B8] block text-[10px]">GAME HANDLE</span>
                  <span className="text-white text-sm">{user.gameName || 'NOT SET'}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                  <span className="text-[#94A3B8] block text-[10px]">CHARACTER UID</span>
                  <span className="text-white text-sm">{user.gameUID || 'NOT SET'}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                  <span className="text-[#94A3B8] block text-[10px]">TOTAL MATCHES</span>
                  <span className="text-[#F7931A] text-sm">{stats.totalMatchesPlayed}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                  <span className="text-[#94A3B8] block text-[10px]">CAREER EARNINGS</span>
                  <span className="text-emerald-400 text-sm">₹{stats.totalPrize.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Professional Player Gaming Statistics */}
        <section className="bg-[#0D1117]/80 border border-white/10 rounded-3xl p-8 shadow-xl backdrop-blur-xl space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-[#DFE104] block mb-1">CAREER ANALYTICS & METRICS</span>
              <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-[#FAFAFA] flex items-center gap-2">
                <Trophy className="h-6 w-6 text-[#DFE104] stroke-[2]" />
                <span>PLAYER STATISTICS</span>
              </h2>
            </div>

            {/* Game Specific Tabs */}
            <div className="flex items-center space-x-2 bg-white/5 p-1.5 rounded-2xl border border-white/10">
              {(['ALL', 'Free Fire', 'BGMI'] as const).map((gameTab) => (
                <button
                  key={gameTab}
                  onClick={() => setActiveGameFilter(gameTab)}
                  className={`px-4 py-2 text-xs font-bold uppercase rounded-xl transition-all whitespace-nowrap ${
                    activeGameFilter === gameTab
                      ? 'bg-[#DFE104] text-black shadow-md shadow-[#DFE104]/20'
                      : 'text-[#94A3B8] hover:text-[#FAFAFA] hover:bg-white/5'
                  }`}
                >
                  {gameTab === 'ALL' ? 'ALL GAMES' : gameTab}
                </button>
              ))}
            </div>
          </div>

          {statsLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#DFE104]">
              <Loader2 className="h-8 w-8 animate-spin mb-3 stroke-[2]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">SYNCING PLAYER METRICS...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Stat 1: Total Matches Played */}
              <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-2 hover:border-[#DFE104]/40 transition-all">
                <div className="flex items-center justify-between text-[#94A3B8]">
                  <span className="text-[10px] font-bold uppercase">MATCHES PLAYED</span>
                  <Gamepad2 className="h-4 w-4 text-[#DFE104]" />
                </div>
                <div className="text-2xl font-display font-bold text-[#FAFAFA]">{stats.totalMatchesPlayed}</div>
                <span className="text-[10px] text-[#94A3B8] block">All Verified Entries</span>
              </div>

              {/* Stat 2: Total Matches Won */}
              <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-2 hover:border-[#DFE104]/40 transition-all">
                <div className="flex items-center justify-between text-[#94A3B8]">
                  <span className="text-[10px] font-bold uppercase">MATCHES WON</span>
                  <Trophy className="h-4 w-4 text-[#DFE104]" />
                </div>
                <div className="text-2xl font-display font-bold text-[#DFE104]">{stats.totalWins}</div>
                <span className="text-[10px] text-[#94A3B8] block">#1 Champion Titles</span>
              </div>

              {/* Stat 3: Win Rate % */}
              <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-2 hover:border-[#DFE104]/40 transition-all">
                <div className="flex items-center justify-between text-[#94A3B8]">
                  <span className="text-[10px] font-bold uppercase">WIN RATE %</span>
                  <Flame className="h-4 w-4 text-amber-400" />
                </div>
                <div className="text-2xl font-display font-bold text-[#FAFAFA]">{stats.winRate}</div>
                <span className="text-[10px] text-[#94A3B8] block">Victory Ratio</span>
              </div>

              {/* Stat 4: Total Prize Won */}
              <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-2 hover:border-[#DFE104]/40 transition-all">
                <div className="flex items-center justify-between text-[#94A3B8]">
                  <span className="text-[10px] font-bold uppercase">TOTAL PRIZE (₹)</span>
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-display font-bold text-emerald-400">₹{stats.totalPrize.toLocaleString()}</div>
                <span className="text-[10px] text-[#94A3B8] block">Cash Earnings</span>
              </div>

              {/* Stat 5: Total Kills */}
              <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-2 hover:border-[#DFE104]/40 transition-all">
                <div className="flex items-center justify-between text-[#94A3B8]">
                  <span className="text-[10px] font-bold uppercase">TOTAL KILLS</span>
                  <Crosshair className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-display font-bold text-[#FAFAFA]">{stats.totalKills}</div>
                <span className="text-[10px] text-[#94A3B8] block">Career Eliminations</span>
              </div>

              {/* Stat 6: Total Points */}
              <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-2 hover:border-[#DFE104]/40 transition-all">
                <div className="flex items-center justify-between text-[#94A3B8]">
                  <span className="text-[10px] font-bold uppercase">CIRCUIT POINTS</span>
                  <Zap className="h-4 w-4 text-purple-400" />
                </div>
                <div className="text-2xl font-display font-bold text-[#DFE104]">{stats.totalPoints}</div>
                <span className="text-[10px] text-[#94A3B8] block">Accumulated Points</span>
              </div>

              {/* Stat 7: Best Position */}
              <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-2 hover:border-[#DFE104]/40 transition-all">
                <div className="flex items-center justify-between text-[#94A3B8]">
                  <span className="text-[10px] font-bold uppercase">BEST POSITION</span>
                  <Medal className="h-4 w-4 text-[#DFE104]" />
                </div>
                <div className="text-xl font-display font-bold text-[#FAFAFA] truncate">{stats.bestPosition}</div>
                <span className="text-[10px] text-[#94A3B8] block">Career Peak</span>
              </div>

              {/* Stat 8: Current Leaderboard Rank */}
              <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-2 hover:border-[#DFE104]/40 transition-all">
                <div className="flex items-center justify-between text-[#94A3B8]">
                  <span className="text-[10px] font-bold uppercase">LEADERBOARD RANK</span>
                  <Award className="h-4 w-4 text-[#DFE104]" />
                </div>
                <div className="text-2xl font-display font-bold text-[#DFE104]">{stats.leaderboardRank}</div>
                <span className="text-[10px] text-[#94A3B8] block">Global Standing</span>
              </div>
            </div>
          )}
        </section>

        {/* Section 2: Top 5 Achievements Showcase */}
        <section className="bg-[#0D1117]/80 border border-white/10 rounded-3xl p-8 shadow-xl backdrop-blur-xl space-y-6">
          <div className="border-b border-white/10 pb-4 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-[#DFE104] block mb-1">MILESTONES & BADGES</span>
              <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-[#FAFAFA] flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-[#DFE104] stroke-[2]" />
                <span>TOP 5 PLAYER ACHIEVEMENTS</span>
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {stats.achievements.map((ach) => (
              <div
                key={ach.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 relative overflow-hidden ${
                  ach.unlocked
                    ? 'bg-white/5 border-[#DFE104]/50 shadow-lg shadow-[#DFE104]/5'
                    : 'bg-white/[0.02] border-white/5 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-[#FAFAFA]">{ach.title}</span>
                    {ach.unlocked ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-[#DFE104] text-black">
                        UNLOCKED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-white/10 text-[#94A3B8]">
                        LOCKED
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#94A3B8] leading-tight font-medium">{ach.description}</p>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-bold uppercase">
                  <span className="text-[#94A3B8]">PROGRESS:</span>
                  <span className={ach.unlocked ? 'text-[#DFE104]' : 'text-[#FAFAFA]'}>{ach.progress}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Recent Tournament History Table */}
        <section className="bg-[#0D1117]/80 border border-white/10 rounded-3xl p-8 shadow-xl backdrop-blur-xl space-y-6">
          <div className="border-b border-white/10 pb-4 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-[#DFE104] block mb-1">MATCH LOGS & FINISHES</span>
              <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-[#FAFAFA] flex items-center gap-2">
                <Calendar className="h-6 w-6 text-[#DFE104] stroke-[2]" />
                <span>RECENT TOURNAMENT HISTORY</span>
              </h2>
            </div>
            <span className="text-xs text-[#94A3B8] font-bold uppercase">
              {stats.recentHistory.length} MATCHES LOGGED
            </span>
          </div>

          {stats.recentHistory.length === 0 ? (
            <div className="py-12 text-center text-[#94A3B8] font-bold uppercase text-xs">
              NO MATCH HISTORY RECORDED YET. JOIN A TOURNAMENT TO BUILD YOUR LEGACY!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-xs font-bold uppercase tracking-wider text-[#DFE104]">
                    <th className="p-4 pl-6">TOURNAMENT NAME</th>
                    <th className="p-4">GAME</th>
                    <th className="p-4 text-center">MODE</th>
                    <th className="p-4 text-center">FINAL POSITION</th>
                    <th className="p-4 text-center">PRIZE WON (₹)</th>
                    <th className="p-4 text-right pr-6">MATCH DATE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs font-bold uppercase">
                  {stats.recentHistory.map((item, idx) => (
                    <tr key={idx} className="transition-colors hover:bg-white/5 text-[#FAFAFA]">
                      <td className="p-4 pl-6 font-bold text-sm">
                        <Link href={`/tournaments/${item.tournamentId}`} className="hover:text-[#DFE104] transition-colors">
                          {item.title}
                        </Link>
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#DFE104]/10 text-[#DFE104] border border-[#DFE104]/30">
                          {item.game}
                        </span>
                      </td>
                      <td className="p-4 text-center text-[#94A3B8]">{item.mode}</td>
                      <td className="p-4 text-center font-bold">
                        <span className={item.finalPosition.includes('#1') ? 'text-[#DFE104]' : 'text-[#FAFAFA]'}>
                          {item.finalPosition}
                        </span>
                      </td>
                      <td className="p-4 text-center font-bold text-emerald-400">
                        {item.prizeWon > 0 ? `₹${item.prizeWon.toLocaleString()}` : '—'}
                      </td>
                      <td className="p-4 text-right pr-6 text-[#94A3B8] font-mono">{item.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Section 4: Active Registrations & Timeline Section */}
        <section className="space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-[#FAFAFA] flex items-center gap-2">
              <Trophy className="h-6 w-6 text-[#DFE104] stroke-[2]" />
              <span>MY ACTIVE TOURNAMENTS ({registrations.length})</span>
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-12 text-[#DFE104]">
              <Loader2 className="h-8 w-8 animate-spin stroke-[2]" />
            </div>
          ) : registrations.length === 0 ? (
            <div className="bg-[#0D1117]/80 border border-white/10 rounded-3xl p-12 text-center text-[#94A3B8] font-bold uppercase">
              <p className="text-base text-[#FAFAFA] mb-2">NO ACTIVE MATCH REGISTRATIONS</p>
              <p className="text-xs mb-6">Browse the tournament directory and join your first high-stakes showdown.</p>
              <Link href="/tournaments" className="kt-btn-primary text-xs">
                EXPLORE TOURNAMENTS
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {registrations.map((reg) => {
                const tourney = reg.tournament || {};
                const currentStep =
                  reg.status === 'CONFIRMED' && (reg.paymentStatus === 'PAID' || reg.paymentStatus === 'FREE')
                    ? 4
                    : reg.status === 'CONFIRMED' || reg.paymentStatus === 'PAID'
                    ? 3
                    : reg.paymentStatus === 'UNDER_VERIFICATION' || reg.paymentStatus === 'PENDING'
                    ? 2
                    : 1;

                return (
                  <div key={reg._id} className="bg-[#0D1117]/80 border border-white/10 rounded-3xl p-8 shadow-xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-white/10 gap-4">
                      <div>
                        <span className="text-xs text-[#DFE104] font-bold uppercase">{tourney.game || 'MATCH'} • {tourney.mode || 'SQUAD'}</span>
                        <h3 className="text-2xl font-display font-bold uppercase text-[#FAFAFA] tracking-tight">{tourney.title || 'Esports Match'}</h3>
                      </div>
                      <Link
                        href={`/tournaments/${tourney._id}`}
                        className="kt-btn-outline text-xs !py-2.5 !px-5"
                      >
                        MATCH ARENA PAGE →
                      </Link>
                    </div>

                    <StatusTimeline
                      currentStep={currentStep}
                      status={reg.status}
                      paymentStatus={reg.paymentStatus}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 5: Profile Settings & Identification Updates */}
        <section className="bg-[#0D1117]/80 border border-white/10 rounded-3xl p-8 shadow-xl">
          <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-[#FAFAFA] mb-6 flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-[#DFE104] stroke-[2]" />
            <span>PLAYER IDENTIFICATION & PROOF UPDATES</span>
          </h2>

          {profileSuccess && (
            <div className="mb-6 p-4 rounded-2xl border border-[#DFE104]/40 bg-[#DFE104]/10 text-[#DFE104] text-xs font-bold uppercase tracking-wide flex items-center gap-2">
              <CheckCircle className="h-5 w-5 shrink-0 stroke-[2]" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="mb-6 p-4 rounded-2xl border border-red-500/40 bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-wide flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0 stroke-[2]" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-2">IN-GAME NAME / HANDLE</label>
                <input
                  type="text"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  placeholder="E.G. PROGAMER#TAG1"
                  className="w-full bg-white/5 border border-white/15 rounded-xl py-3 px-4 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#DFE104] font-bold uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-2">IN-GAME CHARACTER UID</label>
                <input
                  type="text"
                  value={gameUID}
                  onChange={(e) => setGameUID(e.target.value)}
                  placeholder="E.G. 519284019"
                  className="w-full bg-white/5 border border-white/15 rounded-xl py-3 px-4 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#DFE104] font-bold uppercase"
                />
              </div>
            </div>



            <button
              type="submit"
              disabled={savingProfile}
              className="kt-btn-primary text-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {savingProfile ? (
                <Loader2 className="h-5 w-5 animate-spin stroke-[2]" />
              ) : (
                <span>SAVE PROFILE & IDENTIFICATION UPDATES</span>
              )}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
