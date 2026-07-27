'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { Trophy, Users, Shield, CheckCircle, Clock, AlertCircle, Eye, RefreshCw } from 'lucide-react';
import api from '@/lib/api';

export default function AdminTeamsModerationPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [tournamentTeams, setTournamentTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'TEAMS' | 'REGISTRATIONS'>('TEAMS');

  const fetchData = async () => {
    try {
      const [teamsRes, tournTeamsRes] = await Promise.all([
        api.get('/community/admin/teams'),
        api.get('/community/admin/tournament-teams'),
      ]);
      setTeams(teamsRes.data.data || []);
      setTournamentTeams(tournTeamsRes.data.data || []);
    } catch (err) {
      console.error('Failed to load admin teams', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#090D16] text-[#FAFAFA] selection:bg-[#DFE104] selection:text-black">
      <AdminSidebar activePath="/community/teams" />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="bg-[#09090B] border-b-2 border-[#3F3F46] px-8 py-4 flex items-center justify-between">
          <h1 className="font-heading font-extrabold text-xl uppercase tracking-tight text-[#FAFAFA]">
            COMMUNITY TEAMS & SQUAD MODERATION
          </h1>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-[#27272A] border border-[#3F3F46] hover:border-[#DFE104] text-xs font-bold uppercase text-white rounded-xl transition-all flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>REFRESH</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Header Card */}
          <div className="bg-[#0D1117]/90 border border-white/10 rounded-3xl p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-xs font-mono font-bold text-[#DFE104] uppercase tracking-widest block mb-1">
                ADMIN MODERATION HUB
              </span>
              <h1 className="text-3xl font-display font-extrabold uppercase text-white flex items-center gap-3">
                <Trophy className="h-7 w-7 text-[#DFE104]" />
                <span>CLANS & TOURNAMENT TEAMS</span>
              </h1>
            </div>

            <div className="flex items-center space-x-3 bg-white/5 p-1.5 rounded-2xl border border-white/10">
              <button
                onClick={() => setActiveTab('TEAMS')}
                className={`px-5 py-2 text-xs font-bold uppercase rounded-xl transition-all ${
                  activeTab === 'TEAMS'
                    ? 'bg-[#DFE104] text-black shadow-md shadow-[#DFE104]/20'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                PERMANENT TEAMS ({teams.length})
              </button>
              <button
                onClick={() => setActiveTab('REGISTRATIONS')}
                className={`px-5 py-2 text-xs font-bold uppercase rounded-xl transition-all ${
                  activeTab === 'REGISTRATIONS'
                    ? 'bg-[#DFE104] text-black shadow-md shadow-[#DFE104]/20'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                SQUAD REGISTRATIONS ({tournamentTeams.length})
              </button>
            </div>
          </div>

          {/* Table Content */}
          {loading ? (
            <div className="py-20 text-center text-xs text-[#94A3B8] font-bold uppercase">
              LOADING MODERATION DATA...
            </div>
          ) : activeTab === 'TEAMS' ? (
            <div className="bg-[#0D1117]/80 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono uppercase">
                  <thead className="bg-white/5 border-b border-white/10 text-[#94A3B8] font-bold">
                    <tr>
                      <th className="py-4 px-6">TEAM / LOGO</th>
                      <th className="py-4 px-6">TAG</th>
                      <th className="py-4 px-6">GAME</th>
                      <th className="py-4 px-6">CAPTAIN</th>
                      <th className="py-4 px-6 text-center">ROSTER SIZE</th>
                      <th className="py-4 px-6 text-right">CREATED AT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-bold">
                    {teams.map((t) => (
                      <tr key={t._id} className="hover:bg-white/5 transition-colors text-white">
                        <td className="py-4 px-6 flex items-center space-x-3">
                          <img
                            src={t.logo}
                            alt={t.name}
                            className="h-10 w-10 rounded-xl object-cover border border-[#DFE104]"
                          />
                          <span className="font-heading font-extrabold text-sm uppercase text-white">
                            {t.name}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-[#DFE104]">[{t.tag}]</td>
                        <td className="py-4 px-6 text-white">{t.game}</td>
                        <td className="py-4 px-6 text-[#94A3B8]">{t.captainName || 'Leader'}</td>
                        <td className="py-4 px-6 text-center text-emerald-400">
                          {t.roster?.length || 1}/{t.maxMembers || 4}
                        </td>
                        <td className="py-4 px-6 text-right text-[#94A3B8]">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-[#0D1117]/80 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono uppercase">
                  <thead className="bg-white/5 border-b border-white/10 text-[#94A3B8] font-bold">
                    <tr>
                      <th className="py-4 px-6">SQUAD TEAM</th>
                      <th className="py-4 px-6">CAPTAIN IGN</th>
                      <th className="py-4 px-6">UID</th>
                      <th className="py-4 px-6 text-center">MEMBER APPROVALS</th>
                      <th className="py-4 px-6 text-center">PAYMENT</th>
                      <th className="py-4 px-6 text-right">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-bold">
                    {tournamentTeams.map((reg) => (
                      <tr key={reg._id} className="hover:bg-white/5 transition-colors text-white">
                        <td className="py-4 px-6 font-heading font-extrabold text-sm uppercase text-[#DFE104]">
                          {reg.teamName || 'Squad Team'}
                        </td>
                        <td className="py-4 px-6 text-white">{reg.gameName}</td>
                        <td className="py-4 px-6 text-[#94A3B8]">{reg.gameUID}</td>
                        <td className="py-4 px-6 text-center">
                          <span className="px-2.5 py-1 rounded-lg bg-white/5 text-[#DFE104] border border-white/10">
                            {reg.squadInvites?.filter((i: any) => i.status === 'ACCEPTED').length || 0} Accepted
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-lg ${
                              reg.paymentStatus === 'PAID'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {reg.paymentStatus || 'PENDING'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="px-3 py-1 rounded-lg bg-[#DFE104]/15 text-[#DFE104] border border-[#DFE104]/30">
                            {reg.status}
                          </span>
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
    </div>
  );
}
