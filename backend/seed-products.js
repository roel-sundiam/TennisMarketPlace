import mongoose from 'mongoose';
import Product from './models/Product.js';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tennis-marketplace';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected successfully for seeding');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
};

const createSampleUser = async () => {
  // Check if sample user already exists
  let sampleUser = await User.findOne({ email: 'sample@tennismarket.ph' });
  
  if (!sampleUser) {
    sampleUser = new User({
      firstName: 'Tennis',
      lastName: 'Store',
      email: 'sample@tennismarket.ph',
      password: 'hashedpassword123', // In real app this would be properly hashed
      phoneNumber: '+639171234567',
      role: 'seller',
      isActive: false, // Sample user - requires admin approval
      location: {
        city: 'Makati',
        region: 'Metro Manila'
      },
      rating: {
        average: 4.8,
        totalReviews: 25
      },
      isVerified: true
    });
    
    await sampleUser.save();
    console.log('✅ Sample user created');
  }
  
  return sampleUser._id;
};

const sampleProducts = [
  {
    title: 'Wilson Pro Staff 97 v14',
    description: 'Professional grade tennis racquet used by Roger Federer. Excellent control and feel for advanced players.',
    price: 14500,
    category: 'Racquets',
    condition: 'New',
    brand: 'Wilson',
    model: 'Pro Staff 97 v14',
    specifications: {
      weight: '315g',
      headSize: '97 sq in',
      stringPattern: '16x19',
      gripSize: '4 3/8"'
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1544966503-7a5e6b2c1c3d?w=500&h=500&fit=crop',
        alt: 'Wilson Pro Staff 97 v14',
        isMain: true
      }
    ],
    location: {
      city: 'Makati',
      region: 'Metro Manila'
    },
    availability: 'available',
    tags: ['Professional', 'Control', 'Advanced'],
    isBoosted: true,
    isApproved: 'approved',
    negotiable: true,
    shippingOptions: {
      meetup: true,
      delivery: true,
      shipping: true
    },
    reasonForSelling: 'Upgrading to newer model'
  },
  {
    title: 'Babolat Pure Drive 2023',
    description: 'Popular power racquet perfect for intermediate to advanced players. Great spin potential.',
    price: 12000,
    category: 'Racquets',
    condition: 'Like New',
    brand: 'Babolat',
    model: 'Pure Drive 2023',
    specifications: {
      weight: '300g',
      headSize: '100 sq in',
      stringPattern: '16x19',
      gripSize: '4 1/4"'
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500&h=500&fit=crop',
        alt: 'Babolat Pure Drive 2023',
        isMain: true
      }
    ],
    location: {
      city: 'Quezon City',
      region: 'Metro Manila'
    },
    availability: 'available',
    tags: ['Power', 'Spin', 'Intermediate'],
    isBoosted: false,
    isApproved: 'approved',
    negotiable: true,
    shippingOptions: {
      meetup: true,
      delivery: false,
      shipping: true
    },
    reasonForSelling: 'Too powerful for my playing style'
  },
  {
    title: 'Nike Court Air Zoom GP Turbo',
    description: 'Professional tennis shoes with excellent court grip and comfort. Size 9 US.',
    price: 5200,
    category: 'Shoes',
    condition: 'Excellent',
    brand: 'Nike',
    model: 'Court Air Zoom GP Turbo',
    specifications: {
      size: '9 US',
      width: 'Medium',
      color: 'White/Navy'
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop',
        alt: 'Nike Court Air Zoom GP Turbo',
        isMain: true
      }
    ],
    location: {
      city: 'Pasig',
      region: 'Metro Manila'
    },
    availability: 'available',
    tags: ['Size 9', 'Performance', 'Professional'],
    isBoosted: true,
    isApproved: 'approved',
    negotiable: false,
    shippingOptions: {
      meetup: true,
      delivery: true,
      shipping: true
    },
    reasonForSelling: 'Bought wrong size'
  },
  {
    title: 'Head Speed MP 2024',
    description: 'Modern power racquet with great spin capabilities. Perfect for aggressive baseline players.',
    price: 13800,
    category: 'Racquets',
    condition: 'New',
    brand: 'Head',
    model: 'Speed MP 2024',
    specifications: {
      weight: '300g',
      headSize: '100 sq in',
      stringPattern: '16x19',
      gripSize: '4 3/8"'
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc4b?w=500&h=500&fit=crop',
        alt: 'Head Speed MP 2024',
        isMain: true
      }
    ],
    location: {
      city: 'BGC',
      region: 'Metro Manila'
    },
    availability: 'available',
    tags: ['Speed', 'Power', 'Spin'],
    isBoosted: false,
    isApproved: 'approved',
    negotiable: true,
    shippingOptions: {
      meetup: true,
      delivery: true,
      shipping: true
    }
  },
  {
    title: 'Yonex Poly Tour Pro 125',
    description: 'Professional polyester tennis string. Excellent for power players who need control.',
    price: 1200,
    category: 'Strings',
    condition: 'New',
    brand: 'Yonex',
    model: 'Poly Tour Pro 125',
    specifications: {
      gauge: '125 (16)',
      length: '12m',
      material: 'Polyester'
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=500&fit=crop',
        alt: 'Yonex Poly Tour Pro String',
        isMain: true
      }
    ],
    location: {
      city: 'Manila',
      region: 'Metro Manila'
    },
    availability: 'available',
    tags: ['Professional', 'Control', 'Power'],
    isBoosted: false,
    isApproved: 'approved',
    negotiable: false,
    shippingOptions: {
      meetup: true,
      delivery: true,
      shipping: true
    }
  }
];

const seedProducts = async () => {
  try {
    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');

    // Create sample user
    const sellerId = await createSampleUser();

    // Add seller ID to all products
    const productsWithSeller = sampleProducts.map(product => ({
      ...product,
      seller: sellerId
    }));

    // Insert sample products
    const insertedProducts = await Product.insertMany(productsWithSeller);
    console.log(`✅ Added ${insertedProducts.length} sample products`);

    // Show summary
    console.log('\n📋 Products added:');
    insertedProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.title} - ₱${product.price.toLocaleString()} ${product.isBoosted ? '(BOOSTED)' : ''}`);
    });

    console.log('\n🎯 Featured Items should now show real data instead of mock data!');
    
  } catch (error) {
    console.error('❌ Error seeding products:', error);
  }
};

const main = async () => {
  const connected = await connectDB();
  if (!connected) {
    console.error('❌ Could not connect to database');
    process.exit(1);
  }

  await seedProducts();
  
  console.log('✅ Seeding completed');
  process.exit(0);
};

main().catch(console.error);