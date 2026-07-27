const mongoose = require('mongoose');
const User = require('../models/userModel');
const Friendship = require('../models/friendshipModel');
const Message = require('../models/messageModel');
const Team = require('../models/teamModel');
const TeamMember = require('../models/teamMemberModel');
const TeamInvitation = require('../models/teamInvitationModel');
const Tournament = require('../models/tournamentModel');
const Registration = require('../models/registrationModel');
const TournamentInvitation = require('../models/tournamentInvitationModel');
const TeamLeaderboard = require('../models/teamLeaderboardModel');

const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const { createPersistentStore } = require('../utils/persistentStore');
const { getIO } = require('../socket');

// Persistent stores for dev/offline fallback
const mockFriendships = createPersistentStore('friendships', []);
const mockMessages = createPersistentStore('messages', []);
const mockTeams = createPersistentStore('teams', []);
const mockTeamMembers = createPersistentStore('team_members', []);
const mockTeamInvitations = createPersistentStore('team_invitations', []);
const mockTournamentInvitations = createPersistentStore('tournament_invitations', []);

// Helper to calculate user gaming stats automatically
const calculateUserStats = (userObj) => {
  const matches = Number(userObj.matchesPlayed || 0);
  const wins = Number(userObj.wins || 0);
  const winRate = matches > 0 ? ((wins / matches) * 100).toFixed(1) + '%' : '0.0%';
  const kills = Number(userObj.kills || 0);
  const prize = Number(userObj.totalPrize || 0);

  return {
    matchesPlayed: matches,
    wins,
    winRate,
    kills,
    totalPrize: prize,
    rank: userObj.rank || (wins > 10 ? 'Grandmaster' : wins > 5 ? 'Master' : 'Heroic'),
    level: Number(userObj.level || Math.max(1, Math.floor(matches / 2) + 1)),
  };
};

/**
 * ==========================================
 * MODULE 1: PLAYER DIRECTORY
 * GET /api/v1/community/players
 * ==========================================
 */
const getPlayersList = asyncHandler(async (req, res) => {
  const { search, game, role, country, rank, minWinRate, sortBy, onlineOnly } = req.query;
  const currentUserId = req.user ? String(req.user._id || req.user.id || req.user.email).toLowerCase() : '';
  const currentUserEmail = req.user?.email ? String(req.user.email).toLowerCase() : '';

  const getFriendStatus = (targetId, targetEmail) => {
    if (!currentUserId) return 'NOT_FRIEND';
    const tid = String(targetId).toLowerCase();
    const temail = targetEmail ? String(targetEmail).toLowerCase() : '';

    for (const fObj of mockFriendships.values()) {
      const rId = String(fObj.requester).toLowerCase();
      const cId = String(fObj.recipient).toLowerCase();

      const isReqUser = rId === currentUserId || (currentUserEmail && rId === currentUserEmail);
      const isReqTarget = rId === tid || (temail && rId === temail);
      const isRecUser = cId === currentUserId || (currentUserEmail && cId === currentUserEmail);
      const isRecTarget = cId === tid || (temail && cId === temail);

      if ((isReqUser && isRecTarget) || (isReqTarget && isRecUser)) {
        if (fObj.status === 'ACCEPTED') return 'ACCEPTED';
        if (fObj.status === 'BLOCKED') return 'BLOCKED';
        if (isReqUser) return 'PENDING_SENT';
        return 'PENDING_RECEIVED';
      }
    }
    return 'NOT_FRIEND';
  };

  const isSelfUser = (u) => {
    if (!currentUserId) return false;
    const uid = String(u._id || u.id || u.email).toLowerCase();
    const uemail = u.email ? String(u.email).toLowerCase() : '';
    return uid === currentUserId || (currentUserEmail && (uid === currentUserEmail || uemail === currentUserEmail));
  };

  if (mongoose.connection.readyState === 1) {
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { gameName: { $regex: search, $options: 'i' } },
        { gameUID: { $regex: search, $options: 'i' } },
      ];
    }
    if (game && game !== 'ALL') query.preferredGame = game;
    if (role && role !== 'ALL') query.preferredRole = role;
    if (country && country !== 'ALL') query.country = country;

    let users = await User.find(query).select('-password');
    let players = users
      .filter((u) => !isSelfUser(u))
      .map((u) => {
        const stats = calculateUserStats(u);
        return {
          _id: u._id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          gameName: u.gameName || u.name,
          gameUID: u.gameUID || '519284019',
          profileImage: u.profileImage || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
          preferredGame: u.preferredGame || 'Free Fire',
          preferredRole: u.preferredRole || 'Assaulter',
          country: u.country || 'India 🇮🇳',
          isOnline: Boolean(u.isOnline),
          friendStatus: getFriendStatus(u._id, u.email),
          createdAt: u.createdAt,
          ...stats,
        };
      });

    // Sorting
    if (sortBy === 'prize') players.sort((a, b) => b.totalPrize - a.totalPrize);
    else if (sortBy === 'matches') players.sort((a, b) => b.matchesPlayed - a.matchesPlayed);
    else players.sort((a, b) => b.wins - a.wins);

    return res.status(200).json(new ApiResponse(200, players, 'Players fetched successfully'));
  }

  // Persistent store fallback
  const mockUsers = createPersistentStore('users', []);
  let list = Array.from(mockUsers.values()).filter((u) => !isSelfUser(u));

  if (search) {
    const s = search.toLowerCase();
    list = list.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(s)) ||
        (u.gameName && u.gameName.toLowerCase().includes(s)) ||
        (u.gameUID && u.gameUID.toLowerCase().includes(s))
    );
  }

  let players = list.map((u) => {
    const stats = calculateUserStats(u);
    return {
      _id: u.id || u._id || u.email,
      name: u.name,
      email: u.email,
      phone: u.phone,
      gameName: u.gameName || u.name,
      gameUID: u.gameUID || '519284019',
      profileImage: u.profileImage || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
      preferredGame: u.preferredGame || 'Free Fire',
      preferredRole: u.preferredRole || 'Assaulter',
      country: u.country || 'India 🇮🇳',
      isOnline: true,
      friendStatus: getFriendStatus(u.id || u._id || u.email, u.email),
      createdAt: u.createdAt || new Date(),
      ...stats,
    };
  });

  if (sortBy === 'prize') players.sort((a, b) => b.totalPrize - a.totalPrize);
  else if (sortBy === 'matches') players.sort((a, b) => b.matchesPlayed - a.matchesPlayed);
  else players.sort((a, b) => b.wins - a.wins);

  return res.status(200).json(new ApiResponse(200, players, 'Players fetched successfully'));
});

