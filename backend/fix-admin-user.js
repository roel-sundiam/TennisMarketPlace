import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tennis-marketplace';
mongoose.connect(mongoUri);

async function fixAdminUser() {
  try {
    console.log('🗑️ Deleting old admin user...');
    await User.deleteOne({ email: 'admin@tennis.com' });
    console.log('✅ Old admin user deleted');

    console.log('👤 Creating new admin user with plain text password...');
    // Don't hash manually - let the pre-save middleware handle it
    const adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User', 
      email: 'admin@tennis.com',
      password: 'admin123', // Plain text - middleware will hash it
      phoneNumber: '+639123456789',
      role: 'admin',
      subscription: {
        plan: 'pro',
        remainingListings: -1,
        remainingBoosts: 5
      },
      location: {
        city: 'Manila',
        region: 'Metro Manila'
      },
      isVerified: true,
      rating: {
        average: 5.0,
        totalReviews: 0
      },
      isActive: true
    });

    console.log('✅ New admin user created successfully!');
    console.log('📧 Email:', adminUser.email);
    console.log('🔑 Role:', adminUser.role);
    console.log('👤 ID:', adminUser._id);
    
    // Test password verification
    console.log('\n🧪 Testing password verification...');
    const isPasswordValid = await adminUser.comparePassword('admin123');
    console.log('✅ Password "admin123" is valid:', isPasswordValid);
    
  } catch (error) {
    console.error('❌ Error fixing admin user:', error);
  } finally {
    mongoose.disconnect();
  }
}

fixAdminUser();