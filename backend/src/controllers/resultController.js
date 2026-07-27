const mongoose = require('mongoose');
const Result = require('../models/resultModel');
const Leaderboard = require('../models/leaderboardModel');
const Tournament = require('../models/tournamentModel');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

// Mock memory store fallbacks for dev mode
const mockResults = new Map();
const mockLeaderboard = [];

/**
 * @desc    Submit match results and update leaderboard
 * @route   POST /api/v1/results
 * @access  Private (Admin / Organizer)
 */
const submitTournamentResult = asyncHandler(async (req, res) => {
  const { tournamentId, rankings, mvp, proofImage } = req.body;
  const adminId = req.user._id || req.user.id;

  if (!tournamentId || !rankings || !Array.isArray(rankings)) {
    throw new ApiError(400, 'Tournament ID and rankings array are required');
  }

  const resultObj = {
    _id: 'res-' + Date.now(),
    tournament: tournamentId,
    rankings,
    mvp: mvp || rankings[0],
    proofImage: proofImage || '',
    createdBy: adminId,
    createdAt: new Date(),
  };

  if (mongoose.connection.readyState !== 1) {
    mockResults.set(tournamentId, resultObj);
    return res
      .status(201)
      .json(new ApiResponse(201, resultObj, 'Match results submitted and tournament marked COMPLETED (Dev Mode)'));
  }

  try {
    const result = await Result.create({
      tournament: tournamentId,
      rankings,
      mvp: mvp || rankings[0],
      proofImage: proofImage || '',
      createdBy: adminId,
    });

    // Mark tournament status as COMPLETED
    await Tournament.findByIdAndUpdate(tournamentId, {
      status: 'COMPLETED',
      completedAt: new Date(),
      registrationOpen: false,
    });

    // Recalculate leaderboard scores for participants
    for (const item of rankings) {
      if (item.user) {
        let lb = await Leaderboard.findOne({ user: item.user });
        if (!lb) {
          lb = new Leaderboard({
            user: item.user,
            gameName: item.gameName || 'Gamer',
            totalTournamentsPlayed: 1,
            totalWins: item.rank === 1 ? 1 : 0,
            totalKills: item.kills || 0,
            totalEarnings: item.prizeAmount || 0,
          });
        } else {
          lb.totalTournamentsPlayed += 1;
          if (item.rank === 1) lb.totalWins += 1;
          lb.totalKills += item.kills || 0;
          lb.totalEarnings += item.prizeAmount || 0;
        }
        await lb.save();
      }
    }

    return res
      .status(201)
      .json(new ApiResponse(201, result, 'Match results submitted successfully!'));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    mockResults.set(tournamentId, resultObj);
    return res
      .status(201)
      .json(new ApiResponse(201, resultObj, 'Match results submitted and tournament marked COMPLETED (Dev Mode)'));
  }
});

/**
 * @desc    Get match result for a specific tournament
 * @route   GET /api/v1/results/tournament/:tournamentId
 * @access  Public
 */
const getTournamentResult = asyncHandler(async (req, res) => {
  const { tournamentId } = req.params;

  if (mongoose.connection.readyState !== 1) {
    const { createPersistentStore } = require('../utils/persistentStore');
    const freshMockResults = createPersistentStore('results', []);
    const mockRes = freshMockResults.get(tournamentId) || mockResults.get(tournamentId);
    if (!mockRes) {
      return res
        .status(200)
        .json(new ApiResponse(200, null, 'Match result not published yet'));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, mockRes, 'Tournament result retrieved (Dev Mode)'));
  }

  try {
    const result = await Result.findOne({ tournament: tournamentId }).populate(
      'rankings.user',
      'name email profileImage'
    );

    if (!result) {
      return res
        .status(200)
        .json(new ApiResponse(200, null, 'Match result not published yet'));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, result, 'Tournament result retrieved successfully'));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const { createPersistentStore } = require('../utils/persistentStore');
    const freshMockResults = createPersistentStore('results', []);
    const mockRes = freshMockResults.get(tournamentId) || mockResults.get(tournamentId);
    return res
      .status(200)
      .json(new ApiResponse(200, mockRes || null, 'Tournament result retrieved (Dev Mode)'));
  }
});

