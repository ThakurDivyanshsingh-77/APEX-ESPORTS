'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ToastData, NotificationToastContainer } from '@/components/NotificationToast';
import { playNotificationSound } from '@/lib/notificationSound';
import { useAuth } from '@/context/AuthContext';
import { io, Socket } from 'socket.io-client';

interface ToastContextType {
  showToast: (toast: Omit<ToastData, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const { user } = useAuth();

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const newToast: ToastData = { ...toast, id };

    playNotificationSound();

    setToasts((prev) => [newToast, ...prev].slice(0, 4));

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      dismissToast(id);
    }, 6000);
  }, [dismissToast]);

  // Connect Socket.io client for real-time foreground notifications
  useEffect(() => {
    if (!user) return;

    const getSocketUrl = () => {
      if (process.env.NEXT_PUBLIC_SOCKET_URL) return process.env.NEXT_PUBLIC_SOCKET_URL;
      if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '');
      if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return 'https://apex-esports.onrender.com';
      }
      return 'http://localhost:5000';
    };

    const socketUrl = getSocketUrl();
    const socket: Socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      const userId = (user as any)._id || user.id;
      if (userId) {
        socket.emit('join_room', String(userId));
      }
    });

    socket.on('user_notification', (data: any) => {
      console.log('[Socket Notification Received]', data);
      showToast({
        title: data.title || 'APEX Notification',
        message: data.message || '',
        link: data.link || '/notifications',
        type: data.type || 'ANNOUNCEMENT',
      });
    });

    socket.on('new_notification', (data: any) => {
      if (data.userId === 'all' || !data.userId) {
        showToast({
          title: data.title || 'Announcement',
          message: data.message || '',
          link: data.link || '/notifications',
          type: data.type || 'ANNOUNCEMENT',
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, showToast]);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <NotificationToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
