const mongoose = require('mongoose');
const crypto = require('crypto');

const ClubSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a club name'],
        trim: true,
        unique: true,
    },
    description: {
        type: String,
        default: '',
    },
    logo: {
        type: String, // Cloudinary URL
        default: '',
    },
    // The user who created the club — has full control
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // All members of the club (including owner)
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    // Short invite code for members to join
    inviteCode: {
        type: String,
        unique: true,
        default: () => crypto.randomBytes(4).toString('hex').toUpperCase(),
    },
    // Admin can verify/approve clubs
    isVerified: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

// Generate a unique 8-character invite code before saving if not present
ClubSchema.pre('save', function () {
    if (!this.inviteCode) {
        this.inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    }
});

module.exports = mongoose.model('Club', ClubSchema);
