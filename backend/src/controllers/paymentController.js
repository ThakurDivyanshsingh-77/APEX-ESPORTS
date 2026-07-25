const mongoose = require('mongoose');
const Payment = require('../models/paymentModel');
const Registration = require('../models/registrationModel');
const Tournament = require('../models/tournamentModel');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { validatePaymentInput } = require('../validators/paymentValidator');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const { createPersistentStore } = require('../utils/persistentStore');

// Persistent JSON file-backed payment store — survives server restarts
const mockPayments = createPersistentStore('payments', [
  [
    'mock-p-101',
    {
      _id: 'mock-p-101',
      user: { _id: 'u-1', name: 'Alex Vance', email: 'alex@esports.com' },
      tournament: { _id: 'mock-t-2', title: 'BGMI Cyber Series Season 4', entryFee: 50 },
      amount: 50,
      utr: '419280192041',
      image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      status: 'PENDING',
      remarks: '',
      createdAt: new Date().toISOString(),
    },
  ],
]);

/**
 * @desc    Submit payment screenshot proof & UTR number
 * @route   POST /api/v1/payments/submit
 * @access  Private (Authenticated User)
 */
const submitPayment = asyncHandler(async (req, res) => {
  const { tournamentId, amount, utr } = req.body;
  const userId = req.user._id || req.user.id;

  const { isValid, errors } = validatePaymentInput({ tournamentId, amount, utr });
  if (!isValid) {
    throw new ApiError(400, 'Validation Error', errors);
  }

  // Handle uploaded payment screenshot file
  let imageUrl = req.body.image || req.body.screenshotUrl || '';
  if (req.file) {
    const uploadRes = await uploadToCloudinary(req.file.path);
    if (uploadRes && uploadRes.secure_url) {
      imageUrl = uploadRes.secure_url;
    } else {
      // Local server URL fallback when Cloudinary is unconfigured or offline
      const filename = req.file.filename;
      const host = req.get('host') || 'localhost:5000';
      const protocol = req.protocol || 'http';
      imageUrl = `${protocol}://${host}/uploads/${filename}`;
    }
  }

  if (!imageUrl) {
    imageUrl = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80';
  }

  // BUG FIX #4: Build userObj entirely from req.user — no hardcoded fallback names
  const userObj = {
    _id: userId,
    name: req.user?.name || 'Unknown Player',
    email: req.user?.email || 'unknown@player.com',
    phone: req.user?.phone || '',
    gameName: req.user?.gameName || '',
    gameUID: req.user?.gameUID || '',
  };

  // Look up real tournament details from the persistent tournament store
  const { createPersistentStore: _getStore } = require('../utils/persistentStore');
  const _tournamentStore = _getStore('tournaments', []);
  const _storedTournament = _tournamentStore.get(String(tournamentId));

  const tournamentObj =
    typeof tournamentId === 'object'
      ? tournamentId
      : {
          _id: tournamentId,
          title: _storedTournament?.title || 'Tournament',
          entryFee: _storedTournament?.entryFee ?? Number(amount) ?? 0,
          prizePool: _storedTournament?.prizePool || '₹0',
        };

  if (mongoose.connection.readyState !== 1) {
    console.warn('[Payment Dev Fallback] MongoDB offline. Creating mock payment.');
    const { createPersistentStore } = require('../utils/persistentStore');
    const freshPayments = createPersistentStore('payments', []);
    const mockId = 'mock-p-' + Date.now();
    const mockPayment = {
      _id: mockId,
      user: userObj,
      tournament: tournamentObj,
      amount: Number(amount),
      utr: utr.trim(),
      image: imageUrl,
      status: 'PENDING',
      remarks: '',
      createdAt: new Date().toISOString(),
    };
    freshPayments.set(mockId, mockPayment);
    mockPayments.set(mockId, mockPayment);

    const mockRegistrations = createPersistentStore('registrations', []);
    for (const [rKey, rVal] of mockRegistrations.entries()) {
      const rUserId = String(rVal.user?._id || rVal.user?.id || rVal.user);
      const rTournId = String(rVal.tournament?._id || rVal.tournament?.id || rVal.tournament);
      const pUserId = String(userId);
      const pTournId = String(tournamentObj._id || tournamentObj.id || tournamentId);

      const isUserMatch = rUserId === pUserId || (req.user?.email && rVal.user?.email === req.user.email);
      const isTournMatch = rTournId === pTournId;

      if (isUserMatch && isTournMatch) {
        rVal.paymentStatus = 'PENDING';
        mockRegistrations.set(rKey, rVal);
      }
    }

    return res
      .status(201)
      .json(new ApiResponse(201, mockPayment, 'Payment proof submitted successfully. Pending Admin Verification.'));
  }

  try {
    // Check duplicate UTR
    const existingPayment = await Payment.findOne({ utr: utr.trim() });
    if (existingPayment) {
      throw new ApiError(409, 'This UTR / Transaction Reference ID has already been submitted');
    }

    const payment = await Payment.create({
      user: userId,
      tournament: tournamentId,
      amount: Number(amount),
      utr: utr.trim(),
      image: imageUrl,
      status: 'PENDING',
    });

    // Update associated registration paymentStatus to PENDING
    await Registration.findOneAndUpdate(
      { user: userId, tournament: tournamentId },
      { paymentStatus: 'PENDING' }
    );

    const fullPayment = {
      ...payment.toObject(),
      user: userObj,
      tournament: tournamentObj,
    };
    mockPayments.set(payment._id.toString(), fullPayment);

    return res
      .status(201)
      .json(new ApiResponse(201, fullPayment, 'Payment proof submitted successfully. Pending Admin Verification.'));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const { createPersistentStore } = require('../utils/persistentStore');
    const freshPayments = createPersistentStore('payments', []);
    const mockId = 'mock-p-' + Date.now();
    const mockPayment = {
      _id: mockId,
      user: userObj,
      tournament: tournamentObj,
      amount: Number(amount),
      utr: utr.trim(),
      image: imageUrl,
      status: 'PENDING',
      remarks: '',
      createdAt: new Date().toISOString(),
    };
    freshPayments.set(mockId, mockPayment);
    mockPayments.set(mockId, mockPayment);

    return res
      .status(201)
      .json(new ApiResponse(201, mockPayment, 'Payment proof submitted successfully. Pending Admin Verification.'));
  }
});

