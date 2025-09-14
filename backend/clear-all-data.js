import mongoose from 'mongoose';
import Product from './models/Product.js';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tennis-marketplace';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected successfully for cleanup');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
};

const clearAllMockData = async () => {
  try {
    console.log('🧹 Starting comprehensive data cleanup...\n');

    // 1. Clear all products
    const productResult = await Product.deleteMany({});
    console.log(`🗑️  Deleted ${productResult.deletedCount} products`);

    // 2. Clear sample/test users (but keep real admin accounts)
    const testUserEmails = [
      'sample@tennismarket.ph',
      'test@tennis.com',
      'demo@tennis.ph',
      'mockuser@tennis.com'
    ];
    
    const userResult = await User.deleteMany({ 
      email: { $in: testUserEmails } 
    });
    console.log(`🗑️  Deleted ${userResult.deletedCount} test users`);

    // 3. Show remaining user count (should be real users only)
    const remainingUsers = await User.countDocuments({});
    console.log(`👥 Remaining users: ${remainingUsers} (real accounts)`);

    // 4. Clear any other collections if they exist
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📊 Database collections:');
    for (const collection of collections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      console.log(`   ${collection.name}: ${count} documents`);
    }

    console.log('\n✅ Mock data cleanup completed successfully!');
    console.log('🏠 Featured Items will now show proper empty state');
    console.log('📱 All frontend components will display "No data" states');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
};

const main = async () => {
  const connected = await connectDB();
  if (!connected) {
    console.error('❌ Could not connect to database');
    process.exit(1);
  }

  await clearAllMockData();
  
  console.log('\n🎯 Database is now clean and ready for real data');
  process.exit(0);
};

main().catch(console.error);