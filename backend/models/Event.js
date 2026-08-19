const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide an event title'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Please provide an event description'],
    },
    // The club that owns this event
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        required: true,
    },
    // The individual club member who posted the event
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    organizerName: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: [true, 'Please select an event category'],
    },
    department: {
        type: String,
        default: 'All',
    },
    venue: {
        type: String,
        required: [true, 'Please provide a venue'],
    },
    eventDate: {
        type: Date,
        required: [true, 'Please provide an event date'],
    },
    eventTime: {
        type: String,
        required: [true, 'Please provide an event time'],
    },
    registrationLink: {
        type: String,
        validate: {
            validator: function (v) {
                // Simple URL validation
                return !v || /^https?:\/\/.+/.test(v);
            },
            message: 'Please provide a valid URL'
        }
    },
    posterImage: {
        type: String,
        default: '', // Cloudinary URL
    },
    isOnline: {
        type: Boolean,
        default: false,
    },
    useInternalRegistration: {
        type: Boolean,
        default: false,
    },
    customForm: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Form',
    },

    // Admin moderation
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed'],
        default: 'pending',
    },
    isFeatured: {
        type: Boolean,
        default: false,
    },
    rejectionReason: {
        type: String,
    },

    // Analytics
    views: {
        type: Number,
        default: 0,
    },
    registrations: {
        type: Number,
        default: 0,
    },
    bookmarksCount: {
        type: Number,
        default: 0,
    },
    gallery: [{
        url: {
            type: String, // Cloudinary URL
            required: true
        },
        resourceType: {
            type: String,
            enum: ['image', 'video'],
            default: 'image'
        }
    }],
    contacts: [{
        name: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        }
    }],
}, {
    timestamps: true,
});

// Index for efficient queries
EventSchema.index({ category: 1, status: 1, eventDate: 1 });
EventSchema.index({ organizer: 1 });

module.exports = mongoose.model('Event', EventSchema);
