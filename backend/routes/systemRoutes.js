const express = require('express');
const { getSettings, updateSettings } = require('../controllers/systemController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public route to get settings
router.get('/', getSettings);

// Admin-only route to update settings
router.put('/', protect, authorize('admin'), updateSettings);

module.exports = router;
