const mongoose = require('mongoose');
const Tournament = require('../models/tournamentModel');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { validateTournamentInput } = require('../validators/tournamentValidator');
const { createPersistentStore } = require('../utils/persistentStore');

// Persistent JSON file-backed tournament store — survives server restarts
// Data is written to backend/data/tournaments.json on every mutation
const mockTournaments = createPersistentStore('tournaments', []);

const getFilteredMockList = (status, game, search) => {
  let list = Array.from(mockTournaments.values());
  if (status && status !== 'ALL') {
    list = list.filter((t) => t.status === status.toUpperCase());
  }
  if (game && game !== 'ALL') {
    list = list.filter((t) => t.game.toLowerCase().includes(game.toLowerCase()));
  }
  if (search) {
    list = list.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));
  }
  return list;
};

/**
 * @desc    Create a new tournament
 * @route   POST /api/v1/tournaments
 * @access  Private (Admin / Organizer)
 */
const createTournament = asyncHandler(async (req, res) => {
  const {
    title,
    game,
    mode,
    entryFee,
    prizePool,
    winnerCount,
    prizeBreakdown,
    slots,
    date,
    time,
    map,
    bannerImage,
    description,
  } = req.body;

  const { isValid, errors } = validateTournamentInput(req.body);
  if (!isValid) {
    throw new ApiError(400, 'Validation Error', errors);
  }

  const parsedWinnerCount = ['1', '2', '3'].includes(String(winnerCount)) ? String(winnerCount) : '3';
  const parsedBreakdown = prizeBreakdown || { first: 0, second: 0, third: 0 };

  if (mongoose.connection.readyState !== 1) {
    const mockId = 'mock-t-' + Date.now();
    const mockObj = {
      _id: mockId,
      title,
      game,
      mode: mode || 'SQUAD',
      entryFee: Number(entryFee) || 0,
      prizePool,
      winnerCount: parsedWinnerCount,
      prizeBreakdown: parsedBreakdown,
      slots: Number(slots),
      filledSlots: 0,
      date,
      time,
      map: map || 'TBD',
      status: 'UPCOMING',
      registrationOpen: true,
      roomID: '',
      password: '',
      bannerImage: bannerImage || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
      description: description || 'Official Esports Tournament.',
      createdAt: new Date(),
    };
    mockTournaments.set(mockId, mockObj);
    return res
      .status(201)
      .json(new ApiResponse(201, mockObj, 'Tournament created successfully'));
  }

  try {
    const tournament = await Tournament.create({
      title,
      game,
      mode: mode || 'SQUAD',
      entryFee: entryFee || 0,
      prizePool,
      winnerCount: parsedWinnerCount,
      prizeBreakdown: parsedBreakdown,
      slots: Number(slots),
      filledSlots: 0,
      date,
      time,
      map: map || 'TBD',
      bannerImage: bannerImage || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
      description: description || 'Official Esports Tournament.',
      createdBy: req.user?._id,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, tournament, 'Tournament created successfully'));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // Fallback for dev mode
    const mockId = 'mock-t-' + Date.now();
    const mockObj = {
      _id: mockId,
      title,
      game,
      mode: mode || 'SQUAD',
      entryFee: Number(entryFee) || 0,
      prizePool,
      winnerCount: parsedWinnerCount,
      prizeBreakdown: parsedBreakdown,
      slots: Number(slots),
      filledSlots: 0,
      date,
      time,
      map: map || 'TBD',
      status: 'UPCOMING',
      registrationOpen: true,
      roomID: '',
      password: '',
      bannerImage: bannerImage || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
      description: description || 'Official Esports Tournament.',
      createdAt: new Date(),
    };
    mockTournaments.set(mockId, mockObj);
    return res
      .status(201)
      .json(new ApiResponse(201, mockObj, 'Tournament created successfully'));
  }
});

/**
 * @desc    Get all tournaments with filtering, search, status tabs
 * @route   GET /api/v1/tournaments
 * @access  Public
 */
