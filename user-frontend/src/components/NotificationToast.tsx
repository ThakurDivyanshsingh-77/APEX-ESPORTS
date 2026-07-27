'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  Zap,
  Key,
  DollarSign,
  UserPlus,
  MessageSquare,
  Bell,
  ShieldAlert,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export interface ToastData {
  id: string;
  title: string;
  message: string;
  link?: string;
  type?: string;
}

interface NotificationToastProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export const getNotificationIcon = (type?: string) => {
  switch (type) {
    case 'TOURNAMENT_CREATED':
    case 'TOURNAMENT_UPDATED':
    case 'TOURNAMENT_CANCELLED':
    case 'MATCH_REMINDER':
      return <Trophy className="h-5 w-5 text-[#DFE104]" />;
    case 'ROOM_RELEASED':
      return <Key className="h-5 w-5 text-amber-400" />;
    case 'PRIZE_CREDITED':
    case 'WALLET_UPDATED':
    case 'DEPOSIT_APPROVED':
    case 'WITHDRAW_APPROVED':
    case 'PAYMENT_APPROVED':
      return <DollarSign className="h-5 w-5 text-emerald-400" />;
    case 'FRIEND_REQUEST':
    case 'FRIEND_REQUEST_ACCEPTED':
      return <UserPlus className="h-5 w-5 text-blue-400" />;
    case 'NEW_MESSAGE':
    case 'SUPPORT_REPLY':
      return <MessageSquare className="h-5 w-5 text-purple-400" />;
    case 'SECURITY_ALERT':
      return <ShieldAlert className="h-5 w-5 text-red-400" />;
    default:
      return <Sparkles className="h-5 w-5 text-[#DFE104]" />;
  }
};

export const NotificationToastContainer: React.FC<NotificationToastProps> = ({ toasts, onDismiss }) => {
  const router = useRouter();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col space-y-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, x: 100 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="pointer-events-auto bg-[#0D1117]/95 border border-[#DFE104]/40 backdrop-blur-2xl text-white rounded-2xl p-4 shadow-[0_10px_35px_rgba(0,0,0,0.8)] relative overflow-hidden group cursor-pointer"
            onClick={() => {
              if (toast.link) {
                router.push(toast.link);
                onDismiss(toast.id);
              }
            }}
          >
            {/* Top Accent Neon Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#DFE104] via-emerald-400 to-[#DFE104]" />

            <div className="flex items-start space-x-3">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 shrink-0 shadow-inner">
                {getNotificationIcon(toast.type)}
              </div>

              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#DFE104] animate-ping" />
                  <h4 className="text-xs font-display font-extrabold uppercase text-white truncate tracking-wide">
                    {toast.title}
                  </h4>
                </div>
                <p className="text-[11px] text-[#94A3B8] font-medium leading-snug mt-1 line-clamp-2">
                  {toast.message}
                </p>

                {toast.link && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#DFE104] uppercase mt-2 group-hover:underline">
                    <span>VIEW DETAILS</span>
                    <ArrowRight className="h-3 w-3" />
                  </span>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(toast.id);
                }}
                className="text-[#94A3B8] hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