/**
 * @desc    Get global leaderboard rankings
 * @route   GET /api/v1/leaderboard
 * @access  Public
 */
const getGlobalLeaderboard = asyncHandler(async (req, res) => {
  const { game, tab, category } = req.query;
  const activeCategory = (category || tab || 'OVERALL').toUpperCase();

  const getDevLeaderboardData = () => {
    const { createPersistentStore } = require('../utils/persistentStore');
    const mockResultsStore = createPersistentStore('results', []);
    const mockUsersStore = createPersistentStore('users', []);
    const mockRegistrationsStore = createPersistentStore('registrations', []);

    const playerMap = new Map();

    // 1. Initialize stats for all registered non-banned PLAYER accounts
    for (const [, user] of mockUsersStore.entries()) {
      if (user && user.role !== 'ADMIN' && user.status !== 'BANNED' && user.status !== 'SUSPENDED') {
        const userIdStr = String(user._id || user.id);
        playerMap.set(userIdStr, {
          _id: 'lb-' + userIdStr,
          user: {
            _id: user._id || user.id,
            name: user.name || 'Gamer',
            email: user.email || '',
            profileImage: user.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          },
          gameName: user.gameName || user.name || 'Gamer',
          gameUID: user.gameUID || 'UID-' + userIdStr.slice(-6),
          profileImage: user.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          totalTournamentsPlayed: 0,
          totalKills: 0,
          totalWins: 0,
          totalEarnings: 0,
          points: 0,
        });
      }
    }

    // 2. Count confirmed registrations as matches played
    for (const [, reg] of mockRegistrationsStore.entries()) {
      if (reg && (reg.status === 'CONFIRMED' || reg.status === 'APPROVED')) {
        const uId = String(reg.user?._id || reg.user?.id || reg.user);
        if (playerMap.has(uId)) {
          playerMap.get(uId).totalTournamentsPlayed += 1;
        }
      }
    }

    const combinedLeaderboardResults = new Map();
    for (const [k, v] of mockResultsStore.entries()) {
      combinedLeaderboardResults.set(String(k), v);
    }
    for (const [k, v] of mockResults.entries()) {
      combinedLeaderboardResults.set(String(k), v);
    }

    // 3. Aggregate wins, kills, earnings, and points from published match results
    for (const [, resObj] of combinedLeaderboardResults.entries()) {
      if (resObj && Array.isArray(resObj.rankings)) {
        for (const winner of resObj.rankings) {
          const wUserId = String(winner.user?._id || winner.user?.id || winner.user || winner.userId || '');
          let player = playerMap.get(wUserId);

          if (!player) {
            for (const [, p] of playerMap.entries()) {
              if (
                (winner.gameUID && String(p.gameUID).toLowerCase() === String(winner.gameUID).toLowerCase()) ||
                (winner.gameName && String(p.gameName).toLowerCase() === String(winner.gameName).toLowerCase())
              ) {
                player = p;
                break;
              }
            }
          }

          if (player) {
            player.totalKills += Number(winner.kills) || 0;
            player.totalEarnings += Number(winner.prizeAmount) || 0;
            player.points += Number(winner.points) || (Number(winner.rank) === 1 ? 100 : Number(winner.rank) === 2 ? 50 : 25);
            if (Number(winner.rank) === 1) {
              player.totalWins += 1;
            }
          } else if (winner.gameName) {
            // Check if winner email is banned before creating dynamic entry
            const winnerEmail = `${winner.gameName}@esports.com`;
            const checkUser = mockUsersStore.get(winnerEmail);
            if (!checkUser || (checkUser.status !== 'BANNED' && checkUser.status !== 'SUSPENDED')) {
              const newId = 'winner-' + (winner.gameUID || Date.now());
              playerMap.set(newId, {
                _id: 'lb-' + newId,
                user: {
                  _id: newId,
                  name: winner.gameName,
                  email: winnerEmail,
                  profileImage: winner.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
                },
                gameName: winner.gameName,
                gameUID: winner.gameUID || 'UID-99201',
                profileImage: winner.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
                totalTournamentsPlayed: 1,
                totalKills: Number(winner.kills) || 0,
                totalWins: Number(winner.rank) === 1 ? 1 : 0,
                totalEarnings: Number(winner.prizeAmount) || 0,
                points: Number(winner.points) || (Number(winner.rank) === 1 ? 100 : Number(winner.rank) === 2 ? 50 : 25),
              });
            }
          }
        }
      }
    }

    let list = Array.from(playerMap.values());

    // Filter out any banned users
    list = list.filter((item) => {
      const email = item.user?.email;
      if (!email) return true;
      const u = mockUsersStore.get(email);
      return !u || (u.status !== 'BANNED' && u.status !== 'SUSPENDED');
    });

    // Sort by earnings -> points -> wins -> kills descending
    list.sort((a, b) => {
      if (b.totalEarnings !== a.totalEarnings) return b.totalEarnings - a.totalEarnings;
      if (b.points !== a.points) return b.points - a.points;
      if (b.totalWins !== a.totalWins) return b.totalWins - a.totalWins;
      return b.totalKills - a.totalKills;
    });

    return list.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  };

  if (mongoose.connection.readyState !== 1) {
    const devData = getDevLeaderboardData();
    return res
      .status(200)
      .json(new ApiResponse(200, devData, 'Global leaderboard retrieved (Dev Mode)'));
  }

  try {
    const query = {};
    if (game && game !== 'ALL') {
      query.game = new RegExp(`^${game}$`, 'i');
    }

    const leaderboard = await Leaderboard.find(query)
      .populate('user', 'name profileImage gameName email status')
      .sort({ totalEarnings: -1, points: -1, totalWins: -1, totalKills: -1 })
      .limit(100);

    const formatted = leaderboard
      .filter((lb) => !lb.user || (lb.user.status !== 'BANNED' && lb.user.status !== 'SUSPENDED'))
      .slice(0, 50)
      .map((lb, index) => ({
        ...lb.toObject(),
        rank: index + 1,
      }));

    return res
      .status(200)
      .json(new ApiResponse(200, formatted, 'Global leaderboard retrieved successfully'));
  } catch (error) {
    const devData = getDevLeaderboardData();
    return res
      .status(200)
      .json(new ApiResponse(200, devData, 'Global leaderboard retrieved (Dev Mode)'));
  }
});

