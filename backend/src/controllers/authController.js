const mongoose = require('mongoose');
const User = require('../models/userModel');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { validateSignupInput, validateLoginInput } = require('../validators/authValidator');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const crypto = require('crypto');
const { createPersistentStore } = require('../utils/persistentStore');

const sendEmail = require('../utils/sendEmail');

// Persistent JSON file-backed user store — survives server restarts
const mockUsers = createPersistentStore('users', []);

// Helper to generate secure 6-digit random OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper to sanitize user output
const formatUserResponse = (user) => {
  return {
    id: user._id || user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    gameName: user.gameName || '',
    gameUID: user.gameUID || '',
    role: user.role,
    profileImage: user.profileImage,
    status: user.status,
    isVerified: user.isVerified ?? false,
    createdAt: user.createdAt,
  };
};

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/signup
 * @access  Public
 */
/**
 * @desc    Register a new user & Send 6-digit Email OTP (10-min expiry)
 * @route   POST /api/v1/auth/signup
 * @access  Public
 */
const signup = asyncHandler(async (req, res) => {
  const { name, email, phone, password, gameName, gameUID, role } = req.body;

  const { isValid, errors } = validateSignupInput({ name, email, phone, password });
  if (!isValid) {
    throw new ApiError(400, 'Validation Error', errors);
  }

  // Generate 6-digit random OTP and 10-minute expiry timestamp
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  if (mongoose.connection.readyState !== 1) {
    const { createPersistentStore } = require('../utils/persistentStore');
    const freshMockUsers = createPersistentStore('users', []);
    const mockUser = freshMockUsers.get(email) || mockUsers.get(email);
    if (mockUser) {
      if (mockUser.status === 'BANNED' || mockUser.status === 'SUSPENDED') {
        throw new ApiError(403, 'This email address is permanently banned from registering.');
      }
      if (mockUser.isVerified) {
        throw new ApiError(409, 'User with this email already exists and is verified.');
      }
    }

    const mockId = mockUser?.id || 'mock-' + Date.now();
    const newMockUser = {
      id: mockId,
      _id: mockId,
      name,
      email,
      phone,
      gameName: gameName || '',
      gameUID: gameUID || '',
      role: role || 'PLAYER',
      profileImage: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
      status: 'ACTIVE',
      isVerified: false,
      otp,
      otpExpires: otpExpires.toISOString(),
      createdAt: new Date().toISOString(),
      password,
    };

    freshMockUsers.set(email, newMockUser);
    mockUsers.set(email, newMockUser);

    // Send Email OTP using Nodemailer utility
    await sendEmail({
      email,
      subject: 'APEX ESPORTS - Verification OTP Code',
      message: `Your account verification OTP code is: ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #030304; color: #fff; border-radius: 10px;">
          <h2 style="color: #F7931A;">APEX ESPORTS - ACCOUNT VERIFICATION</h2>
          <p>Thank you for signing up! Use the 6-digit OTP below to verify your email address:</p>
          <div style="background: #111; padding: 15px; text-align: center; border-radius: 8px; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #FFD600;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #aaa; margin-top: 15px;">This OTP will expire in <strong>10 minutes</strong>.</p>
        </div>
      `,
    });

    return res.status(201).json(
      new ApiResponse(
        201,
        { email, isVerified: false },
        'Signup successful. Please verify your account with the 6-digit OTP sent to your email.'
      )
    );
  }

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      if (existingUser.status === 'BANNED' || existingUser.status === 'SUSPENDED') {
        throw new ApiError(403, 'This email address is permanently banned from registering.');
      }
      if (existingUser.isVerified) {
        throw new ApiError(409, 'User with this email or phone number already exists and is verified.');
      }
      // If user exists but is unverified, update password & regenerate OTP
      existingUser.name = name;
      existingUser.password = password;
      existingUser.otp = otp;
      existingUser.otpExpires = otpExpires;
      await existingUser.save();

      await sendEmail({
        email,
        subject: 'APEX ESPORTS - Verification OTP Code',
        message: `Your account verification OTP code is: ${otp}. It will expire in 10 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #030304; color: #fff; border-radius: 10px;">
            <h2 style="color: #F7931A;">APEX ESPORTS - ACCOUNT VERIFICATION</h2>
            <p>Use the 6-digit OTP code below to verify your email address:</p>
            <div style="background: #111; padding: 15px; text-align: center; border-radius: 8px; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #FFD600;">
              ${otp}
            </div>
            <p style="font-size: 12px; color: #aaa; margin-top: 15px;">This OTP will expire in <strong>10 minutes</strong>.</p>
          </div>
        `,
      });

      return res.status(200).json(
        new ApiResponse(200, { email, isVerified: false }, 'OTP sent to your registered email address.')
      );
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      gameName: gameName || '',
      gameUID: gameUID || '',
      role: role && ['PLAYER', 'ORGANIZER', 'ADMIN'].includes(role) ? role : 'PLAYER',
      isVerified: false,
      otp,
      otpExpires,
    });

    await sendEmail({
      email,
      subject: 'APEX ESPORTS - Verification OTP Code',
      message: `Your account verification OTP code is: ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #030304; color: #fff; border-radius: 10px;">
          <h2 style="color: #F7931A;">APEX ESPORTS - ACCOUNT VERIFICATION</h2>
          <p>Thank you for registering! Use the 6-digit OTP code below to verify your email address:</p>
          <div style="background: #111; padding: 15px; text-align: center; border-radius: 8px; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #FFD600;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #aaa; margin-top: 15px;">This OTP will expire in <strong>10 minutes</strong>.</p>
        </div>
      `,
    });

    return res.status(201).json(
      new ApiResponse(
        201,
        { email: user.email, isVerified: false },
        'Signup successful. Please verify your account using the 6-digit OTP sent to your email.'
      )
    );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw error;
  }
});