/**
 * ==========================================
 * MODULE 2: PUBLIC PLAYER PROFILE
 * GET /api/v1/community/players/:id
 * ==========================================
 */
const getPlayerProfileById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user?._id || req.user?.id || req.user?.email;

  let targetUser = null;
  if (mongoose.connection.readyState === 1) {
    targetUser = await User.findById(id).select('-password');
  }
  if (!targetUser) {
    const mockUsers = createPersistentStore('users', []);
    targetUser = Array.from(mockUsers.values()).find(
      (u) => String(u._id || u.id || u.email) === String(id) || u.email === id
    );
  }

  if (!targetUser) {
    throw new ApiError(404, 'Player not found');
  }

  const stats = calculateUserStats(targetUser);

  // Check friendship status relative to current requesting user
  let friendStatus = 'NOT_FRIEND';
  if (currentUserId && String(currentUserId) !== String(targetUser._id || targetUser.id || targetUser.email)) {
    const key1 = `${currentUserId}-${targetUser._id || targetUser.id || targetUser.email}`;
    const key2 = `${targetUser._id || targetUser.id || targetUser.email}-${currentUserId}`;
    const fObj = mockFriendships.get(key1) || mockFriendships.get(key2);

    if (fObj) {
      if (fObj.status === 'ACCEPTED') friendStatus = 'ACCEPTED';
      else if (fObj.status === 'BLOCKED') friendStatus = 'BLOCKED';
      else if (String(fObj.requester) === String(currentUserId)) friendStatus = 'PENDING_SENT';
      else friendStatus = 'PENDING_RECEIVED';
    }
  }

  const profileData = {
    _id: targetUser._id || targetUser.id || targetUser.email,
    name: targetUser.name,
    email: targetUser.email,
    phone: targetUser.phone,
    gameName: targetUser.gameName || targetUser.name,
    gameUID: targetUser.gameUID || '519284019',
    profileImage: targetUser.profileImage || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
    banner: targetUser.banner || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1000&auto=format&fit=crop&q=80',
    bio: targetUser.bio || 'Competitive Esports Gamer & Tournament Fighter 🔥',
    preferredGame: targetUser.preferredGame || 'Free Fire',
    preferredRole: targetUser.preferredRole || 'Assaulter',
    country: targetUser.country || 'India 🇮🇳',
    friendStatus,
    friendsCount: 12,
    teamName: targetUser.teamName || 'No Mercy Clan',
    badges: ['👑 PRO CHAMPION', '🔥 SNIPER KING', '⚡ TOP KILLER', '🛡️ DEFI VERIFIED'],
    ...stats,
  };

  return res.status(200).json(new ApiResponse(200, profileData, 'Player profile loaded'));
});

