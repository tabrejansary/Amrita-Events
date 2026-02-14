const express = require('express');
const multer = require('multer');
const {
    getEvents,
    getEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    registerForEvent,
    getUpcomingEvents,
    getThisWeekEvents,
    getFeaturedEvents,
    getGeneralEvents,
    getSavedEvents,
    getRegisteredEvents,
    getPastEvents,
    toggleBookmark,
    getTrendingEvents,
    unregisterFromEvent,
} = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: '/tmp' });

// Dashboard section routes
router.get('/trending', protect, getTrendingEvents);
router.get('/upcoming', protect, getUpcomingEvents);
router.get('/this-week', protect, getThisWeekEvents);
router.get('/featured', protect, getFeaturedEvents);
router.get('/general', protect, getGeneralEvents);
router.get('/saved', protect, getSavedEvents);
router.get('/registered', protect, getRegisteredEvents);
router.get('/past', protect, getPastEvents);

// Bookmark route
router.post('/:id/bookmark', protect, toggleBookmark);

// Standard routes
router.get('/', protect, getEvents);
router.get('/:id', protect, getEvent);
router.post('/', protect, authorize('club', 'admin'), upload.fields([{ name: 'poster', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), createEvent);
router.put('/:id', protect, authorize('club', 'admin'), upload.fields([{ name: 'poster', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), updateEvent);
router.delete('/:id', protect, authorize('club', 'admin'), deleteEvent);
router.post('/:id/register', protect, registerForEvent);
router.delete('/:id/unregister', protect, unregisterFromEvent);

module.exports = router;