const getAllTournaments = asyncHandler(async (req, res) => {
  const { status, game, search } = req.query;

  if (mongoose.connection.readyState !== 1) {
    const { createPersistentStore } = require('../utils/persistentStore');
    const freshMockRegs = createPersistentStore('registrations', []);
    let list = getFilteredMockList(status, game, search);

    list = list.map((t) => {
      const activeRegCount = Array.from(freshMockRegs.values()).filter(
        (r) => String(r.tournament?._id || r.tournament?.id || r.tournament) === String(t._id || t.id) && r.status !== 'CANCELLED'
      ).length;
      return { ...t, filledSlots: Math.max(t.filledSlots || 0, activeRegCount) };
    });

    return res
      .status(200)
      .json(new ApiResponse(200, list, 'Tournaments retrieved successfully'));
  }

  try {
    const query = {};
    if (status && status !== 'ALL') {
      query.status = status.toUpperCase();
    }
    if (game && game !== 'ALL') {
      query.game = { $regex: game, $options: 'i' };
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { game: { $regex: search, $options: 'i' } },
      ];
    }

    const Registration = require('../models/registrationModel');
    const tournaments = await Tournament.find(query).sort({ createdAt: -1 });

    const populatedList = await Promise.all(
      tournaments.map(async (t) => {
        const count = await Registration.countDocuments({ tournament: t._id, status: { $ne: 'CANCELLED' } });
        const obj = t.toObject ? t.toObject() : t;
        obj.filledSlots = Math.max(obj.filledSlots || 0, count);
        return obj;
      })
    );

    return res
      .status(200)
      .json(new ApiResponse(200, populatedList, 'Tournaments retrieved successfully'));
  } catch (error) {
    const { createPersistentStore } = require('../utils/persistentStore');
    const freshMockRegs = createPersistentStore('registrations', []);
    let list = getFilteredMockList(status, game, search);

    list = list.map((t) => {
      const activeRegCount = Array.from(freshMockRegs.values()).filter(
        (r) => String(r.tournament?._id || r.tournament?.id || r.tournament) === String(t._id || t.id) && r.status !== 'CANCELLED'
      ).length;
      return { ...t, filledSlots: Math.max(t.filledSlots || 0, activeRegCount) };
    });

    return res
      .status(200)
      .json(new ApiResponse(200, list, 'Tournaments retrieved successfully'));
  }
});

/**
 * @desc    Get single tournament details
 * @route   GET /api/v1/tournaments/:id
 * @access  Public
 */
const getTournamentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (mongoose.connection.readyState !== 1) {
    const { createPersistentStore } = require('../utils/persistentStore');
    const freshMockStore = createPersistentStore('tournaments', []);
    const freshMockRegs = createPersistentStore('registrations', []);

    const mockObj = freshMockStore.get(id) || mockTournaments.get(id) || Array.from(freshMockStore.values())[0];
    if (!mockObj) throw new ApiError(404, 'Tournament not found');

    const activeRegCount = Array.from(freshMockRegs.values()).filter(
      (r) => String(r.tournament?._id || r.tournament?.id || r.tournament) === String(id) && r.status !== 'CANCELLED'
    ).length;
    mockObj.filledSlots = Math.max(mockObj.filledSlots || 0, activeRegCount);

    const sanitized = await sanitizeRoomCredentials(mockObj, req.user);
    return res
      .status(200)
      .json(new ApiResponse(200, sanitized, 'Tournament details retrieved'));
  }

  try {
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      throw new ApiError(404, 'Tournament not found');
    }

    const Registration = require('../models/registrationModel');
    const dbRegCount = await Registration.countDocuments({ tournament: id, status: { $ne: 'CANCELLED' } });
    tournament.filledSlots = Math.max(tournament.filledSlots || 0, dbRegCount);

    const sanitized = await sanitizeRoomCredentials(tournament, req.user);
    return res
      .status(200)
      .json(new ApiResponse(200, sanitized, 'Tournament details retrieved'));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const { createPersistentStore } = require('../utils/persistentStore');
    const freshMockStore = createPersistentStore('tournaments', []);
    const freshMockRegs = createPersistentStore('registrations', []);

    const mockObj = freshMockStore.get(id) || mockTournaments.get(id) || Array.from(freshMockStore.values())[0];
    if (!mockObj) throw new ApiError(404, 'Tournament not found');

    const activeRegCount = Array.from(freshMockRegs.values()).filter(
      (r) => String(r.tournament?._id || r.tournament?.id || r.tournament) === String(id) && r.status !== 'CANCELLED'
    ).length;
    mockObj.filledSlots = Math.max(mockObj.filledSlots || 0, activeRegCount);

    const sanitized = await sanitizeRoomCredentials(mockObj, req.user);
    return res
      .status(200)
      .json(new ApiResponse(200, sanitized, 'Tournament details retrieved'));
  }
});



