const express = require('express');
const {
  createTournament,
  getAllTournaments,
  getTournamentById,
  updateTournament,
  deleteTournament,
  updateTournamentStatus,
  updateRoomCredentials,
  releaseRoomNow,
  getRoomCredentials,
} = require('../controllers/tournamentController');
const { verifyJWT, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', getAllTournaments);
router.get('/:id', getTournamentById);

// Protected routes (User & Admin)
router.get('/:id/room-credentials', verifyJWT, getRoomCredentials);
router.post('/', verifyJWT, authorizeRoles('ADMIN', 'ORGANIZER'), createTournament);
router.put('/:id', verifyJWT, authorizeRoles('ADMIN', 'ORGANIZER'), updateTournament);
router.delete('/:id', verifyJWT, authorizeRoles('ADMIN', 'ORGANIZER'), deleteTournament);
router.patch('/:id/status', verifyJWT, authorizeRoles('ADMIN', 'ORGANIZER'), updateTournamentStatus);
router.patch('/:id/room', verifyJWT, authorizeRoles('ADMIN', 'ORGANIZER'), updateRoomCredentials);
router.patch('/:id/room/release', verifyJWT, authorizeRoles('ADMIN', 'ORGANIZER'), releaseRoomNow);

module.exports = router;

