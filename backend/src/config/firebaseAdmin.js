const admin = require('firebase-admin');

/**
 * Initialize Firebase Admin SDK for tournament-ac0ae
 */
let firebaseAdmin = null;

try {
  if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        firebaseAdmin = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: 'tournament-ac0ae',
        });
      } catch (err) {
        console.warn('[Firebase Admin] Service account JSON parse error, falling back to Project ID config:', err.message);
        firebaseAdmin = admin.initializeApp({
          projectId: 'tournament-ac0ae',
        });
      }
    } else {
      firebaseAdmin = admin.initializeApp({
        projectId: 'tournament-ac0ae',
      });
    }
    console.log('[Firebase Admin] Initialized successfully for project: tournament-ac0ae');
  } else {
    firebaseAdmin = admin.app();
  }
} catch (error) {
  console.error('[Firebase Admin] Initialization failed:', error.message);
}

module.exports = admin;
