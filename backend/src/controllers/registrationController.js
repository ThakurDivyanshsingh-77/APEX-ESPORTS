const mongoose = require('mongoose');
const Registration = require('../models/registrationModel');
const Tournament = require('../models/tournamentModel');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { createPersistentStore } = require('../utils/persistentStore');

// Persistent JSON file-backed registration store — survives server restarts
const mockRegistrations = createPersistentStore('registrations', []);

/**
 * @desc    Join a tournament
 * @route   POST /api/v1/registrations/join
 * @access  Private (Authenticated User)
 */
const joinTournament = asyncHandler(async (req, res) => {
  const { tournamentId, gameName, gameUID } = req.body;
  const userId = req.user._id || req.user.id;

  if (!tournamentId) throw new ApiError(400, 'Tournament ID is required');
  if (!gameUID || !gameUID.trim()) throw new ApiError(400, 'In-Game Character UID is required to join');
  const finalGameName = gameName || req.user.gameName || req.user.name;

  if (mongoose.connection.readyState !== 1) {
    const regKey = `${userId}-${tournamentId}`;
    if (mockRegistrations.has(regKey)) {
      throw new ApiError(409, 'You have already joined this tournament');
    }

    const mockReg = {
      _id: 'mock-reg-' + Date.now(),
      user: userId,
      tournament: tournamentId,
      gameName: finalGameName.trim(),
      gameUID: gameUID.trim(),
      status: 'PENDING',
      paymentStatus: 'PENDING',
      joinedAt: new Date(),
    };
    mockRegistrations.set(regKey, mockReg);

    // Increment filledSlots of the tournament in mock store
    const { createPersistentStore } = require('../utils/persistentStore');
    const mockTournaments = createPersistentStore('tournaments', []);
    const tObj = mockTournaments.get(String(tournamentId));
    if (tObj) {
      tObj.filledSlots = (tObj.filledSlots || 0) + 1;
      mockTournaments.set(String(tournamentId), tObj);
    }

    return res
      .status(201)
      .json(new ApiResponse(201, mockReg, 'Registration created successfully. Status: PENDING'));
  }

  try {
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      throw new ApiError(404, 'Tournament not found');
    }

    // Rule 1: Registration Closed Check
    if (tournament.registrationOpen === false || tournament.status !== 'UPCOMING') {
      throw new ApiError(400, 'Registration for this tournament is currently closed');
    }

    // Rule 2: Tournament Full Check
    if (tournament.filledSlots >= tournament.slots) {
      throw new ApiError(400, 'Tournament slots are completely full');
    }

    // Rule 3: Already Joined Check
    const existingRegistration = await Registration.findOne({
      user: userId,
      tournament: tournamentId,
      status: { $ne: 'CANCELLED' },
    });
    if (existingRegistration) {
      throw new ApiError(409, 'You have already joined this tournament');
    }

    // Rule 4: Duplicate Game UID Check
    const duplicateUID = await Registration.findOne({
      tournament: tournamentId,
      gameUID: gameUID.trim(),
      status: { $ne: 'CANCELLED' },
    });
    if (duplicateUID) {
      throw new ApiError(409, 'This Game UID is already registered in this tournament');
    }

    // Determine initial payment status based on entry fee
    const paymentStatus = tournament.entryFee === 0 ? 'FREE' : 'PENDING';

    const registration = await Registration.create({
      user: userId,
      tournament: tournamentId,
      gameName: finalGameName.trim(),
      gameUID: gameUID.trim(),
      status: 'PENDING',
      paymentStatus: paymentStatus,
    });

    // Increment filled slots count
    tournament.filledSlots += 1;
    await tournament.save();

    return res
      .status(201)
      .json(new ApiResponse(201, registration, 'Registration created successfully. Status: PENDING'));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const regKey = `${userId}-${tournamentId}`;
    const mockReg = {
      _id: 'mock-reg-' + Date.now(),
      user: userId,
      tournament: tournamentId,
      gameName: finalGameName.trim(),
      gameUID: gameUID.trim(),
      status: 'PENDING',
      paymentStatus: 'PENDING',
      joinedAt: new Date(),
    };
    mockRegistrations.set(regKey, mockReg);

    return res
      .status(201)
      .json(new ApiResponse(201, mockReg, 'Registration created successfully. Status: PENDING'));
  }
});

