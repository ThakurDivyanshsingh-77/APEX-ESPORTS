'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { io } from 'socket.io-client';
import {
  HelpCircle,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Loader2,
  X,
  FileText,
  Shield,
  CreditCard,
  Key,
  User,
  Upload,
  Paperclip,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface TicketMessage {
  _id?: string;
  sender: string;
  senderRole: 'USER' | 'ADMIN' | 'ORGANIZER';
  senderName: string;
  message: string;
  attachment?: string;
  timestamp: string;
}

export interface Ticket {
  _id: string;
  ticketNumber: string;
  category: 'PAYMENT' | 'ROOM_CREDENTIALS' | 'REGISTRATION' | 'ACCOUNT' | 'DISPUTE' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  subject: string;
  description: string;
  attachment?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  messages: TicketMessage[];
  createdAt: string;
}

export default function SupportPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');

  // Raise Ticket Modal State
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [category, setCategory] = useState<Ticket['category']>('PAYMENT');
  const [priority, setPriority] = useState<Ticket['priority']>('HIGH');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  const [useUrlInput, setUseUrlInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Chat Drawer State
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatFile, setChatFile] = useState<File | null>(null);
  const [chatFilePreview, setChatFilePreview] = useState<string>('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const userChatEndRef = React.useRef<HTMLDivElement>(null);

  const fetchMyTickets = async () => {
    if (!user) return;
    try {
      const res = await api.get('/tickets/my-tickets');
      setTickets(res.data.data);
      // Auto-update selectedTicket if open
      if (selectedTicket) {
        const updated = res.data.data.find((t: Ticket) => t._id === selectedTicket._id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (err) {
      console.error('Failed to fetch support tickets', err);
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
    fetchMyTickets();
    const interval = setInterval(fetchMyTickets, 6000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const s = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });

    s.on('ticket_message_sent', (data: any) => {
      const { ticketId, newMsg } = data;
      if (selectedTicket && (selectedTicket._id === ticketId || selectedTicket.ticketNumber === ticketId)) {
        setSelectedTicket((prev) => {
          if (!prev) return null;
          const exists = prev.messages?.some((m) => m._id === newMsg._id);
          if (exists) return prev;
          return { ...prev, messages: [...(prev.messages || []), newMsg] };
        });
      }
      fetchMyTickets();
    });

    return () => {
      s.disconnect();
    };
  }, [selectedTicket]);

  useEffect(() => {
    userChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit');
      return;
    }
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setFilePreview(objectUrl);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview('');
  };

  const handleChatFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit');
      return;
    }
    setChatFile(file);
    setChatFilePreview(URL.createObjectURL(file));
  };

  const handleRemoveChatFile = () => {
    setChatFile(null);
    if (chatFilePreview) URL.revokeObjectURL(chatFilePreview);
    setChatFilePreview('');
  };

  const handleRaiseTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('category', category);
        formData.append('priority', priority);
        formData.append('subject', subject.trim());
        formData.append('description', description.trim());

        await api.post('/tickets', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/tickets', {
          category,
          priority,
          subject,
          description,
          attachment,
        });
      }

      setIsRaiseModalOpen(false);
      setSubject('');
      setDescription('');
      setAttachment('');
      handleRemoveFile();
      fetchMyTickets();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to raise support ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || (!chatMessage.trim() && !chatFile)) return;

    setSendingMsg(true);
    try {
      if (chatFile) {
        const formData = new FormData();
        formData.append('file', chatFile);
        formData.append('message', chatMessage.trim());

        await api.post(`/tickets/${selectedTicket._id}/messages`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post(`/tickets/${selectedTicket._id}/messages`, {
          message: chatMessage,
        });
      }

      setChatMessage('');
      handleRemoveChatFile();
      fetchMyTickets();
    } catch (err: any) {
      alert('Failed to send message');
    } finally {
      setSendingMsg(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (activeTab === 'ALL') return true;
    return t.status === activeTab;
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-[#090D16] text-[#FAFAFA] flex flex-col justify-center items-center px-4">
        <HelpCircle className="h-12 w-12 text-[#DFE104] mb-4 stroke-[2]" />
        <h2 className="text-2xl font-display font-bold uppercase mb-2">SIGN IN TO ACCESS HELPDESK</h2>
        <p className="text-[#94A3B8] text-xs font-bold uppercase mb-6">PLEASE SIGN IN TO RAISE SUPPORT TICKETS AND CHAT LIVE WITH ADMINS.</p>
        <Link href="/login" className="kt-btn-primary text-xs">
          SIGN IN NOW
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-[#FAFAFA] pb-20 selection:bg-[#DFE104] selection:text-black">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        {/* Top Banner Header */}
        <div className="bg-[#0D1117]/80 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-2xl bg-[#DFE104] text-black flex items-center justify-center font-bold shadow-lg shadow-[#DFE104]/20">
                <HelpCircle className="h-6 w-6 stroke-[2]" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold uppercase tracking-tight text-[#FAFAFA]">
                  SUPPORT & LIVE ADMIN HELPDESK
                </h1>
                <p className="text-xs text-[#94A3B8] font-bold uppercase">
                  Raise tickets for payments, room credentials, disputes & chat live with Admin support.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsRaiseModalOpen(true)}
            className="kt-btn-primary text-xs flex items-center gap-2 shadow-lg shadow-[#DFE104]/20 self-start md:self-auto"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>RAISE NEW SUPPORT TICKET</span>
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center space-x-3 overflow-x-auto pb-2">
          {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? 'bg-[#DFE104] text-black shadow-md shadow-[#DFE104]/20'
                  : 'bg-white/5 border border-white/10 text-[#94A3B8] hover:text-[#FAFAFA]'
              }`}
            >
              {tab.replace('_', ' ')} TICKETS
            </button>
          ))}
        </div>

        {/* Tickets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-16 text-center text-[#DFE104]">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 stroke-[2]" />
              <span className="text-xs font-bold uppercase">Loading support tickets...</span>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="col-span-full bg-[#0D1117]/80 border border-white/10 rounded-3xl p-12 text-center text-[#94A3B8]">
              <MessageSquare className="h-12 w-12 text-[#94A3B8]/40 mx-auto mb-3 stroke-[2]" />
              <h3 className="text-lg font-bold text-[#FAFAFA] uppercase mb-1">NO SUPPORT TICKETS FOUND</h3>
              <p className="text-xs uppercase font-semibold mb-6">Have an issue with payments, credentials, or matches? Raise a support ticket to get help.</p>
              <button
                onClick={() => setIsRaiseModalOpen(true)}
                className="kt-btn-primary text-xs"
              >
                RAISE SUPPORT TICKET
              </button>
            </div>
          ) : (
            filteredTickets.map((t) => {
              const lastMsg = t.messages?.[t.messages.length - 1];

              return (
                <div
                  key={t._id}
                  className="bg-[#0D1117]/80 border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-[#DFE104]/50 transition-all group"
                >
                  <div className="space-y-4 mb-6">
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
                      <span className="text-[10px] text-[#DFE104] font-bold uppercase tracking-wider block mb-1">
                        CATEGORY: {t.category} • PRIORITY: {t.priority}
                      </span>
                      <h3 className="text-lg font-display font-bold uppercase text-[#FAFAFA] tracking-tight group-hover:text-[#DFE104] transition-colors">
                        {t.subject}
                      </h3>
                    </div>

                    <p className="text-xs text-[#94A3B8] font-medium line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/10 space-y-3">
                    {lastMsg && (
                      <div className="text-[11px] text-[#94A3B8] flex items-center justify-between">
                        <span className="truncate">
                          <strong>{lastMsg.senderName}:</strong> {lastMsg.message}
                        </span>
                        <span className="shrink-0 text-[9px] text-[#94A3B8]/60 ml-2">
                          {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}

                    <button
                      onClick={() => setSelectedTicket(t)}
                      className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-[#DFE104] hover:text-black border border-white/10 text-[#FAFAFA] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                      <MessageSquare className="h-4 w-4 stroke-[2]" />
                      <span>LIVE ADMIN CHAT ({t.messages?.length || 0})</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Raise Support Ticket Modal */}
      {isRaiseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0D1117] border border-white/15 rounded-3xl w-full max-w-lg p-8 relative max-h-[90vh] overflow-y-auto text-[#FAFAFA] shadow-2xl">
            <button
              onClick={() => setIsRaiseModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-[#DFE104] hover:text-black transition-colors"
            >
              <X className="h-5 w-5 stroke-[2]" />
            </button>

            <div className="flex items-center space-x-4 mb-6 border-b border-white/10 pb-4">
              <div className="h-12 w-12 bg-[#DFE104] text-black rounded-2xl flex items-center justify-center font-bold shadow-md">
                <HelpCircle className="h-6 w-6 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-2xl font-display font-bold uppercase tracking-tight text-[#FAFAFA]">RAISE SUPPORT TICKET</h3>
                <p className="text-xs text-[#DFE104] font-bold uppercase">Direct help from Esports Admin Support</p>
              </div>
            </div>

            <form onSubmit={handleRaiseTicket} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#94A3B8] mb-1">Issue Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-white/5 border border-white/15 rounded-xl p-3 text-xs text-white font-bold uppercase focus:outline-none focus:border-[#DFE104]"
                  >
                    <option value="PAYMENT" className="bg-slate-900">Payment / UTR Issue</option>
                    <option value="ROOM_CREDENTIALS" className="bg-slate-900">Room ID & Password</option>
                    <option value="REGISTRATION" className="bg-slate-900">Tournament Slot Registration</option>
                    <option value="ACCOUNT" className="bg-slate-900">Account / Ban Inquiry</option>
                    <option value="DISPUTE" className="bg-slate-900">Match Result Dispute</option>
                    <option value="OTHER" className="bg-slate-900">General Support</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#94A3B8] mb-1">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-white/5 border border-white/15 rounded-xl p-3 text-xs text-white font-bold uppercase focus:outline-none focus:border-[#DFE104]"
                  >
                    <option value="LOW" className="bg-slate-900">Low</option>
                    <option value="MEDIUM" className="bg-slate-900">Medium</option>
                    <option value="HIGH" className="bg-slate-900">High Priority</option>
                    <option value="URGENT" className="bg-slate-900">Urgent 🔥</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#94A3B8] mb-1">Subject / Summary</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. UTR payment verified but slot still pending"
                  className="w-full bg-white/5 border border-white/15 rounded-xl p-3 text-xs text-white font-bold focus:outline-none focus:border-[#DFE104]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#94A3B8] mb-1">Detailed Description</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your issue with transaction IDs, match names, or character UIDs..."
                  className="w-full bg-white/5 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#DFE104]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase text-[#94A3B8]">
                    Attachment / Screenshot Proof (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseUrlInput(!useUrlInput)}
                    className="text-[10px] font-bold text-[#DFE104] hover:underline uppercase"
                  >
                    {useUrlInput ? '📁 Upload Screenshot File' : '🔗 Paste Image URL'}
                  </button>
                </div>

                {useUrlInput ? (
                  <input
                    type="text"
                    value={attachment}
                    onChange={(e) => setAttachment(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-white/5 border border-white/15 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-[#DFE104]"
                  />
                ) : (
                  <div>
                    {filePreview ? (
                      <div className="p-3 rounded-2xl bg-white/5 border border-[#DFE104]/50 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <img
                            src={filePreview}
                            alt="Screenshot Preview"
                            className="h-14 w-14 rounded-xl object-cover border border-white/20"
                          />
                          <div>
                            <span className="text-xs font-bold text-white block truncate max-w-[200px]">
                              {selectedFile?.name}
                            </span>
                            <span className="text-[10px] font-mono text-[#DFE104] font-bold">
                              {((selectedFile?.size || 0) / 1024).toFixed(1)} KB • READY TO UPLOAD
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                          title="Remove file"
                        >
                          <X className="h-4 w-4 stroke-[2]" />
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-white/20 hover:border-[#DFE104] bg-white/5 hover:bg-white/10 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all group">
                        <Upload className="h-6 w-6 text-[#DFE104] mb-1 group-hover:scale-110 transition-transform stroke-[2]" />
                        <span className="text-xs font-bold uppercase text-white tracking-tight">
                          CLICK OR DRAG SCREENSHOT HERE
                        </span>
                        <span className="text-[10px] text-[#94A3B8] font-mono mt-0.5">
                          PNG, JPG, WEBP (MAX 5MB)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsRaiseModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-white/5 text-[#94A3B8] font-bold text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="kt-btn-primary text-xs flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin stroke-[2]" /> : <Send className="h-4 w-4 stroke-[2]" />}
                  <span>SUBMIT SUPPORT TICKET</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Admin Chat Drawer Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0D1117] border border-white/15 rounded-3xl w-full max-w-2xl h-[80vh] p-6 relative shadow-2xl flex flex-col justify-between text-[#FAFAFA]">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-[#DFE104] text-black rounded-2xl flex items-center justify-center font-bold shadow-md">
                  <MessageSquare className="h-5 w-5 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold uppercase tracking-tight text-[#FAFAFA]">
                    #{selectedTicket.ticketNumber} — {selectedTicket.subject}
                  </h3>
                  <p className="text-[10px] text-[#DFE104] font-bold uppercase">
                    STATUS: {selectedTicket.status} • CATEGORY: {selectedTicket.category}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-[#DFE104] hover:text-black transition-colors"
              >
                <X className="h-5 w-5 stroke-[2]" />
              </button>
            </div>

            {/* Chat Stream */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-[#94A3B8] space-y-1">
                <span className="font-bold text-[#DFE104] uppercase block">TICKET CREATED BY USER</span>
                <p className="text-white text-xs">{selectedTicket.description}</p>
                {selectedTicket.attachment && (
                  <a
                    href={selectedTicket.attachment}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-2 text-[#DFE104] underline text-[10px]"
                  >
                    View Attached Proof Screenshot →
                  </a>
                )}
              </div>

              {selectedTicket.messages?.map((msg, idx) => {
                const isAdmin = msg.senderRole === 'ADMIN' || msg.senderRole === 'ORGANIZER';

                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase ${isAdmin ? 'text-[#DFE104]' : 'text-blue-400'}`}>
                        {msg.senderName} {isAdmin && ' (OFFICIAL ADMIN)'}
                      </span>
                      <span className="text-[9px] text-[#94A3B8]/60">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div
                      className={`p-4 rounded-2xl max-w-[80%] text-xs font-medium leading-relaxed ${
                        isAdmin
                          ? 'bg-[#DFE104]/15 border border-[#DFE104]/40 text-[#FAFAFA] rounded-tl-none'
                          : 'bg-blue-600 text-white rounded-tr-none'
                      }`}
                    >
                      <p>{msg.message}</p>
                      {msg.attachment && (
                        <div className="mt-2">
                          <a href={msg.attachment} target="_blank" rel="noreferrer">
                            <img
                              src={msg.attachment}
                              alt="Attachment Screenshot"
                              className="max-h-48 rounded-xl object-cover border border-white/20 hover:opacity-90 transition-opacity"
                            />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={userChatEndRef} />
            </div>

            {/* Chat File Preview Chip */}
            {chatFilePreview && (
              <div className="mb-2 p-2 rounded-xl bg-white/5 border border-[#DFE104]/50 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <img
                    src={chatFilePreview}
                    alt="File Preview"
                    className="h-10 w-10 rounded-lg object-cover border border-white/20"
                  />
                  <span className="text-xs font-bold text-white truncate max-w-[200px]">
                    {chatFile?.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveChatFile}
                  className="p-1 rounded-lg text-red-400 hover:bg-red-500/20"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="pt-4 border-t border-white/10 flex items-center gap-2">
              <label className="p-3 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 text-white cursor-pointer transition-colors" title="Attach Screenshot / Photo">
                <Paperclip className="h-4 w-4 text-[#DFE104]" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleChatFileSelect}
                  className="hidden"
                />
              </label>

              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type your message to Admin support..."
                className="flex-1 bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-xs text-white font-medium focus:outline-none focus:border-[#DFE104]"
              />
              <button
                type="submit"
                disabled={sendingMsg || (!chatMessage.trim() && !chatFile)}
                className="kt-btn-primary text-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {sendingMsg ? <Loader2 className="h-4 w-4 animate-spin stroke-[2]" /> : <Send className="h-4 w-4 stroke-[2]" />}
                <span>SEND</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
