const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
    },
    type: {
        type: String,
        enum: ['reminder', 'featured', 'announcement', 'approval', 'rejection'],
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    read: {
        type: Boolean,
        default: false,
    },
    sentAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Index for efficient queries
NotificationSchema.index({ user: 1, read: 1, sentAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
