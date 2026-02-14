const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const User = require('./models/User');

const createAdmin = async () => {
    try {
        const adminEmail = process.env.INITIAL_ADMIN_EMAIL;
        const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            console.error('❌ Setup Error: Please set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD in your .env file.');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const adminExists = await User.findOne({ email: adminEmail });
        if (adminExists) {
            console.log('ℹ️ User with this email already exists. Upgrading to admin and verifying...');
            adminExists.role = 'admin';
            adminExists.isVerified = true;
            adminExists.password = adminPassword;
            await adminExists.save();
            console.log('✅ User upgraded to admin successfully');
            process.exit(0);
        }

        await User.create({
            name: 'Platform Admin',
            email: adminEmail,
            password: adminPassword,
            role: 'admin',
            isVerified: true,
            emailNotifications: true,
            pushNotifications: true
        });

        console.log('✅ Admin user created successfully');
        console.log('📧 Email:', adminEmail);
        // Do not log password for security

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
        process.exit(1);
    }
};

createAdmin();
