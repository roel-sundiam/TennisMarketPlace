import mongoose from 'mongoose';
import LookingFor from './models/LookingFor.js';
import User from './models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tennis-marketplace';
mongoose.connect(mongoUri);

async function deleteAllLookingFor() {
  try {
    console.log('🔍 Finding all Looking For requests...');

    // Count total Looking For requests
    const totalRequests = await LookingFor.countDocuments();
    console.log(`Found ${totalRequests} Looking For requests to delete`);

    if (totalRequests === 0) {
      console.log('✅ No Looking For requests found to delete');
      return;
    }

    // Show some sample requests before deletion
    const sampleRequests = await LookingFor.find({})
      .select('title buyer category status')
      .populate('buyer', 'firstName lastName')
      .limit(10);

    console.log('\nSample Looking For requests to be deleted:');
    for (const request of sampleRequests) {
      const buyerName = request.buyer ? `${request.buyer.firstName} ${request.buyer.lastName}` : 'Unknown';
      console.log(`- "${request.title}" by ${buyerName} (${request.category}) - Status: ${request.status}`);
    }

    if (totalRequests > 10) {
      console.log(`  ... and ${totalRequests - 10} more requests`);
    }

    console.log('\n🗑️ Deleting all Looking For requests...');

    // Delete all Looking For requests
    const deleteResult = await LookingFor.deleteMany({});

    console.log(`✅ Successfully deleted ${deleteResult.deletedCount} Looking For requests`);

    // Verify deletion
    const remainingRequests = await LookingFor.countDocuments();
    console.log(`📊 Remaining Looking For requests in database: ${remainingRequests}`);

    console.log('\n🎉 All Looking For requests deleted! Database is clean.');

  } catch (error) {
    console.error('❌ Error deleting Looking For requests:', error);
  } finally {
    mongoose.disconnect();
  }
}

deleteAllLookingFor();