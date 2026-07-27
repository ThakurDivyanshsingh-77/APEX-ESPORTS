const mongoose = require('mongoose');
const Notification = require('../models/notificationModel');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { createPersistentStore } = require('../utils/persistentStore');
const {
  saveFCMToken,
  removeFCMToken,
  sendPushToUser,
  sendPushToAll,
} = require('../services/fcmService');

// Persistent JSON file-backed notification store — survives server restarts
const mockNotificationsStore = createPersistentStore('notifications', [
  [
    'mock-n-1',
    {
      _id: 'mock-n-1',
      user: 'dev-user-id',
      title: 'Payment Approved 🎉',
      message: 'Your entry fee for Valorant Champions Showdown has been verified. Your slot is confirmed!',
      type: 'PAYMENT_APPROVED',
      link: '/tournaments',
      read: false,
      createdAt: new Date().toISOString(),
    },
  ],
  [
    'mock-n-2',
    {
      _id: 'mock-n-2',
      user: 'dev-user-id',
      title: 'Room Credentials Unlocked 🔑',
      message: 'Match Room ID & Password for BGMI Cyber Series Season 4 are now live.',
      type: 'ROOM_RELEASED',
      link: '/tournaments',
      read: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ],
]);

/**
 * Default link mapping based on notification type
 */
const getDefaultLinkForType = (type, metadata = {}) => {
  if (metadata.link) return metadata.link;
  if (metadata.tournamentId) return `/tournaments/${metadata.tournamentId}`;
  if (metadata.ticketId) return `/support`;

  switch (type) {
    case 'TOURNAMENT_CREATED':
    case 'TOURNAMENT_UPDATED':
    case 'TOURNAMENT_CANCELLED':
      return '/tournaments';
    case 'MATCH_REMINDER':
    case 'ROOM_RELEASED':
    case 'PAYMENT_APPROVED':
    case 'PAYMENT_REJECTED':
      return '/tournaments';
    case 'PRIZE_CREDITED':
    case 'WALLET_UPDATED':
    case 'DEPOSIT_APPROVED':
    case 'DEPOSIT_REJECTED':
    case 'WITHDRAW_APPROVED':
    case 'WITHDRAW_REJECTED':
    case 'SECURITY_ALERT':
      return '/dashboard';
    case 'FRIEND_REQUEST':
    case 'FRIEND_REQUEST_ACCEPTED':
      return '/community/friends';
    case 'NEW_MESSAGE':
    case 'SUPPORT_REPLY':
      return '/support';
    case 'ANNOUNCEMENT':
    case 'MODERATOR_ANNOUNCEMENT':
    case 'ADMIN_ANNOUNCEMENT':
    default:
      return '/notifications';
  }
};

/**
 * Core Helper to dispatch notification to a user or all users (Socket + FCM Push)
 */
const sendUserNotification = async ({
  userId,
  userEmail,
  title,
  message,
  type = 'ANNOUNCEMENT',
  link = null,
  metadata = {},
  icon = '/icon-192.png',
}) => {
  const finalLink = link || getDefaultLinkForType(type, metadata);

  const notifObj = {
    _id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    user: String(userId || ''),
    userEmail: userEmail || '',
    title,
    message,
    type,
    link: finalLink,
    metadata,
    read: false,
    createdAt: new Date().toISOString(),
  };

  // 1. Write to persistent store file (notifications.json)
  mockNotificationsStore.set(notifObj._id, notifObj);

  // 2. If MongoDB connected, save to DB
  let dbSavedNotif = null;
  if (mongoose.connection.readyState === 1 && userId && mongoose.Types.ObjectId.isValid(userId)) {
    try {
      dbSavedNotif = await Notification.create({
        user: userId,
        title,
        message,
        type,
        link: finalLink,
        metadata,
        read: false,
      });
      notifObj._id = String(dbSavedNotif._id);
    } catch (e) {
      console.error('[Notification DB Save Warning]', e.message);
    }
  }

  // 3. Real-time Socket.io broadcast
  let isOnlineViaSocket = false;
  try {
    const { getIO } = require('../socket');
    const io = getIO();
    if (io) {
      io.emit('new_notification', notifObj);
      if (userId) {
        const roomName = String(userId);
        const roomSockets = io.sockets.adapter.rooms.get(roomName);
        if (roomSockets && roomSockets.size > 0) {
          isOnlineViaSocket = true;
        }
        io.to(roomName).emit('user_notification', notifObj);
      }
    }
  } catch (e) {}

  // 4. FCM Push Notification
  try {
    const pushData = {
      title,
      message,
      link: finalLink,
      type,
      icon,
      metadata,
    };

    if (userId === 'all' || !userId) {
      await sendPushToAll(pushData);
    } else {
      await sendPushToUser(userId, pushData);
    }
  } catch (pushErr) {
    console.warn('[FCM Push Dispatch Warning]', pushErr.message);
  }

  return notifObj;
};

/**
 * @desc    Register FCM Device Token
 * @route   POST /api/v1/notifications/fcm-token
 * @access  Private (Authenticated User)
 */
const registerFCMToken = asyncHandler(async (req, res) => {
  const { token, deviceInfo } = req.body;
  const userId = req.user?._id || req.user?.id;

  if (!token) {
    throw new ApiError(400, 'FCM token is required');
  }

  const result = await saveFCMToken(userId, token, deviceInfo || req.headers['user-agent']);
  return res.status(200).json(new ApiResponse(200, result, 'FCM token registered successfully'));
});

/**
 * @desc    Unregister FCM Device Token (on logout)
 * @route   DELETE /api/v1/notifications/fcm-token
 * @access  Private (Authenticated User)
 */
const unregisterFCMToken = asyncHandler(async (req, res) => {
  const token = req.body?.token || req.query?.token;
  const userId = req.user?._id || req.user?.id;

  if (token || userId) {
    await removeFCMToken(userId, token);
  }
  return res.status(200).json(new ApiResponse(200, null, 'FCM token unregistered successfully'));
});

/**
 * @desc    Get user's notifications (Paginated with filtering)
 * @route   GET /api/v1/notifications/my-notifications
 * @access  Private (Authenticated User)
 */
const getMyNotifications = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const userEmail = req.user?.email || '';

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const statusFilter = req.query.status || 'all'; // 'all', 'unread', 'read'
  const typeFilter = req.query.type || 'all';

  if (mongoose.connection.readyState !== 1) {
    const freshNotifs = createPersistentStore('notifications', []);
    let list = Array.from(freshNotifs.values()).filter(
      (n) =>
        String(n.user) === String(userId) ||
        (userEmail && n.userEmail === userEmail) ||
        n.user === 'dev-user-id' ||
        n.type === 'ANNOUNCEMENT'
    );

    if (statusFilter === 'unread') list = list.filter((n) => !n.read);
    if (statusFilter === 'read') list = list.filter((n) => n.read);
    if (typeFilter !== 'all') list = list.filter((n) => n.type === typeFilter);

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = list.length;
    const unreadCount = list.filter((n) => !n.read).length;
    const paginatedList = list.slice(skip, skip + limit);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          notifications: paginatedList,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit) || 1,
            unreadCount,
          },
        },
        'Notifications retrieved (Dev Mode)'
      )
    );
  }

  try {
    const query = { user: userId };
    if (statusFilter === 'unread') query.read = false;
    if (statusFilter === 'read') query.read = true;
    if (typeFilter !== 'all') query.type = typeFilter;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(query),
      Notification.countDocuments({ user: userId, read: false }),
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          notifications,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit) || 1,
            unreadCount,
          },
        },
        'Notifications retrieved successfully'
      )
    );
  } catch (error) {
    const freshNotifs = createPersistentStore('notifications', []);
    const list = Array.from(freshNotifs.values()).filter(
      (n) =>
        String(n.user) === String(userId) ||
        (userEmail && n.userEmail === userEmail) ||
        n.user === 'dev-user-id' ||
        n.type === 'ANNOUNCEMENT'
    );
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const unreadCount = list.filter((n) => !n.read).length;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          notifications: list.slice(skip, skip + limit),
          pagination: {
            page,
            limit,
            total: list.length,
            pages: Math.ceil(list.length / limit) || 1,
            unreadCount,
          },
        },
        'Notifications retrieved (Dev Fallback)'
      )
    );
  }
});

