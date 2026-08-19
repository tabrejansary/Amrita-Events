const Event = require('../models/Event');
const User = require('../models/User');

// Helper function to calculate percentage change
const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
};

// Helper function to get date range
const getDateRange = (range) => {
    const now = new Date();
    const start = new Date();

    switch (range) {
        case '7':
            start.setDate(now.getDate() - 7);
            break;
        case '30':
            start.setDate(now.getDate() - 30);
            break;
        case '90':
            start.setDate(now.getDate() - 90);
            break;
        default:
            start.setDate(now.getDate() - 30);
    }

    return { start, end: now };
};

// @desc    Get KPI metrics
// @route   GET /api/admin/analytics/kpis
// @access  Private (Admin only)
exports.getKPIs = async (req, res) => {
    try {
        const range = req.query.range || '30'; // Default to 30 days
        const { start, end } = getDateRange(range);

        // Get previous period for comparison
        const periodLength = end - start;
        const previousStart = new Date(start - periodLength);
        const previousEnd = start;

        // Active users (users who logged in or updated in the period)
        const activeUsers = await User.countDocuments({
            updatedAt: { $gte: start, $lte: end }
        });

        const previousActiveUsers = await User.countDocuments({
            updatedAt: { $gte: previousStart, $lt: previousEnd }
        });

        // Total approved events
        const totalApprovedEvents = await Event.countDocuments({ status: 'approved' });
        const previousApprovedEvents = await Event.countDocuments({
            status: 'approved',
            createdAt: { $lt: previousEnd }
        });

        // Total views and registrations
        const engagement = await Event.aggregate([
            { $match: { status: 'approved' } },
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: '$views' },
                    totalRegistrations: { $sum: '$registrations' }
                }
            }
        ]);

        const currentEngagement = engagement[0] || { totalViews: 0, totalRegistrations: 0 };

        // For comparison, we'll estimate based on events created in previous period
        // This is approximate since we don't have historical view/registration data
        const previousEngagement = await Event.aggregate([
            {
                $match: {
                    status: 'approved',
                    createdAt: { $lt: previousEnd }
                }
            },
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: '$views' },
                    totalRegistrations: { $sum: '$registrations' }
                }
            }
        ]);

        const prevEngagement = previousEngagement[0] || { totalViews: 0, totalRegistrations: 0 };

        // Calculate conversion rate
        const conversionRate = currentEngagement.totalViews > 0
            ? (currentEngagement.totalRegistrations / currentEngagement.totalViews) * 100
            : 0;

        const previousConversionRate = prevEngagement.totalViews > 0
            ? (prevEngagement.totalRegistrations / prevEngagement.totalViews) * 100
            : 0;

        res.status(200).json({
            success: true,
            data: {
                activeUsers: {
                    value: activeUsers,
                    change: calculatePercentageChange(activeUsers, previousActiveUsers),
                    timeRange: `Last ${range} days`
                },
                totalApprovedEvents: {
                    value: totalApprovedEvents,
                    change: calculatePercentageChange(totalApprovedEvents, previousApprovedEvents),
                    timeRange: `Last ${range} days`
                },
                totalViews: {
                    value: currentEngagement.totalViews,
                    change: calculatePercentageChange(currentEngagement.totalViews, prevEngagement.totalViews),
                    timeRange: `Last ${range} days`
                },
                totalRegistrations: {
                    value: currentEngagement.totalRegistrations,
                    change: calculatePercentageChange(currentEngagement.totalRegistrations, prevEngagement.totalRegistrations),
                    timeRange: `Last ${range} days`
                },
                conversionRate: {
                    value: conversionRate.toFixed(2),
                    change: calculatePercentageChange(conversionRate, previousConversionRate),
                    timeRange: `Last ${range} days`
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get engagement trends over time
// @route   GET /api/admin/analytics/trends
// @access  Private (Admin only)
exports.getTrends = async (req, res) => {
    try {
        const period = req.query.period || '30d';
        const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;

        const now = new Date();
        const startDate = new Date();
        startDate.setDate(now.getDate() - days);

        // Get events created over time
        const eventsCreated = await Event.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Since we don't have timestamp-based view/registration history,
        // we'll show cumulative growth
        const allEvents = await Event.find({ status: 'approved' })
            .sort({ createdAt: 1 })
            .select('createdAt views registrations');

        // Build cumulative data
        const trendData = [];
        let cumulativeViews = 0;
        let cumulativeRegistrations = 0;

        // Create date buckets
        const dateBuckets = {};
        for (let i = days; i >= 0; i--) {
            const date = new Date();
            date.setDate(now.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            dateBuckets[dateStr] = {
                date: dateStr,
                eventsCreated: 0,
                views: 0,
                registrations: 0
            };
        }

        // Fill in events created
        eventsCreated.forEach(item => {
            if (dateBuckets[item._id]) {
                dateBuckets[item._id].eventsCreated = item.count;
            }
        });

        // Fill in cumulative views and registrations
        allEvents.forEach(event => {
            const eventDate = event.createdAt.toISOString().split('T')[0];
            cumulativeViews += event.views;
            cumulativeRegistrations += event.registrations;

            // Find the date bucket and all subsequent buckets
            Object.keys(dateBuckets).forEach(date => {
                if (date >= eventDate) {
                    dateBuckets[date].views = cumulativeViews;
                    dateBuckets[date].registrations = cumulativeRegistrations;
                }
            });
        });

        const trendsArray = Object.values(dateBuckets);

        res.status(200).json({
            success: true,
            data: trendsArray,
            note: 'Views and registrations show cumulative totals. For daily metrics, consider adding timestamp tracking to the Event model.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get event performance table data
// @route   GET /api/admin/analytics/event-performance
// @access  Private (Admin only)
exports.getEventPerformance = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy || 'views';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        const category = req.query.category;
        const skip = (page - 1) * limit;

        // Build query
        let query = { status: 'approved' };
        if (category) {
            query.category = category;
        }

        // Get total count
        const total = await Event.countDocuments(query);

        // Get events with sorting
        const events = await Event.find(query)
            .populate('organizer', 'name logo description')
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(limit)
            .lean();

        // Add conversion rate to each event
        const eventsWithMetrics = events.map(event => ({
            ...event,
            conversionRate: event.views > 0 ? ((event.registrations / event.views) * 100).toFixed(2) : 0,
            organizerName: event.organizer?.name || event.organizerName || 'Club Event'
        }));

        res.status(200).json({
            success: true,
            data: eventsWithMetrics,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get category and department insights
// @route   GET /api/admin/analytics/category-insights
// @access  Private (Admin only)
exports.getCategoryInsights = async (req, res) => {
    try {
        // Events by category
        const eventsByCategory = await Event.aggregate([
            { $match: { status: 'approved' } },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    totalRegistrations: { $sum: '$registrations' },
                    totalViews: { $sum: '$views' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Engagement by department
        const eventsByDepartment = await Event.aggregate([
            { $match: { status: 'approved' } },
            {
                $group: {
                    _id: '$department',
                    count: { $sum: 1 },
                    totalRegistrations: { $sum: '$registrations' },
                    totalViews: { $sum: '$views' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                categories: eventsByCategory,
                departments: eventsByDepartment
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get user activity insights
// @route   GET /api/admin/analytics/user-insights
// @access  Private (Admin only)
exports.getUserInsights = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Active vs inactive users
        const activeUsers = await User.countDocuments({
            updatedAt: { $gte: thirtyDaysAgo }
        });
        const totalUsers = await User.countDocuments();
        const inactiveUsers = totalUsers - activeUsers;

        // Users by year (students only)
        const usersByYear = await User.aggregate([
            { $match: { role: 'student' } },
            {
                $group: {
                    _id: '$year',
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Students vs clubs
        const students = await User.countDocuments({ role: 'student' });
        const clubs = await User.countDocuments({ role: 'club' });

        // Most active departments
        const departmentActivity = await User.aggregate([
            { $match: { role: 'student' } },
            {
                $group: {
                    _id: '$department',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        res.status(200).json({
            success: true,
            data: {
                activeVsInactive: {
                    active: activeUsers,
                    inactive: inactiveUsers,
                    total: totalUsers
                },
                usersByYear: usersByYear,
                studentsVsClubs: {
                    students,
                    clubs,
                    ratio: clubs > 0 ? (students / clubs).toFixed(2) : students
                },
                topDepartments: departmentActivity
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get top and low performing events
// @route   GET /api/admin/analytics/top-performers
// @access  Private (Admin only)
exports.getTopPerformers = async (req, res) => {
    try {
        // Top 5 by registrations
        const topByRegistrations = await Event.find({ status: 'approved' })
            .sort({ registrations: -1 })
            .limit(5)
            .populate('organizer', 'name logo description')
            .lean();

        // Top 5 by conversion rate (where views > 10 to avoid outliers)
        const allEvents = await Event.find({
            status: 'approved',
            views: { $gte: 10 }
        })
            .populate('organizer', 'name logo description')
            .lean();

        const eventsWithConversion = allEvents.map(event => ({
            ...event,
            conversionRate: event.views > 0 ? (event.registrations / event.views) * 100 : 0
        })).sort((a, b) => b.conversionRate - a.conversionRate).slice(0, 5);

        // Low performers: high views but low registrations (conversion < 5%)
        const lowPerformers = allEvents.filter(event => {
            const conversion = event.views > 0 ? (event.registrations / event.views) * 100 : 0;
            return event.views >= 50 && conversion < 5;
        }).map(event => ({
            ...event,
            conversionRate: event.views > 0 ? (event.registrations / event.views) * 100 : 0
        })).sort((a, b) => b.views - a.views).slice(0, 5);

        // Events with very low engagement overall
        const lowEngagement = await Event.find({
            status: 'approved',
            views: { $lt: 10 },
            createdAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // At least 7 days old
        })
            .sort({ views: 1 })
            .limit(5)
            .populate('organizer', 'name logo description')
            .lean();

        res.status(200).json({
            success: true,
            data: {
                topByRegistrations: topByRegistrations.map(e => ({
                    ...e,
                    organizerName: e.organizer?.name || e.organizerName || 'Club Event'
                })),
                topByConversion: eventsWithConversion.map(e => ({
                    ...e,
                    organizerName: e.organizer?.name || e.organizerName || 'Club Event'
                })),
                lowConversion: lowPerformers.map(e => ({
                    ...e,
                    organizerName: e.organizer?.name || e.organizerName || 'Club Event'
                })),
                lowEngagement: lowEngagement.map(e => ({
                    ...e,
                    organizerName: e.organizer?.name || e.organizerName || 'Club Event'
                }))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get platform insights
// @route   GET /api/admin/analytics/insights
// @access  Private (Admin only)
exports.getPlatformInsights = async (req, res) => {
    try {
        const insights = [];

        // Category performance comparison
        const categoryStats = await Event.aggregate([
            { $match: { status: 'approved' } },
            {
                $group: {
                    _id: '$category',
                    avgRegistrations: { $avg: '$registrations' },
                    avgViews: { $avg: '$views' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { avgRegistrations: -1 } }
        ]);

        if (categoryStats.length >= 2) {
            const best = categoryStats[0];
            const worst = categoryStats[categoryStats.length - 1];
            const ratio = worst.avgRegistrations > 0
                ? (best.avgRegistrations / worst.avgRegistrations).toFixed(1)
                : 'significantly';

            insights.push({
                type: 'category-performance',
                title: 'Category Performance',
                message: `${best._id} events receive ${ratio}× more registrations on average than ${worst._id} events.`,
                icon: 'chart'
            });
        }

        // Posting time analysis
        const now = new Date();
        const fiveDaysAgo = new Date(now);
        fiveDaysAgo.setDate(now.getDate() - 5);

        const earlyPosted = await Event.aggregate([
            {
                $match: {
                    status: 'approved',
                    $expr: {
                        $gte: [
                            { $subtract: ['$eventDate', '$createdAt'] },
                            5 * 24 * 60 * 60 * 1000 // 5 days in milliseconds
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    avgRegistrations: { $avg: '$registrations' }
                }
            }
        ]);

        const latePosted = await Event.aggregate([
            {
                $match: {
                    status: 'approved',
                    $expr: {
                        $lt: [
                            { $subtract: ['$eventDate', '$createdAt'] },
                            5 * 24 * 60 * 60 * 1000
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    avgRegistrations: { $avg: '$registrations' }
                }
            }
        ]);

        if (earlyPosted.length > 0 && latePosted.length > 0) {
            const earlyAvg = earlyPosted[0].avgRegistrations;
            const lateAvg = latePosted[0].avgRegistrations;
            if (earlyAvg > lateAvg * 1.2) {
                insights.push({
                    type: 'posting-time',
                    title: 'Optimal Posting Time',
                    message: 'Events posted 5+ days before the event date receive 20% more registrations on average.',
                    icon: 'calendar'
                });
            }
        }

        // Event day trends
        const eventDayStats = await Event.aggregate([
            { $match: { status: 'approved' } },
            {
                $addFields: {
                    dayOfWeek: { $dayOfWeek: '$eventDate' }
                }
            },
            {
                $group: {
                    _id: '$dayOfWeek',
                    avgRegistrations: { $avg: '$registrations' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { avgRegistrations: -1 } }
        ]);

        if (eventDayStats.length > 0) {
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const bestDay = dayNames[eventDayStats[0]._id - 1];
            insights.push({
                type: 'event-day',
                title: 'Best Event Day',
                message: `${bestDay} events show the highest attendance rates.`,
                icon: 'star'
            });
        }

        // Overall platform health
        const totalEvents = await Event.countDocuments({ status: 'approved' });
        const totalUsers = await User.countDocuments({ role: 'student' });
        const avgViewsPerUser = totalEvents > 0 ? (totalUsers / totalEvents).toFixed(1) : 0;

        if (avgViewsPerUser > 5) {
            insights.push({
                type: 'platform-health',
                title: 'Platform Growth',
                message: `Strong user engagement with ${totalUsers} active students across ${totalEvents} events.`,
                icon: 'users'
            });
        }

        res.status(200).json({
            success: true,
            data: insights
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