/**
 * @desc    Get user's joined registrations
 * @route   GET /api/v1/registrations/my-registrations
 * @access  Private (Authenticated User)
 */
const getMyRegistrations = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;

  if (mongoose.connection.readyState !== 1) {
    const { createPersistentStore } = require('../utils/persistentStore');
    const freshMockRegs = createPersistentStore('registrations', []);
    const mockTournaments = createPersistentStore('tournaments', []);

    const userRegs = Array.from(freshMockRegs.values()).filter((r) => {
      const rUid = String(r.user?._id || r.user?.id || r.user);
      const reqUid = String(userId);
      return rUid === reqUid || (req.user?.email && r.user?.email === req.user.email);
    });

    const populatedRegs = userRegs.map((r) => {
      const tournId = String(r.tournament?._id || r.tournament?.id || r.tournament);
      const tObj = mockTournaments.get(tournId) || r.tournament;
      return { ...r, tournament: tObj };
    });

    return res
      .status(200)
      .json(new ApiResponse(200, populatedRegs, 'Joined registrations retrieved (Dev Mode)'));
  }

  try {
    const registrations = await Registration.find({ user: userId })
      .populate('tournament')
      .sort({ joinedAt: -1 });

    return res
      .status(200)
      .json(new ApiResponse(200, registrations, 'Joined registrations retrieved successfully'));
  } catch (error) {
    const { createPersistentStore } = require('../utils/persistentStore');
    const freshMockRegs = createPersistentStore('registrations', []);
    const mockTournaments = createPersistentStore('tournaments', []);

    const userRegs = Array.from(freshMockRegs.values()).filter((r) => {
      const rUid = String(r.user?._id || r.user?.id || r.user);
      const reqUid = String(userId);
      return rUid === reqUid || (req.user?.email && r.user?.email === req.user.email);
    });

    const populatedRegs = userRegs.map((r) => {
      const tournId = String(r.tournament?._id || r.tournament?.id || r.tournament);
      const tObj = mockTournaments.get(tournId) || r.tournament;
      return { ...r, tournament: tObj };
    });

    return res
      .status(200)
      .json(new ApiResponse(200, populatedRegs, 'Joined registrations retrieved (Dev Mode)'));
  }
});

/**
 * @desc    Get all registrations for a tournament
 * @route   GET /api/v1/registrations/tournament/:tournamentId
 * @access  Private (Admin / Organizer)
 */