/**
 * @desc    Mark a single notification as read
 * @route   PATCH /api/v1/notifications/:id/read
 * @access  Private (Authenticated User)
 */
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (mongoose.connection.readyState !== 1) {
    const freshNotifs = createPersistentStore('notifications', []);
    const mockN = freshNotifs.get(id) || mockNotificationsStore.get(id);
    if (mockN) {
      mockN.read = true;
      freshNotifs.set(id, mockN);
      mockNotificationsStore.set(id, mockN);
    }
    return res
      .status(200)
      .json(new ApiResponse(200, mockN || { _id: id, read: true }, 'Notification marked as read'));
  }

  try {
    const notification = await Notification.findById(id);
    if (notification) {
      notification.read = true;
      await notification.save();
    }
    return res
      .status(200)
      .json(new ApiResponse(200, notification || { _id: id, read: true }, 'Notification marked as read'));
  } catch (error) {
    const freshNotifs = createPersistentStore('notifications', []);
    const mockN = freshNotifs.get(id);
    if (mockN) {
      mockN.read = true;
      freshNotifs.set(id, mockN);
    }
    return res
      .status(200)
      .json(new ApiResponse(200, { _id: id, read: true }, 'Notification marked as read'));
  }
});

/**
 * @desc    Mark a single notification as unread
 * @route   PATCH /api/v1/notifications/:id/unread
 * @access  Private (Authenticated User)
 */
