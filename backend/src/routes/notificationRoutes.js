const express = require('express');
const router = express.Router();
const { verifyJWT, authorizeRoles } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/notificationController');

// All notification routes require JWT Authentication
router.use(verifyJWT);

// FCM Token Management
router.post('/fcm-token', registerFCMToken);
router.delete('/fcm-token', unregisterFCMToken);

// User Notifications REST APIs
router.get('/my-notifications', getMyNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.patch('/:id/unread', markAsUnread);
router.delete('/all', deleteAllNotifications);
router.delete('/:id', deleteNotification);
router.delete('/', deleteAllNotifications);

// Admin Broadcast & Direct Push Routes
router.post('/broadcast', authorizeRoles('ADMIN'), broadcastAnnouncement);
router.post('/send-push', authorizeRoles('ADMIN'), sendAdminPushNotification);

module.exports = router;
