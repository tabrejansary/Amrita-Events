const express = require('express');
const router = express.Router();
const {
    submitRegistration,
    getEventRegistrations,
    getMyRegistrations
} = require('../controllers/registrationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
    .post(submitRegistration);

router.route('/me')
    .get(getMyRegistrations);

router.route('/event/:eventId')
    .get(getEventRegistrations);

module.exports = router;
