const Club = require('../models/Club');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// @desc    Create a new club (club user becomes owner)
// @route   POST /api/clubs/create
// @access  Private (Club role only)
exports.createClub = async (req, res) => {
    try {
        const { name, description } = req.body;

        // A user can only belong to one club
        if (req.user.club) {
            return res.status(400).json({
                success: false,
                message: 'You already belong to a club. Leave your current club before creating a new one.',
            });
        }

        // Check if club name already taken
        const existing = await Club.findOne({ name: name?.trim() });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'A club with this name already exists.',
            });
        }

        // Build club data
        const clubData = {
            name: name?.trim(),
            description: description || '',
            owner: req.user.id,
            members: [req.user.id],
        };

        // Handle logo upload
        if (req.file) {
            try {
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'amrita-events/clubs',
                    use_filename: true,
                });
                clubData.logo = result.secure_url;
                fs.unlinkSync(req.file.path);
            } catch (err) {
                console.error('Club logo upload failed:', err);
            }
        }

        const club = await Club.create(clubData);

        // Link this user to the newly created club
        await User.findByIdAndUpdate(req.user.id, { club: club._id });

        res.status(201).json({
            success: true,
            message: `Club "${club.name}" created successfully! Share your invite code with members: ${club.inviteCode}`,
            data: club,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Join a club using an invite code
// @route   POST /api/clubs/join
// @access  Private (Club role only)
exports.joinClub = async (req, res) => {
    try {
        const { inviteCode } = req.body;

        if (!inviteCode) {
            return res.status(400).json({ success: false, message: 'Please provide an invite code.' });
        }

        // A user can only belong to one club
        if (req.user.club) {
            return res.status(400).json({
                success: false,
                message: 'You already belong to a club. Leave your current club before joining another.',
            });
        }

        const club = await Club.findOne({ inviteCode: inviteCode.toUpperCase().trim() });

        if (!club) {
            return res.status(404).json({ success: false, message: 'Invalid invite code. Please check and try again.' });
        }

        // Check if user is already a member
        if (club.members.includes(req.user.id)) {
            return res.status(400).json({ success: false, message: 'You are already a member of this club.' });
        }

        // Add user to club members
        club.members.push(req.user.id);
        await club.save();

        // Link user to club
        await User.findByIdAndUpdate(req.user.id, { club: club._id });

        res.status(200).json({
            success: true,
            message: `Welcome to ${club.name}!`,
            data: club,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get current user's club info
// @route   GET /api/clubs/me
// @access  Private (Club role only)
exports.getMyClub = async (req, res) => {
    try {
        if (!req.user.club) {
            return res.status(404).json({
                success: false,
                message: 'You are not part of any club. Create one or join with an invite code.',
            });
        }

        const club = await Club.findById(req.user.club)
            .populate('owner', 'name email')
            .populate('members', 'name email');

        if (!club) {
            return res.status(404).json({ success: false, message: 'Club not found.' });
        }

        const isOwner = club.owner._id.toString() === req.user.id;

        res.status(200).json({
            success: true,
            data: {
                ...club.toObject(),
                // Only reveal invite code to the owner
                inviteCode: isOwner ? club.inviteCode : undefined,
                isOwner,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update club info (owner only)
// @route   PUT /api/clubs/me
// @access  Private (Club owner only)
exports.updateClub = async (req, res) => {
    try {
        const club = await Club.findById(req.user.club);

        if (!club) {
            return res.status(404).json({ success: false, message: 'Club not found.' });
        }

        // Only owner can update
        if (club.owner.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Only the club owner can update club details.' });
        }

        const { name, description } = req.body;
        if (name) club.name = name.trim();
        if (description !== undefined) club.description = description;

        // Handle logo upload
        if (req.file) {
            try {
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'amrita-events/clubs',
                    use_filename: true,
                });
                club.logo = result.secure_url;
                fs.unlinkSync(req.file.path);
            } catch (err) {
                console.error('Club logo upload failed:', err);
            }
        }

        await club.save();

        res.status(200).json({ success: true, message: 'Club updated successfully.', data: club });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Remove a member from the club (owner only)
// @route   DELETE /api/clubs/me/members/:userId
// @access  Private (Club owner only)
exports.removeMember = async (req, res) => {
    try {
        const club = await Club.findById(req.user.club);

        if (!club) {
            return res.status(404).json({ success: false, message: 'Club not found.' });
        }

        if (club.owner.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Only the club owner can remove members.' });
        }

        const memberId = req.params.userId;

        // Can't remove the owner
        if (memberId === club.owner.toString()) {
            return res.status(400).json({ success: false, message: 'The club owner cannot be removed.' });
        }

        club.members = club.members.filter(m => m.toString() !== memberId);
        await club.save();

        // Unlink user from club
        await User.findByIdAndUpdate(memberId, { club: null });

        res.status(200).json({ success: true, message: 'Member removed from club.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Leave the club (member only, owner must transfer ownership first)
// @route   POST /api/clubs/me/leave
// @access  Private (Club role only)
exports.leaveClub = async (req, res) => {
    try {
        const club = await Club.findById(req.user.club);

        if (!club) {
            return res.status(404).json({ success: false, message: 'You are not in any club.' });
        }

        if (club.owner.toString() === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You are the club owner. Transfer ownership to another member before leaving.',
            });
        }

        club.members = club.members.filter(m => m.toString() !== req.user.id);
        await club.save();

        await User.findByIdAndUpdate(req.user.id, { club: null });

        res.status(200).json({ success: true, message: `You have left ${club.name}.` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Regenerate invite code (owner only)
// @route   POST /api/clubs/me/invite/regenerate
// @access  Private (Club owner only)
exports.regenerateInviteCode = async (req, res) => {
    try {
        const club = await Club.findById(req.user.club);

        if (!club) {
            return res.status(404).json({ success: false, message: 'Club not found.' });
        }

        if (club.owner.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Only the club owner can regenerate the invite code.' });
        }

        const crypto = require('crypto');
        club.inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
        await club.save();

        res.status(200).json({
            success: true,
            message: 'Invite code regenerated.',
            data: { inviteCode: club.inviteCode },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Send club invite code to a member's email
// @route   POST /api/clubs/me/invite/email
// @access  Private (Club role only)
exports.sendInviteEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Please provide recipient email address.' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Validate Amrita email (or @gmail.com for dev testing)
        const isValidAmrita = normalizedEmail.endsWith('@bl.students.amrita.edu') ||
            normalizedEmail.endsWith('@blr.amrita.edu') ||
            normalizedEmail.endsWith('@amrita.edu') ||
            normalizedEmail.endsWith('@gmail.com');

        if (!isValidAmrita) {
            return res.status(400).json({
                success: false,
                message: 'Recipient must have a valid Amrita or Gmail email address.'
            });
        }

        const club = await Club.findById(req.user.club);
        if (!club) {
            return res.status(404).json({ success: false, message: 'Club not found.' });
        }

        const sendEmail = require('../utils/sendEmail');
        const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #AF0C3E; margin-bottom: 5px; font-size: 24px;">You're Invited to Join ${club.name}!</h2>
                    <p style="color: #64748b; font-size: 14px; margin: 0;">Amrita Events Club Team Invitation</p>
                </div>
                
                <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                    Hello,<br><br>
                    <strong>${req.user.name}</strong> has invited you to join the <strong>${club.name}</strong> organizer team on Amrita Events platform.
                </p>

                <div style="background-color: #fdf2f4; border: 2px dashed #AF0C3E; border-radius: 10px; padding: 20px; text-align: center; margin: 25px 0;">
                    <span style="font-size: 12px; color: #AF0C3E; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Your Team Member Invite Code</span>
                    <span style="font-size: 28px; font-family: monospace; font-weight: bold; color: #1e293b; letter-spacing: 4px;">${club.inviteCode}</span>
                </div>

                <div style="background-color: #f8fafc; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
                    <h4 style="color: #1e293b; margin: 0 0 10px 0; font-size: 14px;">How to Join:</h4>
                    <ol style="margin: 0; padding-left: 20px; color: #475569; font-size: 13px; line-height: 1.6;">
                        <li>Log in to your account with role <strong>Club Organizer</strong> (or register if new).</li>
                        <li>On your Club Portal, click <strong>"Join with Invite Code"</strong>.</li>
                        <li>Enter the code: <strong style="color: #AF0C3E;">${club.inviteCode}</strong>.</li>
                    </ol>
                </div>

                <div style="text-align: center; margin-bottom: 25px;">
                    <a href="${loginUrl}" style="background-color: #AF0C3E; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">Go to Club Portal</a>
                </div>

                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
                    Amrita Vishwa Vidyapeetham, Bengaluru Campus &bull; Automated notification
                </p>
            </div>
        `;

        await sendEmail({
            email: normalizedEmail,
            subject: `Team Invitation: Join ${club.name} on Amrita Events`,
            message: `${req.user.name} invited you to join ${club.name}. Your Invite Code is: ${club.inviteCode}. Go to ${loginUrl} to join.`,
            html,
        });

        res.status(200).json({
            success: true,
            message: `Invitation email sent successfully to ${normalizedEmail}!`,
        });
    } catch (error) {
        console.error('Failed to send invite email:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to send invite email.' });
    }
};
