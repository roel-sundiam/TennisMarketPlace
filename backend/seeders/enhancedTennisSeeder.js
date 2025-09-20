import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BrandModel from '../models/BrandModel.js';

dotenv.config();

const enhancedTennisData = [
  // Wilson - Enhanced tennis rackets
  {
    category: 'Racquets',
    brand: 'Wilson',
    sortOrder: 1,
    models: [
      {
        name: 'Pro Staff 97 v14',
        isPopular: true,
        year: '2024',
        specifications: {
          headSize: '97 sq in',
          racketWeight: '315g',
          stringPattern: '16x19',
          balance: 'Head Light',
          stiffness: 'Medium (60-69)',
          swingWeight: '325',
          playerLevel: 'Advanced',
          playStyle: 'All-Court'
        }
      },
      {
        name: 'Blade 98 16x19 v8',
        isPopular: true,
        year: '2023',
        specifications: {
          headSize: '98 sq in',
          racketWeight: '305g',
          stringPattern: '16x19',
          balance: 'Even Balance',
          stiffness: 'Medium (60-69)',
          swingWeight: '320',
          playerLevel: 'Intermediate',
          playStyle: 'All-Court'
        }
      },
      {
        name: 'Clash 100 v2',
        isPopular: true,
        year: '2023',
        specifications: {
          headSize: '100 sq in',
          racketWeight: '295g',
          stringPattern: '16x19',
          balance: 'Head Light',
          stiffness: 'Flexible (50-59)',
          swingWeight: '315',
          playerLevel: 'Beginner',
          playStyle: 'Baseline'
        }
      },
      {
        name: 'Ultra 100L v4',
        isPopular: false,
        year: '2023',
        specifications: {
          headSize: '100 sq in',
          racketWeight: '280g',
          stringPattern: '16x19',
          balance: 'Head Light',
          stiffness: 'Medium (60-69)',
          swingWeight: '310',
          playerLevel: 'Beginner',
          playStyle: 'Baseline'
        }
      }
    ]
  },

  // Babolat - Enhanced tennis rackets
  {
    category: 'Racquets',
    brand: 'Babolat',
    sortOrder: 2,
    models: [
      {
        name: 'Pure Drive 2024',
        isPopular: true,
        year: '2024',
        specifications: {
          headSize: '100 sq in',
          racketWeight: '300g',
          stringPattern: '16x19',
          balance: 'Even Balance',
          stiffness: 'Stiff (70+)',
          swingWeight: '320',
          playerLevel: 'Intermediate',
          playStyle: 'Aggressive'
        }
      },
      {
        name: 'Pure Aero 2023',
        isPopular: true,
        year: '2023',
        specifications: {
          headSize: '100 sq in',
          racketWeight: '300g',
          stringPattern: '16x19',
          balance: 'Head Light',
          stiffness: 'Stiff (70+)',
          swingWeight: '320',
          playerLevel: 'Advanced',
          playStyle: 'Baseline'
        }
      },
      {
        name: 'Pure Strike 16x19',
        isPopular: false,
        year: '2022',
        specifications: {
          headSize: '98 sq in',
          racketWeight: '305g',
          stringPattern: '16x19',
          balance: 'Head Light',
          stiffness: 'Medium (60-69)',
          swingWeight: '325',
          playerLevel: 'Advanced',
          playStyle: 'All-Court'
        }
      }
    ]
  },

  // Head - Enhanced tennis rackets
  {
    category: 'Racquets',
    brand: 'HEAD',
    sortOrder: 3,
    models: [
      {
        name: 'Speed MP 2023',
        isPopular: true,
        year: '2023',
        specifications: {
          headSize: '100 sq in',
          racketWeight: '300g',
          stringPattern: '16x19',
          balance: 'Even Balance',
          stiffness: 'Medium (60-69)',
          swingWeight: '320',
          playerLevel: 'Intermediate',
          playStyle: 'All-Court'
        }
      },
      {
        name: 'Radical MP 2023',
        isPopular: true,
        year: '2023',
        specifications: {
          headSize: '98 sq in',
          racketWeight: '305g',
          stringPattern: '16x19',
          balance: 'Even Balance',
          stiffness: 'Medium (60-69)',
          swingWeight: '325',
          playerLevel: 'Advanced',
          playStyle: 'All-Court'
        }
      },
      {
        name: 'Boom MP 2023',
        isPopular: false,
        year: '2023',
        specifications: {
          headSize: '100 sq in',
          racketWeight: '310g',
          stringPattern: '16x19',
          balance: 'Head Heavy',
          stiffness: 'Stiff (70+)',
          swingWeight: '335',
          playerLevel: 'Intermediate',
          playStyle: 'Baseline'
        }
      }
    ]
  },

  // Yonex - Enhanced tennis rackets
  {
    category: 'Racquets',
    brand: 'Yonex',
    sortOrder: 4,
    models: [
      {
        name: 'EZONE 100',
        isPopular: true,
        year: '2022',
        specifications: {
          headSize: '100 sq in',
          racketWeight: '300g',
          stringPattern: '16x19',
          balance: 'Even Balance',
          stiffness: 'Medium (60-69)',
          swingWeight: '320',
          playerLevel: 'Intermediate',
          playStyle: 'All-Court'
        }
      },
      {
        name: 'VCORE 100',
        isPopular: false,
        year: '2021',
        specifications: {
          headSize: '100 sq in',
          racketWeight: '305g',
          stringPattern: '16x19',
          balance: 'Even Balance',
          stiffness: 'Stiff (70+)',
          swingWeight: '325',
          playerLevel: 'Advanced',
          playStyle: 'Aggressive'
        }
      }
    ]
  },

  // Prince - Enhanced tennis rackets
  {
    category: 'Racquets',
    brand: 'Prince',
    sortOrder: 5,
    models: [
      {
        name: 'Textreme Tour 100P',
        isPopular: false,
        year: '2021',
        specifications: {
          headSize: '100 sq in',
          racketWeight: '315g',
          stringPattern: '18x20',
          balance: 'Head Light',
          stiffness: 'Medium (60-69)',
          swingWeight: '330',
          playerLevel: 'Advanced',
          playStyle: 'All-Court'
        }
      },
      {
        name: 'Phantom 100X',
        isPopular: false,
        year: '2022',
        specifications: {
          headSize: '100 sq in',
          racketWeight: '290g',
          stringPattern: '16x19',
          balance: 'Head Light',
          stiffness: 'Medium (60-69)',
          swingWeight: '315',
          playerLevel: 'Intermediate',
          playStyle: 'Baseline'
        }
      }
    ]
  },

  // Tecnifibre - Enhanced tennis rackets
  {
    category: 'Racquets',
    brand: 'Tecnifibre',
    sortOrder: 6,
    models: [
      {
        name: 'TF40 305',
        isPopular: true,
        year: '2023',
        specifications: {
          headSize: '98 sq in',
          racketWeight: '305g',
          stringPattern: '16x19',
          balance: 'Head Light',
          stiffness: 'Medium (60-69)',
          swingWeight: '320',
          playerLevel: 'Advanced',
          playStyle: 'All-Court'
        }
      },
      {
        name: 'T-Fight 315 XTC',
        isPopular: false,
        year: '2022',
        specifications: {
          headSize: '98 sq in',
          racketWeight: '315g',
          stringPattern: '16x19',
          balance: 'Even Balance',
          stiffness: 'Stiff (70+)',
          swingWeight: '335',
          playerLevel: 'Professional',
          playStyle: 'Aggressive'
        }
      }
    ]
  },

  // Dunlop - Enhanced tennis rackets
  {
    category: 'Racquets',
    brand: 'Dunlop',
    sortOrder: 7,
    models: [
      {
        name: 'FX 500',
        isPopular: false,
        year: '2021',
        specifications: {
          headSize: '100 sq in',
          racketWeight: '290g',
          stringPattern: '16x19',
          balance: 'Head Light',
          stiffness: 'Medium (60-69)',
          swingWeight: '315',
          playerLevel: 'Intermediate',
          playStyle: 'All-Court'
        }
      }
    ]
  }
];

