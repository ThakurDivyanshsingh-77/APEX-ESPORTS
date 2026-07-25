const express = require('express');
const {
  getAllUsers,
  updateUserStatusOrRole,
  getDisputes,
  updateDisputeStatus,
  getDashboardStats,
} = require('../controllers/adminController');
const {
  getPlatformSettings,
  updatePlatformSettings,
} = require('../controllers/settingsController');
const { verifyJWT, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Protected Admin Routes
router.get('/users', verifyJWT, authorizeRoles('ADMIN'), getAllUsers);
router.patch('/users/:id', verifyJWT, authorizeRoles('ADMIN'), updateUserStatusOrRole);

router.get('/disputes', verifyJWT, authorizeRoles('ADMIN'), getDisputes);
router.patch('/disputes/:id', verifyJWT, authorizeRoles('ADMIN'), updateDisputeStatus);

router.get('/dashboard-stats', verifyJWT, authorizeRoles('ADMIN'), getDashboardStats);

router.get('/settings', verifyJWT, authorizeRoles('ADMIN'), getPlatformSettings);
router.patch('/settings', verifyJWT, authorizeRoles('ADMIN'), updatePlatformSettings);

module.exports = router;
