const Event = require('../models/Event');
const Notification = require('../models/Notification');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// @desc    Get pending events
// @route   GET /api/admin/events/pending
// @access  Private (Admin only)
exports.getPendingEvents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await Event.countDocuments({ status: 'pending' });

        const events = await Event.find({ status: 'pending' })
            .sort({ createdAt: -1 })
            .populate('organizer', 'name email clubName role')
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            count: events.length,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            data: events,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Approve event
// @route   PUT /api/admin/events/:id/approve
// @access  Private (Admin only)
exports.approveEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
            });
        }

        event.status = 'approved';
        await event.save();

        // Create notification for organizer
        await Notification.create({
            user: event.organizer,
            event: event._id,
            type: 'approval',
            title: 'Event Approved',
            message: `Your event "${event.title}" has been approved and is now visible to students.`,
        });

        res.status(200).json({
            success: true,
            data: event,
            message: 'Event approved successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Reject event
// @route   PUT /api/admin/events/:id/reject
// @access  Private (Admin only)
exports.rejectEvent = async (req, res) => {
    try {
        const { reason } = req.body;
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
            });
        }

        event.status = 'rejected';
        event.rejectionReason = reason;
        await event.save();

        // Create notification for organizer
        await Notification.create({
            user: event.organizer,
            event: event._id,
            type: 'rejection',
            title: 'Event Rejected',
            message: `Your event "${event.title}" has been rejected. Reason: ${reason || 'Not specified'}`,
        });

        res.status(200).json({
            success: true,
            data: event,
            message: 'Event rejected successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Feature/Unfeature event
// @route   PUT /api/admin/events/:id/feature
// @access  Private (Admin only)
exports.toggleFeature = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
            });
        }

        event.isFeatured = !event.isFeatured;
        await event.save();

        // If featuring, notify relevant students
        if (event.isFeatured) {
            const students = await User.find({
                role: 'student',
                interests: event.category,
            });

            const notifications = students.map(student => ({
                user: student._id,
                event: event._id,
                type: 'featured',
                title: 'Featured Event',
                message: `"${event.title}" has been featured! Check it out.`,
            }));

            await Notification.insertMany(notifications);
        }

        res.status(200).json({
            success: true,
            data: event,
            message: event.isFeatured ? 'Event featured successfully' : 'Event unfeatured successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Send campus-wide announcement
// @route   POST /api/admin/announcement
// @access  Private (Admin only)
exports.sendAnnouncement = async (req, res) => {
    try {
        const { title, message, targetAudience } = req.body;

        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Please provide title and message',
            });
        }

        // Determine target query
        let query = {};
        if (targetAudience === 'student') {
            query = { role: 'student' };
        } else if (targetAudience === 'club') {
            query = { role: 'club' };
        } else if (targetAudience === 'all') {
            query = { role: { $in: ['student', 'club'] } };
        } else {
            // Default to all if not specified
            query = { role: { $in: ['student', 'club'] } };
        }

        const users = await User.find(query);

        // Create notifications for all users
        const notifications = users.map(user => ({
            user: user._id,
            type: 'announcement',
            title,
            message,
        }));
        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        res.status(200).json({
            success: true,
            message: `Announcement sent to ${users.length} users`,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Helper to get date based on range (supports custom)
const getDateFromRange = (range, startDateStr, endDateStr) => {
    const today = new Date();

    if (range === 'custom' && startDateStr && endDateStr) {
        // Parse custom date strings (YYYY-MM-DD)
        const start = new Date(startDateStr);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDateStr);
        end.setHours(23, 59, 59, 999);

        return { start, end };
    }

    const date = new Date();
    if (range === '7') date.setDate(today.getDate() - 7);
    else if (range === '30') date.setDate(today.getDate() - 30);
    else if (range === '90') date.setDate(today.getDate() - 90);
    else if (range === '365') date.setDate(today.getDate() - 365);
    else if (range === 'all') return { start: new Date(0), end: today }; // All time
    else date.setDate(today.getDate() - 30); // Default 30 days

    return { start: date, end: today };
};

// @desc    Get Key Performance Indicators
// @route   GET /api/admin/analytics/kpis
// @access  Private/Admin
exports.getKPIs = async (req, res) => {
    try {
        const { range, startDate, endDate } = req.query;
        const { start: dateRange, end: contentEndDate } = getDateFromRange(range, startDate, endDate);

        // For trend calculation (previous period), calculate the duration of the current range
        const duration = contentEndDate.getTime() - dateRange.getTime();
        const previousDateRange = new Date(dateRange.getTime() - duration);
        const previousEndDate = new Date(contentEndDate.getTime() - duration);

        // --- Active Users ---
        const activeUsers = await User.countDocuments({
            lastLogin: { $gte: dateRange, $lte: contentEndDate }
        });
        const prevActiveUsers = await User.countDocuments({
            lastLogin: { $gte: previousDateRange, $lt: dateRange } // Use strictly less for previous end to avoid overlap
        });

        // --- Total Approved Events ---
        const approvedEvents = await Event.countDocuments({
            status: 'approved',
            createdAt: { $gte: dateRange, $lte: contentEndDate }
        });
        const prevApprovedEvents = await Event.countDocuments({
            status: 'approved',
            createdAt: { $gte: previousDateRange, $lt: dateRange }
        });

        // --- Total Views ---
        const views = await Event.aggregate([
            { $match: { createdAt: { $gte: dateRange, $lte: contentEndDate } } },
            { $group: { _id: null, total: { $sum: '$views' } } }
        ]);
        const totalViews = views[0]?.total || 0;

        const prevViews = await Event.aggregate([
            { $match: { createdAt: { $gte: previousDateRange, $lt: dateRange } } },
            { $group: { _id: null, total: { $sum: '$views' } } }
        ]);
        const prevTotalViews = prevViews[0]?.total || 0;

        // --- Total Registrations ---
        const registrations = await Event.aggregate([
            { $match: { createdAt: { $gte: dateRange, $lte: contentEndDate } } },
            { $group: { _id: null, total: { $sum: '$registrations' } } }
        ]);
        const totalRegistrations = registrations[0]?.total || 0;

        const prevRegistrations = await Event.aggregate([
            { $match: { createdAt: { $gte: previousDateRange, $lt: dateRange } } },
            { $group: { _id: null, total: { $sum: '$registrations' } } }
        ]);
        const prevTotalRegistrations = prevRegistrations[0]?.total || 0;


        // Calculate changes
        const calculateChange = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        };

        // Conversion Rate
        const conversionRate = totalViews > 0 ? ((totalRegistrations / totalViews) * 100).toFixed(1) : 0;
        const prevConversionRate = prevTotalViews > 0 ? ((prevTotalRegistrations / prevTotalViews) * 100).toFixed(1) : 0;

        res.status(200).json({
            success: true,
            data: {
                activeUsers: {
                    value: activeUsers,
                    change: calculateChange(activeUsers, prevActiveUsers),
                    timeRange: range === 'custom' ? `${dateRange.toLocaleDateString()} - ${contentEndDate.toLocaleDateString()}` : `Last ${range} Days`
                },
                totalApprovedEvents: {
                    value: approvedEvents,
                    change: calculateChange(approvedEvents, prevApprovedEvents),
                    timeRange: range === 'custom' ? `${dateRange.toLocaleDateString()} - ${contentEndDate.toLocaleDateString()}` : `Last ${range} Days`
                },
                totalViews: {
                    value: totalViews,
                    change: calculateChange(totalViews, prevTotalViews),
                    timeRange: range === 'custom' ? `${dateRange.toLocaleDateString()} - ${contentEndDate.toLocaleDateString()}` : `Last ${range} Days`
                },
                totalRegistrations: {
                    value: totalRegistrations,
                    change: calculateChange(totalRegistrations, prevTotalRegistrations),
                    timeRange: range === 'custom' ? `${dateRange.toLocaleDateString()} - ${contentEndDate.toLocaleDateString()}` : `Last ${range} Days`
                },
                conversionRate: {
                    value: conversionRate,
                    change: (conversionRate - prevConversionRate).toFixed(1),
                    timeRange: range === 'custom' ? `${dateRange.toLocaleDateString()} - ${contentEndDate.toLocaleDateString()}` : `Last ${range} Days`
                }
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Get platform statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
exports.getStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalClubs = await User.countDocuments({ role: 'club' });
        const totalEvents = await Event.countDocuments();
        const approvedEvents = await Event.countDocuments({ status: 'approved' });
        const pendingEvents = await Event.countDocuments({ status: 'pending' });

        // Get event category distribution
        const categoryStats = await Event.aggregate([
            { $match: { status: 'approved' } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
        ]);

        // Get total views and registrations
        const engagementStats = await Event.aggregate([
            { $match: { status: 'approved' } },
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: '$views' },
                    totalRegistrations: { $sum: '$registrations' },
                },
            },
        ]);

        res.status(200).json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    students: totalStudents,
                    clubs: totalClubs,
                },
                events: {
                    total: totalEvents,
                    approved: approvedEvents,
                    pending: pendingEvents,
                },
                categories: categoryStats,
                engagement: engagementStats[0] || { totalViews: 0, totalRegistrations: 0 },
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get engagement trends
// @route   GET /api/admin/analytics/trends
// @access  Private/Admin
exports.getTrends = async (req, res) => {
    try {
        const { period, startDate, endDate } = req.query;
        const { start: dateRange, end: contentEndDate } = getDateFromRange(period, startDate, endDate);

        const trends = await Event.aggregate([
            {
                $match: {
                    createdAt: { $gte: dateRange, $lte: contentEndDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    eventsCreated: { $sum: 1 },
                    views: { $sum: '$views' },
                    registrations: { $sum: '$registrations' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Fill in missing dates
        const result = [];
        let currentDate = new Date(dateRange);
        const lastDate = new Date(contentEndDate);

        while (currentDate <= lastDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const data = trends.find(t => t._id === dateStr) || { eventsCreated: 0, views: 0, registrations: 0 };

            result.push({
                date: dateStr,
                eventsCreated: data.eventsCreated,
                views: data.views,
                registrations: data.registrations
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get event performance
// @route   GET /api/admin/analytics/event-performance
// @access  Private/Admin
exports.getEventPerformance = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { sortBy = 'views', sortOrder = 'desc', category, startDate, endDate } = req.query;

        let query = { status: 'approved' };

        if (category) {
            query.category = category;
        }

        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.createdAt = { $gte: start, $lte: end };
        }

        const total = await Event.countDocuments(query);
        const events = await Event.find(query)
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .skip(skip)
            .limit(limit)
            .select('title category organizer views registrations conversionRate isFeatured status organizerName');

        // Populate organizer name if needed
        const populatedEvents = await Promise.all(events.map(async (event) => {
            if (!event.organizerName) {
                const organizer = await User.findById(event.organizer).select('name');
                return { ...event.toObject(), organizerName: organizer ? organizer.name : 'Unknown' };
            }
            return event;
        }));

        res.status(200).json({
            success: true,
            count: events.length,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            data: populatedEvents
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all events (for management)
// @route   GET /api/admin/events
// @access  Private (Admin only)
exports.getAllEvents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;
        const now = new Date();

        // 1. Global Auto-complete past approved events
        await Event.updateMany(
            {
                status: 'approved',
                eventDate: { $lt: now }
            },
            { $set: { status: 'completed' } }
        );

        let query = {};

        // Filters
        if (req.query.status && req.query.status !== 'all') {
            query.status = req.query.status;
        }

        if (req.query.isFeatured) {
            query.isFeatured = req.query.isFeatured === 'true';
        }

        if (req.query.isSpecial === 'true') {
            // Special events are those created by admin or tagged as special
            query['$or'] = [
                { 'organizerName': 'Admin' },
                { 'organizerName': 'admin' }
            ];
            // Check if we can join for role 'admin'
            const adminUsers = await User.find({ role: 'admin' }).select('_id');
            const adminIds = adminUsers.map(u => u._id);
            query['$or'].push({ organizer: { $in: adminIds } });
        }

        if (req.query.upcoming === 'true') {
            query.eventDate = { $gte: new Date() };
        }

        // Search term
        if (req.query.search) {
            query.title = { $regex: req.query.search, $options: 'i' };
        }

        const total = await Event.countDocuments(query);

        const events = await Event.find(query)
            .sort({ createdAt: -1 })
            .populate('organizer', 'name email clubName role')
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            count: events.length,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            data: events,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Invite new admin
// @route   POST /api/admin/invite
// @access  Private (Admin only)
exports.inviteAdmin = async (req, res) => {
    try {
        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name and email',
            });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists',
            });
        }

        // Generate temporary password
        const tempPassword = crypto.randomBytes(4).toString('hex'); // 8 characters

        // Create admin user
        const user = await User.create({
            name,
            email,
            password: tempPassword,
            role: 'admin',
            isVerified: true, // Automatically verify invited admins
        });

        // Send invitation email
        const message = `
            <h1>Admin Invitation</h1>
            <p>Hello ${name},</p>
            <p>You have been invited to be an admin on Amrita Events.</p>
            <p>Your temporary login credentials are:</p>
            <ul>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Password:</strong> ${tempPassword}</li>
            </ul>
            <p>Please log in and reset your password as soon as possible.</p>
            <p><a href="${process.env.FRONTEND_URL}/login">Login Here</a></p>
        `;

        try {
            await sendEmail({
                email,
                subject: 'Amrita Events - Admin Invitation',
                html: message,
            });

            res.status(201).json({
                success: true,
                message: 'Admin invited successfully and email sent',
                data: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                },
            });
        } catch (err) {
            console.error('Email could not be sent:', err);
            res.status(201).json({
                success: true,
                message: 'Admin created but invitation email could not be sent. Password is: ' + tempPassword,
                data: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                },
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get all admins
// @route   GET /api/admin/admins
// @access  Private (Admin only)
exports.getAdmins = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await User.countDocuments({ role: 'admin' });
        const admins = await User.find({ role: 'admin' })
            .select('-password')
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            count: admins.length,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            data: admins,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
// @desc    Get all registered clubs
// @route   GET /api/admin/clubs
// @access  Private (Admin only)
exports.getAllClubs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await User.countDocuments({ role: 'club' });

        const clubs = await User.find({ role: 'club' })
            .select('-password')
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            count: clubs.length,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            data: clubs,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
