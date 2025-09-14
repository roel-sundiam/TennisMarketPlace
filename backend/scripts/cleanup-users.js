import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function cleanupUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tennis-marketplace');
    console.log('✅ Connected to MongoDB');

    // Find the admin user first to make sure we don't delete it
    const adminUser = await User.findOne({ email: 'admin@tennis.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found! Creating admin user first...');
      
      // Create admin user if it doesn't exist
      const newAdmin = new User({
        email: 'admin@tennis.com',
        password: 'admin123', // Will be hashed by pre-save middleware
        firstName: 'Admin',
        lastName: 'User',
        phoneNumber: '+639123456789',
        role: 'admin',
        location: {
          city: 'Manila',
          region: 'Metro Manila'
        },
        coins: {
          balance: 100,
          totalEarned: 100,
          totalSpent: 0,
          lastDailyBonus: new Date().toISOString()
        },
        subscription: {
          plan: 'pro',
          remainingListings: -1,
          remainingBoosts: 5
        },
        isVerified: true,
        isActive: true
      });
      
      await newAdmin.save();
      console.log('✅ Admin user created successfully');
    } else {
      console.log('✅ Admin user found:', adminUser.email, '(ID:', adminUser._id + ')');
    }

    // Count total users before deletion
    const totalUsers = await User.countDocuments();
    console.log(`📊 Total users in database: ${totalUsers}`);

    // Delete all users except admin
    const deleteResult = await User.deleteMany({ 
      email: { $ne: 'admin@tennis.com' } 
    });
    
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} non-admin users`);

    // Verify only admin remains
    const remainingUsers = await User.find({}, 'email role firstName lastName');
    console.log('👥 Remaining users:');
    remainingUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - ${user.firstName} ${user.lastName}`);
    });

    console.log('\n🎉 Database cleanup completed successfully!');
    console.log('💡 You can now test user registration with fresh data.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupUsers();