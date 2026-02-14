const mongoose = require('mongoose');

const SystemConfigSchema = new mongoose.Schema({
    categories: {
        type: [String],
        default: [
            'Hackathons',
            'Tech Workshops',
            'Seminars & Talks',
            'Cultural Events',
            'Sports',
            'Academic & Research',
            'Placement & Career'
        ]
    },
    departments: {
        type: [String],
        default: ['CSE', 'AI', 'ECE', 'EEE', 'ME', 'CE', 'BT', 'All', 'Other']
    },
    years: {
        type: [Number],
        default: [1, 2, 3, 4]
    },
    // Using a key to ensure only one config document exists
    configKey: {
        type: String,
        default: 'global',
        unique: true
    }
}, { timestamps: true });

module.exports = mongoose.model('SystemConfig', SystemConfigSchema);
