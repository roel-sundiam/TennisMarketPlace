import mongoose from 'mongoose';

// Simple schema definitions to avoid import issues
const ProductSchema = new mongoose.Schema({}, { strict: false });
const UserSchema = new mongoose.Schema({}, { strict: false });

const Product = mongoose.model('Product', ProductSchema);
const User = mongoose.model('User', UserSchema);

async function clearAllData() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tennis-marketplace';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Delete all products
    const productResult = await Product.deleteMany({});
    console.log(`🗑️ Deleted ${productResult.deletedCount} products`);

    // Delete test users (but keep real admin accounts)
    const userResult = await User.deleteMany({
      email: { 
        $in: [
          'sample@tennismarket.ph',
          'test@tennis.com', 
          'demo@tennis.ph',
          'mockuser@tennis.com'
        ]
      }
    });
    console.log(`🗑️ Deleted ${userResult.deletedCount} test users`);

    // Show what's left
    const remainingProducts = await Product.countDocuments();
    const remainingUsers = await User.countDocuments();
    
    console.log(`\n📊 Remaining in database:`);
    console.log(`   Products: ${remainingProducts}`);
    console.log(`   Users: ${remainingUsers}`);

    if (remainingProducts === 0) {
      console.log('\n🎉 SUCCESS: All products cleared!');
      console.log('🏠 Featured Items will now show empty state');
    } else {
      console.log('\n⚠️ Warning: Some products still remain');
    }

    await mongoose.disconnect();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

clearAllData();