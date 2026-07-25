const mongoose = require('mongoose');

const rankingItemSchema = new mongoose.Schema({
  rank: { type: Number, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gameName: { type: String, required: true },
  gameUID: { type: String, required: true },
  profileImage: { type: String, default: '' },
  kills: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  prizeAmount: { type: Number, default: 0 },
});

const resultSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: [true, 'Tournament ID is required'],
    },
    distribution: {
      type: String,
      enum: ['1ST_ONLY', 'TOP_2', 'TOP_3'],
      default: 'TOP_3',
    },
    rankings: [rankingItemSchema],
    mvp: {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      gameName: String,
      gameUID: String,
      kills: Number,
    },
    proofImage: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    auditLog: [
      {
        adminId: { type: String, required: true },
        adminEmail: { type: String },
        action: { type: String, default: 'PUBLISHED_RESULT' },
        timestamp: { type: Date, default: Date.now },
        details: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Result = mongoose.model('Result', resultSchema);
module.exports = Result;