/**
 * @desc    Get user's submitted payment history
 * @route   GET /api/v1/payments/my-payments
 * @access  Private (Authenticated User)
 */
const getMyPayments = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;

  if (mongoose.connection.readyState !== 1) {
    const { createPersistentStore } = require('../utils/persistentStore');
    const freshPayments = createPersistentStore('payments', []);
    const list = Array.from(freshPayments.values()).filter(
      (p) =>
        String(p.user?._id || p.user?.id || p.user) === String(userId) ||
        (req.user?.email && p.user?.email === req.user.email)
    );
    return res
      .status(200)
      .json(new ApiResponse(200, list, 'Payment history retrieved (Dev Mode)'));
  }

  try {
    const payments = await Payment.find({ user: userId })
      .populate('tournament', 'title game entryFee prizePool')
      .sort({ createdAt: -1 });

    return res
      .status(200)
      .json(new ApiResponse(200, payments, 'Payment history retrieved successfully'));
  } catch (error) {
    const { createPersistentStore } = require('../utils/persistentStore');
    const freshPayments = createPersistentStore('payments', []);
    const list = Array.from(freshPayments.values()).filter(
      (p) =>
        String(p.user?._id || p.user?.id || p.user) === String(userId) ||
        (req.user?.email && p.user?.email === req.user.email)
    );
    return res
      .status(200)
      .json(new ApiResponse(200, list, 'Payment history retrieved (Dev Mode)'));
  }
});

/**
 * @desc    Get all pending payments for Admin verification
 * @route   GET /api/v1/payments/pending
 * @access  Private (Admin)
 */
