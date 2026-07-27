'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PaymentModal from '@/components/PaymentModal';
import StatusTimeline from '@/components/StatusTimeline';
import CountdownTimer from '@/components/CountdownTimer';
import LiveChat from '@/components/LiveChat';
import { Trophy, Calendar, Clock, MapPin, Users, DollarSign, Shield, ArrowLeft, Key, Lock, CheckCircle, AlertCircle, Loader2, Gamepad2, X, QrCode, Copy, Check, Award } from 'lucide-react';
import { Tournament } from '../page';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import PacmanLoader from '@/components/PacmanLoader';

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matchResult, setMatchResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Registration & Payment state
  const [registration, setRegistration] = useState<any>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [gameNameInput, setGameNameInput] = useState('');
  const [gameUIDInput, setGameUIDInput] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');

  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [copiedRoom, setCopiedRoom] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  const fetchTournamentAndRegistration = async () => {
    if (!params.id) return;
    try {
      const res = await api.get(`/tournaments/${params.id}`);
      setTournament(res.data.data);

      try {
        const resultRes = await api.get(`/results/tournament/${params.id}`);
        if (resultRes.data?.data) {
          setMatchResult(resultRes.data.data);
        }
      } catch (e) {}

      if (user) {
        try {
          const [myRegs, roomRes] = await Promise.all([
            api.get('/registrations/my-registrations'),
            api.get(`/tournaments/${params.id}/room-credentials`),
          ]);

          const found = myRegs.data.data.find(
            (r: any) => (r.tournament?._id || r.tournament) === params.id && r.status !== 'CANCELLED'
          );
          if (found) setRegistration(found);
          if (roomRes.data?.data) setRoomInfo(roomRes.data.data);
        } catch (e) {}
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load tournament');
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
    fetchTournamentAndRegistration();
    const interval = setInterval(fetchTournamentAndRegistration, 10000);
    return () => clearInterval(interval);
  }, [params.id, user]);

  const handleOpenJoinModal = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setGameNameInput(user.gameName || user.name || '');
    setGameUIDInput(user.gameUID || '');
    setJoinError('');
    setJoinSuccess('');
    setIsJoinModalOpen(true);
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    setJoining(true);

    try {
      const response = await api.post('/registrations/join', {
        tournamentId: params.id,
        gameName: gameNameInput,
        gameUID: gameUIDInput,
      });

      setRegistration(response.data.data);
      setJoinSuccess('Successfully registered! Status: PENDING PAYMENT');
      setIsJoinModalOpen(false);

      if (tournament && tournament.entryFee > 0) {
        setIsPaymentModalOpen(true);
      }
      fetchTournamentAndRegistration();
    } catch (err: any) {
      setJoinError(err.response?.data?.message || 'Failed to join tournament');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return <PacmanLoader fullScreen text="LOADING TOURNAMENT DETAILS..." />;
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-[#090D16] text-[#FAFAFA] flex flex-col items-center justify-center px-4">
        <AlertCircle className="h-12 w-12 text-[#DFE104] mb-4 stroke-[2]" />
        <h2 className="text-2xl font-display font-bold uppercase mb-2">Tournament Not Found</h2>
        <p className="text-[#94A3B8] text-sm mb-6 font-medium">{error || 'The requested tournament could not be located.'}</p>
        <button
          onClick={() => router.push('/tournaments')}
          className="kt-btn-primary text-xs"
        >
          BACK TO TOURNAMENTS
        </button>
      </div>
    );
  }

  const isCompleted = tournament.status === 'COMPLETED';
  const isFull = tournament.filledSlots >= tournament.slots;
  const isClosed = !tournament.registrationOpen || tournament.status !== 'UPCOMING';

  const getPrizeBreakdownList = () => {
    if (!tournament) return [];

    const breakdown = (tournament as any).prizeBreakdown || { first: 0, second: 0, third: 0 };
    
    // Determine winner count: priority to explicit winnerCount ('1', '2', '3')
    let count = String((tournament as any).winnerCount || '3');
    if (!['1', '2', '3'].includes(count)) {
      if (breakdown.third && breakdown.third > 0) count = '3';
      else if (breakdown.second && breakdown.second > 0) count = '2';
      else count = '1';
    }

    const rawPrizeStr = String(tournament.prizePool || '');
    const cleanRawPrize = rawPrizeStr.startsWith('$') ? `₹${rawPrizeStr.slice(1)}` : rawPrizeStr;
    const currencySymbol = '₹';
    const digitsOnly = rawPrizeStr.replace(/[^0-9]/g, '');
    const totalNumeric = parseInt(digitsOnly, 10) || 0;

    let f = breakdown.first || 0;
    let s = breakdown.second || 0;
    let t = breakdown.third || 0;

    // Fallback split calculation if individual prize numbers were 0
    if (f === 0 && s === 0 && t === 0 && totalNumeric > 0) {
      if (count === '1') {
        f = totalNumeric;
      } else if (count === '2') {
        f = Math.round(totalNumeric * 0.65);
        s = Math.round(totalNumeric * 0.35);
      } else {
        f = Math.round(totalNumeric * 0.50);
        s = Math.round(totalNumeric * 0.30);
        t = Math.round(totalNumeric * 0.20);
      }
    }

    const result = [];

    // Always 1st Prize for count >= 1
    const fStr = f > 0 ? `₹${f.toLocaleString()}` : (cleanRawPrize.startsWith('₹') ? cleanRawPrize : `₹${cleanRawPrize}`) || '₹0';
    result.push({ label: '1ST PRIZE', icon: '🥇', amount: fStr, color: 'text-amber-400' });

    // 2nd Prize if count is '2' or '3'
    if (count === '2' || count === '3') {
      const sStr = s > 0 ? `${currencySymbol}${s.toLocaleString()}` : `${currencySymbol}0`;
      result.push({ label: '2ND PRIZE', icon: '🥈', amount: sStr, color: 'text-slate-300' });
    }

    // 3rd Prize ONLY if count is '3'
    if (count === '3') {
      const tStr = t > 0 ? `${currencySymbol}${t.toLocaleString()}` : `${currencySymbol}0`;
      result.push({ label: '3RD PRIZE', icon: '🥉', amount: tStr, color: 'text-amber-600' });
    }

    return result;
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-[#FAFAFA] pb-20 selection:bg-[#DFE104] selection:text-black">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push('/tournaments')}
          className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#94A3B8] hover:text-[#DFE104] transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
          <span>BACK TO ALL TOURNAMENTS</span>
        </button>

        {/* Hero Header Banner */}
        <div className="bg-[#0D1117]/80 border border-white/10 rounded-3xl overflow-hidden mb-8 relative shadow-2xl backdrop-blur-xl">
          <div className="relative h-64 md:h-80 w-full overflow-hidden">
            <img
              src={tournament.bannerImage}
              alt={tournament.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D1117] via-[#0D1117]/70 to-transparent" />

            <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 text-xs font-bold uppercase rounded-full bg-[#DFE104] text-black shadow-md shadow-[#DFE104]/20">
                    {tournament.game}
                  </span>
                  <span className="px-3 py-1 text-xs font-bold uppercase rounded-full bg-white/10 text-[#FAFAFA] border border-white/20">
                    {tournament.mode}
                  </span>
                  <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${
                    isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-md'
                      : 'bg-white/5 text-[#DFE104] border-[#DFE104]/40'
                  }`}>
                    {isCompleted ? 'COMPLETED' : tournament.status}
                  </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-display font-bold uppercase tracking-tight text-[#FAFAFA]">{tournament.title}</h1>
              </div>

              {/* Dynamic Registration Action Button */}
              <div>
                {isCompleted ? (
                  <button disabled className="px-6 py-3.5 rounded-2xl bg-emerald-500/20 text-emerald-400 font-bold text-xs uppercase border border-emerald-500/40 shadow-lg cursor-not-allowed flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 stroke-[2]" />
                    <span>MATCH COMPLETED 🏆</span>
                  </button>
                ) : registration ? (
                  <div className="flex flex-col items-end gap-2">
                    <div className={`px-5 py-2.5 rounded-full border font-bold text-xs uppercase tracking-tight flex items-center gap-2 ${
                      registration.status === 'CONFIRMED'
                        ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10'
                        : 'border-[#DFE104]/40 bg-[#DFE104]/10 text-[#DFE104]'
                    }`}>
                      <CheckCircle className="h-4 w-4 stroke-[2]" />
                      <span>
                        {registration.status === 'CONFIRMED'
                          ? 'REGISTRATION DONE ✅ (CONFIRMED)'
                          : `REGISTRATION SUBMITTED: ${registration.status} (${registration.paymentStatus})`}
                      </span>
                    </div>

                    {tournament.entryFee > 0 && registration.paymentStatus === 'PENDING' && (
                      <button
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="kt-btn-primary text-xs flex items-center gap-1.5"
                      >
                        <QrCode className="h-4 w-4 stroke-[2]" />
                        <span>PAY ENTRY FEE & UPLOAD PROOF</span>
                      </button>
                    )}
                  </div>
                ) : isClosed ? (
                  <button disabled className="px-6 py-3 rounded-xl bg-white/5 text-[#94A3B8] font-bold text-xs uppercase border border-white/10 cursor-not-allowed">
                    REGISTRATION CLOSED
                  </button>
                ) : isFull ? (
                  <button disabled className="px-6 py-3 rounded-xl bg-white/5 text-[#DFE104] font-bold text-xs uppercase border border-white/10 cursor-not-allowed">
                    SLOTS FULL ({tournament.filledSlots}/{tournament.slots})
                  </button>
                ) : (
                  <button
                    onClick={handleOpenJoinModal}
                    className="kt-btn-primary text-xs w-full md:w-auto"
                  >
                    JOIN TOURNAMENT SLOT
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {joinSuccess && (
          <div className="mb-6 p-4 rounded-2xl border border-[#DFE104]/40 bg-[#DFE104]/10 text-[#DFE104] text-xs font-bold uppercase tracking-wide flex items-center gap-2">
            <CheckCircle className="h-5 w-5 shrink-0 stroke-[2]" />
            <span>{joinSuccess}</span>
          </div>
        )}

        {/* Registration Approval Timeline */}
        {registration && (
          <StatusTimeline
            currentStep={
              registration.status === 'CONFIRMED' && (registration.paymentStatus === 'PAID' || registration.paymentStatus === 'FREE')
                ? 4
                : registration.status === 'CONFIRMED' || registration.paymentStatus === 'PAID'
                ? 3
                : registration.paymentStatus === 'UNDER_VERIFICATION' || registration.paymentStatus === 'PENDING'
                ? 2
                : 1
            }
            status={registration.status}
            paymentStatus={registration.paymentStatus}
          />
        )}

        {/* Detailed Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Match Results & Winners Showdown Section */}
            {matchResult && matchResult.rankings && matchResult.rankings.length > 0 && (
              <div className="bg-[#0D1117]/90 border-2 border-[#DFE104]/60 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-white/10 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-2xl bg-[#DFE104] text-black flex items-center justify-center font-bold shadow-lg shadow-[#DFE104]/30">
                      <Award className="h-7 w-7 stroke-[2]" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-[#FAFAFA]">
                        OFFICIAL MATCH RESULTS & WINNERS
                      </h2>
                      <p className="text-xs text-[#DFE104] font-bold uppercase">
                        Verified Match Outcome • Winner Rankings & Cash Prizes 🏆
                      </p>
                    </div>
                  </div>

                  <span className="px-3.5 py-1 text-xs font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full w-fit">
                    COMPLETED MATCH
                  </span>
                </div>

                {/* Winners Podium Cards */}
                <div className="space-y-4 mb-6">
                  {matchResult.rankings.map((winner: any, idx: number) => {
                    const isChampion = winner.rank === 1;
                    const isRunnerUp = winner.rank === 2;

                    return (
                      <div
                        key={idx}
                        className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row items-center justify-between gap-4 ${
                          isChampion
                            ? 'bg-gradient-to-r from-[#DFE104]/20 via-[#0D1117] to-black border-[#DFE104] shadow-xl shadow-[#DFE104]/10'
                            : isRunnerUp
                            ? 'bg-white/5 border-slate-400/40'
                            : 'bg-black/40 border-amber-800/40'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          {/* Rank Badge / Crown */}
                          <div
                            className={`h-12 w-12 rounded-2xl flex items-center justify-center font-extrabold text-sm border shrink-0 ${
                              isChampion
                                ? 'bg-[#DFE104] text-black border-[#DFE104] shadow-md'
                                : isRunnerUp
                                ? 'bg-slate-300 text-black border-slate-200'
                                : 'bg-amber-800/40 text-amber-300 border-amber-700'
                            }`}
                          >
                            {isChampion ? '👑 #1' : isRunnerUp ? '🥈 #2' : '🥉 #3'}
                          </div>

                          {/* Avatar & Player Info */}
                          <div className="flex items-center space-x-3">
                            <img
                              src={winner.profileImage || winner.user?.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                              alt={winner.gameName || 'Winner'}
                              className="h-12 w-12 rounded-full object-cover border-2 border-[#DFE104]"
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-lg font-bold text-[#FAFAFA] font-display uppercase tracking-tight">
                                  {winner.gameName || winner.user?.name || 'Pro Gamer'}
                                </span>
                                {isChampion && (
                                  <span className="px-2 py-0.5 rounded bg-[#DFE104] text-black text-[10px] font-extrabold uppercase">
                                    MATCH MVP
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-[#94A3B8] font-mono font-bold">
                                {winner.gameUID ? `UID: ${winner.gameUID}` : `HANDLE: ${winner.gameName}`}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Winner Stats: Kills, Prize Money */}
                        <div className="flex items-center space-x-3">
                          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-center">
                            <span className="text-[10px] text-[#94A3B8] font-bold uppercase block">KILLS</span>
                            <span className="text-sm font-extrabold text-[#FAFAFA] font-mono">🔥 {winner.kills || 0}</span>
                          </div>

                          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-center">
                            <span className="text-[10px] text-[#94A3B8] font-bold uppercase block">POINTS</span>
                            <span className="text-sm font-extrabold text-[#DFE104] font-mono">⚡ {winner.points || (winner.rank === 1 ? 100 : winner.rank === 2 ? 50 : 25)}</span>
                          </div>

                          <div className="px-5 py-2.5 rounded-xl bg-[#DFE104] text-black font-extrabold text-sm uppercase tracking-wider shadow-md">
                            ₹{winner.prizeAmount || 0} CASH
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Proof Image Screenshot & Notes */}
                {matchResult.proofImage && (
                  <div className="mb-4">
                    <span className="text-xs font-bold text-[#94A3B8] uppercase block mb-2">OFFICIAL RESULT SCREENSHOT:</span>
                    <img
                      src={matchResult.proofImage}
                      alt="Match Result Proof"
                      className="max-h-64 rounded-2xl border border-white/15 object-cover"
                    />
                  </div>
                )}

                {matchResult.notes && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-[#94A3B8]">
                    <span className="font-bold text-[#FAFAFA] uppercase block mb-1">REFEREE NOTES:</span>
                    <span>{matchResult.notes}</span>
                  </div>
                )}
              </div>
            )}
            {/* Rules & Overview */}
            <div className="bg-[#0D1117]/80 border border-white/10 rounded-3xl p-8 shadow-xl backdrop-blur-xl">
              <h2 className="text-2xl font-display font-bold uppercase mb-4 flex items-center gap-2 text-[#FAFAFA] tracking-tight">
                <Shield className="h-5 w-5 text-[#DFE104] stroke-[2]" />
                <span>TOURNAMENT FORMAT & RULES</span>
              </h2>
              <p className="text-[#94A3B8] text-sm leading-relaxed whitespace-pre-line font-medium">
                {tournament.description}
              </p>
            </div>

            {/* Room Credentials Section */}
            <div className="bg-[#0D1117]/80 border border-white/10 rounded-3xl p-8 shadow-xl backdrop-blur-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-white/10 pb-4">
                <h2 className="text-2xl font-display font-bold uppercase flex items-center gap-2 text-[#DFE104] tracking-tight">
                  <Key className="h-5 w-5 stroke-[2]" />
                  <span>MATCH LOBBY ROOM CREDENTIALS</span>
                </h2>
                <span className="text-xs px-3 py-1 font-bold uppercase bg-[#DFE104]/20 text-[#DFE104] border border-[#DFE104]/40 rounded-full w-fit">
                  {roomInfo?.isUnlocked ? 'LOBBY LIVE' : 'RESTRICTED LOBBY'}
                </span>
              </div>

              {roomInfo?.isUnlocked && roomInfo?.roomID ? (
                <div>
                  <div className="mb-4 text-xs font-bold text-[#DFE104] uppercase flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 stroke-[2]" />
                    <span>Lobby Unlocked for Approved Participant</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-[#94A3B8] uppercase font-bold block mb-1">ROOM ID</span>
                        <span className="text-xl font-bold text-[#DFE104] font-mono">
                          {roomInfo.roomID}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(roomInfo.roomID);
                          setCopiedRoom(true);
                          setTimeout(() => setCopiedRoom(false), 2000);
                        }}
                        className="p-2.5 rounded-xl border border-[#DFE104] bg-[#DFE104] text-black hover:bg-[#FAFAFA] transition-all flex items-center gap-1.5 text-xs font-bold uppercase shadow-md"
                        title="Copy Room ID"
                      >
                        {copiedRoom ? <Check className="h-4 w-4 stroke-[2]" /> : <Copy className="h-4 w-4 stroke-[2]" />}
                        <span>{copiedRoom ? 'COPIED!' : 'COPY'}</span>
                      </button>
                    </div>

                    <div className="p-5 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-[#94A3B8] uppercase font-bold block mb-1">PASSWORD</span>
                        <span className="text-xl font-bold text-[#FAFAFA] font-mono">
                          {roomInfo.password}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(roomInfo.password);
                          setCopiedPass(true);
                          setTimeout(() => setCopiedPass(false), 2000);
                        }}
                        className="p-2.5 rounded-xl border border-white/20 bg-white/10 text-[#FAFAFA] hover:bg-[#DFE104] hover:text-black transition-all flex items-center gap-1.5 text-xs font-bold uppercase shadow-md"
                        title="Copy Room Password"
                      >
                        {copiedPass ? <Check className="h-4 w-4 stroke-[2]" /> : <Copy className="h-4 w-4 stroke-[2]" />}
                        <span>{copiedPass ? 'COPIED!' : 'COPY'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl border border-white/10 bg-white/5 text-center text-xs font-bold uppercase text-[#94A3B8] flex flex-col items-center space-y-2">
                  <Lock className="h-8 w-8 text-[#94A3B8]/40 stroke-[2]" />
                  <p>{roomInfo?.message || 'Room details hidden. Reserved exclusively for Approved tournament participants.'}</p>
                </div>
              )}
            </div>


            {/* Live Tournament Chatbox */}
            <LiveChat
              tournamentId={tournament._id}
              tournamentTitle={tournament.title}
              isRegistered={!!registration && registration.status !== 'CANCELLED'}
              tournamentStatus={tournament.status}
              completedAt={(tournament as any).completedAt}
              updatedAt={(tournament as any).updatedAt}
            />
          </div>

          {/* Right Sidebar Key Specs */}
          <div className="space-y-6">
            <div className="bg-[#0D1117]/80 border border-white/10 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-6">
              <h3 className="text-xl font-display font-bold uppercase border-b border-white/10 pb-3 flex items-center gap-2 text-[#FAFAFA] tracking-tight">
                <Trophy className="h-5 w-5 text-[#DFE104] stroke-[2]" />
                <span>SUMMARY</span>
              </h3>

              <div className="space-y-4 text-xs font-bold uppercase">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-[#94A3B8] flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-[#DFE104] stroke-[2]" /> TOTAL PRIZE
                  </span>
                  <span className="font-bold text-[#DFE104] text-base">{tournament.prizePool}</span>
                </div>

                {/* Winner Prize Pool Breakdown */}
                {getPrizeBreakdownList().map((prize, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-white/10 pb-2 bg-white/[0.03] px-3 py-1.5 rounded-xl border border-white/5">
                    <span className="text-[#FAFAFA] flex items-center gap-2 font-bold text-xs">
                      <span className="text-base">{prize.icon}</span>
                      <span>{prize.label}</span>
                    </span>
                    <span className={`font-extrabold text-sm ${prize.color}`}>
                      {prize.amount}
                    </span>
                  </div>
                ))}

                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-[#94A3B8] flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-[#94A3B8] stroke-[2]" /> ENTRY FEE
                  </span>
                  <span className="font-bold text-[#FAFAFA]">
                    {tournament.entryFee === 0 ? 'FREE ENTRY' : `₹${tournament.entryFee}`}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-[#94A3B8] flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#DFE104] stroke-[2]" /> DATE
                  </span>
                  <span className="font-bold text-[#FAFAFA]">{tournament.date}</span>
                </div>

                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-[#94A3B8] flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#DFE104] stroke-[2]" /> TIME
                  </span>
                  <span className="font-bold text-[#FAFAFA]">{tournament.time}</span>
                </div>

                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-[#94A3B8] flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#DFE104] stroke-[2]" /> MAP
                  </span>
                  <span className="font-bold text-[#FAFAFA]">{tournament.map}</span>
                </div>

                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-[#94A3B8] flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#DFE104] stroke-[2]" /> CAPACITY
                  </span>
                  <span className="font-bold text-[#FAFAFA]">
                    {tournament.filledSlots} / {tournament.slots} TEAMS
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Join Registration Modal */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0D1117] border border-white/15 rounded-3xl w-full max-w-md p-8 relative text-[#FAFAFA] shadow-2xl">
            <button
              onClick={() => setIsJoinModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 border border-white/10 text-[#FAFAFA] hover:bg-[#DFE104] hover:text-black transition-colors"
            >
              <X className="h-5 w-5 stroke-[2]" />
            </button>

            <div className="flex items-center space-x-3 mb-6 border-b border-white/10 pb-4">
              <div className="h-10 w-10 bg-[#DFE104] text-black rounded-2xl flex items-center justify-center font-bold shadow-md shadow-[#DFE104]/20">
                <Trophy className="h-5 w-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold uppercase tracking-tight text-[#FAFAFA]">JOIN TOURNAMENTS</h3>
                <p className="text-xs text-[#DFE104] font-bold uppercase">{tournament.title}</p>
              </div>
            </div>

            {joinError && (
              <div className="mb-4 p-3 rounded-2xl border border-[#DFE104]/40 bg-[#DFE104]/10 text-[#DFE104] text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 stroke-[2]" />
                <span>{joinError}</span>
              </div>
            )}

            <form onSubmit={handleJoinSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-2">IN-GAME HANDLE / NAME</label>
                <div className="relative">
                  <Gamepad2 className="h-5 w-5 absolute left-3.5 top-3.5 text-[#94A3B8] stroke-[2]" />
                  <input
                    type="text"
                    required
                    value={gameNameInput}
                    onChange={(e) => setGameNameInput(e.target.value)}
                    placeholder="E.G. PROGAMER#TAG1"
                    className="w-full bg-white/5 border border-white/15 rounded-xl py-3 pl-11 pr-4 text-xs font-bold text-[#FAFAFA] focus:outline-none focus:border-[#DFE104] uppercase transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-2">IN-GAME CHARACTER UID</label>
                <div className="relative">
                  <Gamepad2 className="h-5 w-5 absolute left-3.5 top-3.5 text-[#94A3B8] stroke-[2]" />
                  <input
                    type="text"
                    required
                    value={gameUIDInput}
                    onChange={(e) => setGameUIDInput(e.target.value)}
                    placeholder="E.G. 519284019"
                    className="w-full bg-white/5 border border-white/15 rounded-xl py-3 pl-11 pr-4 text-xs font-bold text-[#FAFAFA] focus:outline-none focus:border-[#DFE104] uppercase transition-all"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-white/10 bg-white/5 text-xs font-bold uppercase space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">ENTRY FEE:</span>
                  <span className="font-bold text-[#DFE104]">
                    {tournament.entryFee === 0 ? 'FREE' : `₹${tournament.entryFee}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">INITIAL STATUS:</span>
                  <span className="font-bold text-[#DFE104]">PENDING PAYMENT</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={joining}
                className="w-full kt-btn-primary py-3.5 text-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {joining ? (
                  <Loader2 className="h-5 w-5 animate-spin stroke-[2]" />
                ) : (
                  <span>CONFIRM TOURNAMENT REGISTRATION</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {tournament && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          tournamentId={tournament._id}
          tournamentTitle={tournament.title}
          entryFee={tournament.entryFee}
          onPaymentSuccess={() => {
            fetchTournamentAndRegistration();
          }}
        />
      )}
    </div>
  );
}


