import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const mockUsers = [
  {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
    email: 'admin@tennis.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    phoneNumber: '+639171234567',
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
    isActive: true // Admin user - exception to approval system
  },
  {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
    email: 'user@tennis.com',
    password: 'user123',
    firstName: 'Tennis',
    lastName: 'Player',
    phoneNumber: '+639187654321',
    role: 'seller',
    location: {
      city: 'Quezon City',
      region: 'Metro Manila'
    },
    coins: {
      balance: 50,
      totalEarned: 75,
      totalSpent: 25,
      lastDailyBonus: '2024-01-10'
    },
    subscription: {
      plan: 'basic',
      remainingListings: 15,
      remainingBoosts: 1
    },
    isVerified: false,
    isActive: false // Regular user - requires admin approval
  }
];

async function seedMockUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tennis-marketplace');
    console.log('Connected to MongoDB');

    for (const userData of mockUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`User ${userData.email} already exists, updating with coins and subscription...`);
        
        // Update existing user with coins and subscription
        existingUser.coins = userData.coins;
        existingUser.subscription = userData.subscription;
        existingUser.role = userData.role;
        existingUser.isVerified = userData.isVerified;
        existingUser.isActive = userData.isActive;
        await existingUser.save();
        
        console.log(`✓ Updated user: ${userData.email} (ID: ${existingUser._id})`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      userData.password = hashedPassword;

      // Create user with specific _id
      const user = new User(userData);
      await user.save();
      
      console.log(`✓ Created mock user: ${userData.email} (${userData.role}) (ID: ${user._id})`);
    }

    console.log('Mock users seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding mock users:', error);
    process.exit(1);
  }
}

seedMockUsers();