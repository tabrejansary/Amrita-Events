const mongoose = require('mongoose');
const Event = require('../models/Event');

// @desc    Get club's own events
// @route   GET /api/club/events
// @access  Private (Club only)
exports.getMyEvents = async (req, res) => {
    try {
        if (!req.user.club) {
            return res.status(400).json({
                success: false,
                message: 'You are not part of any club. Create or join a club first.',
            });
        }

        const clubId = req.user.club; // Club._id, shared by all members
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const now = new Date();

        // 1. Auto-complete past approved events
        await Event.updateMany(
            {
                organizer: clubId,
                status: 'approved',
                eventDate: { $lt: now }
            },
            { $set: { status: 'completed' } }
        );

        // 2. Fetch Upcoming Events (Pending or Approved and >= now)
        const upcomingQuery = {
            organizer: clubId,
            status: { $in: ['pending', 'approved'] },
            eventDate: { $gte: now }
        };

        const upcomingTotal = await Event.countDocuments(upcomingQuery);
        const upcomingEvents = await Event.find(upcomingQuery)
            .sort({ eventDate: 1 }) // Closest first
            .skip(skip)
            .limit(limit);

        // 3. Fetch Completed Events (status: 'completed' or manually marked)
        // Also include Rejected events here for history? 
        // User specifically asked for "Completed events"
        const completedQuery = {
            organizer: clubId,
            $or: [
                { status: 'completed' },
                { status: 'rejected' }, // History
                // Catch-all for past events that weren't caught by auto-complete (e.g. pending ones)
                { status: 'pending', eventDate: { $lt: now } }
            ]
        };

        const completedEvents = await Event.find(completedQuery)
            .sort({ eventDate: -1 }) // Most recent first
            .limit(10); // Show last 10 for history

        // 4. Get general stats for individual display if needed
        const approvedCount = await Event.countDocuments({ organizer: clubId, status: 'approved' });
        const pendingCount = await Event.countDocuments({ organizer: clubId, status: 'pending' });
        const viewsResult = await Event.aggregate([
            { $match: { organizer: new mongoose.Types.ObjectId(clubId) } },
            { $group: { _id: null, totalViews: { $sum: "$views" } } }
        ]);

        res.status(200).json({
            success: true,
            count: upcomingEvents.length,
            pagination: {
                page,
                limit,
                total: upcomingTotal,
                pages: Math.ceil(upcomingTotal / limit)
            },
            stats: {
                approved: approvedCount,
                pending: pendingCount,
                totalViews: viewsResult[0]?.totalViews || 0
            },
            data: {
                upcoming: upcomingEvents,
                completed: completedEvents
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get broad analytics for club dashboard
// @route   GET /api/club/stats
// @access  Private (Club owner)
exports.getClubStats = async (req, res) => {
    try {
        if (!req.user.club) {
            return res.status(400).json({
                success: false,
                message: 'You are not part of any club.',
            });
        }

        const clubId = new mongoose.Types.ObjectId(req.user.club);
        const { range, status } = req.query;
        const now = new Date();

        // Build query filter
        let queryFilter = { organizer: clubId };

        // 1. Creation Date (Range) Filter
        if (range) {
            if (range === 'custom' && req.query.startDate && req.query.endDate) {
                const start = new Date(req.query.startDate);
                start.setHours(0, 0, 0, 0);
                const end = new Date(req.query.endDate);
                end.setHours(23, 59, 59, 999);
                queryFilter.createdAt = { $gte: start, $lte: end };
            } else if (range !== 'all') {
                const days = parseInt(range);
                if (!isNaN(days)) {
                    const startDate = new Date();
                    startDate.setDate(now.getDate() - days);
                    queryFilter.createdAt = { $gte: startDate };
                }
            }
        }

        // 2. Event Date (Status) Filter
        if (status === 'upcoming') {
            queryFilter.eventDate = { $gte: now };
        } else if (status === 'completed') {
            queryFilter.eventDate = { $lt: now };
        }

        // Aggregate overall stats with filters
        const overallStats = await Event.aggregate([
            { $match: queryFilter },
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: "$views" },
                    totalRegistrations: { $sum: "$registrations" },
                    totalEvents: { $sum: 1 },
                    approvedEvents: {
                        $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] }
                    }
                }
            }
        ]);

        // Get filtered events with performance metrics
        const eventStats = await Event.find(queryFilter)
            .select('title views registrations status eventDate category')
            .sort({ eventDate: -1 });

        const stats = overallStats[0] || {
            totalViews: 0,
            totalRegistrations: 0,
            totalEvents: 0,
            approvedEvents: 0
        };

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    ...stats,
                    conversionRate: stats.totalViews > 0
                        ? ((stats.totalRegistrations / stats.totalViews) * 100).toFixed(2)
                        : 0
                },
                events: eventStats.map(e => ({
                    ...e.toObject(),
                    conversionRate: e.views > 0
                        ? ((e.registrations / e.views) * 100).toFixed(2)
                        : 0
                }))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get event analytics
// @route   GET /api/club/analytics/:eventId
// @access  Private (Club owner or Admin)
exports.getEventAnalytics = async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
            });
        }

        // Check ownership — any member of the club can view analytics
        const userClubId = req.user.club?._id?.toString() || req.user.club?.toString();
        const isClubMember = userClubId && event.organizer?.toString() === userClubId;
        if (!isClubMember && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view analytics for this event',
            });
        }

        res.status(200).json({
            success: true,
            data: {
                eventId: event._id,
                title: event.title,
                views: event.views,
                registrations: event.registrations,
                conversionRate: event.views > 0 ? ((event.registrations / event.views) * 100).toFixed(2) : 0,
                status: event.status,
                isFeatured: event.isFeatured,
                createdAt: event.createdAt,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
