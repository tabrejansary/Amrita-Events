const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { name, email, password, role, department, year, interests } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email',
            });
        }

        // Validate Amrita email formats (or @gmail.com for dev testing)
        const isValidAmritaEmail = email.endsWith('@bl.students.amrita.edu') ||
            email.endsWith('@blr.amrita.edu') ||
            email.endsWith('@amrita.edu') ||
            email.endsWith('@gmail.com');

        if (!isValidAmritaEmail) {
            return res.status(400).json({
                success: false,
                message: 'Only Amrita or Gmail email addresses are allowed',
            });
        }

        // Create user object
        const userData = {
            name,
            email,
            password,
            role: role || 'student',
        };

        // Validate password complexity
        const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters and contain at least one letter, one number, and one special character',
            });
        }

        // Add role-specific fields
        if (userData.role === 'student') {
            if (!department || !year || !interests || interests.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Students must provide department, year, and at least one interest',
                });
            }
            userData.department = department;
            userData.year = year;
            userData.year = year;
            // Robust parsing for registration
            let parsedInterests = [];
            if (typeof interests === 'string') {
                try {
                    const parsed = JSON.parse(interests);
                    if (Array.isArray(parsed)) parsedInterests = parsed;
                    else parsedInterests = [interests];
                } catch (e) {
                    parsedInterests = [interests];
                }
            } else if (Array.isArray(interests)) {
                parsedInterests = interests;
            }
            // Flatten one level deep just in case
            userData.interests = parsedInterests.flat().map(i => String(i).trim());
        }

        if (userData.role === 'club') {
            // Club users don't need clubName at registration.
            // They create or join a club separately via /api/clubs/create or /api/clubs/join
        }

        // Handle image upload
        if (req.file) {
            try {
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'amrita-events/profiles',
                    use_filename: true,
                });
                userData.profileImage = result.secure_url;
                // Delete local file
                fs.unlinkSync(req.file.path);
            } catch (err) {
                console.error('Cloudinary upload failed:', err);
                // Continue registration even if upload fails
            }
        }

        // Create user
        const user = await User.create(userData);

        // Get verification token
        const verificationToken = user.getVerificationToken();
        await user.save({ validateBeforeSave: false });

        // Create verification URL
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

        const message = `Welcome to Amrita Events, ${user.name}!\n\nPlease verify your email by clicking the link below:\n\n${verificationUrl}`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Email Verification - Amrita Events',
                message,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                        <h2 style="color: #AF0C3E; text-align: center;">Welcome to Amrita Events</h2>
                        <p>Hi ${user.name},</p>
                        <p>Thank you for joining Amrita Events! Please verify your email address to get started.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verificationUrl}" style="background-color: #AF0C3E; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
                        </div>
                        <p>If the button doesn't work, copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #656565;">${verificationUrl}</p>
                        <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
                        <p style="font-size: 14px; font-weight: bold; color: #AF0C3E; text-align: center; margin-bottom: 5px;">Amrita Events</p>
                        <p style="font-size: 12px; color: #656565; text-align: center; margin-top: 0;">Amrita Vishwa Vidyapeetham, Bengaluru</p>
                        <p style="font-size: 10px; color: #999; text-align: center; margin-top: 20px;">This is an automated email, please do not reply.</p>
                    </div>
                `,
            });

            res.status(201).json({
                success: true,
                message: 'Registration successful! Please check your email to verify your account.' +
                    (userData.role === 'club' ? ' After verifying, create or join a club to start posting events.' : ''),
                data: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    profileImage: user.profileImage,
                },
            });
        } catch (err) {
            console.error('Email send failed:', err);
            res.status(201).json({
                success: true,
                message: 'User registered, but verification email could not be sent.',
                data: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    profileImage: user.profileImage,
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

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
exports.resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an email address',
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No user found with this email',
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'This account is already verified',
            });
        }

        // Generate a new verification token
        const verificationToken = user.getVerificationToken();
        await user.save({ validateBeforeSave: false });

        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
        const message = `Please verify your email by clicking the link below:\n\n${verificationUrl}`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Email Verification - Amrita Events',
                message,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                        <h2 style="color: #AF0C3E; text-align: center;">Email Verification</h2>
                        <p>Hi ${user.name},</p>
                        <p>You requested to resend the verification email. Please click the button below to verify your account.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verificationUrl}" style="background-color: #AF0C3E; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
                        </div>
                        <p>If the button doesn't work, copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #656565;">${verificationUrl}</p>
                        <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
                        <p style="font-size: 14px; font-weight: bold; color: #AF0C3E; text-align: center; margin-bottom: 5px;">Amrita Events</p>
                        <p style="font-size: 12px; color: #656565; text-align: center; margin-top: 0;">Amrita Vishwa Vidyapeetham, Bengaluru</p>
                        <p style="font-size: 10px; color: #999; text-align: center; margin-top: 20px;">This is an automated email, please do not reply.</p>
                    </div>
                `,
            });

            res.status(200).json({
                success: true,
                message: 'Verification email sent successfully!',
            });
        } catch (err) {
            console.error('Email send failed:', err);
            return res.status(500).json({
                success: false,
                message: 'Email could not be sent',
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password',
            });
        }

        // Check for user (include password for comparison)
        const user = await User.findOne({ email }).select('+password').populate('club', 'name logo inviteCode');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Check if user is verified
        if (!user.isVerified) {
            return res.status(401).json({
                success: false,
                message: 'Please verify your email before logging in',
            });
        }

        // Generate token
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                year: user.year,
                interests: user.interests,
                club: user.club || null,
                profileImage: user.profileImage,
                savedEvents: user.savedEvents || [],
                registeredEvents: user.registeredEvents || [],
            },
            token,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('club', '_id name logo description inviteCode owner');

        // Ensure arrays exist in the response
        const userData = user.toObject();
        if (!userData.savedEvents) userData.savedEvents = [];
        if (!userData.registeredEvents) userData.registeredEvents = [];

        res.status(200).json({
            success: true,
            data: userData,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update user interests
// @route   PUT /api/auth/update-interests
// @access  Private (Student only)
exports.updateInterests = async (req, res) => {
    try {
        const { interests } = req.body;

        if (!interests || interests.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide at least one interest',
            });
        }

        const user = await User.findById(req.user.id);

        if (user.role !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'Only students can update interests',
            });
        }

        user.interests = interests;
        await user.save();

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update notification preferences
// @route   PUT /api/auth/notification-preferences
// @access  Private
exports.updateNotificationPreferences = async (req, res) => {
    try {
        const { emailNotifications, pushNotifications } = req.body;

        const user = await User.findById(req.user.id);

        if (emailNotifications !== undefined) {
            user.emailNotifications = emailNotifications;
        }
        if (pushNotifications !== undefined) {
            user.pushNotifications = pushNotifications;
        }

        await user.save();

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const { name, department, year, interests, clubName } = req.body;

        if (name) user.name = name;

        if (user.role === 'student') {
            if (department) user.department = department;
            if (year) user.year = year;
            if (interests) {
                // Parse and flatten interests to prevent double encoding
                let newInterests = [];
                if (typeof interests === 'string') {
                    try {
                        const parsed = JSON.parse(interests);
                        newInterests = Array.isArray(parsed) ? parsed : [interests];
                    } catch (e) {
                        newInterests = [interests]; // It's just a string interest
                    }
                } else if (Array.isArray(interests)) {
                    newInterests = interests;
                }

                // Flatten and clean
                user.interests = newInterests.flat().flatMap(i => {
                    if (typeof i === 'string' && i.trim().startsWith('[')) {
                        try { return JSON.parse(i); } catch (e) { return i; }
                    }
                    return i;
                }).map(i => String(i).trim());
            }
        }

        // Handle image update
        if (req.file) {
            try {
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'amrita-events/profiles',
                    use_filename: true,
                });

                user.profileImage = result.secure_url;

                // Delete local file
                fs.unlinkSync(req.file.path);
            } catch (err) {
                console.error('Cloudinary upload failed:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to upload profile image',
                });
            }
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: user,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res) => {
    try {
        const user = await User.findOne({
            verificationToken: req.params.token,
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification token',
            });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Email verified successfully! You can now login.',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'There is no user with that email',
            });
        }

        // Get reset token
        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false });

        // Create reset url
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please click the link below to reset your password:\n\n${resetUrl}`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset - Amrita Events',
                message,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                        <h2 style="color: #AF0C3E; text-align: center;">Password Reset Request</h2>
                        <p>Hi ${user.name},</p>
                        <p>You requested to reset your password for Amrita Events. Click the button below to set a new password. This link is valid for 10 minutes.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" style="background-color: #AF0C3E; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                        </div>
                        <p>If you did not request this, please ignore this email.</p>
                        <p style="word-break: break-all; color: #656565;">${resetUrl}</p>
                        <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
                        <p style="font-size: 14px; font-weight: bold; color: #AF0C3E; text-align: center; margin-bottom: 5px;">Amrita Events</p>
                        <p style="font-size: 12px; color: #656565; text-align: center; margin-top: 0;">Amrita Vishwa Vidyapeetham, Bengaluru</p>
                        <p style="font-size: 10px; color: #999; text-align: center; margin-top: 20px;">This is an automated email, please do not reply.</p>
                    </div>
                `,
            });

            res.status(200).json({
                success: true,
                message: 'Email sent',
            });
        } catch (err) {
            console.error(err);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;

            await user.save({ validateBeforeSave: false });

            return res.status(500).json({
                success: false,
                message: 'Email could not be sent',
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired token',
            });
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successful',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
