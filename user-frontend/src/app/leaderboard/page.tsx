'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Award, Flame, Star, ShieldCheck, Loader2, Sparkles, User, Medal } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import PacmanLoader from '@/components/PacmanLoader';

export interface LeaderboardEntry {
  _id: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    profileImage: string;
  };
  gameName: string;
  gameUID: string;
  profileImage?: string;
  totalTournamentsPlayed: number;
  totalKills: number;
  totalWins: number;
  totalEarnings: number;
  points: number;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'OVERALL' | 'SOLO' | 'SQUAD' | 'MONTHLY' | 'WEEKLY'>('OVERALL');

  useEffect(() => {
    fetchLeaderboard();
  }, [activeCategory]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/leaderboard?category=${activeCategory}`);
      setLeaderboard(res.data.data);
    } catch (err) {
      console.error('Failed to fetch leaderboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const topThree = leaderboard.slice(0, 3);

  const categories = [
    { id: 'OVERALL', label: 'OVERALL PROS' },
    { id: 'SOLO', label: 'SOLO KINGS' },
    { id: 'SQUAD', label: 'SQUAD MASTERS' },
    { id: 'MONTHLY', label: 'MONTHLY RANK' },
    { id: 'WEEKLY', label: 'WEEKLY SPRINT' },
  ];

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] pb-20 selection:bg-[#DFE104] selection:text-black">
      <Navbar />

      <main className="w-full px-4 sm:px-8 md:px-12 py-8">
        {/* Header Title */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-[#3F3F46] pb-6 mb-8 gap-4"
        >
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-[#DFE104] block mb-1">HALL OF FAME & CHAMPIONS</span>
            <h1 className="text-4xl md:text-7xl font-heading font-extrabold uppercase tracking-tighter text-[#FAFAFA]">
              GLOBAL LEADERBOARD
            </h1>
          </div>
          <div className="text-xs text-[#A1A1AA] font-bold uppercase font-mono">
            LIVE CIRCUIT RANKINGS
          </div>
        </motion.div>

        {/* Category Pill Tabs */}
        <div className="flex items-center space-x-3 overflow-x-auto pb-6 mb-8 scrollbar-none">
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-5 py-2.5 text-xs font-heading font-extrabold uppercase border-2 transition-all whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-[#DFE104] text-black border-[#DFE104]'
                  : 'bg-[#27272A]/40 text-[#FAFAFA] hover:border-[#DFE104] border-[#3F3F46]'
              }`}
            >
              {cat.label}
            </motion.button>
          ))}
        </div>

        {/* Guest Teaser Banner */}
        {!user && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 p-6 bg-[#09090B] border-2 border-[#3F3F46] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl"
          >
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-[#DFE104] text-black flex items-center justify-center font-bold shrink-0">
                <Sparkles className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-lg font-heading font-extrabold uppercase tracking-tight text-[#FAFAFA]">CLAIM YOUR SPOT ON THE CIRCUIT</h3>
                <p className="text-xs text-[#A1A1AA] font-body">Sign in or register your player account to track kills, points, and leaderboard rank.</p>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/signup"
                className="kt-btn-primary text-xs shrink-0 text-center inline-block"
              >
                JOIN HALL OF FAME
              </Link>
            </motion.div>
          </motion.div>
        )}

        {loading ? (
          <div className="py-16">
            <PacmanLoader text="CALCULATING LEADERBOARD STANDINGS..." />
          </div>
        ) : leaderboard.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0D1117]/80 border border-white/10 rounded-3xl p-12 text-center shadow-xl flex flex-col items-center justify-center space-y-4"
          >
            <Trophy className="h-12 w-12 text-[#94A3B8]/40 stroke-[1.5]" />
            <h3 className="text-xl font-display font-bold uppercase text-[#FAFAFA]">NO CHAMPIONS ON RECORD YET</h3>
            <p className="text-xs text-[#94A3B8] font-medium max-w-sm">
              Be the first pro gamer to register, compete, and claim the #1 spot on the circuit leaderboard!
            </p>
            <Link href={user ? '/tournaments' : '/signup'} className="kt-btn-primary text-xs mt-2">
              {user ? 'EXPLORE TOURNAMENTS' : 'CREATE PLAYER PROFILE'}
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Top 3 Podium Cards */}
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 items-end"
            >
              {/* #2 Rank Card */}
              {topThree[1] && (
                <motion.div 
                  variants={fadeInUp}
                  whileHover={{ y: -6 }}
                  className="bg-[#0D1117]/80 border border-white/10 rounded-3xl p-6 text-center shadow-xl order-2 md:order-1 relative"
                >
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-white/10 text-[#FAFAFA] border border-white/20 rounded-full font-bold text-xs">
                    #2 SILVER
                  </div>
                  <img
                    src={topThree[1].user?.profileImage || topThree[1].profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt={topThree[1].gameName}
                    className="h-20 w-20 rounded-full object-cover mx-auto my-4 border-2 border-white/30"
                  />
                  <h3 className="text-xl font-display font-bold uppercase text-[#FAFAFA] mb-1">{topThree[1].gameName}</h3>
                  <span className="text-xs text-[#DFE104] font-bold block mb-4">UID: {topThree[1].gameUID || '510298310'}</span>

                  <div className="grid grid-cols-2 gap-2 text-xs font-bold uppercase bg-white/5 p-3 rounded-2xl border border-white/5">
                    <div>
                      <span className="text-[#94A3B8] block text-[10px]">KILLS</span>
                      <span className="text-[#FAFAFA] font-bold text-sm">{topThree[1].totalKills}</span>
                    </div>
                    <div>
                      <span className="text-[#94A3B8] block text-[10px]">WINS</span>
                      <span className="text-[#FAFAFA] font-bold text-sm">{topThree[1].totalWins}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* #1 Champion Rank Card (Digital Gold Glow Highlight) */}
              {topThree[0] && (
                <motion.div 
                  variants={fadeInUp}
                  whileHover={{ scale: 1.07 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="bg-[#0F1115] border-2 border-[#DFE104] rounded-3xl p-8 text-center shadow-[0_0_40px_-5px_rgba(223,225,4,0.3)] order-1 md:order-2 relative scale-105 z-10 corner-border-accent"
                >
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-1.5 bg-[#DFE104] text-black font-heading font-extrabold text-xs uppercase tracking-wider rounded-full shadow-[0_0_20px_rgba(223,225,4,0.5)]">
                    ★ #1 CHAMPION
                  </div>
                  <img
                    src={topThree[0].user?.profileImage || topThree[0].profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt={topThree[0].gameName}
                    className="h-24 w-24 rounded-full object-cover mx-auto my-4 border-4 border-[#DFE104] shadow-[0_0_20px_rgba(223,225,4,0.4)]"
                  />
                  <h3 className="text-2xl font-heading font-bold uppercase text-white mb-1">{topThree[0].gameName}</h3>
                  <span className="text-xs font-mono text-[#DFE104] font-bold block mb-6">UID: {topThree[0].gameUID || '991204812'}</span>

                  <div className="grid grid-cols-3 gap-2 text-xs font-mono font-bold uppercase bg-white/5 p-4 rounded-2xl border border-white/10">
                    <div>
                      <span className="text-[#94A3B8] block text-[10px]">KILLS</span>
                      <span className="text-[#DFE104] font-bold text-base">{topThree[0].totalKills}</span>
                    </div>
                    <div>
                      <span className="text-[#94A3B8] block text-[10px]">WINS</span>
                      <span className="text-white font-bold text-base">{topThree[0].totalWins}</span>
                    </div>
                    <div>
                      <span className="text-[#94A3B8] block text-[10px]">EARNINGS</span>
                      <span className="text-emerald-400 font-bold text-base">₹{topThree[0].totalEarnings?.toLocaleString()}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* #3 Rank Card */}
              {topThree[2] && (
                <motion.div 
                  variants={fadeInUp}
                  whileHover={{ y: -6 }}
                  className="bg-[#0D1117]/80 border border-white/10 rounded-3xl p-6 text-center shadow-xl order-3 relative"
                >
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-700/40 text-amber-300 border border-amber-500/30 rounded-full font-bold text-xs">
                    #3 BRONZE
                  </div>
                  <img
                    src={topThree[2].user?.profileImage || topThree[2].profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt={topThree[2].gameName}
                    className="h-20 w-20 rounded-full object-cover mx-auto my-4 border-2 border-white/30"
                  />
                  <h3 className="text-xl font-display font-bold uppercase text-[#FAFAFA] mb-1">{topThree[2].gameName}</h3>
                  <span className="text-xs text-[#DFE104] font-bold block mb-4">UID: {topThree[2].gameUID || '778192031'}</span>

                  <div className="grid grid-cols-2 gap-2 text-xs font-bold uppercase bg-white/5 p-3 rounded-2xl border border-white/5">
                    <div>
                      <span className="text-[#94A3B8] block text-[10px]">KILLS</span>
                      <span className="text-[#FAFAFA] font-bold text-sm">{topThree[2].totalKills}</span>
                    </div>
                    <div>
                      <span className="text-[#94A3B8] block text-[10px]">WINS</span>
                      <span className="text-[#FAFAFA] font-bold text-sm">{topThree[2].totalWins}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Complete Leaderboard Data Table */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-[#0D1117]/80 border border-white/10 rounded-3xl overflow-hidden shadow-xl"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-xs font-bold uppercase tracking-wider text-[#DFE104]">
                      <th className="p-4 pl-6">RANK</th>
                      <th className="p-4">PLAYER IDENTITY</th>
                      <th className="p-4">GAME UID</th>
                      <th className="p-4 text-center">MATCHES</th>
                      <th className="p-4 text-center">WINS</th>
                      <th className="p-4 text-center">KILLS</th>
                      <th className="p-4 text-right pr-6">EARNINGS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs font-bold uppercase">
                    {leaderboard.map((item, idx) => {
                      const isMe = user && (user.name === item.gameName || user.email === item.user?.email);
                      return (
                        <motion.tr
                          key={item._id || idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className={`transition-colors hover:bg-white/5 ${
                            isMe ? 'bg-[#DFE104]/10 text-[#DFE104]' : 'text-[#FAFAFA]'
                          }`}
                        >
                          <td className="p-4 pl-6">
                            <span className="font-mono text-sm">#{idx + 1}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <img
                                src={item.user?.profileImage || item.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                                alt={item.gameName}
                                className="h-8 w-8 rounded-full object-cover border border-white/20"
                              />
                              <div>
                                <span className="font-bold block text-sm">{item.gameName}</span>
                                <span className="text-[10px] text-[#94A3B8] lowercase">{item.user?.name || 'Competitor'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-[#94A3B8]">{item.gameUID || '510298310'}</td>
                          <td className="p-4 text-center text-[#94A3B8]">{item.totalTournamentsPlayed} MATCHES</td>
                          <td className="p-4 text-center text-[#FAFAFA]">{item.totalWins} WINS</td>
                          <td className="p-4 text-center text-[#FAFAFA]">{item.totalKills} KILLS</td>
                          <td className="p-4 text-right pr-6">
                            <span className="text-base font-bold text-[#DFE104]">₹{item.totalEarnings?.toLocaleString()}</span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}