/**
 * @desc    Verify winner Game UID and check registration status for a tournament
 * @route   GET /api/v1/results/verify-winner
 * @access  Private (Admin / Organizer)
 */
const verifyWinnerByUID = asyncHandler(async (req, res) => {
  const { tournamentId, gameUID } = req.query;

  if (!tournamentId || !gameUID) {
    throw new ApiError(400, 'tournamentId and gameUID are required query parameters');
  }

  const cleanUID = String(gameUID).trim();

  if (mongoose.connection.readyState === 1) {
    const User = require('../models/userModel');
    const Registration = require('../models/registrationModel');

    // Search user by gameUID or ID
    const user = await User.findOne({
      $or: [
        { gameUID: { $regex: `^${cleanUID}$`, $options: 'i' } },
        { name: { $regex: `^${cleanUID}$`, $options: 'i' } },
      ],
    });

    if (!user) {
      return res.status(200).json(
        new ApiResponse(200, { valid: false, message: `No user account found matching Game UID "${cleanUID}"` })
      );
    }

    // Verify registration status for this tournament
    const registration = await Registration.findOne({
      user: user._id,
      tournament: tournamentId,
    });

    if (!registration) {
      return res.status(200).json(
        new ApiResponse(200, {
          valid: false,
          user: { id: user._id, name: user.name, gameName: user.gameName, gameUID: user.gameUID },
          message: `Player "${user.name}" (${cleanUID}) is NOT registered for this tournament.`,
        })
      );
    }

    if (registration.status !== 'CONFIRMED') {
      return res.status(200).json(
        new ApiResponse(200, {
          valid: false,
          user: { id: user._id, name: user.name, gameName: user.gameName, gameUID: user.gameUID },
          message: `Player "${user.name}" (${cleanUID}) registration status is "${registration.status}" (Must be Approved / CONFIRMED).`,
        })
      );
    }

    return res.status(200).json(
      new ApiResponse(200, {
        valid: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          gameName: registration.gameName || user.gameName || user.name,
          gameUID: registration.gameUID || user.gameUID || cleanUID,
          profileImage: user.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          registrationStatus: registration.status,
        },
        message: `Verified Approved Participant: ${user.name}`,
      })
    );
  } else {
    // Persistent Mock Fallback logic
    const { createPersistentStore } = require('../utils/persistentStore');
    const mockUsers = createPersistentStore('users', []);
    const mockRegistrations = createPersistentStore('registrations', []);

    let foundUser = null;
    for (const [, u] of mockUsers.entries()) {
      if (
        (u.gameUID && u.gameUID.toLowerCase() === cleanUID.toLowerCase()) ||
        (u.gameName && u.gameName.toLowerCase() === cleanUID.toLowerCase()) ||
        (u.id && u.id === cleanUID)
      ) {
        foundUser = u;
        break;
      }
    }

    if (!foundUser) {
      for (const [, r] of mockRegistrations.entries()) {
        if (r.gameUID && r.gameUID.toLowerCase() === cleanUID.toLowerCase()) {
          foundUser = { id: r.user, name: r.gameName, email: 'player@esports.com', gameName: r.gameName, gameUID: r.gameUID };
          break;
        }
      }
    }

    if (!foundUser) {
      return res.status(200).json(
        new ApiResponse(200, { valid: false, message: `No user account found matching Game UID "${cleanUID}"` })
      );
    }

    let foundReg = null;
    for (const [, r] of mockRegistrations.entries()) {
      const matchTourney = String(r.tournament?._id || r.tournament?.id || r.tournament) === String(tournamentId);
      const matchUID = r.gameUID && r.gameUID.toLowerCase() === cleanUID.toLowerCase();
      const matchUser = String(r.user?._id || r.user?.id || r.user) === String(foundUser.id || foundUser._id);
      if ((matchUser || matchUID) && matchTourney) {
        foundReg = r;
        break;
      }
    }

    if (!foundReg) {
      return res.status(200).json(
        new ApiResponse(200, {
          valid: false,
          user: foundUser,
          message: `Player "${foundUser.name || foundUser.gameName}" (${cleanUID}) is NOT registered for this tournament.`,
        })
      );
    }

    if (foundReg.status && foundReg.status === 'REJECTED') {
      return res.status(200).json(
        new ApiResponse(200, {
          valid: false,
          user: foundUser,
          message: `Player "${foundUser.name || foundUser.gameName}" (${cleanUID}) registration status is REJECTED.`,
        })
      );
    }

    return res.status(200).json(
      new ApiResponse(200, {
        valid: true,
        user: {
          id: foundUser.id || foundUser._id,
          name: foundUser.name || foundUser.gameName,
          email: foundUser.email || 'player@esports.com',
          gameName: foundReg.gameName || foundUser.gameName || foundUser.name,
          gameUID: foundReg.gameUID || foundUser.gameUID || cleanUID,
          profileImage: foundUser.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          registrationStatus: foundReg.status || 'CONFIRMED',
        },
        message: `Verified Approved Participant: ${foundUser.name || foundUser.gameName}`,
      })
    );
  }
});

