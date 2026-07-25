const { Server } = require('socket.io');

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
    socket.on('send_message', (data) => {
      const msgObj = {
        id: 'msg-' + Date.now(),
        user: data.user || 'Gamer',
        avatar: data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        message: data.message,
        time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      if (data.room) {
        io.to(data.room).emit('receive_message', msgObj);
      } else {
        io.emit('receive_message', msgObj);
      }
    });

    socket.on('disconnect', () => {
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
