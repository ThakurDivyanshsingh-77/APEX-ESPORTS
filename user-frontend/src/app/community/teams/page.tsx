'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import PacmanLoader from '@/components/PacmanLoader';
import {
  Trophy,
  Users,
  Plus,
  Crown,
  Shield,
  UserPlus,
  CheckCircle,
  AlertCircle,
  X,
  Gamepad2,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function TeamsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [myTeamData, setMyTeamData] = useState<any>(null);
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [myInvitations, setMyInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Team Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamTag, setTeamTag] = useState('');
  const [description, setDescription] = useState('');
  const [game, setGame] = useState('Free Fire');
  const [maxMembers, setMaxMembers] = useState(4);

  // Invite Friend Modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState('');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    try {
      const [teamRes, allTeamsRes, friendsRes, invitesRes] = await Promise.all([
        api.get('/community/teams/my-team'),
        api.get('/community/teams'),
        api.get('/community/friends'),
        api.get('/community/teams/invitations'),
      ]);
      setMyTeamData(teamRes.data.data);
      setAllTeams(allTeamsRes.data.data || []);
      setFriends((friendsRes.data.data?.accepted || []).map((i: any) => i.friend));
      setMyInvitations(invitesRes.data.data || []);
    } catch (err) {
      console.error('Failed to load teams data', err);
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
    fetchData();
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await api.post('/community/teams', {
        name: teamName,
        tag: teamTag,
        description,
        game,
        maxMembers,
      });
      setSuccessMsg('Team created successfully!');
      setIsCreateModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create team');
    }
  };

  const handleInviteFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFriendId || !myTeamData?.team) return;
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await api.post('/community/teams/invite', {
        teamId: myTeamData.team._id,
        friendId: selectedFriendId,
      });
      setSuccessMsg('Team invitation dispatched to friend!');
      setIsInviteModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to send team invitation');
    }
  };

  const handleRespondInvitation = async (inviteId: string, action: 'ACCEPT' | 'REJECT') => {
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await api.post('/community/teams/invitations/respond', { inviteId, action });
      if (action === 'ACCEPT') {
        setSuccessMsg('Team invitation accepted! You have joined the clan.');
      } else {
        setSuccessMsg('Team invitation declined.');
      }
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to respond to team invitation');
    }
  };

  if (loading) {
    return <PacmanLoader fullScreen text="LOADING TEAMS NETWORK..." />;
  }

  const isCaptain = myTeamData?.team && String(myTeamData.team.captain) === String(user?._id || user?.id);

  return (
    <div className="min-h-screen bg-[#090D16] text-[#FAFAFA] pb-20 selection:bg-[#DFE104] selection:text-black">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header Banner */}
        <div className="bg-[#0D1117]/90 border border-white/10 rounded-3xl p-8 shadow-xl backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xs font-mono font-bold text-[#DFE104] uppercase tracking-widest block mb-1">
              COMPETITIVE SQUAD NETWORK
            </span>
            <h1 className="text-3xl md:text-4xl font-display font-extrabold uppercase tracking-tight text-[#FAFAFA] flex items-center gap-3">
              <Trophy className="h-8 w-8 text-[#DFE104]" />
              <span>TEAMS & CLANS</span>
            </h1>
          </div>

          {!myTeamData?.team && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="kt-btn-primary text-xs flex items-center gap-2"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>CREATE NEW TEAM</span>
            </button>
          )}
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

        {/* Pending Team Invitations Section */}
        {myInvitations.length > 0 && (
          <div className="bg-[#0D1117]/90 border border-[#DFE104]/50 rounded-3xl p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-display font-extrabold uppercase text-[#DFE104] flex items-center gap-2">
              <UserPlus className="h-5 w-5 stroke-[2.5]" />
              <span>INCOMING TEAM & CLAN INVITATIONS ({myInvitations.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myInvitations.map((inv) => (
                <div key={inv._id} className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <img src={inv.teamLogo} alt={inv.teamName} className="h-12 w-12 rounded-xl object-cover border border-[#DFE104]" />
                    <div>
                      <h3 className="font-heading font-extrabold text-sm uppercase text-white">{inv.teamName} <span className="text-xs text-[#DFE104]">[{inv.teamTag}]</span></h3>
                      <p className="text-[10px] text-[#94A3B8] font-bold uppercase">CAPTAIN: {inv.captainName} • GAME: {inv.game}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRespondInvitation(inv._id, 'ACCEPT')}
                      className="px-3.5 py-2 bg-[#DFE104] text-black hover:bg-white font-extrabold text-xs uppercase rounded-xl transition-all flex items-center gap-1.5 shadow-lg"
                    >
                      <CheckCircle className="h-4 w-4 stroke-[2.5]" />
                      <span>ACCEPT</span>
                    </button>
                    <button
                      onClick={() => handleRespondInvitation(inv._id, 'REJECT')}
                      className="px-3 py-2 bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white font-extrabold text-xs uppercase rounded-xl transition-all"
                    >
                      DECLINE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 1: My Official Team */}
        {myTeamData?.team ? (
          <div className="bg-[#0D1117]/90 border border-[#DFE104]/40 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-white/10">
              <div className="flex items-center space-x-5">
                <img
                  src={myTeamData.team.logo}
                  alt={myTeamData.team.name}
                  className="h-20 w-20 rounded-2xl object-cover border-2 border-[#DFE104]"
                />
                <div>
                  <span className="text-xs font-mono text-[#DFE104] font-bold uppercase block">
                    MY OFFICIAL CLAN [{myTeamData.team.tag}]
                  </span>
                  <h2 className="text-3xl font-display font-extrabold uppercase text-white">
                    {myTeamData.team.name}
                  </h2>
                  <p className="text-xs text-[#94A3B8] font-medium mt-1">{myTeamData.team.description}</p>
                </div>
              </div>

              {isCaptain && (
                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="kt-btn-primary text-xs flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4 stroke-[2.5]" />
                  <span>INVITE FRIEND TO TEAM</span>
                </button>
              )}
            </div>

            {/* Roster Section */}
            <div>
              <h3 className="text-sm font-bold uppercase text-[#94A3B8] mb-4">TEAM ROSTER ({myTeamData.roster?.length || 1}/{myTeamData.team.maxMembers})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {myTeamData.roster?.map((m: any) => (
                  <div key={m._id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center space-x-3 relative overflow-hidden group">
                    <img
                      src={m.profileImage || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80'}
                      alt={m.userName || 'Member'}
                      className="h-12 w-12 rounded-xl object-cover border border-[#DFE104]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white uppercase truncate">{m.userName || 'Roster Member'}</span>
                        {m.role === 'CAPTAIN' ? (
                          <Crown className="h-4 w-4 text-[#DFE104] shrink-0" title="Team Captain" />
                        ) : (
                          <Shield className="h-4 w-4 text-[#94A3B8] shrink-0" title="Team Member" />
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-[#DFE104] font-bold uppercase truncate">
                        {m.gameName || 'Gamer'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 text-[9px] font-bold uppercase text-[#94A3B8]">
                        <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white">LVL {m.level || 1}</span>
                        <span className="px-1.5 py-0.5 rounded bg-[#DFE104]/10 text-[#DFE104]">{m.rank || 'Heroic'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {/* Section 2: All Registered Community Teams */}
        <div className="space-y-4">
          <h2 className="text-xl font-display font-bold uppercase text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-[#DFE104]" />
            <span>COMMUNITY TEAMS DIRECTORY</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allTeams.map((t) => (
              <div
                key={t._id}
                className="bg-[#0D1117]/80 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between"
              >
                <div className="flex items-center space-x-4">
                  <img src={t.logo} alt={t.name} className="h-14 w-14 rounded-2xl object-cover border border-[#DFE104]" />
                  <div>
                    <h3 className="font-heading font-extrabold text-base uppercase text-white">{t.name}</h3>
                    <span className="text-[10px] font-mono text-[#DFE104] font-bold uppercase">[{t.tag}] • {t.game}</span>
                  </div>
                </div>
                <p className="text-xs text-[#94A3B8] line-clamp-2">{t.description}</p>
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold uppercase">
                  <span className="text-[#94A3B8]">CAPTAIN: {t.captainName || 'Leader'}</span>
                  <span className="text-[#DFE104] bg-[#DFE104]/10 px-2.5 py-1 rounded-lg border border-[#DFE104]/20">
                    MEMBERS: {t.membersCount || 1}/{t.maxMembers || 4}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modal: Create Team */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0D1117] border border-white/15 rounded-3xl w-full max-w-lg p-8 relative space-y-6 text-white shadow-2xl">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-[#DFE104] hover:text-black transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-display font-bold uppercase">CREATE PERMANENT TEAM / CLAN</h3>

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#94A3B8] mb-1">TEAM NAME</label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="E.G. NO MERCY"
                  className="w-full bg-white/5 border border-white/15 rounded-xl py-3 px-4 text-xs font-bold uppercase focus:outline-none focus:border-[#DFE104]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#94A3B8] mb-1">TEAM TAG</label>
                <input
                  type="text"
                  required
                  value={teamTag}
                  onChange={(e) => setTeamTag(e.target.value)}
                  placeholder="E.G. NM"
                  className="w-full bg-white/5 border border-white/15 rounded-xl py-3 px-4 text-xs font-bold uppercase focus:outline-none focus:border-[#DFE104]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#94A3B8] mb-1">PRIMARY GAME</label>
                <select
                  value={game}
                  onChange={(e) => setGame(e.target.value)}
                  className="w-full bg-[#0D1117] border border-white/15 rounded-xl py-3 px-4 text-xs font-bold uppercase focus:outline-none focus:border-[#DFE104]"
                >
                  <option value="Free Fire">FREE FIRE</option>
                  <option value="BGMI">BGMI</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#94A3B8] mb-1">MAX MEMBERS</label>
                <input
                  type="number"
                  min="2"
                  max="6"
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/15 rounded-xl py-3 px-4 text-xs font-bold uppercase focus:outline-none focus:border-[#DFE104]"
                />
              </div>

              <button type="submit" className="kt-btn-primary text-xs w-full py-3">
                CREATE TEAM & BECOME CAPTAIN
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Invite Friend to Team */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0D1117] border border-white/15 rounded-3xl w-full max-w-md p-8 relative space-y-6 text-white shadow-2xl">
            <button
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-[#DFE104] hover:text-black transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-display font-bold uppercase">INVITE FRIEND TO TEAM</h3>
            <p className="text-xs text-[#94A3B8]">Browse ONLY your accepted friends list to invite team members.</p>

            <form onSubmit={handleInviteFriend} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#94A3B8] mb-1">SELECT FRIEND</label>
                <select
                  required
                  value={selectedFriendId}
                  onChange={(e) => setSelectedFriendId(e.target.value)}
                  className="w-full bg-[#0D1117] border border-white/15 rounded-xl py-3 px-4 text-xs font-bold uppercase focus:outline-none focus:border-[#DFE104]"
                >
                  <option value="">-- CHOOSE FRIEND --</option>
                  {friends.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.name} ({f.gameName || 'Gamer'})
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="kt-btn-primary text-xs w-full py-3">
                DISPATCH TEAM INVITATION
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
