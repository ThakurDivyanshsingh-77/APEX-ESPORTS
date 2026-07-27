const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      unique: true,
      trim: true,
    },
    tag: {
      type: String,
      default: '',
      uppercase: true,
      trim: true,
    },
    logo: {
      type: String,
      default: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80',
    },
    banner: {
      type: String,
      default: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1000&auto=format&fit=crop&q=80',
    },
    description: {
      type: String,
      default: 'Official Competitive Esports Team.',
    },
    game: {
      type: String,
      enum: ['Free Fire', 'BGMI', 'ALL'],
      default: 'Free Fire',
    },
    maxMembers: {
      type: Number,
      default: 4,
      min: 2,
      max: 6,
    },
    captain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    matchesPlayed: {
      type: Number,
      default: 0,
    },
    wins: {
      type: Number,
      default: 0,
    },
    totalPrize: {
      type: Number,
      default: 0,
    },
    kills: {
      type: Number,
      default: 0,
    },
    rank: {
      type: String,
      default: '#1',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Team || mongoose.model('Team', teamSchema);