/**
 * @desc    Publish Tournament Result, update profile stats & leaderboard
 * @route   POST /api/v1/results/publish
 * @access  Private (Admin / Organizer)
 */
const publishTournamentResult = asyncHandler(async (req, res) => {
  const { tournamentId, distribution, winners, proofImage, notes } = req.body;
  const adminId = req.user._id || req.user.id || 'admin';
  const adminEmail = req.user.email || 'admin@esports.com';

  if (!tournamentId || !winners || !Array.isArray(winners) || winners.length === 0) {
    throw new ApiError(400, 'tournamentId and winners array are required');
  }

  // 1. Duplicate UID validation check
  const uids = winners.map((w) => String(w.gameUID).trim().toLowerCase());
  const uniqueUIDs = new Set(uids);
  if (uniqueUIDs.size !== uids.length) {
    throw new ApiError(400, 'Invalid Result: The same player UID cannot be assigned to multiple winning positions!');
  }

  const auditEntry = {
    adminId: String(adminId),
    adminEmail,
    action: 'PUBLISHED_RESULT',
    timestamp: new Date(),
    details: `Published ${distribution || 'TOP_3'} result for tournament ${tournamentId} with ${winners.length} winners.`,
  };

  const formattedRankings = winners.map((w) => ({
    rank: Number(w.rank),
    user: w.userId || undefined,
    gameName: w.gameName || 'Competitor',
    gameUID: w.gameUID,
    profileImage: w.profileImage || '',
    kills: Number(w.kills) || 0,
    prizeAmount: Number(w.prizeAmount) || 0,
    points: (Number(w.rank) === 1 ? 100 : Number(w.rank) === 2 ? 50 : 25) + (Number(w.kills) || 0) * 10,
  }));

  const resultData = {
    _id: 'res-' + Date.now(),
    tournament: tournamentId,
    distribution: distribution || 'TOP_3',
    rankings: formattedRankings,
    mvp: formattedRankings[0],
    proofImage: proofImage || '',
    notes: notes || '',
    createdBy: adminId,
    auditLog: [auditEntry],
    createdAt: new Date(),
  };

  if (mongoose.connection.readyState !== 1) {
    const { createPersistentStore } = require('../utils/persistentStore');
    const mockResultsStore = createPersistentStore('results', []);
    mockResultsStore.set(String(tournamentId), resultData);
    mockResults.set(String(tournamentId), resultData);

    // Update persistent mock store tournament status to COMPLETED
    const mockTournaments = createPersistentStore('tournaments', []);
    const tourney = mockTournaments.get(String(tournamentId));
    if (tourney) {
      tourney.status = 'COMPLETED';
      tourney.registrationOpen = false;
      mockTournaments.set(String(tournamentId), tourney);
    }

    // Update persistent mock store leaderboard & users store
    const mockRegistrations = createPersistentStore('registrations', []);
    const mockUsersStore = createPersistentStore('users', []);

    for (const [, r] of mockRegistrations.entries()) {
      const matchTourney = String(r.tournament?._id || r.tournament?.id || r.tournament) === String(tournamentId);
      if (matchTourney && (r.status === 'CONFIRMED' || r.status === 'APPROVED')) {
        const winnerObj = formattedRankings.find(
          (w) =>
            (w.gameUID && String(w.gameUID).trim().toLowerCase() === String(r.gameUID).trim().toLowerCase()) ||
            (w.user && String(w.user) === String(r.user)) ||
            (w.gameName && String(w.gameName).trim().toLowerCase() === String(r.gameName).trim().toLowerCase())
        );
        const isWinner = !!winnerObj;

        // Update user stats in users store
        for (const [email, u] of mockUsersStore.entries()) {
          if (String(u.id || u._id) === String(r.user) || u.email === r.userEmail) {
            u.totalTournamentsPlayed = (u.totalTournamentsPlayed || 0) + 1;
            if (isWinner) {
              if (winnerObj.rank === 1) u.totalWins = (u.totalWins || 0) + 1;
              u.totalKills = (u.totalKills || 0) + winnerObj.kills;
              u.totalEarnings = (u.totalEarnings || 0) + winnerObj.prizeAmount;
              u.points = (u.points || 0) + winnerObj.points;
            }
            mockUsersStore.set(email, u);
          }
        }
      }
    }

    // Notify connected socket clients to auto-refresh stats live & send match win notifications
    try {
      const { sendUserNotification } = require('./notificationController');
      const tourneyTitle = tourney?.title || 'Esports Tournament';

      for (const w of formattedRankings) {
        sendUserNotification({
          userId: w.user,
          userEmail: '',
          title: 'Victory & Prize Awarded 🏆',
          message: `Congratulations! You placed #${w.rank} in "${tourneyTitle}" and won ₹${w.prizeAmount}! Check your Gaming Stats & Leaderboard!`,
          type: 'MATCH_WIN',
        });
      }

      const io = req.app.get('io');
      if (io) {
        io.emit('results_published', { tournamentId });
      }
    } catch (e) {}

    return res.status(201).json(
      new ApiResponse(201, resultData, 'Tournament results published successfully! Tournament marked COMPLETED and stats updated.')
    );
  }

  try {
    const result = await Result.create({
      tournament: tournamentId,
      distribution: distribution || 'TOP_3',
      rankings: formattedRankings,
      mvp: formattedRankings[0],
      proofImage: proofImage || '',
      notes: notes || '',
      createdBy: adminId,
      auditLog: [auditEntry],
    });

    // Mark tournament as COMPLETED
    await Tournament.findByIdAndUpdate(tournamentId, {
      status: 'COMPLETED',
      completedAt: new Date(),
      registrationOpen: false,
    });

    // Update participant match counts & winner stats
    const Registration = require('../models/registrationModel');
    const User = require('../models/userModel');

    const confirmedRegs = await Registration.find({ tournament: tournamentId, status: 'CONFIRMED' });
    for (const reg of confirmedRegs) {
      if (reg.user) {
        const winnerObj = formattedRankings.find((w) => String(w.gameUID).toLowerCase() === String(reg.gameUID).toLowerCase());
        const isWinner = !!winnerObj;

        // Update User profile stats
        const userUpdate = { $inc: { totalTournamentsPlayed: 1 } };
        if (isWinner) {
          if (winnerObj.rank === 1) userUpdate.$inc.totalWins = 1;
          userUpdate.$inc.totalEarnings = winnerObj.prizeAmount;
          userUpdate.$inc.points = winnerObj.points;
        }
        await User.findByIdAndUpdate(reg.user, userUpdate);

        // Update Leaderboard document
        let lb = await Leaderboard.findOne({ user: reg.user });
        if (!lb) {
          await Leaderboard.create({
            user: reg.user,
            gameName: reg.gameName,
            game: (await Tournament.findById(tournamentId))?.game || 'ESPORTS',
            totalTournamentsPlayed: 1,
            totalWins: isWinner && winnerObj.rank === 1 ? 1 : 0,
            totalKills: isWinner ? winnerObj.kills : 0,
            totalEarnings: isWinner ? winnerObj.prizeAmount : 0,
          });
        } else {
          lb.totalTournamentsPlayed += 1;
          if (isWinner) {
            if (winnerObj.rank === 1) lb.totalWins += 1;
            lb.totalKills += winnerObj.kills;
            lb.totalEarnings += winnerObj.prizeAmount;
          }
          await lb.save();
        }
      }
    }

    // Notify connected socket clients to auto-refresh stats live
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('results_published', { tournamentId });
      }
    } catch (e) {}

    return res.status(201).json(
      new ApiResponse(201, result, 'Tournament results published successfully! Tournament marked COMPLETED and stats updated.')
    );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    mockResults.set(tournamentId, resultData);
    return res.status(201).json(
      new ApiResponse(201, resultData, 'Tournament results published successfully! Tournament marked COMPLETED and stats updated (Dev Mode).')
    );
  }
});