/**
 * ==========================================
 * MODULE 3: FRIEND SYSTEM
 * ==========================================
 */
const sendFriendRequest = asyncHandler(async (req, res) => {
  const { recipientId } = req.body;
  const requesterId = String(req.user?._id || req.user?.id || req.user?.email);

  if (!recipientId || String(recipientId) === requesterId) {
    throw new ApiError(400, 'Invalid recipient for friend request');
  }

  const key1 = `${requesterId}-${recipientId}`;
  const key2 = `${recipientId}-${requesterId}`;

  let existing = mockFriendships.get(key1) || mockFriendships.get(key2);
  if (existing && existing.status === 'ACCEPTED') {
    throw new ApiError(400, 'You are already friends');
  }
  if (existing && existing.status === 'PENDING') {
    throw new ApiError(400, 'Friend request is already pending');
  }

  const fObj = {
    _id: 'friend-' + Date.now(),
    requester: requesterId,
    recipient: String(recipientId),
    status: 'PENDING',
    createdAt: new Date(),
  };

  mockFriendships.set(key1, fObj);

  // Dispatch real-time Socket notification to recipient
  const io = getIO();
  if (io) {
    io.emit('new_notification', {
      _id: 'notif-' + Date.now(),
      type: 'FRIEND_REQUEST',
      user: recipientId,
      message: `${req.user?.name} sent you a friend request.`,
      createdAt: new Date(),
    });
  }

  return res.status(200).json(new ApiResponse(200, fObj, 'Friend request sent successfully'));
});

const respondFriendRequest = asyncHandler(async (req, res) => {
  const { requestId, action } = req.body; // action: 'ACCEPT' | 'REJECT'
  const currentUserId = String(req.user?._id || req.user?.id || req.user?.email);

  let fObj = null;
  let keyToUpdate = null;

  for (const [k, v] of mockFriendships.entries()) {
    if (v._id === requestId || (v.recipient === currentUserId && String(v.requester) === String(requestId))) {
      fObj = v;
      keyToUpdate = k;
      break;
    }
  }

  if (!fObj) {
    throw new ApiError(404, 'Friend request not found');
  }

  if (action === 'ACCEPT') {
    fObj.status = 'ACCEPTED';
    mockFriendships.set(keyToUpdate, fObj);

    const io = getIO();
    if (io) {
      io.emit('new_notification', {
        _id: 'notif-' + Date.now(),
        type: 'FRIEND_ACCEPTED',
        user: fObj.requester,
        message: `${req.user?.name} accepted your friend request!`,
        createdAt: new Date(),
      });
    }

    return res.status(200).json(new ApiResponse(200, fObj, 'Friend request accepted'));
  } else {
    mockFriendships.delete(keyToUpdate);
    return res.status(200).json(new ApiResponse(200, null, 'Friend request rejected'));
  }
});

const removeFriend = asyncHandler(async (req, res) => {
  const { friendId } = req.body;
  const currentUserId = String(req.user?._id || req.user?.id || req.user?.email);

  const key1 = `${currentUserId}-${friendId}`;
  const key2 = `${friendId}-${currentUserId}`;

  mockFriendships.delete(key1);
  mockFriendships.delete(key2);

  return res.status(200).json(new ApiResponse(200, null, 'Friend removed'));
});

// Helper to retrieve complete user details by _id, id, or email from DB or JSON store
const getUserDetailObj = async (userIdOrEmail) => {
  if (!userIdOrEmail) return null;
  const targetStr = String(userIdOrEmail);

  // 1. Try Mongoose DB if connected
  if (mongoose.connection.readyState === 1) {
    try {
      let dbUser = null;
      if (mongoose.Types.ObjectId.isValid(targetStr)) {
        dbUser = await User.findById(targetStr).select('-password');
      }
      if (!dbUser) {
        dbUser = await User.findOne({
          $or: [{ email: targetStr }, { gameUID: targetStr }, { name: targetStr }]
        }).select('-password');
      }
      if (dbUser) {
        const stats = calculateUserStats(dbUser);
        return {
          _id: String(dbUser._id),
          id: String(dbUser._id),
          name: dbUser.name,
          email: dbUser.email,
          phone: dbUser.phone,
          gameName: dbUser.gameName || dbUser.name,
          gameUID: dbUser.gameUID || '519284019',
          profileImage: dbUser.profileImage || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
          preferredGame: dbUser.preferredGame || 'Free Fire',
          preferredRole: dbUser.preferredRole || 'Assaulter',
          country: dbUser.country || 'India 🇮🇳',
          isOnline: Boolean(dbUser.isOnline),
          ...stats,
        };
      }
    } catch (err) {
      console.error('Error in getUserDetailObj DB fetch:', err);
    }
  }

  // 2. Try JSON persistent store
  const mockUsers = createPersistentStore('users', []);
  const allList = Array.from(mockUsers.values());
  const found = allList.find(
    (u) =>
      String(u._id) === targetStr ||
      String(u.id) === targetStr ||
      String(u.email).toLowerCase() === targetStr.toLowerCase()
  );

  if (found) {
    const stats = calculateUserStats(found);
    return {
      _id: String(found._id || found.id || found.email),
      id: String(found.id || found._id || found.email),
      name: found.name,
      email: found.email,
      phone: found.phone,
      gameName: found.gameName || found.name,
      gameUID: found.gameUID || '519284019',
      profileImage: found.profileImage || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
      preferredGame: found.preferredGame || 'Free Fire',
      preferredRole: found.preferredRole || 'Assaulter',
      country: found.country || 'India 🇮🇳',
      isOnline: true,
      ...stats,
    };
  }

  return null;
};