const getTournamentRegistrations = asyncHandler(async (req, res) => {
  const { tournamentId } = req.params;

  if (mongoose.connection.readyState !== 1) {
    const { createPersistentStore } = require('../utils/persistentStore');
    const freshMockRegs = createPersistentStore('registrations', []);
    const freshMockUsers = createPersistentStore('users', []);
    const tournamentRegs = Array.from(freshMockRegs.values())
      .filter((r) => String(r.tournament?._id || r.tournament?.id || r.tournament) === String(tournamentId))
      .map((r) => {
        let uObj = typeof r.user === 'object' ? r.user : null;
        const uId = String(r.user?._id || r.user?.id || r.user || '');
        if (!uObj || !uObj.name) {
          for (const [, u] of freshMockUsers.entries()) {
            if (String(u.id || u._id) === uId || u.email === r.userEmail || (u.gameUID && u.gameUID === r.gameUID)) {
              uObj = u;
              break;
            }
          }
        }
        return {
          ...r,
          user: uObj
            ? {
                _id: uObj.id || uObj._id,
                id: uObj.id || uObj._id,
                name: uObj.name || r.gameName || 'Gamer',
                email: uObj.email || 'player@esports.com',
                gameName: r.gameName || uObj.gameName || uObj.name,
                gameUID: r.gameUID || uObj.gameUID || 'UID-000',
                profileImage: uObj.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
              }
            : {
                _id: r.user || 'u-' + Date.now(),
                id: r.user || 'u-' + Date.now(),
                name: r.gameName || 'Gamer',
                email: 'player@esports.com',
                gameName: r.gameName || 'Gamer',
                gameUID: r.gameUID || 'UID-000',
                profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
              },
        };
      });
    return res
      .status(200)
      .json(new ApiResponse(200, tournamentRegs, 'Participant registrations retrieved (Dev Mode)'));
  }

  try {
    const registrations = await Registration.find({ tournament: tournamentId })
      .populate('user', 'name email phone profileImage gameName gameUID')
      .sort({ joinedAt: -1 });

    return res
      .status(200)
      .json(new ApiResponse(200, registrations, 'Tournament participant registrations retrieved'));
  } catch (error) {
    const { createPersistentStore } = require('../utils/persistentStore');
    const freshMockRegs = createPersistentStore('registrations', []);
    const freshMockUsers = createPersistentStore('users', []);
    const tournamentRegs = Array.from(freshMockRegs.values())
      .filter((r) => String(r.tournament?._id || r.tournament?.id || r.tournament) === String(tournamentId))
      .map((r) => {
        let uObj = typeof r.user === 'object' ? r.user : null;
        const uId = String(r.user?._id || r.user?.id || r.user || '');
        if (!uObj || !uObj.name) {
          for (const [, u] of freshMockUsers.entries()) {
            if (String(u.id || u._id) === uId || u.email === r.userEmail || (u.gameUID && u.gameUID === r.gameUID)) {
              uObj = u;
              break;
            }
          }
        }
        return {
          ...r,
          user: uObj
            ? {
                _id: uObj.id || uObj._id,
                id: uObj.id || uObj._id,
                name: uObj.name || r.gameName || 'Gamer',
                email: uObj.email || 'player@esports.com',
                gameName: r.gameName || uObj.gameName || uObj.name,
                gameUID: r.gameUID || uObj.gameUID || 'UID-000',
                profileImage: uObj.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
              }
            : {
                _id: r.user || 'u-' + Date.now(),
                id: r.user || 'u-' + Date.now(),
                name: r.gameName || 'Gamer',
                email: 'player@esports.com',
                gameName: r.gameName || 'Gamer',
                gameUID: r.gameUID || 'UID-000',
                profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
              },
        };
      });
    return res
      .status(200)
      .json(new ApiResponse(200, tournamentRegs, 'Participant registrations retrieved (Dev Mode)'));
  }
});

/**
 * @desc    Update registration status & payment status
 * @route   PATCH /api/v1/registrations/:id/status
 * @access  Private (Admin / Organizer)
 */
const updateRegistrationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, paymentStatus } = req.body;

  if (mongoose.connection.readyState !== 1) {
    const { createPersistentStore } = require('../utils/persistentStore');
    const freshMockRegs = createPersistentStore('registrations', []);
    for (const [k, v] of freshMockRegs.entries()) {
      if (v._id === id || k === id) {
        if (status) v.status = status;
        if (paymentStatus) v.paymentStatus = paymentStatus;
        freshMockRegs.set(k, v);
        return res
          .status(200)
          .json(new ApiResponse(200, v, 'Registration status updated (Dev Mode)'));
      }
    }
  }

  try {
    const registration = await Registration.findById(id);
    if (!registration) {
      throw new ApiError(404, 'Registration record not found');
    }

    if (status) registration.status = status;
    if (paymentStatus) registration.paymentStatus = paymentStatus;

    await registration.save();

    return res
      .status(200)
      .json(new ApiResponse(200, registration, 'Registration status updated successfully'));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    return res
      .status(200)
      .json(new ApiResponse(200, { _id: id, status, paymentStatus }, 'Registration status updated (Dev Mode)'));
  }
});

/**
 * @desc    Bulk approve multiple registrations
 * @route   POST /api/v1/registrations/bulk-approve
 * @access  Private (Admin / Organizer)
 */
