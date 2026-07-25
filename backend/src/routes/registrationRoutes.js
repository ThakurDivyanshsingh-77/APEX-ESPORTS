const express = require('express');
const {
  joinTournament,
  getMyRegistrations,
  getTournamentRegistrations,
  updateRegistrationStatus,
  bulkApproveRegistrations,
  getRegistrationTimeline,
  cancelRegistration,
} = require('../controllers/registrationController');
const { verifyJWT, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// User routes
router.post('/join', verifyJWT, joinTournament);
router.get('/my-registrations', verifyJWT, getMyRegistrations);
router.get('/timeline/:tournamentId', verifyJWT, getRegistrationTimeline);
router.delete('/:id', verifyJWT, cancelRegistration);

// Admin routes
router.get('/tournament/:tournamentId', verifyJWT, authorizeRoles('ADMIN', 'ORGANIZER'), getTournamentRegistrations);
router.patch('/:id/status', verifyJWT, authorizeRoles('ADMIN', 'ORGANIZER'), updateRegistrationStatus);
router.post('/bulk-approve', verifyJWT, authorizeRoles('ADMIN', 'ORGANIZER'), bulkApproveRegistrations);

module.exports = router;
