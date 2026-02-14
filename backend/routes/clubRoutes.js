const express = require('express');
const {
    getMyEvents,
    getClubStats,
    getEventAnalytics,
} = require('../controllers/clubController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are club-only (or admin)
router.use(protect);
router.use(authorize('club', 'admin'));

router.get('/events', getMyEvents);
router.get('/stats', getClubStats);
router.get('/analytics/:eventId', getEventAnalytics);

module.exports = router;
