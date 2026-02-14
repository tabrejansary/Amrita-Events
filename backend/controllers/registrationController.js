const RegistrationResponse = require('../models/RegistrationResponse');
const Event = require('../models/Event');
const User = require('../models/User');

// @desc    Submit registration for an event
// @route   POST /api/registrations
// @access  Private (Student)
exports.submitRegistration = async (req, res) => {
    try {
        const { eventId, formId, answers } = req.body;

        // 1. Check if event exists and uses internal registration
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        if (!event.useInternalRegistration) {
            return res.status(400).json({
                success: false,
                message: 'This event does not support internal registration'
            });
        }

        // 2. Check if user already registered
        const user = await User.findById(req.user.id);
        if (user.registeredEvents.includes(eventId)) {
            return res.status(400).json({
                success: false,
                message: 'You are already registered for this event'
            });
        }

        // 3. Create registration response
        const registration = await RegistrationResponse.create({
            event: eventId,
            user: req.user.id,
            form: formId,
            answers
        });

        // 4. Update user's registeredEvents and event's registration count
        user.registeredEvents.push(eventId);
        event.registrations = (event.registrations || 0) + 1;

        await Promise.all([user.save(), event.save()]);

        res.status(201).json({
            success: true,
            data: registration,
            message: 'Registration successful'
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'You have already registered for this event'
            });
        }
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all registrations for a specific event
// @route   GET /api/registrations/event/:eventId
// @access  Private (Organizer/Admin)
exports.getEventRegistrations = async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Privacy check: Only the organizer of this event or an admin can see registrations
        if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view registrations for this event'
            });
        }

        // Pagination and filtering (optional but good for spreadsheet view)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const skip = (page - 1) * limit;

        const registrations = await RegistrationResponse.find({ event: req.params.eventId })
            .populate('user', 'name email department year')
            .sort({ submittedAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await RegistrationResponse.countDocuments({ event: req.params.eventId });

        res.status(200).json({
            success: true,
            count: registrations.length,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            data: registrations
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get current user's registrations
// @route   GET /api/registrations/me
// @access  Private
exports.getMyRegistrations = async (req, res) => {
    try {
        const registrations = await RegistrationResponse.find({ user: req.user.id })
            .populate('event', 'title eventDate eventTime status')
            .sort({ submittedAt: -1 });

        res.status(200).json({
            success: true,
            data: registrations
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