/**
 * @desc    Update tournament details & room credentials
 * @route   PUT /api/v1/tournaments/:id
 * @access  Private (Admin / Organizer)
 */
const updateTournament = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (mongoose.connection.readyState !== 1) {
    const mockObj = mockTournaments.get(id);
    if (mockObj) {
      Object.assign(mockObj, req.body);
      mockTournaments.set(id, mockObj);
      return res
        .status(200)
        .json(new ApiResponse(200, mockObj, 'Tournament updated successfully'));
    }
  }

  try {
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      throw new ApiError(404, 'Tournament not found');
    }

    Object.assign(tournament, req.body);
    await tournament.save();

    return res
      .status(200)
      .json(new ApiResponse(200, tournament, 'Tournament updated successfully'));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const mockObj = mockTournaments.get(id);
    if (mockObj) {
      Object.assign(mockObj, req.body);
      mockTournaments.set(id, mockObj);
      return res
        .status(200)
        .json(new ApiResponse(200, mockObj, 'Tournament updated successfully'));
    }
    throw error;
  }
});

/**
 * @desc    Delete a tournament
 * @route   DELETE /api/v1/tournaments/:id
 * @access  Private (Admin / Organizer)
 */
const deleteTournament = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (mongoose.connection.readyState !== 1) {
    mockTournaments.delete(id);
    return res
      .status(200)
      .json(new ApiResponse(200, null, 'Tournament deleted successfully'));
  }

  try {
    const tournament = await Tournament.findByIdAndDelete(id);
    if (!tournament) {
      throw new ApiError(404, 'Tournament not found');
    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, 'Tournament deleted successfully'));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    mockTournaments.delete(id);
    return res
      .status(200)
      .json(new ApiResponse(200, null, 'Tournament deleted successfully'));
  }
});

/**
 * @desc    Quick status and registration toggle
 * @route   PATCH /api/v1/tournaments/:id/status
 * @access  Private (Admin / Organizer)
 */
const updateTournamentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, registrationOpen } = req.body;

  if (mongoose.connection.readyState !== 1) {
    const mockObj = mockTournaments.get(id);
    if (mockObj) {
      if (status) mockObj.status = status;
      if (registrationOpen !== undefined) mockObj.registrationOpen = registrationOpen;
      return res
        .status(200)
        .json(new ApiResponse(200, mockObj, 'Tournament status updated'));
    }
  }

  try {
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      throw new ApiError(404, 'Tournament not found');
    }

    if (status) tournament.status = status;
    if (registrationOpen !== undefined) tournament.registrationOpen = registrationOpen;

    await tournament.save();

    return res
      .status(200)
      .json(new ApiResponse(200, tournament, 'Tournament status updated'));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const mockObj = mockTournaments.get(id);
    if (mockObj) {
      if (status) mockObj.status = status;
      if (registrationOpen !== undefined) mockObj.registrationOpen = registrationOpen;
      return res
        .status(200)
        .json(new ApiResponse(200, mockObj, 'Tournament status updated'));
    }
    throw error;
  }
});

/**
 * Helper to check if a user has an approved (CONFIRMED) registration for a tournament
 */
const isUserApprovedForTournament = async (userId, tournamentId) => {
  if (!userId || !tournamentId) return false;

  if (mongoose.connection.readyState === 1) {
    const Registration = require('../models/registrationModel');
    const reg = await Registration.findOne({
      user: userId,
      tournament: tournamentId,
      status: 'CONFIRMED',
    });
    return !!reg;
  } else {
    const { createPersistentStore } = require('../utils/persistentStore');
    const mockRegistrations = createPersistentStore('registrations', []);
    const regKey = `${userId}-${tournamentId}`;
    const mockReg = mockRegistrations.get(regKey);
    if (mockReg && mockReg.status === 'CONFIRMED') {
      return true;
    }
    for (const [, r] of mockRegistrations.entries()) {
      const uId = String(r.user?._id || r.user?.id || r.user || '');
      const tId = String(r.tournament?._id || r.tournament?.id || r.tournament || '');
      if (uId === String(userId) && tId === String(tournamentId) && r.status === 'CONFIRMED') {
        return true;
      }
    }
    return false;
  }
};


