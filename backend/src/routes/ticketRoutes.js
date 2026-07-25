const express = require('express');
const {
  createTicket,
  getMyTickets,
  getAllTickets,
  getTicketById,
  addTicketMessage,
  updateTicketStatus,
} = require('../controllers/ticketController');
const { verifyJWT, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// User routes
router.post('/', verifyJWT, upload.single('file'), createTicket);
router.get('/my-tickets', verifyJWT, getMyTickets);

// Shared / Protected routes
router.get('/all', verifyJWT, authorizeRoles('ADMIN', 'ORGANIZER'), getAllTickets);
router.get('/:id', verifyJWT, getTicketById);
router.post('/:id/messages', verifyJWT, upload.single('file'), addTicketMessage);
router.patch('/:id/status', verifyJWT, authorizeRoles('ADMIN', 'ORGANIZER'), updateTicketStatus);

module.exports = router;