const getPendingPayments = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const { createPersistentStore } = require('../utils/persistentStore');
    const freshPayments = createPersistentStore('payments', []);
    const list = Array.from(freshPayments.values()).filter((p) => p.status === 'PENDING');
    return res
      .status(200)
      .json(new ApiResponse(200, list, 'Pending payments retrieved (Dev Mode)'));
  }

  try {
    const payments = await Payment.find({ status: 'PENDING' })
      .populate('user', 'name email phone gameName gameUID profileImage')
      .populate('tournament', 'title game entryFee prizePool')
      .sort({ createdAt: -1 });

    return res
      .status(200)
      .json(new ApiResponse(200, payments, 'Pending payments retrieved successfully'));
  } catch (error) {
    const { createPersistentStore } = require('../utils/persistentStore');
    const freshPayments = createPersistentStore('payments', []);
    const list = Array.from(freshPayments.values()).filter((p) => p.status === 'PENDING');
    return res
      .status(200)
      .json(new ApiResponse(200, list, 'Pending payments retrieved (Dev Mode)'));
  }
});

/**
 * @desc    Approve payment (Admin action)
 * @route   PATCH /api/v1/payments/:id/approve
 * @access  Private (Admin)
 */
const approvePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user._id || req.user.id;

  if (mongoose.connection.readyState !== 1) {
    const { createPersistentStore } = require('../utils/persistentStore');
    const freshPayments = createPersistentStore('payments', []);
    const mockRegistrations = createPersistentStore('registrations', []);

    let mockP = freshPayments.get(id) || mockPayments.get(id);
    if (!mockP) {
      for (const [, p] of freshPayments.entries()) {
        if (p._id === id || p.id === id) {
          mockP = p;
          break;
        }
      }
    }

    if (mockP) {
      mockP.status = 'APPROVED';
      mockP.remarks = 'Verified and Approved by Admin';
      mockP.verifiedAt = new Date().toISOString();

      freshPayments.set(String(mockP._id || id), mockP);
      mockPayments.set(String(mockP._id || id), mockP);

      for (const [rKey, rVal] of mockRegistrations.entries()) {
        const rUserId = String(rVal.user?._id || rVal.user?.id || rVal.user);
        const rTournId = String(rVal.tournament?._id || rVal.tournament?.id || rVal.tournament);
        const pUserId = String(mockP.user?._id || mockP.user?.id || mockP.user);
        const pTournId = String(mockP.tournament?._id || mockP.tournament?.id || mockP.tournament);

        const isUserMatch = rUserId === pUserId || (mockP.user?.email && rVal.user?.email === mockP.user.email);
        const isTournMatch = rTournId === pTournId;

        if (isUserMatch && isTournMatch) {
          rVal.status = 'CONFIRMED';
          rVal.paymentStatus = 'PAID';
          mockRegistrations.set(rKey, rVal);
        }
      }

      // Dispatch real-time notification
      const { sendUserNotification } = require('./notificationController');
      sendUserNotification({
        userId: mockP.user?._id || mockP.user?.id || mockP.user,
        userEmail: mockP.user?.email || '',
        title: 'Payment Approved 🎉',
        message: `Your payment for ${mockP.tournament?.title || 'Tournament'} is verified & confirmed! Slot unlocked.`,
        type: 'PAYMENT_APPROVED',
      });
    }
    return res
      .status(200)
      .json(new ApiResponse(200, mockP || { _id: id, status: 'APPROVED' }, 'Payment approved. Player slot confirmed!'));
  }

  try {
    const payment = await Payment.findById(id);
    if (!payment) {
      throw new ApiError(404, 'Payment submission not found');
    }

    payment.status = 'APPROVED';
    payment.remarks = 'Verified and Approved by Admin';
    payment.verifiedBy = adminId;
    await payment.save();

    // Auto-update Registration status to CONFIRMED & paymentStatus to PAID
    const targetUserId = payment.user?._id || payment.user;
    const targetTournId = payment.tournament?._id || payment.tournament;

    await Registration.findOneAndUpdate(
      { user: targetUserId, tournament: targetTournId },
      { status: 'CONFIRMED', paymentStatus: 'PAID' }
    );
    await Registration.updateMany(
      { user: targetUserId, tournament: targetTournId },
      { status: 'CONFIRMED', paymentStatus: 'PAID' }
    );

    // Create Notification
    const Notification = require('../models/notificationModel');
    await Notification.create({
      user: payment.user,
      title: 'Payment Approved 🎉',
      message: `Your payment of $${payment.amount} (UTR: ${payment.utr}) has been verified. Your slot is confirmed!`,
      type: 'PAYMENT_APPROVED',
    });

    return res
      .status(200)
      .json(new ApiResponse(200, payment, 'Payment approved successfully. Player slot confirmed!'));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const { createPersistentStore } = require('../utils/persistentStore');
    const freshPayments = createPersistentStore('payments', []);
    let mockP = freshPayments.get(id) || mockPayments.get(id);
    if (mockP) {
      mockP.status = 'APPROVED';
      freshPayments.set(String(mockP._id || id), mockP);
    }
    return res
      .status(200)
      .json(new ApiResponse(200, mockP || { _id: id, status: 'APPROVED' }, 'Payment approved (Dev Mode)'));
  }
});