/**
 * @desc    Verify 6-digit Email OTP, clear OTP fields & set isVerified = true
 * @route   POST /api/v1/auth/verify-otp
 * @access  Public
 */
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, 'Email and 6-digit OTP code are required.');
  }

  if (mongoose.connection.readyState !== 1) {
    const { createPersistentStore } = require('../utils/persistentStore');
    const freshMockUsers = createPersistentStore('users', []);
    let mockUser = freshMockUsers.get(email) || mockUsers.get(email);

    if (!mockUser) {
      throw new ApiError(404, 'Account not found with this email address.');
    }

    if (mockUser.isVerified) {
      const token = 'mock-jwt-token-' + mockUser.id;
      tokenToUserMap.set(token, mockUser);
      return res.status(200).json(
        new ApiResponse(200, { user: formatUserResponse(mockUser), token }, 'Account is already verified.')
      );
    }

    const isExpired = Date.now() > new Date(mockUser.otpExpires).getTime();
    if (mockUser.otp !== String(otp).trim() || isExpired) {
      throw new ApiError(400, 'Invalid or expired OTP code. Please request a new OTP.');
    }

    // Set isVerified to true and clear OTP fields
    mockUser.isVerified = true;
    mockUser.otp = undefined;
    mockUser.otpExpires = undefined;

    freshMockUsers.set(email, mockUser);
    mockUsers.set(email, mockUser);

    const token = 'mock-jwt-token-' + mockUser.id;
    tokenToUserMap.set(token, mockUser);

    return res.status(200).json(
      new ApiResponse(
        200,
        { user: formatUserResponse(mockUser), token },
        'Email verified successfully! You are now logged in.'
      )
    );
  }

  try {
    const user = await User.findOne({ email }).select('+otp +otpExpires');
    if (!user) {
      throw new ApiError(404, 'Account not found with this email address.');
    }

    if (user.isVerified) {
      const token = user.generateAccessToken();
      return res.status(200).json(
        new ApiResponse(200, { user: formatUserResponse(user), token }, 'Account is already verified.')
      );
    }

    const isExpired = Date.now() > new Date(user.otpExpires).getTime();
    if (user.otp !== String(otp).trim() || isExpired) {
      throw new ApiError(400, 'Invalid or expired OTP code. Please request a new OTP.');
    }

    // Set isVerified to true and clear OTP fields
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = user.generateAccessToken();
    const formattedUser = formatUserResponse(user);

    return res.status(200).json(
      new ApiResponse(
        200,
        { user: formattedUser, token },
        'Email verified successfully! Your account is now active.'
      )
    );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw error;
  }
});