const getFriendsList = asyncHandler(async (req, res) => {
  const currentUserId = String(req.user?._id || req.user?.id || req.user?.email);
  const currentUserEmail = req.user?.email ? String(req.user.email).toLowerCase() : '';

  const isCurrentMatch = (id) => {
    if (!id) return false;
    const s = String(id).toLowerCase();
    return s === currentUserId.toLowerCase() || s === currentUserEmail;
  };

  const incoming = [];
  const outgoing = [];
  const accepted = [];

  for (const fObj of mockFriendships.values()) {
    if (fObj.status === 'PENDING') {
      if (isCurrentMatch(fObj.recipient)) {
        const reqUser = (await getUserDetailObj(fObj.requester)) || {
          _id: fObj.requester,
          name: 'Esports Gamer',
          gameName: 'Gamer',
          gameUID: '519284019',
          profileImage: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
          preferredGame: 'Free Fire',
          preferredRole: 'Assaulter',
          country: 'India 🇮🇳',
          matchesPlayed: 0,
          wins: 0,
          totalPrize: 0,
        };
        incoming.push({ ...fObj, user: reqUser });
      } else if (isCurrentMatch(fObj.requester)) {
        const recUser = (await getUserDetailObj(fObj.recipient)) || {
          _id: fObj.recipient,
          name: 'Esports Gamer',
          gameName: 'Gamer',
          gameUID: '519284019',
          profileImage: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
          preferredGame: 'Free Fire',
          preferredRole: 'Assaulter',
          country: 'India 🇮🇳',
          matchesPlayed: 0,
          wins: 0,
          totalPrize: 0,
        };
        outgoing.push({ ...fObj, user: recUser });
      }
    } else if (fObj.status === 'ACCEPTED') {
      const otherId = isCurrentMatch(fObj.requester) ? fObj.recipient : fObj.requester;
      const friendUser = (await getUserDetailObj(otherId)) || {
        _id: otherId,
        name: 'Esports Gamer',
        gameName: 'Gamer',
        gameUID: '519284019',
        profileImage: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
        preferredGame: 'Free Fire',
        preferredRole: 'Assaulter',
        country: 'India 🇮🇳',
        matchesPlayed: 0,
        wins: 0,
        totalPrize: 0,
      };
      accepted.push({ ...fObj, friend: friendUser });
    }
  }

  return res.status(200).json(
    new ApiResponse(200, { incoming, outgoing, accepted }, 'Friends list fetched successfully')
  );
});

/**
 * ==========================================
 * MODULE 4: REAL-TIME DIRECT CHAT
 * ==========================================
 */
