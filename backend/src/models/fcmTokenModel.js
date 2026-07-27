const mongoose = require('mongoose');

const fcmTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    token: {
      type: String,
      required: [true, 'FCM Token is required'],
      unique: true,
      trim: true,
    },
    deviceInfo: {
      type: String,
      default: 'Unknown Device',
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

fcmTokenSchema.index({ user: 1 });
fcmTokenSchema.index({ token: 1 }, { unique: true });

const FCMToken = mongoose.model('FCMToken', fcmTokenSchema);
module.exports = FCMToken;
