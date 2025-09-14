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

const clearProducts = async () => {
  try {
    // Delete all products
    const deleteResult = await Product.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} products`);

    // Delete the sample user we created
    const userDeleteResult = await User.deleteOne({ email: 'sample@tennismarket.ph' });
    console.log(`🗑️  Deleted ${userDeleteResult.deletedCount} sample user`);

    console.log('✅ Database cleanup completed');
    console.log('🏠 Featured Items will now show mock data again (as intended)');
    
  } catch (error) {
    console.error('❌ Error clearing products:', error);
  }
};

const main = async () => {
  const connected = await connectDB();
  if (!connected) {
    console.error('❌ Could not connect to database');
    process.exit(1);
  }

  await clearProducts();
  
  console.log('✅ Cleanup completed');
  process.exit(0);
};

main().catch(console.error);