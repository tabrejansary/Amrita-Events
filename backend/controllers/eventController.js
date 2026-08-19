const Event = require('../models/Event');
const User = require('../models/User');
const Club = require('../models/Club');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// Memory cache to prevent double-counting views within a short window (e.g., 10s)
const recentViews = new Map();

// Helper to attach isRegistered and isBookmarked to event objects based on the logged-in user
const formatEventsWithUserStatus = (events, user) => {
    if (!user) return events;
    const registeredSet = new Set((user.registeredEvents || []).map(id => (id?._id || id)?.toString()));
    const savedSet = new Set((user.savedEvents || []).map(id => (id?._id || id)?.toString()));

    return events.map(evt => {
        const obj = evt.toObject ? evt.toObject() : { ...evt };
        obj.isRegistered = registeredSet.has(obj._id.toString());
        obj.isBookmarked = savedSet.has(obj._id.toString());
        return obj;
    });
};

// @desc    Get all approved events (filtered by user interests for students)
// @route   GET /api/events
// @access  Private
exports.getEvents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12; // Increased limit for grid view
        const skip = (page - 1) * limit;

        let query = { status: 'approved', eventDate: { $gte: new Date() } };

        // Interest-based filtering for students
        if (req.user.role === 'student' && req.user.interests && req.user.interests.length > 0) {
            query.category = { $in: req.user.interests };
        }

        // Additional filters from query params
        if (req.query.category) {
            query.category = req.query.category;
        }
        if (req.query.department && req.query.department !== 'All') {
            query.department = req.query.department;
        }
        if (req.query.isOnline !== undefined) {
            query.isOnline = req.query.isOnline === 'true';
        }
        if (req.query.startDate) {
            query.eventDate = { $gte: new Date(req.query.startDate) };
        }
        if (req.query.endDate) {
            query.eventDate = { ...query.eventDate, $lte: new Date(req.query.endDate) };
        }

        const total = await Event.countDocuments(query);

        // Sort: Featured first, then by date
        const events = await Event.find(query)
            .sort({ isFeatured: -1, eventDate: 1 })
            .populate('organizer', 'name logo')
            .populate('postedBy', 'name email')
            .populate('customForm')
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
            data: formatEventsWithUserStatus(events, req.user),
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get upcoming events (main feed)
// @route   GET /api/events/upcoming
// @access  Private
exports.getUpcomingEvents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        let query = {
            status: 'approved',
            eventDate: { $gte: new Date() }
        };

        // Apply filters
        if (req.query.category) query.category = req.query.category;
        if (req.query.department) query.department = req.query.department;
        if (req.query.isOnline) query.isOnline = req.query.isOnline === 'true';

        // Interest-based filtering for students (Default to interests if no category selected)
        if (req.user.role === 'student' && req.user.interests && req.user.interests.length > 0 && !req.query.category) {
            query.category = { $in: req.user.interests };
        }

        const total = await Event.countDocuments(query);

        const events = await Event.find(query)
            .sort({ eventDate: 1 })
            .populate('organizer', 'name logo description')
            .populate('postedBy', 'name email')
            .populate('customForm')
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
            data: formatEventsWithUserStatus(events, req.user),
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get events happening today or this week
// @route   GET /api/events/this-week
// @access  Private
exports.getThisWeekEvents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        let query = {
            status: 'approved',
            eventDate: { $gte: today, $lte: nextWeek }
        };

        // Apply filters
        if (req.query.category) query.category = req.query.category;
        if (req.query.department) query.department = req.query.department;
        if (req.query.isOnline) query.isOnline = req.query.isOnline === 'true';

        // Interest-based filtering for students (Default to interests if no category selected)
        if (req.user.role === 'student' && req.user.interests && req.user.interests.length > 0 && !req.query.category) {
            query.category = { $in: req.user.interests };
        }

        const total = await Event.countDocuments(query);

        const events = await Event.find(query)
            .sort({ eventDate: 1 })
            .populate('organizer', 'name logo description')
            .populate('postedBy', 'name email')
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
            data: formatEventsWithUserStatus(events, req.user),
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get featured events
// @route   GET /api/events/featured
// @access  Private
exports.getFeaturedEvents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        const query = {
            status: 'approved',
            isFeatured: true,
            eventDate: { $gte: new Date() }
        };

        const total = await Event.countDocuments(query);

        const events = await Event.find(query)
            .sort({ eventDate: 1 })
            .populate('organizer', 'name logo description')
            .populate('postedBy', 'name email')
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
            data: formatEventsWithUserStatus(events, req.user),
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get general campus-wide events
// @route   GET /api/events/general
// @access  Private
exports.getGeneralEvents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        let query = {
            status: 'approved',
            department: 'All',
            eventDate: { $gte: new Date() }
        };

        // Apply filters (Allow filtering within General events)
        if (req.query.category) query.category = req.query.category;
        if (req.query.isOnline) query.isOnline = req.query.isOnline === 'true';

        // Note: No interest-based filtering for General events (Campus-Wide)

        const total = await Event.countDocuments(query);

        const events = await Event.find(query)
            .sort({ eventDate: 1 })
            .populate('organizer', 'name logo description')
            .populate('postedBy', 'name email')
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
            data: formatEventsWithUserStatus(events, req.user),
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get trending events (most bookmarked)
// @route   GET /api/events/trending
// @access  Private
exports.getTrendingEvents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {
            status: 'approved',
            eventDate: { $gte: new Date() }
        };

        const total = await Event.countDocuments(query);

        const events = await Event.find(query)
            .sort({ bookmarksCount: -1, views: -1 })
            .skip(skip)
            .limit(limit)
            .populate('organizer', 'name logo description')
            .populate('postedBy', 'name email');

        res.status(200).json({
            success: true,
            count: events.length,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            data: formatEventsWithUserStatus(events, req.user),
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get user's saved/bookmarked events
// @route   GET /api/events/saved
// @access  Private
exports.getSavedEvents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        const user = await User.findById(req.user.id);
        const savedIds = (user.savedEvents || []).map(id => id.toString());

        let query = {
            _id: { $in: savedIds },
            status: { $in: ['approved', 'completed'] }
        };

        // Apply filters
        if (req.query.category) query.category = req.query.category;
        if (req.query.department && req.query.department !== 'All') query.department = req.query.department;
        if (req.query.isOnline !== undefined) query.isOnline = req.query.isOnline === 'true';

        const total = await Event.countDocuments(query);

        const events = await Event.find(query)
            .sort({ eventDate: 1 })
            .populate('organizer', 'name logo description')
            .populate('postedBy', 'name email')
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
            data: formatEventsWithUserStatus(events, req.user),
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get user's registered events
// @route   GET /api/events/registered
// @access  Private
exports.getRegisteredEvents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        const user = await User.findById(req.user.id);
        const registeredIds = (user.registeredEvents || []).map(id => id.toString());

        let query = {
            _id: { $in: registeredIds },
            status: { $in: ['approved', 'completed'] }
        };

        // Apply filters
        if (req.query.category) query.category = req.query.category;
        if (req.query.department && req.query.department !== 'All') query.department = req.query.department;
        if (req.query.isOnline !== undefined) query.isOnline = req.query.isOnline === 'true';

        const total = await Event.countDocuments(query);

        const events = await Event.find(query)
            .sort({ eventDate: 1 })
            .populate('organizer', 'name logo description')
            .populate('postedBy', 'name email')
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
            data: formatEventsWithUserStatus(events, req.user),
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get past events
// @route   GET /api/events/past
// @access  Private
exports.getPastEvents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        let query = {
            status: { $in: ['approved', 'completed'] },
            eventDate: { $lt: new Date() }
        };

        // Apply filters
        if (req.query.category) query.category = req.query.category;
        if (req.query.department) query.department = req.query.department;
        if (req.query.isOnline) query.isOnline = req.query.isOnline === 'true';

        // Interest-based filtering for students (Default to interests if no category selected)
        if (req.user.role === 'student' && req.user.interests && req.user.interests.length > 0 && !req.query.category) {
            query.category = { $in: req.user.interests };
        }

        const total = await Event.countDocuments(query);

        const events = await Event.find(query)
            .sort({ eventDate: -1 })
            .populate('organizer', 'name logo description')
            .populate('postedBy', 'name email')
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
            data: formatEventsWithUserStatus(events, req.user),
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Toggle bookmark on an event
// @route   POST /api/events/:id/bookmark
// @access  Private
exports.toggleBookmark = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const eventId = req.params.id;

        // Check if event exists
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
            });
        }

        // Check if already bookmarked
        const index = user.savedEvents.indexOf(eventId);

        if (index > -1) {
            // Remove bookmark
            user.savedEvents.splice(index, 1);
            event.bookmarksCount = Math.max(0, (event.bookmarksCount || 0) - 1);
            await Promise.all([user.save(), event.save()]);
            return res.status(200).json({
                success: true,
                bookmarked: false,
                message: 'Event removed from bookmarks',
            });
        } else {
            // Add bookmark
            user.savedEvents.push(eventId);
            event.bookmarksCount = (event.bookmarksCount || 0) + 1;
            await Promise.all([user.save(), event.save()]);
            return res.status(200).json({
                success: true,
                bookmarked: true,
                message: 'Event added to bookmarks',
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Private
exports.getEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'name logo description')
            .populate('postedBy', 'name email')
            .populate('customForm');

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
            });
        }

        // Increment view count ONLY if user is NOT the organizer/club member and NOT an admin
        // AND handle the "double increment" issue by checking if this request is a duplicate within 10s
        const isOrganizer = (event.postedBy && req.user.id === event.postedBy._id.toString()) ||
            (req.user.club && event.organizer && req.user.club.toString() === event.organizer._id.toString());
        const isAdmin = req.user.role === 'admin';
        const viewKey = `${req.user.id}:${req.params.id}`;
        const now = Date.now();
        const lastViewTime = recentViews.get(viewKey);

        if (!isOrganizer && !isAdmin && (!lastViewTime || now - lastViewTime > 10000)) {
            recentViews.set(viewKey, now);
            event.views += 1;
            await event.save();

            // Periodic cleanup of recentViews cache
            if (recentViews.size > 2000) {
                for (const [key, time] of recentViews.entries()) {
                    if (now - time > 30000) recentViews.delete(key);
                }
            }
        }

        const eventData = event.toObject ? event.toObject() : { ...event };
        if (req.user) {
            const registeredSet = new Set((req.user.registeredEvents || []).map(id => (id?._id || id)?.toString()));
            const savedSet = new Set((req.user.savedEvents || []).map(id => (id?._id || id)?.toString()));
            eventData.isRegistered = registeredSet.has(event._id.toString());
            eventData.isBookmarked = savedSet.has(event._id.toString());
        }

        res.status(200).json({
            success: true,
            data: eventData,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private (Club & Admin only)
exports.createEvent = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            department,
            venue,
            eventDate,
            eventTime,
            registrationLink,
            isOnline,
            contacts,
            useInternalRegistration,
            customForm,
        } = req.body;

        // Parse contacts if sent as string (from FormData)
        let parsedContacts = [];
        if (typeof contacts === 'string') {
            try {
                parsedContacts = JSON.parse(contacts);
            } catch (e) {
                parsedContacts = [];
            }
        } else if (Array.isArray(contacts)) {
            parsedContacts = contacts;
        }

        // For club users: require they belong to a club
        if (req.user.role === 'club') {
            if (!req.user.club) {
                return res.status(400).json({
                    success: false,
                    message: 'You must create or join a club before posting events.',
                });
            }
        }

        // Fetch club name for organizerName
        let organizerName = 'Admin';
        let organizerId = req.user.id; // fallback for admin
        if (req.user.role === 'club') {
            const club = await Club.findById(req.user.club);
            if (!club) {
                return res.status(404).json({ success: false, message: 'Club not found.' });
            }
            organizerName = club.name;
            organizerId = club._id;
        }

        // Create event object
        const eventData = {
            title,
            description,
            category,
            department: department || 'All',
            venue,
            eventDate,
            eventTime,
            registrationLink,
            isOnline: isOnline || false,
            organizer: organizerId,
            postedBy: req.user.id,
            organizerName,
            status: req.user.role === 'admin' ? 'approved' : 'pending',
            contacts: parsedContacts,
            useInternalRegistration: useInternalRegistration === 'true' || useInternalRegistration === true,
            customForm: customForm || null,
        };

        // Handle image upload if provided
        if (req.files) {
            // Handle poster image
            if (req.files.poster && req.files.poster[0]) {
                try {
                    const result = await cloudinary.uploader.upload(req.files.poster[0].path, {
                        folder: 'amrita-pulse/events',
                        transformation: [{ width: 800, height: 600, crop: 'fill', quality: 'auto' }],
                    });
                    eventData.posterImage = result.secure_url;
                    fs.unlinkSync(req.files.poster[0].path);
                } catch (uploadError) {
                    console.error('Poster upload failed:', uploadError);
                }
            }

            // Handle gallery items
            if (req.files.gallery && req.files.gallery.length > 0) {
                eventData.gallery = [];
                for (const file of req.files.gallery) {
                    try {
                        const isVideo = file.mimetype.startsWith('video');
                        const result = await cloudinary.uploader.upload(file.path, {
                            folder: 'amrita-pulse/gallery',
                            resource_type: isVideo ? 'video' : 'image',
                        });
                        eventData.gallery.push({
                            url: result.secure_url,
                            resourceType: isVideo ? 'video' : 'image'
                        });
                        fs.unlinkSync(file.path);
                    } catch (uploadError) {
                        console.error('Gallery file upload failed:', uploadError);
                    }
                }
            }
        }

        const event = await Event.create(eventData);

        res.status(201).json({
            success: true,
            data: event,
            message: req.user.role === 'admin' ? 'Event created and approved' : 'Event created and pending approval',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Owner or Admin only)
exports.updateEvent = async (req, res) => {
    try {
        let event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
            });
        }

        // Check ownership & permissions
        // event.organizer is a Club ObjectId (after Club refactor)
        // Any member of the same club can edit/delete club events; admins can edit any event
        const userClubId = req.user.club?._id?.toString() || req.user.club?.toString();
        const isClubOwner = userClubId && event.organizer?.toString() === userClubId;
        const isAdmin = req.user.role === 'admin';

        if (!isClubOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this event.',
            });
        }

        // Handle image upload if provided
        if (req.files) {
            // Handle poster image
            if (req.files.poster && req.files.poster[0]) {
                try {
                    const result = await cloudinary.uploader.upload(req.files.poster[0].path, {
                        folder: 'amrita-pulse/events',
                        transformation: [{ width: 800, height: 600, crop: 'fill', quality: 'auto' }],
                    });
                    req.body.posterImage = result.secure_url;
                    fs.unlinkSync(req.files.poster[0].path);
                } catch (uploadError) {
                    console.error('Poster upload failed:', uploadError);
                }
            }

            // Handle gallery updates
            // 1. Remove deleted items
            if (req.body.galleryIdsToDelete) {
                const idsToDelete = JSON.parse(req.body.galleryIdsToDelete);
                if (Array.isArray(idsToDelete) && idsToDelete.length > 0) {
                    event.gallery = event.gallery.filter(item => !idsToDelete.includes(item._id.toString()));
                }
            }

            // 2. Add new items
            if (req.files.gallery && req.files.gallery.length > 0) {
                const galleryItems = [];
                for (const file of req.files.gallery) {
                    try {
                        const isVideo = file.mimetype.startsWith('video');
                        const result = await cloudinary.uploader.upload(file.path, {
                            folder: 'amrita-pulse/gallery',
                            resource_type: isVideo ? 'video' : 'image',
                        });
                        galleryItems.push({
                            url: result.secure_url,
                            resourceType: isVideo ? 'video' : 'image'
                        });
                        fs.unlinkSync(file.path);
                    } catch (uploadError) {
                        console.error('Gallery file upload failed:', uploadError);
                    }
                }
                // Append new items to existing gallery
                event.gallery = [...event.gallery, ...galleryItems];
            }

            // Should we update req.body.gallery? No, we modify event.gallery directly.
            req.body.gallery = event.gallery;
        }

        // Handle contacts update
        if (req.body.contacts && typeof req.body.contacts === 'string') {
            try {
                req.body.contacts = JSON.parse(req.body.contacts);
            } catch (e) {
                console.error('Failed to parse contacts:', e);
            }
        }

        // Ensure useInternalRegistration is boolean
        if (req.body.useInternalRegistration !== undefined) {
            req.body.useInternalRegistration = req.body.useInternalRegistration === 'true' || req.body.useInternalRegistration === true;
        }

        event = await Event.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        }).populate('organizer', 'name logo description').populate('postedBy', 'name email').populate('customForm');

        res.status(200).json({
            success: true,
            data: event,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Owner or Admin only)
exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
            });
        }

        // Check ownership & permissions
        // event.organizer is a Club ObjectId (after Club refactor)
        // Any member of the same club can delete club events; admins can delete any event
        const userClubId = req.user.club?._id?.toString() || req.user.club?.toString();
        const isClubOwner = userClubId && event.organizer?.toString() === userClubId;
        const isAdmin = req.user.role === 'admin';

        if (!isClubOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this event.',
            });
        }

        await event.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Event deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Register for an event
