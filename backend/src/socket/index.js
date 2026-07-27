const { Server } = require('socket.io');
const mongoose = require('mongoose');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => callback(null, true),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Join specific tournament chatroom
    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`[Socket.io] Client ${socket.id} joined tournament room: ${room}`);
    });

    // Real-time chat messaging inside tournament room
    socket.on('send_message', async (data) => {
      const room = data.room;

      if (room) {
        try {
          if (mongoose.connection.readyState === 1) {
            const Tournament = require('../models/tournamentModel');
            const Registration = require('../models/registrationModel');

            const tournament = await Tournament.findById(room);
            if (tournament && tournament.status === 'COMPLETED') {
              const compTime = tournament.completedAt || tournament.updatedAt;
              if (compTime && Date.now() - new Date(compTime).getTime() > 5 * 60 * 1000) {
                socket.emit('chat_error', { message: 'Chat is locked (5 minutes post tournament completion).' });
                return;
              }
            }

            if (data.userId) {
              const reg = await Registration.findOne({
                user: data.userId,
                tournament: room,
                status: { $ne: 'CANCELLED' },
              });
              if (!reg) {
                socket.emit('chat_error', { message: 'Only registered participants can send chat messages.' });
                return;
              }
            }
          } else {
            const { createPersistentStore } = require('../utils/persistentStore');
            const mockTournaments = createPersistentStore('tournaments', []);
            const mockRegistrations = createPersistentStore('registrations', []);

            const tObj = mockTournaments.get(String(room));
            if (tObj && tObj.status === 'COMPLETED') {
              const compTime = tObj.completedAt || tObj.updatedAt;
              if (compTime && Date.now() - new Date(compTime).getTime() > 5 * 60 * 1000) {
                socket.emit('chat_error', { message: 'Chat is locked (5 minutes post tournament completion).' });
                return;
              }
            }

            if (data.userId) {
              const regKey = `${data.userId}-${room}`;
              const reg = mockRegistrations.get(regKey);
              if (!reg || reg.status === 'CANCELLED') {
                socket.emit('chat_error', { message: 'Only registered participants can send chat messages.' });
                return;
              }
            }
          }
        } catch (err) {
          console.error('[Socket.io] Validation error:', err);
        }
      }

      const msgObj = {
        id: 'msg-' + Date.now(),
        user: data.user || 'Gamer',
        avatar: data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        message: data.message,
        time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      if (room) {
        io.to(room).emit('receive_message', msgObj);
      } else {
        io.emit('receive_message', msgObj);
      }
    });

    // User online presence tracking
    socket.on('user_online', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        socket.userId = userId;
        io.emit('user_status_change', { userId, status: 'ONLINE' });
      }
    });

    // Typing indicators for direct messaging
    socket.on('typing_start', (data) => {
      if (data.recipientId) {
        io.to(`user:${data.recipientId}`).emit('user_typing', { senderId: data.senderId, isTyping: true });
      }
    });

    socket.on('typing_stop', (data) => {
      if (data.recipientId) {
        io.to(`user:${data.recipientId}`).emit('user_typing', { senderId: data.senderId, isTyping: false });
      }
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        io.emit('user_status_change', { userId: socket.userId, status: 'OFFLINE' });
      }
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    console.warn('[Socket.io] Warning: IO requested before initialization.');
    return null;
  }
  return io;
};

module.exports = { initSocket, getIO };
