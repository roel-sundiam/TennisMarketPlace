import mongoose from 'mongoose';
import User from './models/User.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tennis-marketplace';
mongoose.connect(mongoUri);

async function checkAdminUser() {
  try {
    console.log('🔍 Looking for admin user...');
    const adminUser = await User.findOne({ email: 'admin@tennis.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('✅ Admin user found:');
    console.log('📧 Email:', adminUser.email);
    console.log('🔑 Role:', adminUser.role);
    console.log('👤 ID:', adminUser._id);
    console.log('🔐 Password hash:', adminUser.password);
    
    // Test password verification using User model method
    console.log('\n🧪 Testing password verification...');
    const isPasswordValidDirect = await bcrypt.compare('admin123', adminUser.password);
    console.log('✅ Direct bcrypt.compare result:', isPasswordValidDirect);
    
    const isPasswordValidMethod = await adminUser.comparePassword('admin123');
    console.log('✅ User.comparePassword result:', isPasswordValidMethod);
    
  } catch (error) {
    console.error('❌ Error checking admin user:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkAdminUser();