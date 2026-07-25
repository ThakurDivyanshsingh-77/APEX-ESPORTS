const express = require('express');
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  broadcastAnnouncement,
} = require('../controllers/notificationController');
const { verifyJWT, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// User routes
router.get('/my-notifications', verifyJWT, getMyNotifications);
router.patch('/read-all', verifyJWT, markAllAsRead);
router.patch('/:id/read', verifyJWT, markAsRead);

// Admin routes
router.post('/broadcast', verifyJWT, authorizeRoles('ADMIN'), broadcastAnnouncement);

module.exports = router;
