'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import PacmanLoader from '@/components/PacmanLoader';
import { Award, Trophy, Users, Shield, Flame, Sparkles } from 'lucide-react';
import api from '@/lib/api';

export default function TeamLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [gameFilter, setGameFilter] = useState('ALL');
  const [modeFilter, setModeFilter] = useState('SQUAD');
  const [timelineFilter, setTimelineFilter] = useState('ALL_TIME');

  const fetchLeaderboard = async () => {
    try {
      const res = await api.get(
        `/community/team-leaderboard?game=${gameFilter}&mode=${modeFilter}&timeline=${timelineFilter}`
      );
      setLeaderboard(res.data.data || []);
    } catch (err) {
      console.error('Failed to load team leaderboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [gameFilter, modeFilter, timelineFilter]);

  return (
    <div className="min-h-screen bg-[#090D16] text-[#FAFAFA] pb-20 selection:bg-[#DFE104] selection:text-black">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Hero Banner */}
        <div className="bg-[#0D1117]/90 border border-white/10 rounded-3xl p-8 shadow-xl backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-[#DFE104] uppercase tracking-widest block">
              OFFICIAL CLAN STANDINGS
            </span>
            <h1 className="text-3xl md:text-5xl font-display font-extrabold uppercase tracking-tight text-[#FAFAFA] flex items-center gap-3">
              <Award className="h-8 w-8 text-[#DFE104]" />
              <span>TEAM LEADERBOARD</span>
            </h1>
            <p className="text-xs text-[#94A3B8]">
              Rankings of top competitive clans based on total victories, win rates, and prize earnings.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={gameFilter}
              onChange={(e) => setGameFilter(e.target.value)}
              className="bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white uppercase focus:outline-none focus:border-[#DFE104] cursor-pointer"
            >
              <option value="ALL" className="bg-[#0D1117]">ALL GAMES</option>
              <option value="Free Fire" className="bg-[#0D1117]">FREE FIRE</option>
              <option value="BGMI" className="bg-[#0D1117]">BGMI</option>
            </select>

            <select
              value={timelineFilter}
              onChange={(e) => setTimelineFilter(e.target.value)}
              className="bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-[#DFE104] uppercase focus:outline-none focus:border-[#DFE104] cursor-pointer"
            >
              <option value="ALL_TIME" className="bg-[#0D1117]">ALL TIME</option>
              <option value="WEEKLY" className="bg-[#0D1117]">THIS WEEK</option>
              <option value="MONTHLY" className="bg-[#0D1117]">THIS MONTH</option>
            </select>
          </div>
        </div>

        {/* Leaderboard Table */}
        {loading ? (
          <div className="py-20">
            <PacmanLoader text="CALCULATING TEAM STANDINGS..." />
          </div>
        ) : (
          <div className="bg-[#0D1117]/80 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono uppercase">
                <thead className="bg-white/5 border-b border-white/10 text-[#94A3B8] font-bold">
                  <tr>
                    <th className="py-4 px-6">RANK</th>
                    <th className="py-4 px-6">TEAM / CLAN</th>
                    <th className="py-4 px-6">GAME</th>
                    <th className="py-4 px-6 text-center">MATCHES</th>
                    <th className="py-4 px-6 text-center">WINS</th>
                    <th className="py-4 px-6 text-center">WIN RATE</th>
                    <th className="py-4 px-6 text-right">TOTAL PRIZE (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-bold">
                  {leaderboard.map((item, index) => (
                    <tr
                      key={item._id}
                      className="hover:bg-white/5 transition-colors text-white"
                    >
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-extrabold ${
                            index === 0
                              ? 'bg-[#DFE104] text-black shadow-md shadow-[#DFE104]/20'
                              : index === 1
                              ? 'bg-slate-300 text-black'
                              : index === 2
                              ? 'bg-amber-600 text-white'
                              : 'bg-white/5 text-[#94A3B8]'
                          }`}
                        >
                          #{index + 1}
                        </span>
                      </td>
                      <td className="py-4 px-6 flex items-center space-x-3">
                        <img
                          src={item.teamLogo || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80'}
                          alt={item.teamName}
                          className="h-10 w-10 rounded-xl object-cover border border-[#DFE104]"
                        />
                        <span className="font-heading font-extrabold text-sm uppercase text-white">
                          {item.teamName}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-[#94A3B8]">{item.game}</td>
                      <td className="py-4 px-6 text-center text-white">{item.matchesPlayed}</td>
                      <td className="py-4 px-6 text-center text-[#DFE104] font-extrabold">{item.wins}</td>
                      <td className="py-4 px-6 text-center text-blue-400">{item.winRate}</td>
                      <td className="py-4 px-6 text-right text-emerald-400 font-extrabold">
                        ₹{item.totalPrizeWon.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
