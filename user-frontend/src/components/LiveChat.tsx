'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, User, Sparkles } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';

interface ChatMessage {
  id: string;
  user: string;
  avatar?: string;
  message: string;
  time: string;
}

interface LiveChatProps {
  tournamentId: string;
  tournamentTitle: string;
  isRegistered?: boolean;
  tournamentStatus?: string;
  completedAt?: string | Date;
  updatedAt?: string | Date;
}

export default function LiveChat({
  tournamentId,
  tournamentTitle,
  isRegistered = false,
  tournamentStatus,
  completedAt,
  updatedAt,
}: LiveChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      user: 'System Admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      message: `Welcome to ${tournamentTitle} Live Lobby Chat! Keep conversation respectful.`,
      time: '12:00 PM',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isChatExpired, setIsChatExpired] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  // Check 5-minute post-completion expiry rule
  useEffect(() => {
    const checkExpiry = () => {
      if (tournamentStatus === 'COMPLETED') {
        const compTime = completedAt || updatedAt;
        if (compTime) {
          const elapsed = Date.now() - new Date(compTime).getTime();
          if (elapsed > 5 * 60 * 1000) {
            setIsChatExpired(true);
            return;
          }
        }
      }
      setIsChatExpired(false);
    };

    checkExpiry();
    const interval = setInterval(checkExpiry, 5000);
    return () => clearInterval(interval);
  }, [tournamentStatus, completedAt, updatedAt]);

  useEffect(() => {
    const s = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => {
      s.emit('join_room', tournamentId);
    });

    s.on('receive_message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [tournamentId]);

  // Scroll internal container only, preventing full-window scroll jumping
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const canChat = !!user && isRegistered && !isChatExpired;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canChat || !inputMessage.trim()) return;

    const msgPayload = {
      room: tournamentId,
      userId: user?._id || user?.id,
      user: user?.gameName || user?.name || 'Anonymous Gamer',
      avatar: user?.profileImage,
      message: inputMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    if (socket) {
      socket.emit('send_message', msgPayload);
    } else {
      // Local fallback
      setMessages((prev) => [
        ...prev,
        {
          id: 'local-' + Date.now(),
          user: msgPayload.user,
          avatar: msgPayload.avatar,
          message: msgPayload.message,
          time: msgPayload.time,
        },
      ]);
    }

    setInputMessage('');
  };

  const getPlaceholderText = () => {
    if (isChatExpired) return 'CHAT CLOSED (5 MINUTES POST MATCH COMPLETION)';
    if (!user) return 'LOGIN & REGISTER TO PARTICIPATE IN LOBBY CHAT';
    if (!isRegistered) return 'ONLY REGISTERED PARTICIPANTS CAN CHAT IN THIS LOBBY';
    return 'SEND A LOBBY CHAT MESSAGE...';
  };

  return (
    <div className="bg-[#0D1117]/80 border border-white/10 rounded-3xl p-6 relative overflow-hidden flex flex-col h-[480px] backdrop-blur-xl shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 bg-[#DFE104] text-black rounded-xl flex items-center justify-center font-bold shadow-md shadow-[#DFE104]/20">
            <MessageSquare className="h-4 w-4 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-tight text-[#FAFAFA]">LIVE MATCH CHAT</h3>
            <span className="text-xs text-[#DFE104] font-bold uppercase">ROOM CHANNEL • REAL-TIME</span>
          </div>
        </div>

        {isChatExpired ? (
          <div className="flex items-center space-x-2 text-xs text-red-400 font-bold uppercase bg-red-500/10 border border-red-500/30 px-3 py-1 rounded-full">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span>CHAT CLOSED (5M EXPIRED)</span>
          </div>
        ) : !isRegistered ? (
          <div className="flex items-center space-x-2 text-xs text-amber-400 font-bold uppercase bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>REGISTERED ONLY</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-xs text-[#DFE104] font-bold uppercase bg-[#DFE104]/10 border border-[#DFE104]/30 px-3 py-1 rounded-full">
            <span className="h-2 w-2 rounded-full bg-[#DFE104] animate-pulse" />
            <span>SOCKET CONNECTED</span>
          </div>
        )}
      </div>

      {/* Messages Feed */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10"
      >
        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start space-x-3 text-xs">
            <img
              src={msg.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
              alt={msg.user}
              className="h-8 w-8 rounded-full border border-white/15 object-cover shrink-0 mt-0.5"
            />
            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl max-w-[80%] backdrop-blur-md">
              <div className="flex items-center justify-between gap-4 mb-1">
                <span className="font-bold text-[#DFE104] uppercase">{msg.user}</span>
                <span className="text-[10px] text-[#94A3B8]">{msg.time}</span>
              </div>
              <p className="text-[#FAFAFA] leading-relaxed break-words font-medium">{msg.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Access Control Notice Banner if disabled */}
      {!canChat && (
        <div className="mt-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] font-bold uppercase text-amber-400 text-center tracking-wide">
          {isChatExpired
            ? 'Chat disabled: 5 minutes have passed since tournament completion.'
            : !user
            ? 'Please login and join tournament to participate in chat.'
            : 'Only registered participants of this tournament can send chat messages.'}
        </div>
      )}

      {/* Message Input Form */}
      <form onSubmit={handleSendMessage} className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={inputMessage}
          disabled={!canChat}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={getPlaceholderText()}
          className="flex-1 bg-white/5 border border-white/15 rounded-xl py-2.5 px-4 text-xs font-bold text-[#FAFAFA] placeholder-[#94A3B8]/60 focus:outline-none focus:border-[#DFE104] uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!canChat}
          className="p-3 bg-[#DFE104] text-black font-bold rounded-xl hover:scale-105 transition-all shadow-md shadow-[#DFE104]/25 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4 stroke-[2.5]" />
        </button>
      </form>
    </div>
  );
}