const getDirectMessages = asyncHandler(async (req, res) => {
  const { friendId } = req.params;
  const currentUserId = String(req.user?._id || req.user?.id || req.user?.email).toLowerCase();
  const currentUserEmail = req.user?.email ? String(req.user.email).toLowerCase() : '';
  const targetFriendStr = String(friendId).toLowerCase();

  const friendObj = await getUserDetailObj(friendId);
  const friendEmail = friendObj?.email ? String(friendObj.email).toLowerCase() : '';
  const friendIdAlt = friendObj?._id ? String(friendObj._id).toLowerCase() : '';

  const isUserA = (id) => {
    if (!id) return false;
    const s = String(id).toLowerCase();
    return s === currentUserId || (currentUserEmail && s === currentUserEmail);
  };

  const isUserB = (id) => {
    if (!id) return false;
    const s = String(id).toLowerCase();
    return s === targetFriendStr || (friendEmail && s === friendEmail) || (friendIdAlt && s === friendIdAlt);
  };

  // 1. Try DB fetch if ready
  if (mongoose.connection.readyState === 1) {
    try {
      if (mongoose.Types.ObjectId.isValid(currentUserId) && mongoose.Types.ObjectId.isValid(friendIdAlt || targetFriendStr)) {
        const u1 = currentUserId;
        const u2 = friendIdAlt || targetFriendStr;
        const dbMsgs = await Message.find({
          $or: [
            { sender: u1, recipient: u2 },
            { sender: u2, recipient: u1 }
          ]
        }).sort({ createdAt: 1 });

        if (dbMsgs && dbMsgs.length > 0) {
          const formatted = dbMsgs.map(m => ({
            _id: String(m._id),
            sender: String(m.sender),
            recipient: String(m.recipient),
            message: m.message,
            attachment: m.attachment,
            read: m.read,
            createdAt: m.createdAt,
          }));
          return res.status(200).json(new ApiResponse(200, formatted, 'Direct messages fetched from DB'));
        }
      }
    } catch (e) {
      console.error('DB fetch direct messages error:', e);
    }
  }

  // 2. Persistent store fallback
  const messagesList = Array.from(mockMessages.values()).filter(
    (m) =>
      (isUserA(m.sender) && isUserB(m.recipient)) ||
      (isUserB(m.sender) && isUserA(m.recipient))
  );

  messagesList.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return res.status(200).json(new ApiResponse(200, messagesList, 'Direct messages fetched'));
});

const sendDirectMessage = asyncHandler(async (req, res) => {
  const { recipientId, message } = req.body;
  const currentUserId = String(req.user?._id || req.user?.id || req.user?.email);

  if (!recipientId || (!message && !req.file)) {
    throw new ApiError(400, 'Recipient and content are required');
  }

  let attachmentUrl = '';
  if (req.file) {
    try {
      const uploaded = await uploadToCloudinary(req.file.path);
      attachmentUrl = uploaded?.secure_url || `/uploads/${req.file.filename}`;
    } catch (e) {
      attachmentUrl = `/uploads/${req.file.filename}`;
    }
  }

  const msgId = 'msg-' + Date.now();
  const msgObj = {
    _id: msgId,
    sender: currentUserId,
    recipient: String(recipientId),
    message: message || '',
    attachment: attachmentUrl,
    read: false,
    createdAt: new Date(),
  };

  mockMessages.set(msgId, msgObj);

  // If MongoDB connected and ObjectIds valid, persist to Mongoose Message model
  if (mongoose.connection.readyState === 1) {
    try {
      if (mongoose.Types.ObjectId.isValid(currentUserId) && mongoose.Types.ObjectId.isValid(recipientId)) {
        await Message.create({
          sender: currentUserId,
          recipient: recipientId,
          message: message || '',
          attachment: attachmentUrl,
        });
      }
    } catch (e) {
      console.error('Error saving message to Mongoose DB:', e);
    }
  }

  // Real-time socket emit
  const io = getIO();
  if (io) {
    io.emit('direct_message', msgObj);
  }

  return res.status(201).json(new ApiResponse(201, msgObj, 'Message sent successfully'));
});

/**
 * ==========================================
 * MODULE 5 & 6: PERMANENT TEAMS (CLANS)
 * ==========================================
 */
const createTeam = asyncHandler(async (req, res) => {
  const { name, tag, description, game, maxMembers } = req.body;
  const captainId = String(req.user?._id || req.user?.id || req.user?.email);

  if (!name) throw new ApiError(400, 'Team name is required');

  const teamId = 'team-' + Date.now();
  const teamObj = {
    _id: teamId,
    name,
    tag: tag || name.substring(0, 3).toUpperCase(),
    logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1000&auto=format&fit=crop&q=80',
    description: description || 'Official Competitive Esports Clan.',
    game: game || 'Free Fire',
    maxMembers: Number(maxMembers) || 4,
    captain: captainId,
    captainName: req.user?.name,
    membersCount: 1,
    createdAt: new Date(),
  };

  mockTeams.set(teamId, teamObj);

  // Add Captain to members store
  const memberObj = {
    _id: 'mem-' + Date.now(),
    team: teamId,
    user: captainId,
    userName: req.user?.name,
    role: 'CAPTAIN',
    joinedAt: new Date(),
  };
  mockTeamMembers.set(`${teamId}-${captainId}`, memberObj);

  return res.status(201).json(new ApiResponse(201, teamObj, 'Team created successfully'));
});

const getAllTeams = asyncHandler(async (req, res) => {
  const teamsList = Array.from(mockTeams.values());
  return res.status(200).json(new ApiResponse(200, teamsList, 'Teams fetched successfully'));
});

