const Tournament = require('../models/tournamentModel');
const { calculateRoomUnlockState } = require('../utils/timeUtils');
const mongoose = require('mongoose');

/**
 * Scheduled evaluation job scanning upcoming tournaments every 60 seconds
 * and auto-setting `roomVisible = true` 15 minutes before start time.
 */
const startRoomRevealJob = () => {
  console.log('[Room Distribution Job] Background Room Auto Reveal evaluation initialized (60s interval).');

  setInterval(async () => {
    try {
      if (mongoose.connection.readyState === 1) {
        const upcomingTournaments = await Tournament.find({
          status: { $in: ['UPCOMING', 'LIVE'] },
          roomVisible: false,
          roomID: { $ne: '' },
        });

        for (const t of upcomingTournaments) {
          const { isUnlocked } = calculateRoomUnlockState(t.date, t.time);
          if (isUnlocked) {
            t.roomVisible = true;
            t.roomAuditLog.push({
              adminId: 'SYSTEM_JOB',
              adminEmail: 'cron@esports.com',
              action: 'AUTO_RELEASED',
              timestamp: new Date(),
              details: 'Automatically set roomVisible = true 15 minutes before scheduled match start',
            });
            await t.save();
            console.log(`[Room Reveal System] Automatically released Room Credentials 15 mins before match start: "${t.title}" (${t._id})`);
          }
        }
      } else {
        // Fallback for persistent mock store
        const { createPersistentStore } = require('../utils/persistentStore');
        const mockTournaments = createPersistentStore('tournaments', []);
        for (const [id, t] of mockTournaments.entries()) {
          if ((t.status === 'UPCOMING' || t.status === 'LIVE') && !t.roomVisible && t.roomID) {
            const { isUnlocked } = calculateRoomUnlockState(t.date, t.time);
            if (isUnlocked) {
              t.roomVisible = true;
              if (!t.roomAuditLog) t.roomAuditLog = [];
              t.roomAuditLog.push({
                adminId: 'SYSTEM_JOB',
                adminEmail: 'cron@esports.com',
                action: 'AUTO_RELEASED',
                timestamp: new Date(),
                details: 'Automatically set roomVisible = true 15 minutes before scheduled match start',
              });
              mockTournaments.set(id, t);
              console.log(`[Room Reveal System] Automatically released Room Credentials 15 mins before match start: "${t.title}" (${id})`);
            }
          }
        }
      }
    } catch (err) {
      // Dev mode silence
    }
  }, 60000);
};

module.exports = { startRoomRevealJob };

