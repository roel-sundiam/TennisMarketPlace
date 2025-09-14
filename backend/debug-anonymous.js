import mongoose from 'mongoose';
import Analytics from './models/Analytics.js';
import dotenv from 'dotenv';

dotenv.config();

async function debugAnonymous() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tennis-marketplace';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check total analytics entries
    const totalEntries = await Analytics.countDocuments();
    console.log('📊 Total analytics entries:', totalEntries);

    // Check anonymous entries (userId is null)
    const anonymousEntries = await Analytics.find({ userId: null });
    console.log('👻 Anonymous entries (userId null):', anonymousEntries.length);

    // Check entries with fingerprints
    const fingerprintEntries = await Analytics.find({ 
      userId: null,
      fingerprint: { $ne: null }
    });
    console.log('🔍 Anonymous entries with fingerprint:', fingerprintEntries.length);

    if (fingerprintEntries.length > 0) {
      console.log('\n📋 Sample anonymous entries:');
      fingerprintEntries.slice(0, 5).forEach((entry, index) => {
        console.log(`${index + 1}. Event: ${entry.eventType}, Path: ${entry.path}`);
        console.log(`   Fingerprint: ${entry.fingerprint}`);
        console.log(`   SessionID: ${entry.sessionId}`);
        console.log(`   Date: ${entry.createdAt}`);
        console.log(`   Device: ${entry.device?.type}, Browser: ${entry.device?.browser}`);
        console.log('   ---');
      });
    }

    // Test the aggregation query used by the API
    console.log('\n🔍 Testing anonymous visits aggregation...');
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const now = new Date();

    const matchStage = {
      createdAt: { $gte: last30Days, $lte: now },
      userId: null,
      fingerprint: { $ne: null }
    };

    console.log('🗓️ Date range:', last30Days.toISOString(), 'to', now.toISOString());
    
    const matchingEntries = await Analytics.find(matchStage);
    console.log('📅 Entries in last 30 days (matching criteria):', matchingEntries.length);

    // Run the full aggregation
    const aggregationResult = await Analytics.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$fingerprint',
          firstVisit: { $min: '$createdAt' },
          lastVisit: { $max: '$createdAt' },
          totalPageViews: { $sum: 1 },
          uniqueSessions: { $addToSet: '$sessionId' },
          devices: { $addToSet: '$device.type' },
          browsers: { $addToSet: '$device.browser' }
        }
      },
      {
        $addFields: {
          sessionCount: { $size: '$uniqueSessions' }
        }
      },
      { $sort: { lastVisit: -1 } }
    ]);

    console.log('📈 Aggregation result:', aggregationResult.length, 'unique anonymous visitors');
    
    if (aggregationResult.length > 0) {
      console.log('\n👻 Anonymous visitors found:');
      aggregationResult.forEach((visitor, index) => {
        console.log(`${index + 1}. Fingerprint: ${visitor._id.substring(0, 8)}...`);
        console.log(`   Page views: ${visitor.totalPageViews}, Sessions: ${visitor.sessionCount}`);
        console.log(`   Last visit: ${visitor.lastVisit}`);
        console.log('   ---');
      });
    } else {
      console.log('❌ No anonymous visitors found in aggregation');
    }

    await mongoose.disconnect();
    console.log('\n✅ Debug complete');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugAnonymous();