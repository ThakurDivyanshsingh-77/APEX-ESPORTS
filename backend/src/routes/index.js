const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const tournamentRoutes = require('./tournamentRoutes');
const registrationRoutes = require('./registrationRoutes');
const adminRoutes = require('./adminRoutes');
const paymentRoutes = require('./paymentRoutes');
const notificationRoutes = require('./notificationRoutes');
const resultRoutes = require('./resultRoutes');
const ticketRoutes = require('./ticketRoutes');
const communityRoutes = require('./communityRoutes');

const router = express.Router();

router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/tournaments', tournamentRoutes);
router.use('/registrations', registrationRoutes);
router.use('/admin', adminRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/tickets', ticketRoutes);
router.use('/community', communityRoutes);
router.use('/', resultRoutes);

module.exports = router;
