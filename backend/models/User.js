const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function (email) {
                // Accept Amrita Bengaluru email formats:
                // Students/BCA: *@bl.students.amrita.edu (e.g., bl.sc.u4cse24063@bl.students.amrita.edu)
                // Faculty/Staff: *@blr.amrita.edu (e.g., sa@blr.amrita.edu)
                // Generic: *@amrita.edu (for other campuses or admin accounts)
                return email.endsWith('@bl.students.amrita.edu') ||
                    email.endsWith('@blr.amrita.edu') ||
                    email.endsWith('@amrita.edu');
            },
            message: 'Only Amrita email addresses are allowed (@bl.students.amrita.edu, @blr.amrita.edu, or @amrita.edu)'
        }
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6,
        select: false, // Don't return password in queries by default
    },
    role: {
        type: String,
        enum: ['student', 'club', 'admin'],
        default: 'student',
    },

    // Student-specific fields
    department: {
        type: String,
        required: function () {
            return this.role === 'student';
        }
    },
    year: {
        type: Number,
        min: 1,
        max: 4,
        required: function () {
            return this.role === 'student';
        }
    },
    interests: {
        type: [String],
        required: function () {
            return this.role === 'student';
        },
        validate: {
            validator: function (interests) {
                return this.role !== 'student' || (interests && interests.length > 0);
            },
            message: 'Students must select at least one interest'
        }
    },

    // Common fields
    profileImage: {
        type: String, // Cloudinary URL
        default: '',
    },

    // Notification preferences
    emailNotifications: {
        type: Boolean,
        default: true,
    },
    pushNotifications: {
        type: Boolean,
        default: true,
    },

    // Club-specific fields
    clubName: {
        type: String,
        required: function () {
            return this.role === 'club';
        }
    },
    clubLogo: {
        type: String, // Cloudinary URL
        default: '',
    },

    // Saved/bookmarked events
    savedEvents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    }],

    // Registered events
    registeredEvents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    }],

    // Auth & Verification
    isVerified: {
        type: Boolean,
        default: false,
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
}, {
    timestamps: true,
});

// Method to generate and hash password reset token
UserSchema.methods.getResetPasswordToken = function () {
    const crypto = require('crypto');
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expire
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    return resetToken;
};

// Method to generate email verification token
UserSchema.methods.getVerificationToken = function () {
    const crypto = require('crypto');
    const token = crypto.randomBytes(20).toString('hex');
    this.verificationToken = token;
    return token;
};

// Hash password before saving
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