const getMyTeam = asyncHandler(async (req, res) => {
  const userId = String(req.user?._id || req.user?.id || req.user?.email).toLowerCase();
  const userEmail = req.user?.email ? String(req.user.email).toLowerCase() : '';

  let userTeamMember = null;
  for (const m of mockTeamMembers.values()) {
    const mUser = String(m.user).toLowerCase();
    if (mUser === userId || (userEmail && mUser === userEmail)) {
      userTeamMember = m;
      break;
    }
  }

  if (!userTeamMember) {
    return res.status(200).json(new ApiResponse(200, null, 'User has no team'));
  }

  const team = mockTeams.get(userTeamMember.team);
  const rawRoster = Array.from(mockTeamMembers.values()).filter((m) => m.team === userTeamMember.team);

  const roster = await Promise.all(
    rawRoster.map(async (m) => {
      const detail = (await getUserDetailObj(m.user)) || {};
      return {
        ...m,
        userName: detail.name || m.userName || 'Roster Member',
        userEmail: detail.email,
        gameName: detail.gameName || detail.name || 'Gamer',
        gameUID: detail.gameUID || '519284019',
        profileImage: detail.profileImage || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
        preferredGame: detail.preferredGame || 'Free Fire',
        preferredRole: detail.preferredRole || 'Assaulter',
        rank: detail.rank || 'Heroic',
        level: detail.level || 1,
      };
    })
  );

  return res.status(200).json(new ApiResponse(200, { team, roster }, 'User team fetched'));
});

const getMyTeamInvitations = asyncHandler(async (req, res) => {
  const userId = String(req.user?._id || req.user?.id || req.user?.email).toLowerCase();
  const userEmail = req.user?.email ? String(req.user.email).toLowerCase() : '';

  const pendingInvites = [];
  for (const invObj of mockTeamInvitations.values()) {
    const inviteeStr = String(invObj.invitee).toLowerCase();
    const isInviteeMatch = inviteeStr === userId || (userEmail && inviteeStr === userEmail);

    if (isInviteeMatch && invObj.status === 'PENDING') {
      const team = mockTeams.get(invObj.team) || {};
      let inviterDetail = null;
      if (invObj.inviter) {
        inviterDetail = await getUserDetailObj(invObj.inviter);
      }
      pendingInvites.push({
        ...invObj,
        teamName: team.name || invObj.teamName || 'Clan',
        teamTag: team.tag || 'CLAN',
        teamLogo: team.logo || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=150&auto=format&fit=crop&q=80',
        game: team.game || 'Free Fire',
        membersCount: team.membersCount || 1,
        maxMembers: team.maxMembers || 4,
        captainName: inviterDetail?.name || team.captainName || invObj.inviterName || 'Captain',
      });
    }
  }

  return res.status(200).json(new ApiResponse(200, pendingInvites, 'Team invitations fetched'));
});

const inviteFriendToTeam = asyncHandler(async (req, res) => {
  const { teamId, friendId } = req.body;
  const captainId = String(req.user?._id || req.user?.id || req.user?.email);

  const team = mockTeams.get(teamId);
  if (!team) throw new ApiError(404, 'Team not found');
  if (String(team.captain).toLowerCase() !== captainId.toLowerCase()) {
    throw new ApiError(403, 'Only Captain can invite members');
  }

  // Verify recipient is an accepted friend
  const key1 = `${captainId}-${friendId}`;
  const key2 = `${friendId}-${captainId}`;
  let fObj = mockFriendships.get(key1) || mockFriendships.get(key2);

  if (!fObj || fObj.status !== 'ACCEPTED') {
    for (const item of mockFriendships.values()) {
      const rId = String(item.requester).toLowerCase();
      const cId = String(item.recipient).toLowerCase();
      const capLower = captainId.toLowerCase();
      const friendLower = String(friendId).toLowerCase();
      if (
        ((rId === capLower && cId === friendLower) || (rId === friendLower && cId === capLower)) &&
        item.status === 'ACCEPTED'
      ) {
        fObj = item;
        break;
      }
    }
  }

  if (!fObj || fObj.status !== 'ACCEPTED') {
    throw new ApiError(400, 'You can only invite accepted friends to your team');
  }

  // Check if already pending
  for (const inv of mockTeamInvitations.values()) {
    if (
      inv.team === teamId &&
      String(inv.invitee).toLowerCase() === String(friendId).toLowerCase() &&
      inv.status === 'PENDING'
    ) {
      throw new ApiError(400, 'Team invitation is already pending for this friend');
    }
  }

  const inviteId = 'tinvite-' + Date.now();
  const invObj = {
    _id: inviteId,
    team: teamId,
    teamName: team.name,
    inviter: captainId,
    inviterName: req.user?.name,
    invitee: String(friendId),
    status: 'PENDING',
    createdAt: new Date(),
  };

  mockTeamInvitations.set(inviteId, invObj);

  const io = getIO();
  if (io) {
    io.emit('new_notification', {
      _id: 'notif-' + Date.now(),
      type: 'TEAM_INVITATION',
      user: friendId,
      message: `${req.user?.name} invited you to join team "${team.name}"!`,
      createdAt: new Date(),
    });
  }

  return res.status(200).json(new ApiResponse(200, invObj, 'Team invitation sent'));
});