const markAsUnread = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (mongoose.connection.readyState !== 1) {
    const freshNotifs = createPersistentStore('notifications', []);
    const mockN = freshNotifs.get(id) || mockNotificationsStore.get(id);
    if (mockN) {
      mockN.read = false;
      freshNotifs.set(id, mockN);
      mockNotificationsStore.set(id, mockN);
    }
    return res
      .status(200)
      .json(new ApiResponse(200, mockN || { _id: id, read: false }, 'Notification marked as unread'));
  }

  try {
    const notification = await Notification.findById(id);
    if (notification) {
      notification.read = false;
      await notification.save();
    }
    return res
      .status(200)
      .json(new ApiResponse(200, notification || { _id: id, read: false }, 'Notification marked as unread'));
  } catch (error) {
    return res
      .status(200)
      .json(new ApiResponse(200, { _id: id, read: false }, 'Notification marked as unread'));
  }
});

/**
 * @desc    Mark ALL user notifications as read
 * @route   PATCH /api/v1/notifications/read-all
 * @access  Private (Authenticated User)
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const userEmail = req.user?.email || '';

  if (mongoose.connection.readyState !== 1) {
    const freshNotifs = createPersistentStore('notifications', []);
    for (const [k, n] of freshNotifs.entries()) {
      if (
        String(n.user) === String(userId) ||
        (userEmail && n.userEmail === userEmail) ||
        n.user === 'dev-user-id' ||
        n.type === 'ANNOUNCEMENT'
      ) {
        n.read = true;
        freshNotifs.set(k, n);
      }
    }
    return res.status(200).json(new ApiResponse(200, null, 'All notifications marked as read'));
  }

  try {
    await Notification.updateMany({ user: userId, read: false }, { read: true });
    return res.status(200).json(new ApiResponse(200, null, 'All notifications marked as read'));
  } catch (error) {
    return res.status(200).json(new ApiResponse(200, null, 'All notifications marked as read'));
  }
});

/**
 * @desc    Delete a single notification
 * @route   DELETE /api/v1/notifications/:id
 * @access  Private (Authenticated User)
 */
const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (mongoose.connection.readyState !== 1) {
    const freshNotifs = createPersistentStore('notifications', []);
    freshNotifs.delete(id);
    mockNotificationsStore.delete(id);
    return res.status(200).json(new ApiResponse(200, null, 'Notification deleted'));
  }

  try {
    await Notification.findByIdAndDelete(id);
    return res.status(200).json(new ApiResponse(200, null, 'Notification deleted'));
  } catch (error) {
    const freshNotifs = createPersistentStore('notifications', []);
    freshNotifs.delete(id);
    return res.status(200).json(new ApiResponse(200, null, 'Notification deleted'));
  }
});

/**
 * @desc    Delete ALL user notifications
 * @route   DELETE /api/v1/notifications
 * @access  Private (Authenticated User)
 */
const deleteAllNotifications = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const userEmail = req.user?.email || '';

  if (mongoose.connection.readyState !== 1) {
    const freshNotifs = createPersistentStore('notifications', []);
    for (const [k, n] of freshNotifs.entries()) {
      if (
        String(n.user) === String(userId) ||
        (userEmail && n.userEmail === userEmail) ||
        n.user === 'dev-user-id'
      ) {
        freshNotifs.delete(k);
      }
    }
    return res.status(200).json(new ApiResponse(200, null, 'All notifications cleared'));
  }

  try {
    await Notification.deleteMany({ user: userId });
    return res.status(200).json(new ApiResponse(200, null, 'All notifications cleared'));
  } catch (error) {
    return res.status(200).json(new ApiResponse(200, null, 'All notifications cleared'));
  }
});

/**
 * @desc    Admin broadcast announcement to all users (Socket + FCM Push)
 * @route   POST /api/v1/notifications/broadcast
 * @access  Private (Admin)
 */
const broadcastAnnouncement = asyncHandler(async (req, res) => {
  const { title, message, type = 'ADMIN_ANNOUNCEMENT', link = '/notifications' } = req.body;

  if (!title || !message) {
    throw new ApiError(400, 'Title and message are required for broadcast');
  }

  const notifObj = await sendUserNotification({
    userId: 'all',
    userEmail: '',
    title,
    message,
    type,
    link,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, notifObj, 'Global announcement broadcasted successfully'));
});

/**
 * @desc    Admin targeted Push Notification to a specific user
 * @route   POST /api/v1/notifications/send-push
 * @access  Private (Admin)
 */
const sendAdminPushNotification = asyncHandler(async (req, res) => {
  const { userId, title, message, type = 'ADMIN_ANNOUNCEMENT', link } = req.body;

  if (!userId || !title || !message) {
    throw new ApiError(400, 'User ID, title, and message are required');
  }

  const notifObj = await sendUserNotification({
    userId,
    title,
    message,
    type,
    link,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, notifObj, 'Targeted push notification sent successfully'));
});

module.exports = {
  getMyNotifications,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  registerFCMToken,
  unregisterFCMToken,
  broadcastAnnouncement,
  sendAdminPushNotification,
  sendUserNotification,
};
