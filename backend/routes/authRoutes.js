const express = require('express');
const multer = require('multer');
const {
    register,
    login,
    getMe,
    updateInterests,
    updateProfile,
    updateNotificationPreferences,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: '/tmp' });

router.post('/register', upload.single('image'), register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/update-profile', protect, upload.single('image'), updateProfile);
router.put('/update-interests', protect, updateInterests);
router.put('/notification-preferences', protect, updateNotificationPreferences);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

module.exports = router;
