const mongoose = require('mongoose');
const User = require('../models/userModel');
const Tournament = require('../models/tournamentModel');
const Registration = require('../models/registrationModel');
const Payment = require('../models/paymentModel');
const Result = require('../models/resultModel');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { createPersistentStore } = require('../utils/persistentStore');

// In-memory mock storage fallback for disputes and activity logs if DB daemon is offline
const mockDisputes = [
  {
    _id: 'disp-101',
    tournamentName: 'Valorant Champions Showdown',
    matchId: 'M-501',
    raisedBy: 'Vance#TAG1',
    opponent: 'ShadowRider#991',
    reason: 'Opponent failed to submit match end screenshot after victory',
    status: 'PENDING',
    evidenceUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 3600000),
  },
  {
    _id: 'disp-102',
    tournamentName: 'BGMI Cyber Series S4',
    matchId: 'M-508',
    raisedBy: 'AlphaSquad_Cap',
    opponent: 'CyberNinja_Squad',
    reason: 'Suspected unofficial roster player substitution during Round 2',
    status: 'RESOLVED',
    evidenceUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 86400000),
  },
];

/**
 * @desc    Get all registered users for Admin panel
 * @route   GET /api/v1/admin/users
 * @access  Private (Admin)
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { getRegisteredUsersList } = require('./authController');

  if (mongoose.connection.readyState !== 1) {
    const userList = getRegisteredUsersList();
    return res
      .status(200)
      .json(new ApiResponse(200, userList, 'Users list retrieved (Dev Mode)'));
  }

  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res
      .status(200)
      .json(new ApiResponse(200, users, 'Users list retrieved successfully'));
  } catch (error) {
    const userList = getRegisteredUsersList();
    return res
      .status(200)
      .json(new ApiResponse(200, userList, 'Users list retrieved (Dev Mode)'));
  }
});

/**
 * @desc    Update user role or status (Ban/Unban)
 * @route   PATCH /api/v1/admin/users/:id
 * @access  Private (Admin)
 */
const updateUserStatusOrRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role, status } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (role && ['PLAYER', 'ORGANIZER', 'ADMIN'].includes(role)) {
      user.role = role;
    }
    if (status && ['ACTIVE', 'BANNED', 'SUSPENDED'].includes(status)) {
      user.status = status;
    }

    await user.save();

    return res
      .status(200)
      .json(new ApiResponse(200, user, 'User status/role updated successfully'));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === 'MongooseError' || error.name === 'MongoServerSelectionError' || error.name === 'CastError') {
      const { updateMockUserStatus } = require('./authController');
      const updatedMock = updateMockUserStatus(id, role, status);
      return res
        .status(200)
        .json(new ApiResponse(200, updatedMock || { _id: id, role, status }, 'User status updated (Dev Mode)'));
    }
    throw error;
  }
});

/**
 * @desc    Get all disputes & system logs
 * @route   GET /api/v1/admin/disputes
 * @access  Private (Admin)
 */
const getDisputes = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, mockDisputes, 'Disputes list retrieved successfully'));
});

/**
 * @desc    Resolve or reject dispute
 * @route   PATCH /api/v1/admin/disputes/:id
 * @access  Private (Admin)
 */
const updateDisputeStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const dispute = mockDisputes.find((d) => d._id === id);
  if (dispute) {
    dispute.status = status;
  }

  return res
    .status(200)
    .json(new ApiResponse(200, dispute || { _id: id, status }, 'Dispute status updated successfully'));
});

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/v1/admin/dashboard-stats
 * @access  Private (Admin)
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const getDevStats = () => {
    const mockUsers = createPersistentStore('users', []);
    const mockTournaments = createPersistentStore('tournaments', []);
    const mockRegistrations = createPersistentStore('registrations', []);
    const mockPayments = createPersistentStore('payments', []);
    const mockResults = createPersistentStore('results', []);

    // Total registered users
    const totalUsers = Array.from(mockUsers.values()).length;

    // Active tournaments (UPCOMING + LIVE)
    const tournaments = Array.from(mockTournaments.values());
    const activeTournaments = tournaments.filter(t => t.status === 'UPCOMING' || t.status === 'LIVE').length;
    const liveMatches = tournaments.filter(t => t.status === 'LIVE').length;

    // Tournament status breakdown
    const upcoming = tournaments.filter(t => t.status === 'UPCOMING').length;
    const live = tournaments.filter(t => t.status === 'LIVE').length;
    const completed = tournaments.filter(t => t.status === 'COMPLETED').length;

    // Calculate revenue: total participant money - total prize money given
    let totalParticipantMoney = 0;
    let totalPrizeMoneyGiven = 0;

    // Sum all approved payments (participant money)
    const payments = Array.from(mockPayments.values());
    payments.forEach(p => {
      if (p.status === 'APPROVED') {
        totalParticipantMoney += Number(p.amount) || 0;
      }
    });

    // Sum all prize money from published results
    const results = Array.from(mockResults.values());
    results.forEach(r => {
      if (r.rankings && Array.isArray(r.rankings)) {
        r.rankings.forEach(winner => {
          totalPrizeMoneyGiven += Number(winner.prizeAmount) || 0;
        });
      }
    });

    const profit = totalParticipantMoney - totalPrizeMoneyGiven;

    // Growth chart data (monthly)
    const monthlyGrowth = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      players: [0, 0, 0, 0, 0, 0, 0],
      tournaments: [0, 0, 0, 0, 0, 0, 0]
    };

    return {
      totalUsers,
      activeTournaments,
      liveMatches,
      totalRevenue: totalParticipantMoney,
      totalPrizeGiven: totalPrizeMoneyGiven,
      profit,
      tournamentStatusBreakdown: { upcoming, live, completed },
      monthlyGrowth
    };
  };

  if (mongoose.connection.readyState !== 1) {
    const stats = getDevStats();
    return res.status(200).json(new ApiResponse(200, stats, 'Dashboard stats retrieved (Dev Mode)'));
  }

  try {
    // Total registered users
    const totalUsers = await User.countDocuments({ status: 'ACTIVE' });

    // Active tournaments
    const activeTournaments = await Tournament.countDocuments({ 
      status: { $in: ['UPCOMING', 'LIVE'] } 
    });
    const liveMatches = await Tournament.countDocuments({ status: 'LIVE' });

    // Tournament status breakdown
    const upcoming = await Tournament.countDocuments({ status: 'UPCOMING' });
    const live = await Tournament.countDocuments({ status: 'LIVE' });
    const completed = await Tournament.countDocuments({ status: 'COMPLETED' });

    // Calculate revenue
    let totalParticipantMoney = 0;
    let totalPrizeMoneyGiven = 0;

    // Sum all approved payments
    const payments = await Payment.find({ status: 'APPROVED' });
    payments.forEach(p => {
      totalParticipantMoney += Number(p.amount) || 0;
    });

    // Sum all prize money from results
    const results = await Result.find({});
    results.forEach(r => {
      if (r.rankings && Array.isArray(r.rankings)) {
        r.rankings.forEach(winner => {
          totalPrizeMoneyGiven += Number(winner.prizeAmount) || 0;
        });
      }
    });

    const profit = totalParticipantMoney - totalPrizeMoneyGiven;

    // Growth chart data (simplified for now)
    const monthlyGrowth = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      players: [totalUsers, 0, 0, 0, 0, 0, 0],
      tournaments: [activeTournaments, 0, 0, 0, 0, 0, 0]
    };

    const stats = {
      totalUsers,
      activeTournaments,
      liveMatches,
      totalRevenue: totalParticipantMoney,
      totalPrizeGiven: totalPrizeMoneyGiven,
      profit,
      tournamentStatusBreakdown: { upcoming, live, completed },
      monthlyGrowth
    };

    return res.status(200).json(new ApiResponse(200, stats, 'Dashboard stats retrieved successfully'));
  } catch (error) {
    const stats = getDevStats();
    return res.status(200).json(new ApiResponse(200, stats, 'Dashboard stats retrieved (Dev Mode)'));
  }
});

module.exports = {
  getAllUsers,
  updateUserStatusOrRole,
  getDisputes,
  updateDisputeStatus,
  getDashboardStats,
};
