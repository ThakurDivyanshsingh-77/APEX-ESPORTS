const mongoose = require('mongoose');
const Notification = require('../models/notificationModel');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { createPersistentStore } = require('../utils/persistentStore');

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
      read: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ],
]);

/**
 * @desc    Helper to dispatch notification to a specific user or all users
 */
const sendUserNotification = async ({ userId, userEmail, title, message, type = 'ANNOUNCEMENT' }) => {
  const notifObj = {
    _id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    user: String(userId || ''),
    userEmail: userEmail || '',
    title,
    message,
    type,
    read: false,
    createdAt: new Date().toISOString(),
  };

  // 1. Write to persistent store file (notifications.json)
  mockNotificationsStore.set(notifObj._id, notifObj);

  // 2. If MongoDB connected, save to DB
  if (mongoose.connection.readyState === 1 && userId && mongoose.Types.ObjectId.isValid(userId)) {
    try {
      await Notification.create({
        user: userId,
        title,
        message,
        type,
        read: false,
      });
    } catch (e) {
      console.error('[Notification DB Save Warning]', e.message);
    }
  }

  // 3. Socket.io broadcast to real-time clients
  try {
    const { getIO } = require('../socket');
    const io = getIO();
    if (io) {
      io.emit('new_notification', notifObj);
      if (userId) io.to(String(userId)).emit('user_notification', notifObj);
    }
  } catch (e) {}

  return notifObj;
};

/**
 * @desc    Get user's notifications
 * @route   GET /api/v1/notifications/my-notifications
 * @access  Private (Authenticated User)
 */
const getMyNotifications = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const userEmail = req.user?.email || '';

  if (mongoose.connection.readyState !== 1) {
    const freshNotifs = createPersistentStore('notifications', []);
    const list = Array.from(freshNotifs.values()).filter(
      (n) =>
        String(n.user) === String(userId) ||
        (userEmail && n.userEmail === userEmail) ||
        n.user === 'dev-user-id' ||
        n.type === 'ANNOUNCEMENT'
    );
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res
      .status(200)
      .json(new ApiResponse(200, list, 'Notifications retrieved (Dev Mode)'));
  }

  try {
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(30);

    return res
      .status(200)
      .json(new ApiResponse(200, notifications, 'Notifications retrieved successfully'));
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
    return res
      .status(200)
      .json(new ApiResponse(200, list, 'Notifications retrieved (Dev Mode)'));
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
 * @desc    Admin broadcast announcement to all users
 * @route   POST /api/v1/notifications/broadcast
 * @access  Private (Admin)
 */
const broadcastAnnouncement = asyncHandler(async (req, res) => {
  const { title, message } = req.body;

  if (!title || !message) {
    throw new ApiError(400, 'Title and message are required for broadcast');
  }

  const notifObj = await sendUserNotification({
    userId: 'all',
    userEmail: '',
    title,
    message,
    type: 'ANNOUNCEMENT',
  });

  return res
    .status(200)
    .json(new ApiResponse(200, notifObj, 'Global announcement broadcasted successfully'));
});

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  broadcastAnnouncement,
  sendUserNotification,
};
