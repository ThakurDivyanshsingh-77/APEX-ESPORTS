'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import PacmanLoader from '@/components/PacmanLoader';
import {
  User,
  Trophy,
  Award,
  Flame,
  ShieldCheck,
  UserPlus,
  MessageSquare,
  ArrowLeft,
  Gamepad2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Users,
  Medal,
  Calendar,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function PublicPlayerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchProfile = async () => {
    if (!params.id) return;
    try {
      const res = await api.get(`/community/players/${params.id}`);
      setProfile(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Player profile not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [params.id]);

  const handleConnect = async () => {
    if (!profile) return;
    setActionSuccess('');
    try {
      await api.post('/community/friends/request', { recipientId: profile._id });
      setActionSuccess(`Friend request sent to ${profile.name}!`);
      fetchProfile();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send request');
    }
  };

  if (loading) {
    return <PacmanLoader fullScreen text="LOADING PLAYER PROFILE..." />;
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#090D16] text-[#FAFAFA] flex flex-col items-center justify-center px-4">
        <AlertCircle className="h-12 w-12 text-[#DFE104] mb-4 stroke-[2]" />
        <h2 className="text-2xl font-display font-bold uppercase mb-2">PLAYER NOT FOUND</h2>
        <p className="text-[#94A3B8] text-xs font-bold uppercase mb-6">{error || 'The requested profile could not be loaded.'}</p>
        <Link href="/community/players" className="kt-btn-primary text-xs">
          BACK TO PLAYERS DIRECTORY
        </Link>
      </div>
    );
  }

  const isSelf = String(profile._id) === String(user?._id || user?.id);

  return (
    <div className="min-h-screen bg-[#090D16] text-[#FAFAFA] pb-20 selection:bg-[#DFE104] selection:text-black">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center space-x-2 text-xs font-bold uppercase text-[#94A3B8] hover:text-[#DFE104] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
          <span>BACK TO DIRECTORY</span>
        </button>

        {actionSuccess && (
          <div className="p-4 rounded-2xl border border-[#DFE104]/40 bg-[#DFE104]/10 text-[#DFE104] text-xs font-bold uppercase tracking-wide flex items-center gap-2">
            <CheckCircle className="h-5 w-5 shrink-0 stroke-[2]" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Profile Banner & Header Card */}
        <div className="bg-[#0D1117]/90 border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl relative">
          <div className="h-48 md:h-64 w-full relative">
            <img src={profile.banner} alt="Banner" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D1117] via-[#0D1117]/40 to-transparent" />
          </div>

          <div className="px-8 pb-8 -mt-20 relative flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center md:items-end space-y-4 md:space-y-0 md:space-x-6 text-center md:text-left">
              <img
                src={profile.profileImage}
                alt={profile.name}
                className="h-32 w-32 rounded-3xl object-cover border-4 border-[#DFE104] shadow-2xl"
              />
              <div className="space-y-1">
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <h1 className="text-3xl md:text-4xl font-display font-extrabold uppercase tracking-tight text-[#FAFAFA]">
                    {profile.name}
                  </h1>
                  <span className="px-3 py-1 bg-[#DFE104]/15 text-[#DFE104] border border-[#DFE104]/30 rounded-full text-xs font-bold uppercase">
                    LVL {profile.level}
                  </span>
                </div>
                <p className="text-sm font-mono text-[#DFE104] font-bold uppercase">
                  IGN: {profile.gameName} • UID: {profile.gameUID}
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                  <span className="px-2.5 py-0.5 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white uppercase flex items-center gap-1">
                    <Gamepad2 className="h-3 w-3 text-[#DFE104]" />
                    {profile.preferredGame || 'Free Fire'}
                  </span>
                  <span className="px-2.5 py-0.5 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-[#94A3B8] uppercase">
                    {profile.preferredRole || 'Assaulter'}
                  </span>
                  <span className="px-2.5 py-0.5 bg-[#DFE104]/15 text-[#DFE104] border border-[#DFE104]/30 rounded-lg text-xs font-bold uppercase">
                    {profile.rank || 'Heroic'}
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8] font-medium max-w-md">{profile.bio}</p>
              </div>
            </div>

            {!isSelf && (
              <div className="flex items-center gap-3">
                {profile.friendStatus === 'ACCEPTED' ? (
                  <span className="px-4 py-2 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-bold uppercase rounded-xl flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" /> FRIENDS
                  </span>
                ) : (
                  <button
                    onClick={handleConnect}
                    disabled={profile.friendStatus === 'PENDING_SENT'}
                    className="kt-btn-primary text-xs flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4 stroke-[2.5]" />
                    <span>
                      {profile.friendStatus === 'PENDING_SENT' ? 'REQUEST SENT' : 'CONNECT'}
                    </span>
                  </button>
                )}

                <Link
                  href={`/community/chat?friend=${profile._id}`}
                  className="kt-btn-outline text-xs flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4 stroke-[2]" />
                  <span>MESSAGE</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#0D1117]/80 border border-white/10 rounded-2xl p-5 text-center space-y-1">
            <span className="text-xs text-[#94A3B8] font-bold uppercase block">MATCHES PLAYED</span>
            <span className="text-2xl font-display font-extrabold text-[#FAFAFA]">{profile.matchesPlayed}</span>
          </div>
          <div className="bg-[#0D1117]/80 border border-white/10 rounded-2xl p-5 text-center space-y-1">
            <span className="text-xs text-[#94A3B8] font-bold uppercase block">TOTAL WINS</span>
            <span className="text-2xl font-display font-extrabold text-[#DFE104]">{profile.wins}</span>
          </div>
          <div className="bg-[#0D1117]/80 border border-white/10 rounded-2xl p-5 text-center space-y-1">
            <span className="text-xs text-[#94A3B8] font-bold uppercase block">WIN RATE</span>
            <span className="text-2xl font-display font-extrabold text-blue-400">{profile.winRate}</span>
          </div>
          <div className="bg-[#0D1117]/80 border border-white/10 rounded-2xl p-5 text-center space-y-1">
            <span className="text-xs text-[#94A3B8] font-bold uppercase block">TOTAL PRIZE (₹)</span>
            <span className="text-2xl font-display font-extrabold text-emerald-400">₹{profile.totalPrize.toLocaleString()}</span>
          </div>
        </div>

        {/* Badges & Achievements Section */}
        <div className="bg-[#0D1117]/80 border border-white/10 rounded-3xl p-8 space-y-6">
          <h3 className="text-xl font-display font-bold uppercase tracking-tight text-[#FAFAFA] flex items-center gap-2">
            <Award className="h-5 w-5 text-[#DFE104]" />
            <span>PLAYER BADGES & CLAN ROSTER</span>
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            {profile.badges?.map((badge: string, idx: number) => (
              <span
                key={idx}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase text-[#DFE104]"
              >
                {badge}
              </span>
            ))}
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono font-bold uppercase">
            <span className="text-[#94A3B8]">OFFICIAL CLAN:</span>
            <span className="text-white bg-white/5 px-4 py-1.5 rounded-xl border border-white/10">{profile.teamName}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
