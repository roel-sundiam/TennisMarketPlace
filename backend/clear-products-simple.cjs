const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tennis-marketplace';

mongoose.connect(mongoUri).then(async () => {
  console.log('Connected to MongoDB');
  
  // Delete all products
  const result1 = await mongoose.connection.db.collection('products').deleteMany({});
  console.log(`Deleted ${result1.deletedCount} products`);
  
  // Delete sample user
  const result2 = await mongoose.connection.db.collection('users').deleteOne({ email: 'sample@tennismarket.ph' });
  console.log(`Deleted ${result2.deletedCount} sample users`);
  
  console.log('✅ Cleanup complete');
  process.exit(0);
}).catch(err => {
  console.error('Connection error:', err);
  process.exit(1);
});