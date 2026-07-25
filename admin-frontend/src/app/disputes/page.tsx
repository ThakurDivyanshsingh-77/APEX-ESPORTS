'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { io } from 'socket.io-client';
import {
  ShieldAlert,
  Search,
  MessageSquare,
  CheckCircle,
  XCircle,
  Loader2,
  X,
  Send,
  HelpCircle,
  Filter,
  User,
  Clock,
  Check,
  Paperclip,
  Image as ImageIcon,
  MessageSquare as MsgIcon,
  ShieldAlert as ShieldIcon,
  Send as SendIcon,
  Loader2 as SpinnerIcon,
  X as CloseIcon,
  HelpCircle as HelpIcon,
  CheckCircle as CheckIcon,
} from 'lucide-react';
import api from '@/lib/api';

export interface AdminTicket {
  _id: string;
  ticketNumber: string;
  user: any;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  subject: string;
  description: string;
  attachment?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  messages: any[];
  createdAt: string;
}

export default function AdminDisputesPage() {
  const [activeTab, setActiveTab] = useState<'TICKETS' | 'MATCH_DISPUTES'>('TICKETS');
  
  // Support Tickets state
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Selected ticket chat modal
  const [selectedTicket, setSelectedTicket] = useState<AdminTicket | null>(null);
  const [adminMsg, setAdminMsg] = useState('');
  const [adminFile, setAdminFile] = useState<File | null>(null);
  const [adminFilePreview, setAdminFilePreview] = useState<string>('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  // Match disputes state
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loadingDisputes, setLoadingDisputes] = useState(true);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);

  const fetchTickets = async () => {
    try {
      const res = await api.get('/tickets/all');
      setTickets(res.data.data);
      if (selectedTicket) {
        const updated = res.data.data.find((t: AdminTicket) => t._id === selectedTicket._id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (err) {
      console.error('Failed to fetch tickets', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const fetchDisputes = async () => {
    try {
      const res = await api.get('/admin/disputes');
      setDisputes(res.data.data);
    } catch (err) {
      console.error('Failed to fetch disputes', err);
    } finally {
      setLoadingDisputes(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchDisputes();
    const interval = setInterval(fetchTickets, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const s = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });

    s.on('ticket_message_sent', (data: any) => {
      const { ticketId, newMsg } = data;
      if (selectedTicket && (selectedTicket._id === ticketId || selectedTicket.ticketNumber === ticketId)) {
        setSelectedTicket((prev) => {
          if (!prev) return null;
          const exists = prev.messages?.some((m: any) => m._id === newMsg._id);
          if (exists) return prev;
          return { ...prev, messages: [...(prev.messages || []), newMsg] };
        });
      }
      fetchTickets();
    });

    return () => {
      s.disconnect();
    };
  }, [selectedTicket]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.messages]);

  const handleAdminFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit');
      return;
    }
    setAdminFile(file);
    setAdminFilePreview(URL.createObjectURL(file));
  };

  const handleRemoveAdminFile = () => {
    setAdminFile(null);
    if (adminFilePreview) URL.revokeObjectURL(adminFilePreview);
    setAdminFilePreview('');
  };

  const handleSendAdminMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || (!adminMsg.trim() && !adminFile)) return;

    setSendingMsg(true);
    try {
      if (adminFile) {
        const formData = new FormData();
        formData.append('file', adminFile);
        formData.append('message', adminMsg.trim());

        await api.post(`/tickets/${selectedTicket._id}/messages`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post(`/tickets/${selectedTicket._id}/messages`, {
          message: adminMsg,
        });
      }

      setAdminMsg('');
      handleRemoveAdminFile();
      fetchTickets();
    } catch (err) {
      alert('Failed to send admin message');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      await api.patch(`/tickets/${ticketId}/status`, { status: newStatus });
      fetchTickets();
    } catch (err) {
      alert('Failed to update ticket status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter === 'ALL') return true;
    return t.status === statusFilter;
  });

  return (
    <div className="min-h-screen bg-[#090D16] text-[#FAFAFA] flex selection:bg-[#DFE104] selection:text-black">
      <AdminSidebar />

      <main className="flex-1 p-8 space-y-8 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <div className="h-10 w-10 bg-[#DFE104] rounded-xl flex items-center justify-center font-bold text-black shadow-md">
                <HelpIcon className="h-5 w-5 stroke-[2]" />
              </div>
              <h1 className="text-3xl font-display font-bold uppercase tracking-tight text-[#FAFAFA]">
                HELPDESK & DISPUTES CONTROL
              </h1>
            </div>
            <p className="text-xs text-[#94A3B8] font-bold uppercase">
              Manage user support tickets, respond to live chats, and resolve match disputes.
            </p>
          </div>

          {/* Navigation Mode Tabs */}
          <div className="flex items-center space-x-2 bg-white/5 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab('TICKETS')}
              className={`px-5 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                activeTab === 'TICKETS'
                  ? 'bg-[#DFE104] text-black shadow-md'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              SUPPORT TICKETS ({tickets.length})
            </button>
            <button
              onClick={() => setActiveTab('MATCH_DISPUTES')}
              className={`px-5 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                activeTab === 'MATCH_DISPUTES'
                  ? 'bg-[#DFE104] text-black shadow-md'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              MATCH DISPUTES ({disputes.length})
            </button>
          </div>
        </div>

        {activeTab === 'TICKETS' ? (
          <div className="space-y-6">
            {/* Status Filter Tabs */}
            <div className="flex items-center space-x-3 overflow-x-auto">
              {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase border transition-all ${
                    statusFilter === st
                      ? 'bg-[#DFE104] text-black border-[#DFE104] shadow-md'
                      : 'bg-white/5 border-white/10 text-[#94A3B8] hover:text-white'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Tickets Grid */}
            {loadingTickets ? (
              <div className="py-20 text-center text-[#DFE104]">
                <SpinnerIcon className="h-8 w-8 animate-spin mx-auto mb-2 stroke-[2]" />
                <span className="text-xs font-bold uppercase">Loading support tickets...</span>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="bg-[#0D1117]/80 border border-white/10 rounded-3xl p-12 text-center text-[#94A3B8]">
                <HelpIcon className="h-12 w-12 text-[#94A3B8]/40 mx-auto mb-3 stroke-[2]" />
                <h3 className="text-lg font-bold text-[#FAFAFA] uppercase mb-1">NO TICKETS FOUND</h3>
                <p className="text-xs uppercase font-semibold">There are no user support tickets under this status filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTickets.map((t) => (
                  <div
                    key={t._id}
                    className="bg-[#0D1117]/80 border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-[#DFE104]/50 transition-all group"
                  >
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-white/5 text-[#94A3B8] border border-white/10 font-mono">
                          #{t.ticketNumber}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                            t.status === 'RESOLVED'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              : t.status === 'IN_PROGRESS'
                              ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                              : 'bg-[#DFE104]/20 text-[#DFE104] border-[#DFE104]/40'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>

                      <div>
                        <div className="text-[10px] text-[#DFE104] font-bold uppercase tracking-wider mb-1">
                          CAT: {t.category} • PRIORITY: {t.priority}
                        </div>
                        <h3 className="text-lg font-display font-bold uppercase text-[#FAFAFA] tracking-tight group-hover:text-[#DFE104] transition-colors">
                          {t.subject}
                        </h3>
                      </div>

                      <div className="text-xs text-[#94A3B8] font-medium">
                        <strong>User:</strong> {t.user?.name || 'Player'} ({t.user?.email || 'N/A'})
                      </div>

                      <p className="text-xs text-[#94A3B8]/80 font-medium line-clamp-2 leading-relaxed">
                        {t.description}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedTicket(t)}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#DFE104] text-black hover:bg-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                      <MsgIcon className="h-4 w-4 stroke-[2]" />
                      <span>LIVE ADMIN CHAT ({t.messages?.length || 0})</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Match Disputes Table */
          <div className="bg-[#0D1117]/80 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
            <h2 className="text-xl font-display font-bold uppercase text-[#FAFAFA] flex items-center gap-2">
              <ShieldIcon className="h-5 w-5 text-[#DFE104] stroke-[2]" />
              <span>TOURNAMENT MATCH DISPUTES</span>
            </h2>

            {loadingDisputes ? (
              <div className="py-12 text-center text-[#DFE104]">
                <SpinnerIcon className="h-6 w-6 animate-spin mx-auto mb-2 stroke-[2]" />
                <span className="text-xs font-bold uppercase">Loading match disputes...</span>
              </div>
            ) : disputes.length === 0 ? (
              <div className="py-12 text-center text-[#94A3B8]">
                <p className="text-xs uppercase font-bold">No active match disputes reported.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-medium text-[#FAFAFA]">
                  <thead className="bg-white/5 uppercase text-[#94A3B8] text-[10px] font-bold tracking-wider border-b border-white/10">
                    <tr>
                      <th className="py-3 px-4">Match / Tournament</th>
                      <th className="py-3 px-4">Raised By</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {disputes.map((d) => (
                      <tr key={d._id} className="hover:bg-white/5">
                        <td className="py-3 px-4 font-bold">{d.tournamentName || d.matchId}</td>
                        <td className="py-3 px-4">{d.raisedBy}</td>
                        <td className="py-3 px-4">{d.reason}</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[#DFE104]/20 text-[#DFE104]">
                            {d.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 space-x-2">
                          <button
                            onClick={() => api.patch(`/admin/disputes/${d._id}`, { status: 'RESOLVED' })}
                            className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold uppercase text-[10px]"
                          >
                            Resolve
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Admin Live Chat & Resolver Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0D1117] border border-white/15 rounded-3xl w-full max-w-2xl h-[80vh] p-6 relative shadow-2xl flex flex-col justify-between text-[#FAFAFA]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#DFE104] text-black font-extrabold text-[10px] uppercase">
                    TICKET #{selectedTicket.ticketNumber}
                  </span>
                  <span className="text-xs text-[#94A3B8] font-bold uppercase">
                    PRIORITY: {selectedTicket.priority}
                  </span>
                </div>
                <h3 className="text-lg font-display font-bold uppercase tracking-tight text-[#FAFAFA] mt-1">
                  {selectedTicket.subject}
                </h3>
              </div>

              <div className="flex items-center space-x-3">
                {/* Admin Status Selector */}
                <select
                  value={selectedTicket.status}
                  disabled={updatingStatus}
                  onChange={(e) => handleUpdateTicketStatus(selectedTicket._id, e.target.value)}
                  className="bg-white/5 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-[#DFE104] font-bold uppercase focus:outline-none"
                >
                  <option value="OPEN" className="bg-slate-900">Status: OPEN</option>
                  <option value="IN_PROGRESS" className="bg-slate-900">Status: IN PROGRESS ⏳</option>
                  <option value="RESOLVED" className="bg-slate-900">Status: RESOLVED ✅</option>
                  <option value="CLOSED" className="bg-slate-900">Status: CLOSED 🔒</option>
                </select>

                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-[#DFE104] hover:text-black transition-colors"
                >
                  <CloseIcon className="h-5 w-5 stroke-[2]" />
                </button>
              </div>
            </div>

            {/* Chat Stream */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-[#94A3B8] space-y-1">
                <span className="font-bold text-[#DFE104] uppercase block">ORIGINAL ISSUE DETAILS:</span>
                <p className="text-white text-xs">{selectedTicket.description}</p>
                {selectedTicket.attachment && (
                  <a
                    href={selectedTicket.attachment}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-2 text-[#DFE104] underline text-[10px]"
                  >
                    View User Attachment Screenshot →
                  </a>
                )}
              </div>

              {selectedTicket.messages?.map((msg, idx) => {
                const isAdmin = msg.senderRole === 'ADMIN' || msg.senderRole === 'ORGANIZER';

                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase ${isAdmin ? 'text-[#DFE104]' : 'text-blue-400'}`}>
                        {msg.senderName} {isAdmin && ' (ADMIN SUPPORT)'}
                      </span>
                      <span className="text-[9px] text-[#94A3B8]/60">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div
                      className={`p-4 rounded-2xl max-w-[80%] text-xs font-medium leading-relaxed ${
                        isAdmin
                          ? 'bg-[#DFE104] text-black font-semibold rounded-tr-none shadow-md'
                          : 'bg-white/10 border border-white/15 text-white rounded-tl-none'
                      }`}
                    >
                      <p>{msg.message}</p>
                      {msg.attachment && (
                        <div className="mt-2">
                          <a href={msg.attachment} target="_blank" rel="noreferrer">
                            <img
                              src={msg.attachment}
                              alt="Attachment Screenshot"
                              className="max-h-48 rounded-xl object-cover border border-black/20 hover:opacity-90 transition-opacity"
                            />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* File Preview Chip if Attached */}
            {adminFilePreview && (
              <div className="mb-2 p-2 rounded-xl bg-white/5 border border-[#DFE104]/50 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <img
                    src={adminFilePreview}
                    alt="File Preview"
                    className="h-10 w-10 rounded-lg object-cover border border-white/20"
                  />
                  <span className="text-xs font-bold text-white truncate max-w-[200px]">
                    {adminFile?.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveAdminFile}
                  className="p-1 rounded-lg text-red-400 hover:bg-red-500/20"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Admin Reply Form */}
            <form onSubmit={handleSendAdminMessage} className="pt-4 border-t border-white/10 flex items-center gap-2">
              <label className="p-3 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 text-white cursor-pointer transition-colors" title="Attach Screenshot / Photo">
                <Paperclip className="h-4 w-4 text-[#DFE104]" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAdminFileSelect}
                  className="hidden"
                />
              </label>

              <input
                type="text"
                value={adminMsg}
                onChange={(e) => setAdminMsg(e.target.value)}
                placeholder="Type official admin reply to user..."
                className="flex-1 bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-xs text-white font-medium focus:outline-none focus:border-[#DFE104]"
              />
              <button
                type="submit"
                disabled={sendingMsg || (!adminMsg.trim() && !adminFile)}
                className="kt-btn-primary text-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {sendingMsg ? <SpinnerIcon className="h-4 w-4 animate-spin stroke-[2]" /> : <SendIcon className="h-4 w-4 stroke-[2]" />}
                <span>REPLY TO USER</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