/**
 * Sanitize tournament output to hide room credentials unless authorized
 */
const sanitizeRoomCredentials = async (tournament, reqUser) => {
  if (!tournament) return tournament;
  const tourneyObj = typeof tournament.toObject === 'function' ? tournament.toObject() : { ...tournament };

  const isAdmin = reqUser && (reqUser.role === 'ADMIN' || reqUser.role === 'ORGANIZER');
  if (isAdmin) {
    return tourneyObj;
  }

  // Non-admin logic: check visibility AND registration approval
  const isVisible = tourneyObj.roomVisible === true;
  const userId = reqUser?._id || reqUser?.id;
  const isApproved = userId ? await isUserApprovedForTournament(userId, tourneyObj._id) : false;

  if (isVisible && isApproved) {
    // Delivered safely to approved user
    return tourneyObj;
  }

  // Mask credentials for unauthorized, pending, or unapproved users
  tourneyObj.roomID = '';
  tourneyObj.password = '';
  delete tourneyObj.roomAuditLog;
  return tourneyObj;
};

/**
 * @desc    Upload or update Room ID & Password (Admin/Organizer)
 * @route   PATCH /api/v1/tournaments/:id/room
 * @access  Private (Admin / Organizer)
 */
const updateRoomCredentials = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { roomID, password } = req.body;
  const adminId = req.user?._id || req.user?.id || 'admin';
  const adminEmail = req.user?.email || 'admin@esports.com';

  const auditEntry = {
    adminId: String(adminId),
    adminEmail,
    action: 'UPDATED_CREDENTIALS',
    timestamp: new Date(),
    details: `Updated Room ID to "${roomID || ''}"`,
  };

  if (mongoose.connection.readyState !== 1) {
    const mockObj = mockTournaments.get(id);
    if (!mockObj) throw new ApiError(404, 'Tournament not found');

    if (roomID !== undefined) mockObj.roomID = roomID.trim();
    if (password !== undefined) mockObj.password = password.trim();
    if (mockObj.roomVisible === undefined) mockObj.roomVisible = false;

    if (!mockObj.roomAuditLog) mockObj.roomAuditLog = [];
    mockObj.roomAuditLog.push(auditEntry);

    mockTournaments.set(id, mockObj);
    return res
      .status(200)
      .json(new ApiResponse(200, mockObj, 'Room credentials saved in database (Hidden until release/15-min start)'));
  }

  try {
    const tournament = await Tournament.findById(id);
    if (!tournament) throw new ApiError(404, 'Tournament not found');

    if (roomID !== undefined) tournament.roomID = roomID.trim();
    if (password !== undefined) tournament.password = password.trim();
    if (tournament.roomVisible === undefined) tournament.roomVisible = false;

    tournament.roomAuditLog.push(auditEntry);
    await tournament.save();

    return res
      .status(200)
      .json(new ApiResponse(200, tournament, 'Room credentials saved in database (Hidden until release/15-min start)'));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const mockObj = mockTournaments.get(id);
    if (mockObj) {
      if (roomID !== undefined) mockObj.roomID = roomID.trim();
      if (password !== undefined) mockObj.password = password.trim();
      if (!mockObj.roomAuditLog) mockObj.roomAuditLog = [];
      mockObj.roomAuditLog.push(auditEntry);
      mockTournaments.set(id, mockObj);
      return res.status(200).json(new ApiResponse(200, mockObj, 'Room credentials saved in database'));
    }
    throw error;
  }
});

/**
 * @desc    Instantly release room details to approved players (Admin/Organizer)
 * @route   PATCH /api/v1/tournaments/:id/room/release
 * @access  Private (Admin / Organizer)
 */
