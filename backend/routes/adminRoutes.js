const express = require('express');
const {
    getPendingEvents,
    approveEvent,
    rejectEvent,
    toggleFeature,
    sendAnnouncement,
    getStats,
    getAllEvents,
    inviteAdmin,
    getAdmins,
    getAllClubs,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are admin-only
router.use(protect);
router.use(authorize('admin'));

router.get('/events/pending', getPendingEvents);
router.get('/events', getAllEvents);
router.get('/clubs', getAllClubs);
router.put('/events/:id/approve', approveEvent);
router.put('/events/:id/reject', rejectEvent);
router.put('/events/:id/feature', toggleFeature);
router.post('/announcement', sendAnnouncement);
router.get('/stats', getStats);
router.post('/invite', inviteAdmin);
router.get('/admins', getAdmins);

module.exports = router;
