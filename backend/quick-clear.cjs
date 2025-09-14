const { MongoClient } = require('mongodb');

async function clearDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tennis-marketplace';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Clear products collection
    const productsResult = await db.collection('products').deleteMany({});
    console.log(`Deleted ${productsResult.deletedCount} products`);
    
    // Clear test users
    const usersResult = await db.collection('users').deleteMany({
      email: { $in: ['sample@tennismarket.ph', 'test@tennis.com', 'demo@tennis.ph'] }
    });
    console.log(`Deleted ${usersResult.deletedCount} test users`);
    
    // Show remaining collections
    const collections = await db.listCollections().toArray();
    console.log('\nRemaining collections:');
    for (const coll of collections) {
      const count = await db.collection(coll.name).countDocuments();
      console.log(`  ${coll.name}: ${count} documents`);
    }
    
    console.log('\n✅ Database cleanup complete');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

clearDatabase();