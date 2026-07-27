const admin = require('../config/firebaseAdmin');
const FCMToken = require('../models/fcmTokenModel');
const { createPersistentStore } = require('../utils/persistentStore');

// Fallback disk persistent store for dev mode / un-instantiated DB
const fcmTokensStore = createPersistentStore('fcm_tokens', []);

/**
 * Register or update an FCM Token for a user
 */
const saveFCMToken = async (userId, token, deviceInfo = 'Unknown Device') => {
  if (!token || !userId) return null;

  // 1. Save to persistent JSON store
  const storeKey = `${userId}_${token}`;
  fcmTokensStore.set(storeKey, {
    userId: String(userId),
    token,
    deviceInfo,
    lastActive: new Date().toISOString(),
  });

  // 2. Save to MongoDB if connected
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(userId)) {
      await FCMToken.findOneAndUpdate(
        { token },
        { user: userId, token, deviceInfo, lastActive: new Date() },
        { upsert: true, new: true }
      );
    }
  } catch (err) {
    console.error('[FCM Service] DB Token Save Error:', err.message);
  }

  return { token, userId };
};

/**
 * Delete an FCM Token for a user on logout
 */
const removeFCMToken = async (userId, token) => {
  if (!token) return;

  // 1. Remove from persistent JSON store
  for (const [key, item] of fcmTokensStore.entries()) {
    if (item.token === token || (userId && String(item.userId) === String(userId) && item.token === token)) {
      fcmTokensStore.delete(key);
    }
  }

  // 2. Remove from MongoDB if connected
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      await FCMToken.deleteOne({ token });
    }
  } catch (err) {
    console.error('[FCM Service] DB Token Remove Error:', err.message);
  }
};

/**
 * Get all FCM Tokens for a specific user
 */
const getUserFCMTokens = async (userId) => {
  const tokens = new Set();

  // From persistent store
  for (const item of fcmTokensStore.values()) {
    if (String(item.userId) === String(userId)) {
      tokens.add(item.token);
    }
  }

  // From MongoDB
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(userId)) {
      const dbTokens = await FCMToken.find({ user: userId });
      dbTokens.forEach((t) => tokens.add(t.token));
    }
  } catch (err) {
    console.error('[FCM Service] DB Token Fetch Error:', err.message);
  }

  return Array.from(tokens);
};

/**
 * Get all FCM Tokens across all users
 */
const getAllFCMTokens = async () => {
  const tokens = new Set();

  for (const item of fcmTokensStore.values()) {
    tokens.add(item.token);
  }

  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      const dbTokens = await FCMToken.find();
      dbTokens.forEach((t) => tokens.add(t.token));
    }
  } catch (err) {
    console.error('[FCM Service] DB All Tokens Fetch Error:', err.message);
  }

  return Array.from(tokens);
};

/**
 * Send FCM Push Notification to specific device tokens
 */
const sendPushToTokens = async (tokens, { title, message, link = '/notifications', type = 'ANNOUNCEMENT', icon = '/icon-192.png', metadata = {} }) => {
  if (!tokens || tokens.length === 0) return { success: 0, failure: 0 };
  if (!admin.apps.length) return { success: 0, failure: 0 };

  const payload = {
    notification: {
      title,
      body: message,
    },
    data: {
      title,
      message,
      link,
      type,
      metadata: JSON.stringify(metadata),
      icon,
    },
    webpush: {
      notification: {
        title,
        body: message,
        icon,
        badge: '/icon-192.png',
        click_action: link,
      },
      fcmOptions: {
        link,
      },
    },
  };

  let successCount = 0;
  let failureCount = 0;

  try {
    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      ...payload,
    });

    successCount = response.successCount;
    failureCount = response.failureCount;

    // Prune invalid tokens
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errCode = resp.error?.code;
          if (
            errCode === 'messaging/invalid-registration-token' ||
            errCode === 'messaging/registration-token-not-registered'
          ) {
            failedTokens.push(tokens[idx]);
          }
        }
      });

      if (failedTokens.length > 0) {
        failedTokens.forEach((t) => removeFCMToken(null, t));
      }
    }
  } catch (error) {
    console.warn('[FCM Push Multicast Warning]', error.message);
  }

  return { success: successCount, failure: failureCount };
};

/**
 * Send FCM Push Notification to a user's devices
 */
const sendPushToUser = async (userId, notificationData) => {
  const tokens = await getUserFCMTokens(userId);
  if (tokens.length === 0) return { success: 0, failure: 0 };
  return await sendPushToTokens(tokens, notificationData);
};

/**
 * Broadcast FCM Push Notification to all devices
 */
const sendPushToAll = async (notificationData) => {
  const tokens = await getAllFCMTokens();
  if (tokens.length === 0) return { success: 0, failure: 0 };
  return await sendPushToTokens(tokens, notificationData);
};

module.exports = {
  saveFCMToken,
  removeFCMToken,
  getUserFCMTokens,
  getAllFCMTokens,
  sendPushToTokens,
  sendPushToUser,
  sendPushToAll,
};