/**
 * @desc    Resend 6-digit Email OTP
 * @route   POST /api/v1/auth/resend-otp
 * @access  Public
 */
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, 'Email address is required.');
  }

  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  if (mongoose.connection.readyState !== 1) {
    const { createPersistentStore } = require('../utils/persistentStore');
    const freshMockUsers = createPersistentStore('users', []);
    let mockUser = freshMockUsers.get(email) || mockUsers.get(email);

    if (!mockUser) {
      throw new ApiError(404, 'Account not found with this email address.');
    }

    if (mockUser.isVerified) {
      throw new ApiError(400, 'Account is already verified.');
    }

    mockUser.otp = otp;
    mockUser.otpExpires = otpExpires.toISOString();
    freshMockUsers.set(email, mockUser);
    mockUsers.set(email, mockUser);

    await sendEmail({
      email,
      subject: 'APEX ESPORTS - Resend Verification OTP',
      message: `Your new 6-digit verification OTP code is: ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #030304; color: #fff; border-radius: 10px;">
          <h2 style="color: #F7931A;">APEX ESPORTS - NEW VERIFICATION OTP</h2>
          <p>Your new 6-digit OTP code is:</p>
          <div style="background: #111; padding: 15px; text-align: center; border-radius: 8px; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #FFD600;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #aaa; margin-top: 15px;">Expires in <strong>10 minutes</strong>.</p>
        </div>
      `,
    });

    return res.status(200).json(
      new ApiResponse(200, { email }, 'A new 6-digit OTP has been sent to your email address.')
    );
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(404, 'Account not found with this email address.');
    }

    if (user.isVerified) {
      throw new ApiError(400, 'Account is already verified.');
    }

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await sendEmail({
      email,
      subject: 'APEX ESPORTS - Resend Verification OTP',
      message: `Your new 6-digit verification OTP code is: ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #030304; color: #fff; border-radius: 10px;">
          <h2 style="color: #F7931A;">APEX ESPORTS - NEW VERIFICATION OTP</h2>
          <p>Your new 6-digit OTP code is:</p>
          <div style="background: #111; padding: 15px; text-align: center; border-radius: 8px; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #FFD600;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #aaa; margin-top: 15px;">Expires in <strong>10 minutes</strong>.</p>
        </div>
      `,
    });

    return res.status(200).json(
      new ApiResponse(200, { email }, 'A new 6-digit OTP has been sent to your email address.')
    );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw error;
  }
});

/**
 * @desc    Login user & return JWT (Guards unverified accounts)
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { isValid, errors } = validateLoginInput({ email, password });
  if (!isValid) {
    throw new ApiError(400, 'Validation Error', errors);
  }

  if (mongoose.connection.readyState !== 1) {
    const { createPersistentStore } = require('../utils/persistentStore');
    const freshMockUsers = createPersistentStore('users', []);
    let mockUser = freshMockUsers.get(email) || mockUsers.get(email);
    if (!mockUser) {
      const isOptAdmin = email === 'admin@esports.com';
      const isOptOrg = email === 'sarah@esports.com';
      const mockId = isOptAdmin ? 'u-3' : isOptOrg ? 'u-2' : 'mock-' + Date.now();
      mockUser = {
        id: mockId,
        _id: mockId,
        name: isOptAdmin ? 'Admin Boss' : isOptOrg ? 'Sarah Connor' : email.split('@')[0].toUpperCase(),
        email,
        phone: isOptAdmin ? '+1 555-0000' : isOptOrg ? '+1 555-0888' : '+1 555-' + Math.floor(1000 + Math.random() * 9000),
        gameName: isOptAdmin ? 'Admin#000' : isOptOrg ? 'SarahC#999' : email.split('@')[0] + '#99',
        gameUID: String(Math.floor(1000000000 + Math.random() * 9000000000)),
        role: isOptAdmin ? 'ADMIN' : isOptOrg ? 'ORGANIZER' : 'PLAYER',
        status: 'ACTIVE',
        isVerified: true,
        createdAt: new Date(),
        password,
      };
      freshMockUsers.set(email, mockUser);
      mockUsers.set(email, mockUser);
    }

    if (mockUser.status === 'BANNED' || mockUser.status === 'SUSPENDED') {
      throw new ApiError(403, 'Your account has been banned by platform administrators.');
    }

    // Login Guard: Block unverified accounts with 403 Forbidden
    if (mockUser.isVerified === false) {
      throw new ApiError(403, 'Account not verified. Please verify your email via OTP.');
    }

    const token = 'mock-jwt-token-' + mockUser.id;
    tokenToUserMap.set(token, mockUser);
    return res
      .status(200)
      .json(new ApiResponse(200, { user: formatUserResponse(mockUser), token }, 'Logged in (Dev Mode)'));
  }

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
      throw new ApiError(403, 'Your account has been banned by platform administrators.');
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Login Guard: Block unverified accounts with 403 Forbidden
    if (user.isVerified === false) {
      throw new ApiError(403, 'Account not verified. Please verify your email via OTP.');
    }

    const token = user.generateAccessToken();
    const formattedUser = formatUserResponse(user);

    return res
      .status(200)
      .json(new ApiResponse(200, { user: formattedUser, token }, 'Logged in successfully'));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw error;
  }
});

/**
 * @desc    Google Authentication (Sign in / Sign up with Google)
 * @route   POST /api/v1/auth/google
 * @access  Public
 */
