import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Analytics from '../models/Analytics.js';
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

const cleanupAllData = async () => {
  try {
    console.log('🧹 Starting complete database cleanup...\n');

    // Delete all products
    console.log('📦 Deleting all products...');
    const productResult = await Product.deleteMany({});
    console.log(`✅ Deleted ${productResult.deletedCount} products`);

    // Delete all analytics data
    console.log('📊 Deleting all analytics data...');
    const analyticsResult = await Analytics.deleteMany({});
    console.log(`✅ Deleted ${analyticsResult.deletedCount} analytics records`);

    // Check if there are other collections that need cleanup
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📋 Available collections:');
    collections.forEach(collection => {
      console.log(`   - ${collection.name}`);
    });

    // Clean up any other relevant collections
    const otherCollections = ['pageviews', 'events', 'sessions', 'useranalytics'];

    for (const collectionName of otherCollections) {
      try {
        const collection = mongoose.connection.db.collection(collectionName);
        const result = await collection.deleteMany({});
        if (result.deletedCount > 0) {
          console.log(`✅ Deleted ${result.deletedCount} records from ${collectionName}`);
        }
      } catch (error) {
        // Collection doesn't exist, which is fine
        console.log(`ℹ️  Collection ${collectionName} doesn't exist (skipping)`);
      }
    }

    console.log('\n🎉 Database cleanup completed successfully!');
    console.log('\nSummary:');
    console.log(`   • Products deleted: ${productResult.deletedCount}`);
    console.log(`   • Analytics records deleted: ${analyticsResult.deletedCount}`);
    console.log('   • All site data has been cleared');
    console.log('\n✨ Your database is now clean and ready for fresh data!');

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

  // Confirmation prompt (commented out for direct execution)
  console.log('⚠️  WARNING: This will delete ALL products and analytics data!');
  console.log('⚠️  This action cannot be undone!');
  console.log('\nProceeding with cleanup in 3 seconds...\n');

  // Wait 3 seconds to give user a chance to cancel
  await new Promise(resolve => setTimeout(resolve, 3000));

  await cleanupAllData();

  console.log('\n✅ Cleanup completed');
  process.exit(0);
};

main().catch(console.error);