const respondTeamInvitation = asyncHandler(async (req, res) => {
  const { inviteId, action } = req.body; // action: 'ACCEPT' | 'REJECT'
  const userId = String(req.user?._id || req.user?.id || req.user?.email).toLowerCase();
  const userEmail = req.user?.email ? String(req.user.email).toLowerCase() : '';

  const invObj = mockTeamInvitations.get(inviteId);
  if (!invObj) {
    throw new ApiError(404, 'Team invitation not found');
  }

  const inviteeStr = String(invObj.invitee).toLowerCase();
  const isInviteeMatch = inviteeStr === userId || (userEmail && inviteeStr === userEmail);
  if (!isInviteeMatch) {
    throw new ApiError(403, 'You are not authorized to respond to this team invitation');
  }

  if (action === 'ACCEPT') {
    invObj.status = 'ACCEPTED';
    mockTeamInvitations.set(inviteId, invObj);

    // Add to Team Roster
    const memberObj = {
      _id: 'mem-' + Date.now(),
      team: invObj.team,
      user: String(req.user?._id || req.user?.id || req.user?.email),
      userName: req.user?.name,
      role: 'MEMBER',
      joinedAt: new Date(),
    };
    mockTeamMembers.set(`${invObj.team}-${memberObj.user}`, memberObj);

    const team = mockTeams.get(invObj.team);
    if (team) team.membersCount = (team.membersCount || 1) + 1;

    return res.status(200).json(new ApiResponse(200, memberObj, 'Team invitation accepted! Joined team.'));
  } else {
    invObj.status = 'REJECTED';
    mockTeamInvitations.set(inviteId, invObj);
    return res.status(200).json(new ApiResponse(200, null, 'Team invitation rejected'));
  }
});

/**
 * ==========================================
 * MODULE 7: SQUAD TOURNAMENT REGISTRATION
 * ==========================================
 */
const squadRegisterTournament = asyncHandler(async (req, res) => {
  const { tournamentId, teamId, gameName, gameUID } = req.body;
  const captainId = String(req.user?._id || req.user?.id || req.user?.email);

  const team = mockTeams.get(teamId);
  if (!team) throw new ApiError(404, 'Selected Team not found');
  if (String(team.captain) !== captainId) throw new ApiError(403, 'Only Team Captain can register squad');

  const roster = Array.from(mockTeamMembers.values()).filter((m) => m.team === teamId);
  if (roster.length < 2) {
    throw new ApiError(400, 'Team must have at least 2 members to register for a Squad tournament');
  }

  // Create registration record
  const mockRegistrations = createPersistentStore('registrations', []);
  const regId = 'reg-' + Date.now();
  const regObj = {
    _id: regId,
    tournament: tournamentId,
    user: captainId,
    team: teamId,
    teamName: team.name,
    gameName: gameName || req.user?.gameName || req.user?.name,
    gameUID: gameUID || req.user?.gameUID || '519284019',
    status: 'PENDING_MEMBERS_APPROVAL',
    paymentStatus: 'PENDING',
    createdAt: new Date(),
  };

  mockRegistrations.set(`${captainId}-${tournamentId}`, regObj);

  // Dispatch tournament squad invites to all non-captain roster members
  const nonCaptains = roster.filter((m) => String(m.user) !== captainId);
  nonCaptains.forEach((m) => {
    const invId = 'tourn-inv-' + Date.now() + '-' + Math.random().toString(36).substring(7);
    mockTournamentInvitations.set(invId, {
      _id: invId,
      tournament: tournamentId,
      team: teamId,
      registration: regId,
      inviter: captainId,
      invitee: String(m.user),
      status: 'PENDING',
      createdAt: new Date(),
    });

    const io = getIO();
    if (io) {
      io.emit('new_notification', {
        _id: 'notif-' + Date.now(),
        type: 'TOURNAMENT_SQUAD_INVITE',
        user: m.user,
        message: `Captain ${req.user?.name} registered team "${team.name}" for a tournament! Confirm your slot.`,
        createdAt: new Date(),
      });
    }
  });

  return res.status(201).json(new ApiResponse(201, regObj, 'Squad tournament registration submitted! Invites sent to roster members.'));
});