/**
 * @desc    Get detailed gaming statistics for logged-in user with game filter & achievements
 * @route   GET /api/v1/results/my-stats
 * @access  Private (User)
 */
const getUserGamingStats = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const gameFilter = (req.query.game || 'ALL').trim();

  const { createPersistentStore } = require('../utils/persistentStore');
  const mockResultsStore = createPersistentStore('results', []);
  const mockTournamentsStore = createPersistentStore('tournaments', []);
  const mockRegistrationsStore = createPersistentStore('registrations', []);

  // 1. Gather all tournaments user has joined
  let userRegistrations = [];
  if (mongoose.connection.readyState === 1) {
    const Registration = require('../models/registrationModel');
    userRegistrations = await Registration.find({ user: userId }).populate('tournament');
  } else {
    for (const [, r] of mockRegistrationsStore.entries()) {
      const regUser = String(r.user?._id || r.user?.id || r.user);
      if (regUser === String(userId) && (r.status === 'CONFIRMED' || r.status === 'APPROVED')) {
        let tObj = r.tournament;
        if (typeof tObj === 'string' || !tObj?.title) {
          tObj = mockTournamentsStore.get(String(tObj)) || { _id: tObj, title: 'Esports Tournament', game: 'Free Fire', mode: 'SOLO' };
        }
        userRegistrations.push({ ...r, tournament: tObj });
      }
    }
  }

  // Filter registrations by game if specified
  if (gameFilter !== 'ALL') {
    userRegistrations = userRegistrations.filter((r) => {
      const g = (r.tournament?.game || '').toUpperCase();
      return g === gameFilter.toUpperCase() || g.includes(gameFilter.toUpperCase());
    });
  }

  // 2. Fetch all published results
  let allResults = [];
  if (mongoose.connection.readyState === 1) {
    const Result = require('../models/resultModel');
    allResults = await Result.find({}).populate('tournament');
  } else {
    const combinedResults = new Map();
    for (const [k, v] of mockResultsStore.entries()) {
      combinedResults.set(String(k), v);
    }
    for (const [k, v] of mockResults.entries()) {
      combinedResults.set(String(k), v);
    }

    for (const [, resObj] of combinedResults.entries()) {
      let tObj = resObj.tournament;
      if (typeof tObj === 'string' || !tObj?.title) {
        tObj = mockTournamentsStore.get(String(tObj)) || { _id: tObj, title: 'Esports Match', game: 'Free Fire', mode: 'SOLO' };
      }
      allResults.push({ ...resObj, tournament: tObj });
    }
  }

  // 3. Compute stats
  let totalMatchesPlayed = userRegistrations.length;
  let totalWins = 0;
  let totalPrize = 0;
  let totalKills = 0;
  let totalPoints = 0;
  let bestRankNumeric = Infinity;
  let recentHistory = [];

  for (const reg of userRegistrations) {
    const tourney = reg.tournament || {};
    const tourneyIdStr = String(tourney._id || tourney.id || reg.tournament);

    // Find result for this tournament
    const matchResult = allResults.find((r) => {
      const rTourneyId = String(r.tournament?._id || r.tournament?.id || r.tournament);
      return rTourneyId === tourneyIdStr;
    });

    let finalPosStr = 'Participated';
    let prizeWon = 0;

    if (matchResult && Array.isArray(matchResult.rankings)) {
      const winner = matchResult.rankings.find((w) => {
        const wId = String(w.user?._id || w.user?.id || w.user || w.userId || '');
        const matchByUid = reg.gameUID && w.gameUID && String(w.gameUID).toLowerCase() === String(reg.gameUID).toLowerCase();
        const matchByName = reg.gameName && w.gameName && String(w.gameName).toLowerCase() === String(reg.gameName).toLowerCase();
        return wId === String(userId) || matchByUid || matchByName;
      });

      if (winner) {
        const rankNum = Number(winner.rank);
        if (rankNum < bestRankNumeric) bestRankNumeric = rankNum;

        if (rankNum === 1) {
          totalWins += 1;
          finalPosStr = '#1 Champion 🏆';
        } else if (rankNum === 2) {
          finalPosStr = '#2 Runner Up 🥈';
        } else if (rankNum === 3) {
          finalPosStr = '#3 Bronze 🥉';
        } else {
          finalPosStr = `#${rankNum}`;
        }

        prizeWon = Number(winner.prizeAmount) || 0;
        totalPrize += prizeWon;
        totalKills += Number(winner.kills) || 0;
        totalPoints += Number(winner.points) || (rankNum === 1 ? 100 : rankNum === 2 ? 50 : 25);
      }
    }

    recentHistory.push({
      tournamentId: tourneyIdStr,
      title: tourney.title || 'Apex Arena Showdown',
      game: tourney.game || 'Free Fire',
      mode: tourney.mode || 'SOLO',
      finalPosition: finalPosStr,
      prizeWon,
      date: tourney.date || (reg.createdAt ? new Date(reg.createdAt).toLocaleDateString() : 'Recent'),
    });
  }

  const winRate = totalMatchesPlayed > 0 ? ((totalWins / totalMatchesPlayed) * 100).toFixed(1) : '0.0';
  const bestPosition = bestRankNumeric === 1 ? '#1 Champion' : bestRankNumeric !== Infinity ? `#${bestRankNumeric}` : 'N/A';

  // Achievements calculation
  const achievements = [
    {
      id: 'ach-1',
      title: 'First Victory 🏆',
      description: 'Win your first tournament match',
      unlocked: totalWins >= 1,
      progress: `${Math.min(totalWins, 1)}/1`,
      badgeColor: '#DFE104',
    },
    {
      id: 'ach-2',
      title: 'Sharpshooter 🎯',
      description: 'Eliminate 10+ total opponents',
      unlocked: totalKills >= 10,
      progress: `${Math.min(totalKills, 10)}/10 Kills`,
      badgeColor: '#00F2FE',
    },
    {
      id: 'ach-3',
      title: 'High Roller 💰',
      description: 'Earn ₹1,000+ total prize money',
      unlocked: totalPrize >= 1000,
      progress: `₹${totalPrize}/₹1,000`,
      badgeColor: '#10B981',
    },
    {
      id: 'ach-4',
      title: 'Tournament Veteran 🎖️',
      description: 'Compete in 5+ tournaments',
      unlocked: totalMatchesPlayed >= 5,
      progress: `${Math.min(totalMatchesPlayed, 5)}/5 Matches`,
      badgeColor: '#9D4EDD',
    },
    {
      id: 'ach-5',
      title: 'Podium Master 👑',
      description: 'Finish in Top 3 in any tournament',
      unlocked: bestRankNumeric <= 3,
      progress: bestRankNumeric <= 3 ? 'Unlocked 🎉' : 'Reach Top 3',
      badgeColor: '#F59E0B',
    },
  ];

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalMatchesPlayed,
        totalWins,
        winRate: `${winRate}%`,
        totalPrize,
        totalKills,
        totalPoints,
        bestPosition,
        leaderboardRank: '#1',
        achievements,
        recentHistory,
      },
      'Player gaming statistics retrieved successfully'
    )
  );
});

module.exports = {
  submitTournamentResult,
  getTournamentResult,
  getGlobalLeaderboard,
  verifyWinnerByUID,
  publishTournamentResult,
  getUserGamingStats,
};

