'use client';

import { useEffect, useState, useCallback } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging, VAPID_KEY } from '@/lib/firebase';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { playNotificationSound } from '@/lib/notificationSound';

export interface FCMNotificationPayload {
  title: string;
  message: string;
  link?: string;
  type?: string;
  metadata?: any;
}

export function useFCM(onForegroundNotification?: (payload: FCMNotificationPayload) => void) {
  const { user } = useAuth();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  // Request Notification Permission and register Token
  const requestPermission = useCallback(async () => {
    if (!isSupported || typeof window === 'undefined') return null;

    setLoading(true);
    try {
      const currentPermission = await Notification.requestPermission();
      setPermission(currentPermission);

      if (currentPermission !== 'granted') {
        console.warn('[FCM Hook] Notification permission denied or dismissed.');
        setLoading(false);
        return null;
      }

      // Register Service Worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('[FCM Hook] Service Worker registered:', registration.scope);

      if (!messaging) {
        setLoading(false);
        return null;
      }

      // Get FCM Token
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (token) {
        setFcmToken(token);
        localStorage.setItem('apex_fcm_token', token);

        // Send token to backend if user is logged in
        if (user) {
          try {
            await api.post('/notifications/fcm-token', {
              token,
              deviceInfo: navigator.userAgent,
            });
            console.log('[FCM Hook] FCM Token saved to backend successfully.');
          } catch (err) {
            console.error('[FCM Hook] Failed to save token to backend:', err);
          }
        }
      }
      setLoading(false);
      return token;
    } catch (error) {
      console.error('[FCM Hook] Permission or token retrieval error:', error);
      setLoading(false);
      return null;
    }
  }, [isSupported, user]);

  // Sync token to backend when user logs in
  useEffect(() => {
    if (user && fcmToken) {
      api.post('/notifications/fcm-token', {
        token: fcmToken,
        deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser',
      }).catch((e) => console.warn('[FCM Hook] Auto token sync warning:', e.message));
    }
  }, [user, fcmToken]);

  // Auto request permission on mount if user is logged in and permission is default
  useEffect(() => {
    if (user && isSupported && Notification.permission === 'granted') {
      requestPermission();
    }
  }, [user, isSupported, requestPermission]);

  // Listen for foreground Firebase messages
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('[FCM Hook] Foreground FCM Message received:', payload);

      const title = payload.notification?.title || payload.data?.title || 'APEX ESPORTS Notification';
      const message = payload.notification?.body || payload.data?.message || '';
      const link = payload.data?.link || '/notifications';
      const type = payload.data?.type || 'ANNOUNCEMENT';

      playNotificationSound();

      if (onForegroundNotification) {
        onForegroundNotification({ title, message, link, type });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [onForegroundNotification]);

  // Unregister token on logout
  const removeTokenOnLogout = useCallback(async () => {
    const savedToken = fcmToken || (typeof window !== 'undefined' ? localStorage.getItem('apex_fcm_token') : null);
    if (savedToken) {
      try {
        await api.delete('/notifications/fcm-token', { data: { token: savedToken } });
        localStorage.removeItem('apex_fcm_token');
        setFcmToken(null);
      } catch (e) {
        console.warn('[FCM Hook] Remove token error:', e);
      }
    }
  }, [fcmToken]);

  return {
    fcmToken,
    permission,
    isSupported,
    loading,
    requestPermission,
    removeTokenOnLogout,
  };
}
