import mongoose from 'mongoose';
import Product from '../models/Product.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function cleanupProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tennis-marketplace');
    console.log('✅ Connected to MongoDB');

    // Get the admin user ID
    const adminUser = await User.findOne({ email: 'admin@tennis.com' });
    if (!adminUser) {
      console.log('❌ Admin user not found!');
      process.exit(1);
    }

    console.log('👤 Admin user ID:', adminUser._id);

    // Count products before cleanup
    const totalProducts = await Product.countDocuments();
    console.log(`📊 Total products in database: ${totalProducts}`);

    // Find products with invalid seller references (sellers that no longer exist)
    const productsWithInvalidSellers = await Product.find({
      seller: { $ne: adminUser._id, $ne: null }
    });

    console.log(`🔍 Found ${productsWithInvalidSellers.length} products with potentially invalid sellers`);

    // Check which products actually have invalid seller references
    let invalidProducts = [];
    for (const product of productsWithInvalidSellers) {
      if (product.seller) {
        const sellerExists = await User.findById(product.seller);
        if (!sellerExists) {
          invalidProducts.push(product._id);
        }
      }
    }

    console.log(`🗑️  Found ${invalidProducts.length} products with deleted sellers`);

    if (invalidProducts.length > 0) {
      // Delete products with invalid seller references
      const deleteResult = await Product.deleteMany({ 
        _id: { $in: invalidProducts }
      });
      
      console.log(`🗑️  Deleted ${deleteResult.deletedCount} orphaned products`);
    }

    // Count remaining products
    const remainingProducts = await Product.countDocuments();
    console.log(`📊 Remaining products: ${remainingProducts}`);

    // Show remaining products summary
    const productsByStatus = await Product.aggregate([
      {
        $group: {
          _id: '$isApproved',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('📈 Products by approval status:');
    productsByStatus.forEach(status => {
      console.log(`  - ${status._id}: ${status.count}`);
    });

    console.log('\n🎉 Product cleanup completed successfully!');
    console.log('💡 Database is now clean and ready for testing user registration.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during product cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupProducts();