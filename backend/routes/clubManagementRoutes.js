const express = require('express');
const multer = require('multer');
const {
    createClub,
    joinClub,
    getMyClub,
    updateClub,
    removeMember,
    leaveClub,
    regenerateInviteCode,
    sendInviteEmail,
} = require('../controllers/clubManagementController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: '/tmp' });

// All routes require authentication and club role
router.use(protect);
router.use(authorize('club'));

// Club CRUD
router.post('/create', upload.single('logo'), createClub);
router.post('/join', joinClub);
router.get('/me', getMyClub);
router.put('/me', upload.single('logo'), updateClub);

// Member management
router.post('/me/leave', leaveClub);
router.delete('/me/members/:userId', removeMember);
router.post('/me/invite/regenerate', regenerateInviteCode);
router.post('/me/invite/email', sendInviteEmail);

module.exports = router;
