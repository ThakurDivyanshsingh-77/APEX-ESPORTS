const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./src/config/db');
const { initSocket } = require('./src/socket');
const { startRoomRevealJob } = require('./src/jobs/roomRevealJob');
const routes = require('./src/routes');
const errorMiddleware = require('./src/middleware/errorMiddleware');

const path = require('path');
const app = express();
const server = http.createServer(app);

// Initialize database
connectDB();

// Initialize Socket.io & Background Jobs
const io = initSocket(server);
app.set('io', io);
startRoomRevealJob();

// Security & utility middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  })
);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static upload screenshots
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Base Routes
app.use('/api/v1', routes);

// Base route fallback
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Esports Platform API v1',
    healthCheck: '/api/v1/health',
  });
});

// Global Error Handler
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