const getMySquadInvitations = asyncHandler(async (req, res) => {
  const userId = String(req.user?._id || req.user?.id || req.user?.email);
  const pendingInvites = Array.from(mockTournamentInvitations.values()).filter(
    (inv) => String(inv.invitee) === userId && inv.status === 'PENDING'
  );
  return res.status(200).json(new ApiResponse(200, pendingInvites, 'Squad invitations fetched'));
});

const respondSquadTournamentInvitation = asyncHandler(async (req, res) => {
  const { invitationId, action } = req.body; // action: 'ACCEPT' | 'REJECT'
  const userId = String(req.user?._id || req.user?.id || req.user?.email);

  const invObj = mockTournamentInvitations.get(invitationId);
  if (!invObj || String(invObj.invitee) !== userId) {
    throw new ApiError(404, 'Squad invitation not found');
  }

  invObj.status = action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED';
  mockTournamentInvitations.set(invitationId, invObj);

  // Check if ALL members accepted
  const allInvitesForReg = Array.from(mockTournamentInvitations.values()).filter(
    (i) => i.registration === invObj.registration
  );

  const hasRejection = allInvitesForReg.some((i) => i.status === 'REJECTED');
  const allAccepted = allInvitesForReg.every((i) => i.status === 'ACCEPTED');

  const mockRegistrations = createPersistentStore('registrations', []);
  for (const [k, r] of mockRegistrations.entries()) {
    if (r._id === invObj.registration) {
      if (hasRejection) {
        r.status = 'CANCELLED';
      } else if (allAccepted) {
        r.status = 'PENDING'; // Ready for payment / admin approval
      }
      mockRegistrations.set(k, r);
      break;
    }
  }

  return res.status(200).json(new ApiResponse(200, invObj, `Squad invitation ${action.toLowerCase()}ed`));
});

/**
 * ==========================================
 * MODULE 11: TEAM LEADERBOARD
 * ==========================================
 */
const getTeamLeaderboard = asyncHandler(async (req, res) => {
  const { game, mode, timeline } = req.query;
  const teams = Array.from(mockTeams.values());

  const leaderboard = teams.map((t, idx) => ({
    _id: t._id,
    teamName: t.name,
    teamLogo: t.logo,
    game: t.game || 'Free Fire',
    wins: t.wins || (idx === 0 ? 12 : idx === 1 ? 8 : 5),
    matchesPlayed: t.matchesPlayed || (idx === 0 ? 15 : idx === 1 ? 12 : 9),
    kills: t.kills || (idx === 0 ? 140 : idx === 1 ? 95 : 60),
    totalPrizeWon: t.totalPrize || (idx === 0 ? 25000 : idx === 1 ? 15000 : 8000),
    winRate: t.wins ? ((t.wins / (t.matchesPlayed || 1)) * 100).toFixed(1) + '%' : '75.0%',
    rank: `#${idx + 1}`,
  }));

  leaderboard.sort((a, b) => b.wins - a.wins);

  return res.status(200).json(new ApiResponse(200, leaderboard, 'Team leaderboard fetched'));
});

/**
 * ==========================================
 * MODULE 12: ADMIN PANEL COMMUNITY TEAMS HUB
 * ==========================================
 */
const getAdminTeams = asyncHandler(async (req, res) => {
  const teams = Array.from(mockTeams.values());
  const teamsWithRosters = teams.map((t) => {
    const roster = Array.from(mockTeamMembers.values()).filter((m) => m.team === t._id);
    return { ...t, roster };
  });

  return res.status(200).json(new ApiResponse(200, teamsWithRosters, 'Admin teams fetched'));
});

const getAdminTournamentTeams = asyncHandler(async (req, res) => {
  const mockRegistrations = createPersistentStore('registrations', []);
  const regList = Array.from(mockRegistrations.values()).filter((r) => r.team);

  const detailedList = regList.map((r) => {
    const team = mockTeams.get(r.team);
    const squadInvites = Array.from(mockTournamentInvitations.values()).filter(
      (i) => i.registration === r._id
    );
    return {
      ...r,
      team,
      squadInvites,
    };
  });

  return res.status(200).json(new ApiResponse(200, detailedList, 'Admin tournament teams fetched'));
});

module.exports = {
  getPlayersList,
  getPlayerProfileById,
  sendFriendRequest,
  respondFriendRequest,
  removeFriend,
  getFriendsList,
  getDirectMessages,
  sendDirectMessage,
  createTeam,
  getAllTeams,
  getMyTeam,
  getMyTeamInvitations,
  inviteFriendToTeam,
  respondTeamInvitation,
  squadRegisterTournament,
  getMySquadInvitations,
  respondSquadTournamentInvitation,
  getTeamLeaderboard,
  getAdminTeams,
  getAdminTournamentTeams,
};