const seedEnhancedTennis = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tennis-marketplace';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Remove existing tennis racket data (but keep pickleball data)
    const result = await BrandModel.deleteMany({
      category: 'Racquets'
    });
    console.log(`🗑️  Cleared existing tennis racquet data: ${result.deletedCount} records`);

    // Insert enhanced tennis data
    await BrandModel.insertMany(enhancedTennisData);
    console.log(`✅ Successfully seeded ${enhancedTennisData.length} enhanced tennis racquet brands`);

    // Log summary
    const summary = {};
    enhancedTennisData.forEach(item => {
      if (!summary[item.category]) summary[item.category] = { brands: 0, models: 0 };
      summary[item.category].brands += 1;
      summary[item.category].models += item.models.length;
    });

    console.log('\n📊 Enhanced Tennis Seeding Summary:');
    Object.entries(summary).forEach(([category, counts]) => {
      console.log(`   ${category}: ${counts.models} models across ${counts.brands} brands`);
    });

    // Test advanced search
    console.log('\n🔍 Testing Advanced Tennis Racket Search:');

    const beginnerRackets = await BrandModel.searchTennisRackets({ playerLevel: 'Beginner' });
    console.log(`   Beginner rackets: ${beginnerRackets.reduce((sum, brand) => sum + brand.models.length, 0)} models found`);

    const advancedRackets = await BrandModel.searchTennisRackets({ playerLevel: 'Advanced' });
    console.log(`   Advanced rackets: ${advancedRackets.reduce((sum, brand) => sum + brand.models.length, 0)} models found`);

    const heavyRackets = await BrandModel.searchTennisRackets({ racketWeight: '300-320g' });
    console.log(`   Heavy rackets (300-320g): ${heavyRackets.reduce((sum, brand) => sum + brand.models.length, 0)} models found`);

    const oversizeRackets = await BrandModel.searchTennisRackets({ headSize: '100-105 sq in' });
    console.log(`   Oversize rackets (100-105 sq in): ${oversizeRackets.reduce((sum, brand) => sum + brand.models.length, 0)} models found`);

    // Test specifications endpoint
    const specs = await BrandModel.getTennisRacketSpecifications();
    if (specs.length > 0) {
      console.log('\n🔧 Available Tennis Specifications:');
      console.log(`   Head Sizes: ${specs[0].headSizes.join(', ')}`);
      console.log(`   Racket Weights: ${specs[0].racketWeights.join(', ')}`);
      console.log(`   String Patterns: ${specs[0].stringPatterns.join(', ')}`);
      console.log(`   Player Levels: ${specs[0].playerLevels.join(', ')}`);
      console.log(`   Play Styles: ${specs[0].playStyles.join(', ')}`);
    }

  } catch (error) {
    console.error('❌ Error seeding enhanced tennis data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  }
};

seedEnhancedTennis();