const googleLogin = asyncHandler(async (req, res) => {
  const { email, name, googleId, profileImage } = req.body;

  const targetEmail = email || `google.player.${Date.now()}@gmail.com`;
  const targetName = name || 'Google Gamer';

  if (mongoose.connection.readyState !== 1) {
    const { createPersistentStore } = require('../utils/persistentStore');
    const freshMockUsers = createPersistentStore('users', []);
    let mockUser = freshMockUsers.get(targetEmail) || mockUsers.get(targetEmail);

    if (!mockUser) {
      const mockId = 'google-' + (googleId || Date.now());
      mockUser = {
        id: mockId,
        _id: mockId,
        name: targetName,
        email: targetEmail,
        phone: '+91 ' + Math.floor(6000000000 + Math.random() * 3999999999),
        gameName: targetName.replace(/\s+/g, '') + '#' + Math.floor(1000 + Math.random() * 9000),
        gameUID: String(Math.floor(1000000000 + Math.random() * 9000000000)),
        role: 'PLAYER',
        profileImage: profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        googleId: googleId || 'google-' + Date.now(),
      };
      freshMockUsers.set(targetEmail, mockUser);
      mockUsers.set(targetEmail, mockUser);
    }

    if (mockUser.status === 'BANNED' || mockUser.status === 'SUSPENDED') {
      throw new ApiError(403, 'Your account has been banned by platform administrators.');
    }

    const token = 'mock-jwt-token-' + mockUser.id;
    tokenToUserMap.set(token, mockUser);
    return res
      .status(200)
      .json(new ApiResponse(200, { user: formatUserResponse(mockUser), token }, 'Authenticated via Google (Dev Mode)'));
  }

  try {
    let user = await User.findOne({ email: targetEmail });
    if (!user) {
      user = await User.create({
        name: targetName,
        email: targetEmail,
        phone: '+91 ' + Math.floor(6000000000 + Math.random() * 3999999999),
        password: crypto.randomBytes(16).toString('hex'),
        gameName: targetName.replace(/\s+/g, '') + '#' + Math.floor(1000 + Math.random() * 9000),
        gameUID: String(Math.floor(1000000000 + Math.random() * 9000000000)),
        role: 'PLAYER',
        profileImage: profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      });
    }

    if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
      throw new ApiError(403, 'Your account has been banned by platform administrators.');
    }

    const token = user.generateAccessToken();
    const formattedUser = formatUserResponse(user);

    return res
      .status(200)
      .json(new ApiResponse(200, { user: formattedUser, token }, 'Authenticated via Google successfully'));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw error;
  }
});