const releaseRoomNow = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user?._id || req.user?.id || 'admin';
  const adminEmail = req.user?.email || 'admin@esports.com';

  const auditEntry = {
    adminId: String(adminId),
    adminEmail,
    action: 'RELEASED_ROOM_MANUAL',
    timestamp: new Date(),
    details: 'Manual "Release Now" triggered by Admin',
  };

  if (mongoose.connection.readyState !== 1) {
    const mockObj = mockTournaments.get(id);
    if (!mockObj) throw new ApiError(404, 'Tournament not found');

    mockObj.roomVisible = true;
    if (!mockObj.roomAuditLog) mockObj.roomAuditLog = [];
    mockObj.roomAuditLog.push(auditEntry);
    mockTournaments.set(id, mockObj);

    // Dispatch notifications to all confirmed players of this tournament
    const { createPersistentStore } = require('../utils/persistentStore');
    const { sendUserNotification } = require('./notificationController');
    const mockRegistrations = createPersistentStore('registrations', []);

    for (const [, r] of mockRegistrations.entries()) {
      const isMatch = String(r.tournament?._id || r.tournament?.id || r.tournament) === String(id);
      if (isMatch && (r.status === 'CONFIRMED' || r.status === 'APPROVED')) {
        sendUserNotification({
          userId: r.user?._id || r.user?.id || r.user,
          userEmail: r.userEmail || r.user?.email || '',
          title: 'Match Lobby Released 🗝️',
          message: `Room ID: ${mockObj.roomID || 'ROOM-882190'} | Pass: ${mockObj.password || 'PASS-9901'} for "${mockObj.title}". Join lobby now!`,
          type: 'ROOM_RELEASED',
        });
      }
    }

    return res
      .status(200)
      .json(new ApiResponse(200, mockObj, 'Room released! Now visible exclusively to approved participants.'));
  }

  try {
    const tournament = await Tournament.findById(id);
    if (!tournament) throw new ApiError(404, 'Tournament not found');

    tournament.roomVisible = true;
    tournament.roomAuditLog.push(auditEntry);
    await tournament.save();

    return res
      .status(200)
      .json(new ApiResponse(200, tournament, 'Room released! Now visible exclusively to approved participants.'));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const mockObj = mockTournaments.get(id);
    if (mockObj) {
      mockObj.roomVisible = true;
      if (!mockObj.roomAuditLog) mockObj.roomAuditLog = [];
      mockObj.roomAuditLog.push(auditEntry);
      mockTournaments.set(id, mockObj);
      return res.status(200).json(new ApiResponse(200, mockObj, 'Room released!'));
    }
    throw error;
  }
});

/**
 * @desc    Get secure match room credentials
 * @route   GET /api/v1/tournaments/:id/room-credentials
 * @access  Private (Authenticated Users)
 */
const getRoomCredentials = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?._id || req.user?.id;
  const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'ORGANIZER';

  let tournament = null;
  if (mongoose.connection.readyState === 1) {
    tournament = await Tournament.findById(id);
  } else {
    tournament = mockTournaments.get(id) || Array.from(mockTournaments.values())[0];
  }

  if (!tournament) {
    throw new ApiError(404, 'Tournament not found');
  }

  const { calculateRoomUnlockState } = require('../utils/timeUtils');
  const { isUnlocked: is15MinUnlocked, unlockTimeRemainingMs } = calculateRoomUnlockState(
    tournament.date,
    tournament.time
  );

  // Check registration approval
  const isApproved = userId ? await isUserApprovedForTournament(userId, tournament._id) : false;

  // Final Visibility Criteria:
  // Admin -> YES
  // Player -> (roomVisible OR 15MinUnlocked OR status === 'LIVE') AND isApproved === true
  const isRoomVisible = tournament.roomVisible === true || is15MinUnlocked || tournament.status === 'LIVE';
  const canViewCredentials = isAdmin || (isRoomVisible && isApproved);

  if (!canViewCredentials) {
    let message = 'Room credentials hidden. ';
    if (!isApproved) {
      message += 'Your tournament registration must be Approved (CONFIRMED) by admin to view room details.';
    } else {
      message += 'Credentials will auto-release 15 minutes before match start or when released by Admin.';
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          isUnlocked: false,
          roomVisible: tournament.roomVisible || false,
          isApproved,
          roomID: '',
          password: '',
          unlockTimeRemainingMs,
          message,
        },
        'Credentials locked / restricted'
      )
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isUnlocked: true,
        roomVisible: true,
        isApproved,
        roomID: tournament.roomID || '',
        password: tournament.password || '',
        unlockTimeRemainingMs: 0,
        message: 'Match Room Credentials unlocked!',
      },
      'Credentials unlocked'
    )
  );
});

module.exports = {
  createTournament,
  getAllTournaments,
  getTournamentById,
  updateTournament,
  deleteTournament,
  updateTournamentStatus,
  updateRoomCredentials,
  releaseRoomNow,
  getRoomCredentials,
};

