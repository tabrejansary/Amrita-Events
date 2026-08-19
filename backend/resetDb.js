const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function resetDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const collections = ['users', 'clubs', 'events', 'notifications', 'forms', 'registrationresponses'];
        for (const colName of collections) {
            try {
                const count = await mongoose.connection.db.collection(colName).countDocuments();
                if (count > 0) {
                    await mongoose.connection.db.collection(colName).deleteMany({});
                    console.log(`🧹 Cleared ${count} documents from '${colName}' collection.`);
                } else {
                    console.log(`ℹ️ Collection '${colName}' is already empty.`);
                }
            } catch (err) {
                // Collection might not exist yet
            }
        }

        console.log('🎉 Database fully reset to clean state! You can now register with any email.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error resetting database:', err);
        process.exit(1);
    }
}

resetDatabase();