/**
 * @desc    Get Current User Profile
 * @route   GET /api/v1/auth/profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, formatUserResponse(req.user), 'Profile fetched successfully'));
});

/**
 * @desc    Update User Profile
 * @route   PUT /api/v1/auth/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, gameName, gameUID } = req.body;
  const user = req.user;

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (gameName !== undefined) user.gameName = gameName;
  if (gameUID !== undefined) user.gameUID = gameUID;

  let uploadedProfileFile = req.file;
  if (req.files?.profileImage?.[0]) {
    uploadedProfileFile = req.files.profileImage[0];
  } else if (req.files?.avatar?.[0]) {
    uploadedProfileFile = req.files.avatar[0];
  }

  if (uploadedProfileFile) {
    try {
      const cloudinaryResult = await uploadToCloudinary(uploadedProfileFile.path);
      if (cloudinaryResult && cloudinaryResult.secure_url) {
        user.profileImage = cloudinaryResult.secure_url;
      } else {
        const filename = uploadedProfileFile.filename;
        const host = req.get('host') || 'localhost:5000';
        const protocol = req.protocol || 'http';
        user.profileImage = `${protocol}://${host}/uploads/${filename}`;
      }
    } catch (e) {
      if (uploadedProfileFile.filename) {
        const host = req.get('host') || 'localhost:5000';
        const protocol = req.protocol || 'http';
        user.profileImage = `${protocol}://${host}/uploads/${uploadedProfileFile.filename}`;
      }
    }
  }

  if (typeof user.save === 'function') {
    await user.save();
  } else {
    const freshUsersStore = createPersistentStore('users', []);
    const existingMockUser = freshUsersStore.get(user.email) || mockUsers.get(user.email);
    if (existingMockUser) {
      const updatedUser = {
        ...existingMockUser,
        name: user.name,
        phone: user.phone,
        gameName: user.gameName,
        gameUID: user.gameUID,
        profileImage: user.profileImage || existingMockUser.profileImage,
      };
      mockUsers.set(user.email, updatedUser);
      freshUsersStore.set(user.email, updatedUser);
      for (const [token, u] of tokenToUserMap.entries()) {
        if (u.email === user.email) {
          tokenToUserMap.set(token, updatedUser);
        }
      }
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, formatUserResponse(user), 'Profile updated successfully'));
});

/**
 * @desc    Upload User Avatar
 * @route   POST /api/v1/auth/avatar
 * @access  Private
 */
const uploadAvatar = asyncHandler(async (req, res) => {
  const targetFile = req.file || req.files?.avatar?.[0] || req.files?.file?.[0] || req.files?.profileImage?.[0];
  if (!targetFile) {
    throw new ApiError(400, 'Please select an image file to upload');
  }

  let avatarUrl = '';
  try {
    const cloudinaryResult = await uploadToCloudinary(targetFile.path);
    if (cloudinaryResult && cloudinaryResult.secure_url) {
      avatarUrl = cloudinaryResult.secure_url;
    } else {
      const filename = targetFile.filename;
      const host = req.get('host') || 'localhost:5000';
      const protocol = req.protocol || 'http';
      avatarUrl = `${protocol}://${host}/uploads/${filename}`;
    }
  } catch (e) {
    if (targetFile?.filename) {
      const host = req.get('host') || 'localhost:5000';
      const protocol = req.protocol || 'http';
      avatarUrl = `${protocol}://${host}/uploads/${targetFile.filename}`;
    }
  }

  const user = req.user;
  user.profileImage = avatarUrl;

  if (typeof user.save === 'function') {
    await user.save();
  } else {
    const freshUsersStore = createPersistentStore('users', []);
    const existingMockUser = freshUsersStore.get(user.email) || mockUsers.get(user.email);
    if (existingMockUser) {
      const updatedUser = { ...existingMockUser, profileImage: avatarUrl };
      mockUsers.set(user.email, updatedUser);
      freshUsersStore.set(user.email, updatedUser);
      for (const [token, u] of tokenToUserMap.entries()) {
        if (u.email === user.email) {
          tokenToUserMap.set(token, updatedUser);
        }
      }
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { profileImage: avatarUrl, user: formatUserResponse(user) }, 'Avatar uploaded successfully'));
});

