'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import {
  Trophy,
  Plus,
  Edit,
  Trash2,
  Key,
  CheckCircle,
  Loader2,
  X,
  UserCheck,
  AlertCircle,
  Award,
} from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import api from '@/lib/api';

export interface AdminTournament {
  _id: string;
  title: string;
  game: string;
  mode: string;
  entryFee: number;
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
  map: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  registrationOpen: boolean;
  roomID?: string;
  password?: string;
  roomVisible?: boolean;
  roomAuditLog?: Array<{
    adminId: string;
    adminEmail?: string;
    action: string;
    timestamp: string;
    details?: string;
  }>;
  bannerImage?: string;
  description?: string;
}

const columnHelper = createColumnHelper<AdminTournament>();

const DEFAULT_BANNERS = [
  { name: 'Default Banner', url: '' },
];

export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState<AdminTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Secure Room Management State
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [selectedRoomTournament, setSelectedRoomTournament] = useState<AdminTournament | null>(null);
  const [roomInput, setRoomInput] = useState({ roomID: '', password: '' });
  const [roomSaving, setRoomSaving] = useState(false);
  const [roomReleasing, setRoomReleasing] = useState(false);

  // Participants Modal State
  const [participantsModalOpen, setParticipantsModalOpen] = useState(false);
  const [selectedTournamentTitle, setSelectedTournamentTitle] = useState('');
  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedRegIds, setSelectedRegIds] = useState<string[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    game: 'Valorant',
    mode: 'SQUAD',
    entryFee: 0,
    prizePool: '₹10,000',
    winnerCount: '3' as '1' | '2' | '3',
    firstPrize: 5000,
    secondPrize: 3000,
    thirdPrize: 2000,
    slots: 64,
    date: new Date().toISOString().split('T')[0],
    time: '18:00',
    map: 'Haven',
    roomID: '',
    password: '',
    bannerImage: '',
    description: 'Official Esports Tournament.',
  });

  const fetchTournaments = async () => {
    try {
      const response = await api.get('/tournaments');
      setTournaments(response.data.data);
    } catch (err) {
      console.error('Failed to fetch tournaments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const parsePrizePoolNumber = (poolStr: string): number => {
    const digitsOnly = (poolStr || '').replace(/[^0-9]/g, '');
    const parsed = parseInt(digitsOnly, 10);
    return isNaN(parsed) || parsed <= 0 ? 10000 : parsed;
  };

  const handleWinnerCountChange = (count: '1' | '2' | '3') => {
    const total = parsePrizePoolNumber(formData.prizePool);
    let f = total;
    let s = 0;
    let t = 0;
    if (count === '2') {
      f = Math.round(total * 0.65);
      s = Math.round(total * 0.35);
      t = 0;
    } else if (count === '3') {
      f = Math.round(total * 0.50);
      s = Math.round(total * 0.30);
      t = Math.round(total * 0.20);
    }
    setFormData((prev) => ({
      ...prev,
      winnerCount: count,
      firstPrize: f,
      secondPrize: s,
      thirdPrize: t,
    }));
  };

  // Room Modal Actions
  const handleOpenRoomModal = (tournament: AdminTournament) => {
    setSelectedRoomTournament(tournament);
    setRoomInput({
      roomID: tournament.roomID || '',
      password: tournament.password || '',
    });
    setRoomModalOpen(true);
  };

  const handleSaveRoomCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomTournament) return;
    setRoomSaving(true);
    try {
      await api.patch(`/tournaments/${selectedRoomTournament._id}/room`, roomInput);
      setFeedback({
        type: 'success',
        text: `Room credentials saved for "${selectedRoomTournament.title}". Stored securely in database (Hidden state until 15m before match / manual release).`,
      });
      setRoomModalOpen(false);
      fetchTournaments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save room credentials');
    } finally {
      setRoomSaving(false);
    }
  };

  const handleReleaseRoomNow = async () => {
    if (!selectedRoomTournament) return;
    if (!confirm('Are you sure you want to RELEASE room credentials NOW? Only approved players will be able to view them immediately.')) return;
    setRoomReleasing(true);
    try {
      await api.patch(`/tournaments/${selectedRoomTournament._id}/room/release`);
      setFeedback({
        type: 'success',
        text: `Room credentials for "${selectedRoomTournament.title}" RELEASED NOW! Visible exclusively to approved participants.`,
      });
      setRoomModalOpen(false);
      fetchTournaments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to release room credentials');
    } finally {
      setRoomReleasing(false);
    }
  };

  // Participant Actions
  const handleOpenParticipantsModal = async (tournament: AdminTournament) => {
    setSelectedTournamentTitle(tournament.title);
    setParticipantsModalOpen(true);
    setLoadingParticipants(true);
    setSelectedRegIds([]);
    try {
      const res = await api.get(`/registrations/tournament/${tournament._id}`);
      setParticipants(res.data.data);
    } catch (err) {
      alert('Failed to load participants');
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleUpdateRegStatus = async (regId: string, status: string, paymentStatus: string) => {
    try {
      await api.patch(`/registrations/${regId}/status`, { status, paymentStatus });
      setParticipants((prev) =>
        prev.map((p) => (p._id === regId ? { ...p, status, paymentStatus } : p))
      );
      setFeedback({ type: 'success', text: `Updated participant registration status to ${status}` });
    } catch (err) {
      alert('Failed to update participant status');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedRegIds.length === 0) return;
    try {
      await api.post('/registrations/bulk-approve', { registrationIds: selectedRegIds });
      setParticipants((prev) =>
        prev.map((p) => (selectedRegIds.includes(p._id) ? { ...p, status: 'CONFIRMED', paymentStatus: 'PAID' } : p))
      );
      setSelectedRegIds([]);
      setFeedback({ type: 'success', text: `Bulk approved ${selectedRegIds.length} registrations!` });
    } catch (err) {
      alert('Bulk approval failed');
    }
  };

  // Tournament Actions
  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormData({
      title: '',
      game: 'Valorant',
      mode: 'SQUAD',
      entryFee: 0,
      prizePool: '₹10,000',
      winnerCount: '3',
      firstPrize: 5000,
      secondPrize: 3000,
      thirdPrize: 2000,
      slots: 64,
      date: new Date().toISOString().split('T')[0],
      time: '18:00',
      map: 'Haven',
      roomID: '',
      password: '',
      bannerImage: '',
      description: 'Official Esports Tournament.',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (t: AdminTournament) => {
    setEditingId(t._id);
    const parsedCount = t.winnerCount || '3';
    const pb = t.prizeBreakdown || { first: 0, second: 0, third: 0 };
    setFormData({
      title: t.title,
      game: t.game,
      mode: t.mode,
      entryFee: t.entryFee,
      prizePool: t.prizePool,
      winnerCount: parsedCount,
      firstPrize: pb.first || 0,
      secondPrize: pb.second || 0,
      thirdPrize: pb.third || 0,
      slots: t.slots,
      date: t.date,
      time: t.time,
      map: t.map,
      roomID: t.roomID || '',
      password: t.password || '',
      bannerImage: t.bannerImage || '',
      description: t.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/tournaments/${editingId}`, formData);
        setFeedback({ type: 'success', text: `Tournament "${formData.title}" updated successfully!` });
      } else {
        await api.post('/tournaments', formData);
        setFeedback({ type: 'success', text: `Tournament "${formData.title}" created successfully!` });
      }
      setIsModalOpen(false);
      fetchTournaments();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Error saving tournament' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this tournament?')) {
      try {
        await api.delete(`/tournaments/${id}`);
        setFeedback({ type: 'success', text: 'Tournament deleted successfully.' });
        fetchTournaments();
      } catch (err) {
        setFeedback({ type: 'error', text: 'Failed to delete tournament.' });
      }
    }
  };

  const handleStatusToggle = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/tournaments/${id}/status`, { status: newStatus });
      fetchTournaments();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('title', {
        header: 'Tournament & Game',
        cell: (info) => (
          <div className="flex items-center space-x-3">
            <img
              src={info.row.original.bannerImage || DEFAULT_BANNERS[0].url}
              alt={info.getValue()}
              className="h-10 w-14 rounded object-cover border border-slate-700 shrink-0"
            />
            <div>
              <div className="font-bold text-white text-sm">{info.getValue()}</div>
              <div className="text-xs text-blue-400 font-semibold">{info.row.original.game} • {info.row.original.mode}</div>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('prizePool', {
        header: 'Prize Pool',
        cell: (info) => <span className="font-bold text-emerald-400">{info.getValue()}</span>,
      }),
      columnHelper.accessor('slots', {
        header: 'Slots',
        cell: (info) => (
          <span className="text-slate-300 font-medium">
            {info.row.original.filledSlots} / {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('date', {
        header: 'Schedule',
        cell: (info) => (
          <span className="text-xs text-slate-400">
            {info.getValue()} at {info.row.original.time}
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue();
          const colorMap = {
            UPCOMING: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
            LIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse',
            COMPLETED: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
            CANCELLED: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          };
          return (
            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${colorMap[status]}`}>
                {status}
              </span>
              <select
                value={status}
                onChange={(e) => handleStatusToggle(info.row.original._id, e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded px-2 py-1 focus:outline-none"
              >
                <option value="UPCOMING">UPCOMING</option>
                <option value="LIVE">LIVE</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleOpenRoomModal(info.row.original)}
              className="p-1.5 rounded bg-slate-800 text-blue-400 hover:bg-slate-700 transition-colors flex items-center gap-1 text-xs font-semibold border border-blue-500/30"
              title="Secure Room Management & Auto/Manual Release"
            >
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">Room</span>
            </button>
            <button
              onClick={() => handleOpenEditModal(info.row.original)}
              className="p-1.5 rounded bg-slate-800 text-blue-400 hover:bg-slate-700 transition-colors"
              title="Edit Tournament"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(info.row.original._id)}
              className="p-1.5 rounded bg-slate-800 text-red-400 hover:bg-slate-700 transition-colors"
              title="Delete Tournament"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: tournaments,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col md:flex-row">
      <AdminSidebar activePath="/tournaments" />

      <main className="flex-1 p-6 sm:p-8 w-full overflow-x-hidden">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b-2 border-[#3F3F46] pb-6">
          <div>
            <h1 className="text-4xl font-heading font-extrabold tracking-tighter text-white uppercase flex items-center gap-3">
              <Trophy className="h-8 w-8 text-[#DFE104]" />
              <span>TOURNAMENTS HUB</span>
            </h1>
            <p className="text-[#A1A1AA] font-mono text-xs uppercase tracking-wider mt-1">
              Create, edit, manage slots, configure secure room credentials, and publish esports matches.
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="kt-btn-primary text-xs !py-3 !px-6 flex items-center gap-2"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>CREATE NEW TOURNAMENT</span>
          </button>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`mb-6 p-4 rounded-2xl border text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-between ${feedback.type === 'success'
                ? 'bg-[#FFD600]/10 border-[#FFD600]/30 text-[#FFD600]'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <span>{feedback.text}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-[#94A3B8] hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Table List Container */}
        <div className="bg-[#0F1115] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_40px_-10px_rgba(247,147,26,0.15)] corner-border-accent">
          {loading ? (
            <div className="py-20 text-center text-[#94A3B8] text-xs font-mono font-bold uppercase flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#F7931A] mb-3" />
              <span>Loading tournament directory...</span>
            </div>
          ) : tournaments.length === 0 ? (
            <div className="py-20 text-center text-[#94A3B8] text-xs font-mono uppercase flex flex-col items-center">
              <Trophy className="h-12 w-12 text-[#94A3B8]/40 mb-3" />
              <span className="font-heading text-white text-base mb-1 font-bold">NO TOURNAMENTS FOUND</span>
              <span>Click "Create New Tournament" above to publish your first match.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300 border-collapse">
                <thead className="bg-slate-950 uppercase text-xs text-slate-400 border-b border-slate-800 font-bold">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} className="p-4">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="p-4">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Secure Room Management Modal */}
      {roomModalOpen && selectedRoomTournament && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 relative shadow-2xl text-slate-100">
            <button
              onClick={() => setRoomModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6 border-b border-slate-800 pb-4">
              <div className="h-10 w-10 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-2xl flex items-center justify-center font-bold">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white uppercase tracking-tight">SECURE ROOM MANAGEMENT</h3>
                <p className="text-xs text-blue-400 font-bold">{selectedRoomTournament.title}</p>
              </div>
            </div>

            {/* Visibility State Badge */}
            <div className="mb-6 p-4 rounded-2xl border bg-slate-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-400">Current Room Visibility:</span>
                {selectedRoomTournament.roomVisible ? (
                  <span className="px-3 py-1 text-xs font-extrabold uppercase rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    🔓 RELEASED TO APPROVED PLAYERS
                  </span>
                ) : (
                  <span className="px-3 py-1 text-xs font-extrabold uppercase rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    🔒 HIDDEN (Auto-release 15m before start)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Room credentials are stored securely in MongoDB. Only approved (CONFIRMED) participants will receive Room ID & Password once released.
              </p>
            </div>

            <form onSubmit={handleSaveRoomCredentials} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">MATCH LOBBY ROOM ID</label>
                <input
                  type="text"
                  required
                  value={roomInput.roomID}
                  onChange={(e) => setRoomInput({ ...roomInput, roomID: e.target.value })}
                  placeholder="e.g. ROOM-882190"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">MATCH LOBBY PASSWORD</label>
                <input
                  type="text"
                  required
                  value={roomInput.password}
                  onChange={(e) => setRoomInput({ ...roomInput, password: e.target.value })}
                  placeholder="e.g. PASS-9901"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={roomSaving}
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {roomSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  <span>Save Credentials</span>
                </button>

                <button
                  type="button"
                  onClick={handleReleaseRoomNow}
                  disabled={roomReleasing || selectedRoomTournament.roomVisible}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
                >
                  {roomReleasing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                  <span>RELEASE NOW ⚡</span>
                </button>
              </div>
            </form>

            {/* Audit Log Drawer */}
            {selectedRoomTournament.roomAuditLog && selectedRoomTournament.roomAuditLog.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Audit History Trail</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto text-[10px] text-slate-400 font-mono">
                  {selectedRoomTournament.roomAuditLog.map((log: any, idx: number) => (
                    <div key={idx} className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                      <div>
                        <span className="text-blue-400 font-bold">{log.action}</span> by {log.adminEmail || log.adminId}
                        <span className="block text-slate-500">{log.details}</span>
                      </div>
                      <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit / Create Tournament Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-blue-500" />
              <span>{editingId ? 'Edit Tournament' : 'Create New Tournament'}</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Tournament Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Valorant Champions Showdown"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Game</label>
                  <select
                    value={formData.game}
                    onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Valorant">Valorant</option>
                    <option value="BGMI">BGMI</option>
                    <option value="CS2">CS2</option>
                    <option value="Free Fire">Free Fire</option>
                    <option value="Apex Legends">Apex Legends</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Mode</label>
                  <select
                    value={formData.mode}
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="5v5">5v5</option>
                    <option value="SQUAD">SQUAD</option>
                    <option value="DUO">DUO</option>
                    <option value="SOLO">SOLO</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Total Prize Pool</label>
                  <input
                    type="text"
                    required
                    value={formData.prizePool}
                    onChange={(e) => {
                      const newPool = e.target.value;
                      setFormData({ ...formData, prizePool: newPool });
                      handleWinnerCountChange(formData.winnerCount);
                    }}
                    placeholder="e.g. ₹10,000"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Entry Fee (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.entryFee}
                    onChange={(e) => setFormData({ ...formData, entryFee: Number(e.target.value) })}
                    placeholder="0 for Free"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Max Capacity Slots</label>
                  <input
                    type="number"
                    required
                    value={formData.slots}
                    onChange={(e) => setFormData({ ...formData, slots: Number(e.target.value) })}
                    placeholder="e.g. 64"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Winner Count & Prize Split Config */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold uppercase text-amber-400">
                    Winner Count & Prize Split Config
                  </label>
                  <span className="text-[11px] font-bold text-slate-400">
                    Select how many winners will receive prizes
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: '1', label: '1 Winner (1st Only)' },
                    { id: '2', label: '2 Winners (1st & 2nd)' },
                    { id: '3', label: '3 Winners (1st, 2nd & 3rd)' },
                  ].map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => handleWinnerCountChange(w.id as any)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold uppercase border transition-all ${formData.winnerCount === w.id
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-extrabold'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>

                {/* Individual Prize Inputs */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-amber-400 uppercase mb-1">
                      🥇 1st Place Prize (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.firstPrize}
                      onChange={(e) => setFormData({ ...formData, firstPrize: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-bold text-white"
                    />
                  </div>

                  {formData.winnerCount !== '1' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                        🥈 2nd Place Prize (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.secondPrize}
                        onChange={(e) => setFormData({ ...formData, secondPrize: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-bold text-white"
                      />
                    </div>
                  )}

                  {formData.winnerCount === '3' && (
                    <div>
                      <label className="block text-[10px] font-bold text-amber-600 uppercase mb-1">
                        🥉 3rd Place Prize (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.thirdPrize}
                        onChange={(e) => setFormData({ ...formData, thirdPrize: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-bold text-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Tournament Date</label>
                  <input
                    type="text"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    placeholder="e.g. 2026-08-15"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-[#FAFAFA] focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Start Time</label>
                  <input
                    type="text"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    placeholder="e.g. 19:00 IST"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-[#FAFAFA] focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Map Name</label>
                  <input
                    type="text"
                    value={formData.map}
                    onChange={(e) => setFormData({ ...formData, map: e.target.value })}
                    placeholder="e.g. Erangel / Ascent"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-[#FAFAFA] focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Banner Preset Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Banner Image URL</label>
                <input
                  type="text"
                  value={formData.bannerImage}
                  onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-[#FAFAFA] focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Description & Rules</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-[#FAFAFA] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-xs font-extrabold rounded-lg bg-blue-600 text-[#FAFAFA] hover:bg-blue-500 flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  <span>{editingId ? 'Update Tournament' : 'Publish Tournament'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Participants Modal Dialog */}
      {participantsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl p-6 relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setParticipantsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">Registered Participants</h3>
                <p className="text-xs text-blue-400">{selectedTournamentTitle}</p>
              </div>

              {participants.length > 0 && (
                <button
                  onClick={handleBulkApprove}
                  disabled={selectedRegIds.length === 0}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Bulk Approve Selected ({selectedRegIds.length})</span>
                </button>
              )}
            </div>

            {loadingParticipants ? (
              <div className="py-12 text-center text-slate-400 text-sm flex flex-col items-center">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500 mb-2" />
                <span>Fetching participant list...</span>
              </div>
            ) : participants.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm border border-slate-800 rounded-xl">
                <span>No player registrations yet for this tournament.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300 border-collapse">
                  <thead className="bg-slate-950 uppercase text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedRegIds.length === participants.length && participants.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRegIds(participants.map((p) => p._id));
                            } else {
                              setSelectedRegIds([]);
                            }
                          }}
                        />
                      </th>
                      <th className="p-3">Player / User</th>
                      <th className="p-3">Game Handle</th>
                      <th className="p-3">Character UID</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Payment</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {participants.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-800/40">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedRegIds.includes(p._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRegIds((prev) => [...prev, p._id]);
                              } else {
                                setSelectedRegIds((prev) => prev.filter((id) => id !== p._id));
                              }
                            }}
                          />
                        </td>
                        <td className="p-3 font-semibold text-white">
                          {p.user?.name || p.gameName}
                        </td>
                        <td className="p-3 text-blue-400 font-mono">{p.gameName}</td>
                        <td className="p-3 text-slate-300 font-mono">{p.gameUID}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded font-bold ${p.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded font-bold ${p.paymentStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}`}>
                            {p.paymentStatus}
                          </span>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleUpdateRegStatus(p._id, 'CONFIRMED', 'PAID')}
                            className="px-2.5 py-1 rounded bg-emerald-600 text-[#FAFAFA] font-bold hover:bg-emerald-500 transition-colors"
                          >
                            Confirm & Paid
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