// @route   POST /api/events/:id/register
// @access  Private
exports.registerForEvent = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const eventId = req.params.id;

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
            });
        }

        // Check if already registered
        if (user.registeredEvents.includes(eventId)) {
            return res.status(400).json({
                success: false,
                message: 'You are already registered for this event',
            });
        }

        // Add to user's registered events
        user.registeredEvents.push(eventId);

        // Increment event registration count
        event.registrations = (event.registrations || 0) + 1;

        await Promise.all([user.save(), event.save()]);

        res.status(200).json({
            success: true,
            registered: true,
            message: 'Registration successful',
            data: event,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Unregister from an event
// @route   DELETE /api/events/:id/unregister
// @access  Private
exports.unregisterFromEvent = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const eventId = req.params.id;

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
            });
        }

        // Check if registered
        const index = user.registeredEvents.indexOf(eventId);
        if (index === -1) {
            return res.status(400).json({
                success: false,
                message: 'You are not registered for this event',
            });
        }

        // Remove from user's registered events
        user.registeredEvents.splice(index, 1);

        // Decrement event registration count
        event.registrations = Math.max(0, (event.registrations || 0) - 1);

        await Promise.all([user.save(), event.save()]);

        res.status(200).json({
            success: true,
            registered: false,
            message: 'Unregistration successful',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
