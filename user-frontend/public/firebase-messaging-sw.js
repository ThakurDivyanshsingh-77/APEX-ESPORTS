importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBpTK77fuzYndezW5Mv93ukyiEOktYJCEc",
  authDomain: "tournament-ac0ae.firebaseapp.com",
  projectId: "tournament-ac0ae",
  storageBucket: "tournament-ac0ae.firebasestorage.app",
  messagingSenderId: "677589920201",
  appId: "1:677589920201:web:376f1808791493eece6018"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);

  const title = payload.notification?.title || payload.data?.title || 'APEX ESPORTS Notification';
  const options = {
    body: payload.notification?.body || payload.data?.message || payload.data?.body || '',
    icon: payload.data?.icon || '/icon-192.png',
    badge: '/icon-192.png',
    data: {
      link: payload.data?.link || payload.fcmOptions?.link || '/notifications',
      type: payload.data?.type || 'ANNOUNCEMENT',
    },
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };

  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked: ', event.notification);
  event.notification.close();

  const targetLink = event.notification.data?.link || '/notifications';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window open with the target URL or app domain
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url && 'focus' in client) {
          client.focus();
          if ('navigate' in client) {
            client.navigate(targetLink);
          }
          return;
        }
      }
      // If no window is open, open a new browser tab with the target URL
      if (clients.openWindow) {
        return clients.openWindow(targetLink);
      }
    })
  );
});