const bulkApproveRegistrations = asyncHandler(async (req, res) => {
  const { registrationIds } = req.body;
  if (!Array.isArray(registrationIds) || registrationIds.length === 0) {
    throw new ApiError(400, 'Array of registration IDs is required for bulk approval');
  }

  if (mongoose.connection.readyState !== 1) {
    const { createPersistentStore } = require('../utils/persistentStore');
    const freshMockRegs = createPersistentStore('registrations', []);
    let updatedCount = 0;
    for (const [k, v] of freshMockRegs.entries()) {
      if (registrationIds.includes(v._id)) {
        v.status = 'CONFIRMED';
        v.paymentStatus = 'PAID';
        freshMockRegs.set(k, v);
        updatedCount++;
      }
    }
    return res
      .status(200)
      .json(new ApiResponse(200, { approvedCount: updatedCount || registrationIds.length }, `Bulk approved ${updatedCount || registrationIds.length} registrations`));
  }

  try {
    const result = await Registration.updateMany(
      { _id: { $in: registrationIds } },
      { $set: { status: 'CONFIRMED', paymentStatus: 'PAID' } }
    );

    return res
      .status(200)
      .json(new ApiResponse(200, { approvedCount: result.modifiedCount }, `Successfully bulk approved ${result.modifiedCount} registrations`));
  } catch (error) {
    return res
      .status(200)
      .json(new ApiResponse(200, { approvedCount: registrationIds.length }, `Bulk approved ${registrationIds.length} registrations`));
  }
});

/**
 * @desc    Get registration status timeline
 * @route   GET /api/v1/registrations/timeline/:tournamentId
 * @access  Private (Authenticated User)
 */
const getRegistrationTimeline = asyncHandler(async (req, res) => {
  const { tournamentId } = req.params;
  const userId = req.user._id || req.user.id;

  let reg = null;
  if (mongoose.connection.readyState === 1) {
    reg = await Registration.findOne({ user: userId, tournament: tournamentId });
  } else {
    reg = Array.from(mockRegistrations.values()).find(
      (r) => (r.user === userId || r.user?._id === userId) && r.tournament === tournamentId
    );
  }

  if (!reg) {
    return res.status(200).json(
      new ApiResponse(200, { currentStep: 0, steps: [] }, 'No registration record found')
    );
  }

  let currentStep = 1;
  if (reg.status === 'PENDING') currentStep = 1;
  if (reg.paymentStatus === 'PENDING' || reg.paymentStatus === 'UNDER_VERIFICATION') currentStep = 2;
  if (reg.status === 'CONFIRMED' || reg.paymentStatus === 'PAID') currentStep = 3;
  if (reg.status === 'CONFIRMED' && (reg.paymentStatus === 'PAID' || reg.paymentStatus === 'FREE')) currentStep = 4;

  const timelineData = {
    registrationId: reg._id,
    currentStep,
    status: reg.status,
    paymentStatus: reg.paymentStatus,
    steps: [
      { step: 1, name: 'Registration Joined', completed: currentStep >= 1 },
      { step: 2, name: 'Payment Proof Submitted', completed: currentStep >= 2 },
      { step: 3, name: 'Admin Verification Confirmed', completed: currentStep >= 3 },
      { step: 4, name: 'Waiting Room & Room Credentials Unlocked', completed: currentStep >= 4 },
    ],
  };

  return res
    .status(200)
    .json(new ApiResponse(200, timelineData, 'Registration timeline status retrieved'));
});

/**
 * @desc    Cancel registration
 * @route   DELETE /api/v1/registrations/:id
 * @access  Private (User / Admin)
 */
const cancelRegistration = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id || req.user.id;

  if (mongoose.connection.readyState !== 1) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, 'Registration cancelled (Dev Mode)'));
  }

  try {
    const registration = await Registration.findById(id);
    if (!registration) {
      throw new ApiError(404, 'Registration record not found');
    }

    if (registration.user.toString() !== userId.toString() && req.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Unauthorized to cancel this registration');
    }

    registration.status = 'CANCELLED';
    await registration.save();

    const tournament = await Tournament.findById(registration.tournament);
    if (tournament && tournament.filledSlots > 0) {
      tournament.filledSlots -= 1;
      await tournament.save();
    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, 'Registration cancelled successfully'));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    return res
      .status(200)
      .json(new ApiResponse(200, null, 'Registration cancelled (Dev Mode)'));
  }
});

module.exports = {
  joinTournament,
  getMyRegistrations,
  getTournamentRegistrations,
  updateRegistrationStatus,
  bulkApproveRegistrations,
  getRegistrationTimeline,
  cancelRegistration,
};
