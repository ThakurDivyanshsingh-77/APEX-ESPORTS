const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    gameName: {
      type: String,
      default: '',
      trim: true,
    },
    gameUID: {
      type: String,
      default: '',
      trim: true,
    },
    preferredGame: {
      type: String,
      default: 'Free Fire',
      trim: true,
    },
    preferredRole: {
      type: String,
      default: 'Assaulter',
      trim: true,
    },
    role: {
      type: String,
      enum: ['PLAYER', 'ORGANIZER', 'ADMIN'],
      default: 'PLAYER',
    },
    profileImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'BANNED', 'SUSPENDED'],
      default: 'ACTIVE',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpires: {
      type: Date,
      select: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate Access Token method
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      role: this.role,
    },
    process.env.JWT_SECRET || 'super_secret_jwt_key_esports_2026',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

const User = mongoose.model('User', userSchema);
module.exports = User;
