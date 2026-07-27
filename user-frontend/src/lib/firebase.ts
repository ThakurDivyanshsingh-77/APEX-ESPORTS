import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBpTK77fuzYndezW5Mv93ukyiEOktYJCEc",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "tournament-ac0ae.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "tournament-ac0ae",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "tournament-ac0ae.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "677589920201",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:677589920201:web:376f1808791493eece6018"
};

export const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "BAcpFlauWmnytoCC6TXkyETCQo7K5TKIX4zuCZnB8ZOgQC85sGPHWTHNpaEdXZI-ZL7PrHnheHeewGVpw3VMoGw";

// Initialize Firebase App safely on client side
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export let messaging: Messaging | null = null;

if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
  try {
    messaging = getMessaging(app);
  } catch (err) {
    console.warn('[Firebase Client] Messaging initialization skipped or unsupported:', err);
  }
}

export { app };
