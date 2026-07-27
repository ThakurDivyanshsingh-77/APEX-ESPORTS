const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'TOURNAMENT_CREATED',
        'TOURNAMENT_UPDATED',
        'TOURNAMENT_CANCELLED',
        'MATCH_REMINDER',
        'ROOM_RELEASED',
        'PRIZE_CREDITED',
        'WALLET_UPDATED',
        'DEPOSIT_APPROVED',
        'DEPOSIT_REJECTED',
        'WITHDRAW_APPROVED',
        'WITHDRAW_REJECTED',
        'PAYMENT_APPROVED',
        'PAYMENT_REJECTED',
        'FRIEND_REQUEST',
        'FRIEND_REQUEST_ACCEPTED',
        'NEW_MESSAGE',
        'SUPPORT_REPLY',
        'ANNOUNCEMENT',
        'MODERATOR_ANNOUNCEMENT',
        'ADMIN_ANNOUNCEMENT',
        'SECURITY_ALERT',
      ],
      default: 'ANNOUNCEMENT',
    },
    link: {
      type: String,
      default: '/notifications',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
