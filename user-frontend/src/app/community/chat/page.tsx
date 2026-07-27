'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PacmanLoader from '@/components/PacmanLoader';
import {
  MessageSquare,
  Send,
  Image as ImageIcon,
  Smile,
  Users,
  Search,
  CheckCheck,
  Paperclip,
  X,
  Circle,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { io, Socket } from 'socket.io-client';

export default function DirectChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFriendId = searchParams.get('friend');

  const { user, loading: authLoading } = useAuth();
  const [friends, setFriends] = useState<any[]>([]);
  const [activeFriend, setActiveFriend] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch Friends List
  const fetchFriends = async () => {
    try {
      const res = await api.get('/community/friends');
      const acceptedList = (res.data.data?.accepted || []).map((item: any) => item.friend);
      setFriends(acceptedList);

      if (acceptedList.length > 0) {
        if (initialFriendId) {
          const target = acceptedList.find((f: any) => String(f._id) === String(initialFriendId));
          setActiveFriend(target || acceptedList[0]);
        } else {
          setActiveFriend(acceptedList[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load chat friends', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Messages for active friend
  const fetchMessages = async (friendId: string) => {
    try {
      const res = await api.get(`/community/chat/messages/${friendId}`);
      setMessages(res.data.data || []);
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetchFriends();
  }, []);

  useEffect(() => {
    if (activeFriend) {
      fetchMessages(activeFriend._id);
    }
  }, [activeFriend]);

  // Socket.io Connection Setup
  useEffect(() => {
    const s = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = s;

    if (user) {
      s.emit('user_online', user._id || user.id || user.email);
    }

    s.on('direct_message', (msg: any) => {
      const currentUserId = String(user?._id || user?.id || user?.email).toLowerCase();
      const currentUserEmail = user?.email ? String(user.email).toLowerCase() : '';
      const activeId = activeFriend ? String(activeFriend._id || activeFriend.id || activeFriend.email).toLowerCase() : '';
      const activeEmail = activeFriend?.email ? String(activeFriend.email).toLowerCase() : '';

      const isMe = (id: any) => {
        if (!id) return false;
        const str = String(id).toLowerCase();
        return str === currentUserId || (currentUserEmail && str === currentUserEmail);
      };

      const isTarget = (id: any) => {
        if (!id) return false;
        const str = String(id).toLowerCase();
        return str === activeId || (activeEmail && str === activeEmail);
      };

      if ((isMe(msg.sender) && isTarget(msg.recipient)) || (isTarget(msg.sender) && isMe(msg.recipient))) {
        setMessages((prev) => {
          if (prev.some((m) => String(m._id) === String(msg._id))) {
            return prev;
          }
          return [...prev, msg];
        });
      }
    });

    s.on('user_typing', (data: any) => {
      if (activeFriend && String(data.senderId).toLowerCase() === String(activeFriend._id || activeFriend.id || activeFriend.email).toLowerCase()) {
        setIsTyping(data.isTyping);
      }
    });

    return () => {
      s.disconnect();
    };
  }, [user, activeFriend]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !attachment) || !activeFriend) return;

    const formData = new FormData();
    formData.append('recipientId', activeFriend._id || activeFriend.id || activeFriend.email);
    formData.append('message', inputText);
    if (attachment) formData.append('attachment', attachment);

    try {
      const res = await api.post('/community/chat/send', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setInputText('');
      setAttachment(null);
      setAttachmentPreview('');
      if (res.data.data) {
        const newMsg = res.data.data;
        setMessages((prev) => {
          if (prev.some((m) => String(m._id) === String(newMsg._id))) return prev;
          return [...prev, newMsg];
        });
      }
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const addEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  if (loading) {
    return <PacmanLoader fullScreen text="INITIALIZING REAL-TIME CHAT..." />;
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-[#FAFAFA] flex flex-col selection:bg-[#DFE104] selection:text-black">
      <Navbar />

      <main className="max-w-7xl w-full mx-auto px-6 py-6 flex-1 flex flex-col md:flex-row gap-6 h-[calc(100vh-90px)]">
        {/* Friends Sidebar */}
        <div className="w-full md:w-80 bg-[#0D1117]/90 border border-white/10 rounded-3xl p-4 flex flex-col shadow-xl">
          <div className="pb-4 border-b border-white/10 mb-4">
            <h2 className="font-display font-bold uppercase text-[#FAFAFA] text-base flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#DFE104]" />
              <span>DIRECT MESSAGES</span>
            </h2>
            <span className="text-[10px] text-[#94A3B8] font-bold uppercase">ACCEPTED FRIENDS ONLY</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {friends.length === 0 ? (
              <div className="text-center py-10 text-xs text-[#94A3B8] font-bold uppercase">
                NO FRIENDS AVAILABLE FOR CHAT
              </div>
            ) : (
              friends.map((friend) => {
                const isActive = activeFriend && String(activeFriend._id || activeFriend.id) === String(friend._id || friend.id);

                return (
                  <button
                    key={friend._id || friend.id}
                    onClick={() => setActiveFriend(friend)}
                    className={`w-full p-3 rounded-2xl border transition-all flex items-center space-x-3 text-left ${
                      isActive
                        ? 'bg-[#DFE104] text-black border-[#DFE104] font-extrabold shadow-lg shadow-[#DFE104]/20'
                        : 'bg-white/5 border-white/5 hover:border-white/15 text-[#FAFAFA]'
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={friend.profileImage || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80'}
                        alt={friend.name}
                        className="h-10 w-10 rounded-xl object-cover"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-[#0D1117]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold uppercase block truncate">{friend.name}</span>
                      <span
                        className={`text-[10px] font-mono uppercase block truncate ${
                          isActive ? 'text-black/80 font-bold' : 'text-[#94A3B8]'
                        }`}
                      >
                        {friend.gameName || 'Gamer'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Window Area */}
        <div className="flex-1 bg-[#0D1117]/90 border border-white/10 rounded-3xl flex flex-col shadow-2xl overflow-hidden relative">
          {!activeFriend ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[#94A3B8]">
              <MessageSquare className="h-12 w-12 text-[#94A3B8]/30 mb-3" />
              <h3 className="text-lg font-bold uppercase text-white">SELECT A FRIEND TO START CHATTING</h3>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={activeFriend.profileImage || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80'}
                    alt={activeFriend.name}
                    className="h-10 w-10 rounded-xl object-cover border border-[#DFE104]"
                  />
                  <div>
                    <h3 className="font-heading font-extrabold text-sm uppercase text-white">
                      {activeFriend.name}
                    </h3>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase flex items-center gap-1">
                      <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
                      {isTyping ? 'TYPING...' : 'ONLINE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => {
                  const currentUserId = String(user?._id || user?.id || user?.email).toLowerCase();
                  const currentUserEmail = user?.email ? String(user.email).toLowerCase() : '';
                  const senderStr = String(msg.sender).toLowerCase();
                  const isMine = senderStr === currentUserId || (currentUserEmail && senderStr === currentUserEmail);

                  return (
                    <div
                      key={msg._id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-md p-4 rounded-2xl text-xs font-medium ${
                          isMine
                            ? 'bg-[#DFE104] text-black font-bold rounded-br-none shadow-md shadow-[#DFE104]/10'
                            : 'bg-white/10 text-white rounded-bl-none border border-white/10'
                        }`}
                      >
                        {msg.attachment && (
                          <img
                            src={msg.attachment}
                            alt="Attachment"
                            className="max-h-48 w-full object-cover rounded-xl mb-2"
                          />
                        )}
                        {msg.message && <p>{msg.message}</p>}
                      </div>
                      <span className="text-[9px] font-mono text-[#94A3B8] mt-1 px-1">
                        {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-white/5 space-y-3">
                {attachmentPreview && (
                  <div className="flex items-center gap-2 p-2 bg-white/5 border border-white/10 rounded-xl w-fit">
                    <img src={attachmentPreview} alt="Preview" className="h-10 w-10 object-cover rounded-lg" />
                    <span className="text-[10px] text-white font-mono truncate max-w-[150px]">{attachment?.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachment(null);
                        setAttachmentPreview('');
                      }}
                      className="p-1 hover:text-red-400 text-white/60"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Emoji & Attachment Quick Toolbar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-base">
                    {['🔥', '👑', '🎯', '💀', '🏆', '⚡'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => addEmoji(emoji)}
                        className="p-1 hover:scale-125 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-white/10 rounded-xl text-[#94A3B8] hover:text-[#DFE104] transition-colors flex items-center gap-1.5 text-xs font-bold uppercase"
                    title="Attach Photo"
                  >
                    <Paperclip className="h-4 w-4 stroke-[2]" />
                    <span>PHOTO</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setAttachment(file);
                        setAttachmentPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="TYPE YOUR MESSAGE..."
                    className="flex-1 bg-white/5 border border-white/15 rounded-xl py-3 px-4 text-xs font-bold text-white focus:outline-none focus:border-[#DFE104]"
                  />
                  <button
                    type="submit"
                    className="px-5 py-3 bg-[#DFE104] text-black rounded-xl text-xs font-extrabold uppercase hover:bg-white transition-all shadow-md shadow-[#DFE104]/20 flex items-center gap-2"
                  >
                    <span>SEND</span>
                    <Send className="h-4 w-4 stroke-[2.5]" />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
