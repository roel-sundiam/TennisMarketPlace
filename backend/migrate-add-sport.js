import mongoose from 'mongoose';
import Product from './models/Product.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tennis-marketplace';

async function migrateSportField() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all products that don't have a sport field
    const productsWithoutSport = await Product.find({ sport: { $exists: false } });
    console.log(`📊 Found ${productsWithoutSport.length} products without sport field`);

    if (productsWithoutSport.length === 0) {
      console.log('✅ All products already have sport field');
      return;
    }

    // Update all products without sport field to have sport: 'Tennis'
    const updateResult = await Product.updateMany(
      { sport: { $exists: false } },
      { $set: { sport: 'Tennis' } }
    );

    console.log(`✅ Updated ${updateResult.modifiedCount} products with sport: 'Tennis'`);

    // Verify the update
    const totalProducts = await Product.countDocuments();
    const productsWithSport = await Product.countDocuments({ sport: { $exists: true } });

    console.log(`📊 Total products: ${totalProducts}`);
    console.log(`📊 Products with sport field: ${productsWithSport}`);

    if (totalProducts === productsWithSport) {
      console.log('🎉 Migration completed successfully! All products now have sport field');
    } else {
      console.log('⚠️  Some products still missing sport field');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the migration
migrateSportField();