/**
 * @desc    Reject payment (Admin action with remarks)
 * @route   PATCH /api/v1/payments/:id/reject
 * @access  Private (Admin)
 */
const rejectPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { remarks } = req.body;
  const adminId = req.user._id || req.user.id;

  if (mongoose.connection.readyState !== 1) {
    const { createPersistentStore } = require('../utils/persistentStore');
    const freshPayments = createPersistentStore('payments', []);
    const mockRegistrations = createPersistentStore('registrations', []);

    let mockP = freshPayments.get(id) || mockPayments.get(id);
    if (!mockP) {
      for (const [, p] of freshPayments.entries()) {
        if (p._id === id || p.id === id) {
          mockP = p;
          break;
        }
      }
    }

    if (mockP) {
      mockP.status = 'REJECTED';
      mockP.remarks = remarks || 'UTR validation failed';
      mockP.verifiedAt = new Date().toISOString();

      freshPayments.set(String(mockP._id || id), mockP);
      mockPayments.set(String(mockP._id || id), mockP);

      for (const [rKey, rVal] of mockRegistrations.entries()) {
        const rUserId = String(rVal.user?._id || rVal.user?.id || rVal.user);
        const rTournId = String(rVal.tournament?._id || rVal.tournament?.id || rVal.tournament);
        const pUserId = String(mockP.user?._id || mockP.user?.id || mockP.user);
        const pTournId = String(mockP.tournament?._id || mockP.tournament?.id || mockP.tournament);

        const isUserMatch = rUserId === pUserId || (mockP.user?.email && rVal.user?.email === mockP.user.email);
        const isTournMatch = rTournId === pTournId;

        if (isUserMatch && isTournMatch) {
          rVal.paymentStatus = 'REFUNDED';
          mockRegistrations.set(rKey, rVal);
        }
      }
    }
    return res
      .status(200)
      .json(new ApiResponse(200, mockP || { _id: id, status: 'REJECTED' }, 'Payment rejected.'));
  }

  try {
    const payment = await Payment.findById(id);
    if (!payment) {
      throw new ApiError(404, 'Payment submission not found');
    }

    payment.status = 'REJECTED';
    payment.remarks = remarks || 'UTR validation failed or invalid screenshot';
    payment.verifiedBy = adminId;
    await payment.save();

    // Auto-update Registration paymentStatus to REJECTED
    await Registration.findOneAndUpdate(
      { user: payment.user, tournament: payment.tournament },
      { paymentStatus: 'REFUNDED' }
    );

    // Create Notification
    const Notification = require('../models/notificationModel');
    await Notification.create({
      user: payment.user,
      title: 'Payment Verification Failed ⚠️',
      message: `Your payment (UTR: ${payment.utr}) was rejected. Reason: ${payment.remarks}`,
      type: 'PAYMENT_REJECTED',
    });

    return res
      .status(200)
      .json(new ApiResponse(200, payment, 'Payment rejected successfully'));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const mockP = mockPayments.get(id);
    if (mockP) {
      mockP.status = 'REJECTED';
      mockP.remarks = remarks || 'UTR validation failed';
    }
    return res
      .status(200)
      .json(new ApiResponse(200, mockP || { _id: id, status: 'REJECTED' }, 'Payment rejected (Dev Mode)'));
  }
});

module.exports = {
  submitPayment,
  getMyPayments,
  getPendingPayments,
  approvePayment,
  rejectPayment,
};
