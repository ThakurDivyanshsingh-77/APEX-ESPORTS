const express = require('express');
const {
  submitPayment,
  getMyPayments,
  getPendingPayments,
  approvePayment,
  rejectPayment,
} = require('../controllers/paymentController');
const { verifyJWT, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// User routes
router.post('/submit', verifyJWT, upload.single('screenshot'), submitPayment);
router.get('/my-payments', verifyJWT, getMyPayments);

// Admin routes
router.get('/pending', verifyJWT, authorizeRoles('ADMIN'), getPendingPayments);
router.patch('/:id/approve', verifyJWT, authorizeRoles('ADMIN'), approvePayment);
router.patch('/:id/reject', verifyJWT, authorizeRoles('ADMIN'), rejectPayment);

module.exports = router;
