import mongoose from 'mongoose';
import Product from './models/Product.js';
import User from './models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tennis-marketplace';
mongoose.connect(mongoUri);

async function checkPendingProducts() {
  try {
    console.log('🔍 Checking all products in database...');
    const allProducts = await Product.find({}).populate('seller', 'firstName lastName email');
    console.log(`📦 Total products: ${allProducts.length}`);
    
    console.log('\n📋 Product details:');
    allProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.title}`);
      console.log(`   Status: ${product.isApproved}`);
      console.log(`   Seller: ${product.seller?.firstName} ${product.seller?.lastName} (${product.seller?.email})`);
      console.log(`   Created: ${product.createdAt}`);
      console.log('');
    });

    console.log('🔍 Checking pending products specifically...');
    const pendingProducts = await Product.find({ isApproved: 'pending' }).populate('seller', 'firstName lastName email');
    console.log(`⏳ Pending products: ${pendingProducts.length}`);
    
    if (pendingProducts.length > 0) {
      console.log('\n📋 Pending product details:');
      pendingProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.title}`);
        console.log(`   Price: ₱${product.price.toLocaleString()}`);
        console.log(`   Seller: ${product.seller?.firstName} ${product.seller?.lastName} (${product.seller?.email})`);
        console.log(`   Created: ${product.createdAt}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking products:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkPendingProducts();