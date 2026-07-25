'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import {
  Award,
  Trophy,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  Check,
  X,
  Upload,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import api from '@/lib/api';

export interface Tournament {
  _id: string;
  title: string;
  game: string;
  mode: string;
  prizePool: string;
  winnerCount?: '1' | '2' | '3';
  prizeBreakdown?: {
    first: number;
    second: number;
    third: number;
  };
  slots: number;
  filledSlots: number;
  date: string;
  time: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  bannerImage?: string;
}

export interface WinnerSlot {
  rank: number;
  gameUID: string;
  verifiedUser: {
    id?: string;
    name?: string;
    email?: string;
    gameName?: string;
    gameUID?: string;
    profileImage?: string;
  } | null;
  kills: number;
  prizeAmount: number;
  verifying: boolean;
  error: string;
}

export default function AdminResultsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Result Declaration Modal State
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [distribution, setDistribution] = useState<'1ST_ONLY' | 'TOP_2' | 'TOP_3'>('TOP_3');
  const [winners, setWinners] = useState<WinnerSlot[]>([]);
  const [proofImage, setProofImage] = useState('');
  const [notes, setNotes] = useState('');
  const [publishing, setPublishing] = useState(false);

  // Auto-Detected Participants & Prize Pool State
  const [participants, setParticipants] = useState<any[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const fetchTournaments = async () => {
    try {
      const res = await api.get('/tournaments');
      // Filter Live and Active tournaments
      const activeTournaments = res.data.data.filter(
        (t: Tournament) => t.status === 'LIVE' || t.status === 'UPCOMING' || t.status === 'COMPLETED'
      );
      setTournaments(activeTournaments);
    } catch (err) {
      console.error('Failed to fetch tournaments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const parsePrizeAmount = (prizePoolStr?: string): number => {
    if (!prizePoolStr) return 5000;
    const digitsOnly = prizePoolStr.replace(/[^0-9]/g, '');
    const parsed = parseInt(digitsOnly, 10);
    return isNaN(parsed) || parsed <= 0 ? 5000 : parsed;
  };

  const createInitialWinners = (
    dist: '1ST_ONLY' | 'TOP_2' | 'TOP_3',
    tourneyPrizePool?: string,
    prizeBreakdown?: { first?: number; second?: number; third?: number }
  ): WinnerSlot[] => {
    const totalPool = parsePrizeAmount(tourneyPrizePool);
    const count = dist === '1ST_ONLY' ? 1 : dist === 'TOP_2' ? 2 : 3;
    const slots: WinnerSlot[] = [];

    for (let i = 1; i <= count; i++) {
      let prize = totalPool;
      if (prizeBreakdown && (prizeBreakdown.first || prizeBreakdown.second || prizeBreakdown.third)) {
        prize = i === 1 ? prizeBreakdown.first || 0 : i === 2 ? prizeBreakdown.second || 0 : prizeBreakdown.third || 0;
      } else if (dist === 'TOP_2') {
        prize = i === 1 ? Math.round(totalPool * 0.65) : Math.round(totalPool * 0.35);
      } else if (dist === 'TOP_3') {
        prize = i === 1 ? Math.round(totalPool * 0.50) : i === 2 ? Math.round(totalPool * 0.30) : Math.round(totalPool * 0.20);
      }

      slots.push({
        rank: i,
        gameUID: '',
        verifiedUser: null,
        kills: 0,
        prizeAmount: prize,
        verifying: false,
        error: '',
      });
    }
    return slots;
  };

  const handleOpenDeclareResultModal = async (t: Tournament) => {
    setSelectedTournament(t);
    const autoDist: '1ST_ONLY' | 'TOP_2' | 'TOP_3' =
      t.winnerCount === '1' ? '1ST_ONLY' : t.winnerCount === '2' ? 'TOP_2' : 'TOP_3';

    setDistribution(autoDist);
    setProofImage('');
    setNotes('');
    setWinners(createInitialWinners(autoDist, t.prizePool, t.prizeBreakdown));
    setResultModalOpen(true);
    setLoadingParticipants(true);

    try {
      const res = await api.get(`/registrations/tournament/${t._id}`);
      setParticipants(res.data.data || []);
    } catch (err) {
      console.error('Failed to load tournament participants', err);
      setParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleDistributionChange = (dist: '1ST_ONLY' | 'TOP_2' | 'TOP_3') => {
    setDistribution(dist);
    setWinners(createInitialWinners(dist, selectedTournament?.prizePool));
  };

  const handleSelectParticipant = (index: number, regId: string) => {
    if (!regId) {
      setWinners((prev) => {
        const next = [...prev];
        next[index].gameUID = '';
        next[index].verifiedUser = null;
        next[index].error = '';
        return next;
      });
      return;
    }

    const foundReg = participants.find((p) => String(p._id || p.id) === String(regId));
    if (!foundReg) return;

    const u = typeof foundReg.user === 'object' ? foundReg.user : {};
    const gameUID = foundReg.gameUID || u.gameUID || 'UID-000';
    const cleanUID = gameUID.trim().toLowerCase();

    // Check duplicate participant selection
    const isDuplicate = winners.some(
      (w, i) => i !== index && w.gameUID.trim().toLowerCase() === cleanUID
    );
    if (isDuplicate) {
      setWinners((prev) => {
        const next = [...prev];
        next[index].error = 'Duplicate Winner Error: This player is already assigned to another position!';
        return next;
      });
      return;
    }

    const verifiedUserObj = {
      id: u._id || u.id || foundReg.user,
      name: u.name || foundReg.gameName || 'Gamer',
      email: u.email || 'player@esports.com',
      gameName: foundReg.gameName || u.gameName || u.name,
      gameUID: gameUID,
      profileImage: u.profileImage || '',
    };

    setWinners((prev) => {
      const next = [...prev];
      next[index].gameUID = gameUID;
      next[index].verifiedUser = verifiedUserObj;
      next[index].error = '';
      return next;
    });
  };

  const handleVerifyUID = async (index: number) => {
    const slot = winners[index];
    if (!slot.gameUID || !slot.gameUID.trim()) {
      setWinners((prev) => {
        const next = [...prev];
        next[index].error = 'Please select a participant or enter Game UID';
        return next;
      });
      return;
    }

    if (!selectedTournament) return;

    const cleanUID = slot.gameUID.trim().toLowerCase();
    const isDuplicate = winners.some(
      (w, i) => i !== index && w.gameUID.trim().toLowerCase() === cleanUID
    );
    if (isDuplicate) {
      setWinners((prev) => {
        const next = [...prev];
        next[index].error = 'Duplicate Winner Error: This player UID is already assigned to another rank!';
        return next;
      });
      return;
    }

    setWinners((prev) => {
      const next = [...prev];
      next[index].verifying = true;
      next[index].error = '';
      return next;
    });

    try {
      const res = await api.get('/results/verify-winner', {
        params: {
          tournamentId: selectedTournament._id,
          gameUID: slot.gameUID.trim(),
        },
      });

      const data = res.data.data;
      if (data.valid) {
        setWinners((prev) => {
          const next = [...prev];
          next[index].verifiedUser = data.user;
          next[index].verifying = false;
          next[index].error = '';
          return next;
        });
      } else {
        setWinners((prev) => {
          const next = [...prev];
          next[index].verifiedUser = null;
          next[index].verifying = false;
          next[index].error = data.message || 'Player UID not registered or not approved';
          return next;
        });
      }
    } catch (err: any) {
      setWinners((prev) => {
        const next = [...prev];
        next[index].verifying = false;
        next[index].error = err.response?.data?.message || 'Verification failed';
        return next;
      });
    }
  };

  const handlePublishResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournament) return;

    // Validate that all winner slots are verified
    for (let i = 0; i < winners.length; i++) {
      if (!winners[i].verifiedUser) {
        alert(`Position #${winners[i].rank} winner must be selected or verified before publishing!`);
        return;
      }
    }

    // Check duplicate UIDs
    const uids = winners.map((w) => w.gameUID.trim().toLowerCase());
    if (new Set(uids).size !== uids.length) {
      alert('Duplicate UID Error: You cannot declare the same player in multiple positions!');
      return;
    }

    setPublishing(true);
    try {
      const formattedWinners = winners.map((w) => ({
        rank: w.rank,
        userId: w.verifiedUser?.id,
        gameName: w.verifiedUser?.gameName,
        gameUID: w.verifiedUser?.gameUID || w.gameUID,
        profileImage: w.verifiedUser?.profileImage,
        kills: w.kills,
        prizeAmount: w.prizeAmount,
      }));

      await api.post('/results/publish', {
        tournamentId: selectedTournament._id,
        distribution,
        winners: formattedWinners,
        proofImage,
        notes,
      });

      setFeedback({
        type: 'success',
        text: `Results published for "${selectedTournament.title}"! Tournament marked COMPLETED, leaderboard & profile stats updated.`,
      });
      setResultModalOpen(false);
      fetchTournaments();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to publish tournament results',
      });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <AdminSidebar />

      <main className="flex-1 p-8 max-w-[1600px]">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Award className="h-8 w-8 text-amber-500" />
              <span>Tournament Results Module</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Select active matches, verify winner Game UIDs, set prize distribution, and publish match outcomes to live leaderboards.
            </p>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`mb-6 p-4 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <span>{feedback.text}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Tournament Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center text-slate-400 text-sm flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-3" />
              <span>Loading active matches...</span>
            </div>
          ) : tournaments.length === 0 ? (
            <div className="col-span-full py-20 text-center text-slate-400 text-sm flex flex-col items-center">
              <Trophy className="h-12 w-12 text-slate-600 mb-3" />
              <span className="font-bold text-white mb-1">No active tournaments</span>
              <span>Create or activate tournaments in Tournaments Hub.</span>
            </div>
          ) : (
            tournaments.map((t) => (
              <div
                key={t._id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden"
              >
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-1 rounded text-[10px] font-extrabold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/30">
                      {t.game} • {t.mode}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded text-[10px] font-extrabold uppercase border ${
                        t.status === 'LIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse'
                          : t.status === 'COMPLETED'
                          ? 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white uppercase tracking-tight">{t.title}</h3>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
                    <div>PRIZE: <strong className="text-amber-400">{t.prizePool}</strong></div>
                    <div>SLOTS: <strong className="text-white">{t.filledSlots}/{t.slots}</strong></div>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenDeclareResultModal(t)}
                  className={`w-full py-3 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    t.status === 'COMPLETED'
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                  }`}
                >
                  <Award className="h-4 w-4" />
                  <span>{t.status === 'COMPLETED' ? 'Edit Declared Results' : 'Declare Result 🏆'}</span>
                </button>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Result Declaration Modal Dialog */}
      {resultModalOpen && selectedTournament && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto shadow-2xl text-slate-100">
            <button
              onClick={() => setResultModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center space-x-3 mb-6 border-b border-slate-800 pb-4">
              <div className="h-10 w-10 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl flex items-center justify-center font-bold">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white uppercase tracking-tight">DECLARE MATCH RESULT</h3>
                <p className="text-xs text-amber-400 font-bold">{selectedTournament.title}</p>
              </div>
            </div>

            <form onSubmit={handlePublishResults} className="space-y-6">
              {/* Prize Distribution Selector */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Select Prize Distribution</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['1ST_ONLY', 'TOP_2', 'TOP_3'] as const).map((dist) => (
                    <button
                      key={dist}
                      type="button"
                      onClick={() => handleDistributionChange(dist)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-extrabold uppercase border transition-all ${
                        distribution === dist
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {dist === '1ST_ONLY' ? '★ Only 1st Prize' : dist === 'TOP_2' ? '★ Top 2 Positions' : '★ Top 3 Positions'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Winner Selection Rows */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase text-slate-400">
                    Auto-Detected Tournament Participants ({participants.length})
                  </label>
                  <span className="text-[11px] font-bold text-amber-400">
                    Prize Pool: {selectedTournament.prizePool || '₹5,000'}
                  </span>
                </div>

                {winners.map((slot, index) => {
                  const selectedRegId = participants.find((p) => {
                    const u = typeof p.user === 'object' ? p.user : {};
                    const uid = p.gameUID || u.gameUID || '';
                    return uid.toLowerCase() === slot.gameUID.toLowerCase();
                  })?._id;

                  return (
                    <div key={slot.rank} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Trophy className="h-4 w-4" />
                          <span>#{slot.rank} {slot.rank === 1 ? 'CHAMPION (1ST PLACE)' : slot.rank === 2 ? 'RUNNER UP (2ND PLACE)' : '3RD PLACE'}</span>
                        </span>

                        {slot.verifiedUser && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold uppercase flex items-center gap-1">
                            <ShieldCheck className="h-3.5 w-3.5" /> VERIFIED PARTICIPANT
                          </span>
                        )}
                      </div>

                      {/* Participant Dropdown Selector */}
                      <div className="space-y-2">
                        <label className="block text-[10px] text-slate-400 font-bold uppercase">
                          Select Participant from Tournament Roster
                        </label>
                        {loadingParticipants ? (
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                            <span>Detecting registered participants...</span>
                          </div>
                        ) : (
                          <select
                            value={selectedRegId || ''}
                            onChange={(e) => handleSelectParticipant(index, e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                          >
                            <option value="">-- Select Registered Player for Position #{slot.rank} --</option>
                            {participants.map((p) => {
                              const u = typeof p.user === 'object' ? p.user : {};
                              const name = u.name || p.gameName || 'Gamer';
                              const gName = p.gameName || u.gameName || name;
                              const gUID = p.gameUID || u.gameUID || 'UID-000';
                              return (
                                <option key={p._id || p.id} value={p._id || p.id}>
                                  👤 {name} | Handle: {gName} | UID: {gUID}
                                </option>
                              );
                            })}
                          </select>
                        )}
                      </div>

                      {/* Manual UID Fallback Row */}
                      <div className="flex gap-2 pt-1">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={slot.gameUID}
                            onChange={(e) => {
                              const val = e.target.value;
                              setWinners((prev) => {
                                const next = [...prev];
                                next[index].gameUID = val;
                                next[index].verifiedUser = null;
                                next[index].error = '';
                                return next;
                              });
                            }}
                            placeholder="OR ENTER GAME UID MANUALLY (e.g. UID_99018273)"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-300 focus:outline-none focus:border-amber-500 uppercase"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleVerifyUID(index)}
                          disabled={slot.verifying}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] uppercase rounded-xl flex items-center gap-1 transition-colors disabled:opacity-50"
                        >
                          {slot.verifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                          <span>Verify</span>
                        </button>
                      </div>

                      {/* Verification Error */}
                      {slot.error && (
                        <p className="text-[11px] font-bold text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>{slot.error}</span>
                        </p>
                      )}

                      {/* Auto-Displayed Verified Player Details & Profile Avatar */}
                      {slot.verifiedUser && (
                        <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/40 flex items-center space-x-3 shadow-inner">
                          <img
                            src={slot.verifiedUser.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                            alt={slot.verifiedUser.name}
                            className="h-11 w-11 rounded-full object-cover border-2 border-emerald-500 shadow-md"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-white text-sm">{slot.verifiedUser.name}</span>
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">
                                {slot.verifiedUser.email}
                              </span>
                            </div>
                            <span className="text-xs text-amber-400 font-mono font-bold block mt-0.5">
                              HANDLE: {slot.verifiedUser.gameName} • UID: {slot.verifiedUser.gameUID}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Kills Count</label>
                          <input
                            type="number"
                            value={slot.kills}
                            onChange={(e) => {
                              const killsVal = Number(e.target.value);
                              setWinners((prev) => {
                                const next = [...prev];
                                next[index].kills = killsVal;
                                return next;
                              });
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-bold text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Prize Earnings (₹)</label>
                          <input
                            type="number"
                            value={slot.prizeAmount}
                            onChange={(e) => {
                              const prizeVal = Number(e.target.value);
                              setWinners((prev) => {
                                const next = [...prev];
                                next[index].prizeAmount = prizeVal;
                                return next;
                              });
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-bold text-amber-400"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Proof Image Screenshot & Notes */}
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Proof Screenshot URL</label>
                  <input
                    type="text"
                    value={proofImage}
                    onChange={(e) => setProofImage(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-1542751371-adc38448a05e"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Match Notes (Optional)</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Match ended cleanly after 3 overtime rounds."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setResultModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={publishing}
                  className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
                  <span>Publish Match Results 🏆</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
