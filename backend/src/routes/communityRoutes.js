const express = require('express');
const { verifyJWT } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
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
} = require('../controllers/communityController');

const router = express.Router();

// Module 1 & 2: Player Directory & Profiles
router.get('/players', verifyJWT, getPlayersList);
router.get('/players/:id', verifyJWT, getPlayerProfileById);

// Module 3: Friend System
router.get('/friends', verifyJWT, getFriendsList);
router.post('/friends/request', verifyJWT, sendFriendRequest);
router.post('/friends/respond', verifyJWT, respondFriendRequest);
router.post('/friends/remove', verifyJWT, removeFriend);

// Module 4: Real-Time Direct Chat
router.get('/chat/messages/:friendId', verifyJWT, getDirectMessages);
router.post('/chat/send', verifyJWT, upload.single('attachment'), sendDirectMessage);

// Module 5 & 6: Permanent Teams & Invitations
router.post('/teams', verifyJWT, createTeam);
router.get('/teams', verifyJWT, getAllTeams);
router.get('/teams/my-team', verifyJWT, getMyTeam);
router.get('/teams/invitations', verifyJWT, getMyTeamInvitations);
router.post('/teams/invite', verifyJWT, inviteFriendToTeam);
router.post('/teams/invitations/respond', verifyJWT, respondTeamInvitation);

// Module 7: Squad Tournament Registration
router.post('/tournaments/squad-register', verifyJWT, squadRegisterTournament);
router.get('/tournaments/squad-invitations', verifyJWT, getMySquadInvitations);
router.post('/tournaments/squad-invitations/respond', verifyJWT, respondSquadTournamentInvitation);

// Module 11: Team Leaderboard
router.get('/team-leaderboard', verifyJWT, getTeamLeaderboard);

// Module 12: Admin Community Hub
router.get('/admin/teams', verifyJWT, getAdminTeams);
router.get('/admin/tournament-teams', verifyJWT, getAdminTournamentTeams);

module.exports = router;
