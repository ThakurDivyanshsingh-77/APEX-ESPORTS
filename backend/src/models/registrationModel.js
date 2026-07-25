const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: [true, 'Tournament ID is required'],
    },
    gameName: {
      type: String,
      required: [true, 'In-game handle (Game Name) is required'],
      trim: true,
    },
    gameUID: {
      type: String,
      required: [true, 'Character UID (Game UID) is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED'],
      default: 'PENDING',
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FREE', 'REFUNDED'],
      default: 'PENDING',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes to enforce rule validation
registrationSchema.index({ user: 1, tournament: 1 }, { unique: true });
registrationSchema.index({ tournament: 1, gameUID: 1 }, { unique: true });

const Registration = mongoose.model('Registration', registrationSchema);
module.exports = Registration;
