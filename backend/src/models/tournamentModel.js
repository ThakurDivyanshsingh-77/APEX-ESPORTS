const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tournament title is required'],
      trim: true,
    },
    game: {
      type: String,
      required: [true, 'Game name is required'],
      trim: true,
    },
    mode: {
      type: String,
      required: [true, 'Game mode is required (e.g. SOLO, DUO, SQUAD, 5v5)'],
      default: 'SQUAD',
    },
    entryFee: {
      type: Number,
      default: 0,
      min: [0, 'Entry fee cannot be negative'],
    },
    prizePool: {
      type: String,
      required: [true, 'Prize pool description is required'],
      trim: true,
    },
    winnerCount: {
      type: String,
      enum: ['1', '2', '3'],
      default: '3',
    },
    prizeBreakdown: {
      first: { type: Number, default: 0 },
      second: { type: Number, default: 0 },
      third: { type: Number, default: 0 },
    },
    slots: {
      type: Number,
      required: [true, 'Total slots count is required'],
      min: [2, 'Slots must be at least 2'],
    },
    filledSlots: {
      type: Number,
      default: 0,
      min: 0,
    },
    date: {
      type: String,
      required: [true, 'Tournament date is required'],
    },
    time: {
      type: String,
      required: [true, 'Tournament start time is required'],
    },
    map: {
      type: String,
      default: 'TBD',
      trim: true,
    },
    status: {
      type: String,
      enum: ['UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED'],
      default: 'UPCOMING',
    },
    registrationOpen: {
      type: Boolean,
      default: true,
    },
    roomID: {
      type: String,
      default: '',
    },
    password: {
      type: String,
      default: '',
    },
    roomVisible: {
      type: Boolean,
      default: false,
    },
    roomAuditLog: [
      {
        adminId: { type: String, required: true },
        adminEmail: { type: String },
        action: { type: String, required: true }, // 'UPDATED_CREDENTIALS' | 'RELEASED_ROOM_MANUAL' | 'AUTO_RELEASED'
        timestamp: { type: Date, default: Date.now },
        details: { type: String },
      },
    ],

    completedAt: {
      type: Date,
    },
    bannerImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    },
    description: {
      type: String,
      default: 'Official Esports Tournament. Rules: Respect opponents, anti-cheat proof mandatory, report to lobby 15 mins prior.',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

tournamentSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'COMPLETED' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

tournamentSchema.index({ status: 1, game: 1, createdAt: -1 });

const Tournament = mongoose.model('Tournament', tournamentSchema);
module.exports = Tournament;