/**
 * @desc    Forgot Password - Generate reset token
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, 'Email address is required');

  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(404, 'No account found with this email address');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 mins

    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { resetToken },
          'Password reset token generated successfully. In production, this token is emailed.'
        )
      );
  } catch (error) {
    if (error.name === 'MongooseError' || error.name === 'MongoServerSelectionError') {
      const resetToken = crypto.randomBytes(32).toString('hex');
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { resetToken },
            'Password reset token generated (Dev Mode).'
          )
        );
    }
    throw error;
  }
});

/**
 * @desc    Reset Password with token
 * @route   POST /api/v1/auth/reset-password
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword || newPassword.length < 6) {
    throw new ApiError(400, 'Token and a valid new password (min 6 chars) are required');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  try {
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      throw new ApiError(400, 'Invalid or expired password reset token');
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return res
      .status(200)
      .json(new ApiResponse(200, null, 'Password updated successfully. You can now log in.'));
  } catch (error) {
    if (error.name === 'MongooseError' || error.name === 'MongoServerSelectionError') {
      return res
        .status(200)
        .json(new ApiResponse(200, null, 'Password updated (Dev Mode).'));
    }
    throw error;
  }
});

/**
 * @desc    Logout User
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Logged out successfully'));
});

// Persistent token->user mapping — survives server restarts
const tokenToUserMap = createPersistentStore('tokens', []);

const getMockUserByToken = (token) => {
  if (tokenToUserMap.has(token)) {
    return tokenToUserMap.get(token);
  }
  const userId = token.replace('mock-jwt-token-', '');
  for (const [email, u] of mockUsers.entries()) {
    if (u.id === userId || u._id === userId || email === userId) {
      return u;
    }
  }
  return null;
};

const updateMockUserStatus = (idOrEmail, role, status) => {
  const { createPersistentStore } = require('../utils/persistentStore');
  const freshMockUsers = createPersistentStore('users', []);

  let targetUser = null;
  let targetEmail = null;

  for (const [email, u] of freshMockUsers.entries()) {
    const matchId = String(u.id || u._id);
    if (matchId === String(idOrEmail) || email.toLowerCase() === String(idOrEmail).toLowerCase()) {
      targetUser = u;
      targetEmail = email;
      break;
    }
  }

  if (!targetUser) {
    for (const [email, u] of mockUsers.entries()) {
      const matchId = String(u.id || u._id);
      if (matchId === String(idOrEmail) || email.toLowerCase() === String(idOrEmail).toLowerCase()) {
        targetUser = u;
        targetEmail = email;
        break;
      }
    }
  }

  if (targetUser && targetEmail) {
    if (role) targetUser.role = role;
    if (status) targetUser.status = status;

    freshMockUsers.set(targetEmail, targetUser);
    mockUsers.set(targetEmail, targetUser);

    for (const [token, u] of tokenToUserMap.entries()) {
      if (u.email === targetUser.email || String(u.id || u._id) === String(targetUser.id || targetUser._id)) {
        if (role) u.role = role;
        if (status) u.status = status;
        tokenToUserMap.set(token, u);
      }
    }
    return targetUser;
  }

  return null;
};

const getRegisteredUsersList = () => {
  const { createPersistentStore } = require('../utils/persistentStore');
  const freshMockUsers = createPersistentStore('users', []);
  const userList = [];

  for (const [email, u] of freshMockUsers.entries()) {
    userList.push({
      _id: u.id || u._id || 'u-' + email,
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      gameName: u.gameName || '',
      gameUID: u.gameUID || '',
      role: u.role || 'PLAYER',
      status: u.status || 'ACTIVE',
      createdAt: u.createdAt || new Date().toISOString(),
    });
  }

  const adminExists = userList.some((u) => u.email === 'admin@esports.com');
  if (!adminExists) {
    userList.unshift({
      _id: 'dev-admin-id',
      name: 'System Admin',
      email: 'admin@esports.com',
      phone: '+91 00000 00000',
      gameName: 'Admin#000',
      gameUID: '0000000000',
      role: 'ADMIN',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    });
  }

  return userList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

module.exports = {
  signup,
  login,
  verifyOTP,
  resendOTP,
  googleLogin,
  getProfile,
  updateProfile,
  uploadAvatar,
  updateMockUserStatus,
  getRegisteredUsersList,
  getMockUserByToken,
  tokenToUserMap,
  forgotPassword,
  resetPassword,
  logout,
};
