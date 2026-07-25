const express = require('express');
const {
  submitTournamentResult,
  getTournamentResult,
  getGlobalLeaderboard,
  verifyWinnerByUID,
  publishTournamentResult,
  getUserGamingStats,
} = require('../controllers/resultController');
const { verifyJWT, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/leaderboard', getGlobalLeaderboard);
router.get('/results/tournament/:tournamentId', getTournamentResult);

// Protected User routes
router.get('/results/my-stats', verifyJWT, getUserGamingStats);

// Protected Admin routes
router.get('/results/verify-winner', verifyJWT, authorizeRoles('ADMIN', 'ORGANIZER'), verifyWinnerByUID);
router.post('/results/publish', verifyJWT, authorizeRoles('ADMIN', 'ORGANIZER'), publishTournamentResult);
router.post('/results', verifyJWT, authorizeRoles('ADMIN', 'ORGANIZER'), submitTournamentResult);

module.exports = router;

