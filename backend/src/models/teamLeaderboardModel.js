const mongoose = require('mongoose');

const teamLeaderboardSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    teamName: {
      type: String,
      required: true,
    },
    teamLogo: {
      type: String,
    },
    game: {
      type: String,
      enum: ['ALL', 'Free Fire', 'BGMI'],
      default: 'ALL',
    },
    mode: {
      type: String,
      enum: ['ALL', 'SOLO', 'DUO', 'SQUAD'],
      default: 'SQUAD',
    },
    timeline: {
      type: String,
      enum: ['ALL_TIME', 'WEEKLY', 'MONTHLY'],
      default: 'ALL_TIME',
    },
    wins: {
      type: Number,
      default: 0,
    },
    matchesPlayed: {
      type: Number,
      default: 0,
    },
    kills: {
      type: Number,
      default: 0,
    },
    totalPrizeWon: {
      type: Number,
      default: 0,
    },
    winRate: {
      type: String,
      default: '0.0%',
    },
    rank: {
      type: String,
      default: '#1',
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.TeamLeaderboard || mongoose.model('TeamLeaderboard', teamLeaderboardSchema);
