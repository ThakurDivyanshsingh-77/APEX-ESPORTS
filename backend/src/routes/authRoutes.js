const express = require('express');
const {
  signup,
  login,
  verifyOTP,
  resendOTP,
  googleLogin,
  getProfile,
  updateProfile,
  uploadAvatar,
  forgotPassword,
  resetPassword,
  logout,
} = require('../controllers/authController');
const { verifyJWT } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/profile', verifyJWT, getProfile);
router.put('/profile', verifyJWT, upload.fields([{ name: 'profileImage', maxCount: 1 }, { name: 'idProof', maxCount: 1 }]), updateProfile);
router.put('/update-profile', verifyJWT, upload.fields([{ name: 'profileImage', maxCount: 1 }, { name: 'idProof', maxCount: 1 }]), updateProfile);
router.post('/avatar', verifyJWT, upload.single('avatar'), uploadAvatar);
router.post('/avatar-upload', verifyJWT, upload.single('file'), uploadAvatar);
router.post('/logout', verifyJWT, logout);

module.exports = router;
