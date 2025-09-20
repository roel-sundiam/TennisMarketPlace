import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BrandModel from '../models/BrandModel.js';

dotenv.config();

const enhancedPickleballData = [
  // JOOLA - Enhanced data
  {
    category: 'Pickleball Paddles',
    brand: 'JOOLA',
    sortOrder: 1,
    models: [
      {
        name: 'Ben Johns Hyperion CFS',
        isPopular: true,
        year: '2023',
        specifications: {
          weight: '8.0-8.5oz',
          gripSize: '4 1/4"',
          paddleType: 'Power',
          surface: 'Textured',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      },
      {
        name: 'Ben Johns Perseus CFS',
        isPopular: true,
        year: '2023',
        specifications: {
          weight: '7.5-8.0oz',
          gripSize: '4 1/4"',
          paddleType: 'All-Around',
          surface: 'Textured',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      },
      {
        name: 'Vision CGS',
        isPopular: false,
        year: '2023',
        specifications: {
          weight: '7.5-8.0oz',
          gripSize: '4 1/4"',
          paddleType: 'Control',
          surface: 'Smooth',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      },
      {
        name: 'Radius CGS',
        isPopular: false,
        year: '2022',
        specifications: {
          weight: '8.0-8.5oz',
          gripSize: '4 1/4"',
          paddleType: 'Power',
          surface: 'Textured',
          coreType: 'Polymer',
          shape: 'Elongated',
          usapaApproved: true
        }
      },
      {
        name: 'Solaire CFS',
        isPopular: false,
        year: '2023',
        specifications: {
          weight: '7.5-8.0oz',
          gripSize: '4 1/8"',
          paddleType: 'All-Around',
          surface: 'Textured',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      },
      {
        name: 'Scorpeus CFS',
        isPopular: true,
        year: '2024',
        specifications: {
          weight: '8.0-8.5oz',
          gripSize: '4 1/4"',
          paddleType: 'Power',
          surface: 'Gritty',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      }
    ]
  },

  // Selkirk - Enhanced data
  {
    category: 'Pickleball Paddles',
    brand: 'Selkirk',
    sortOrder: 2,
    models: [
      {
        name: 'LUXX Control Air Invikta',
        isPopular: true,
        year: '2023',
        specifications: {
          weight: '8.0-8.5oz',
          gripSize: '4 1/4"',
          paddleType: 'Control',
          surface: 'Textured',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      },
      {
        name: 'LUXX Control Air Epic',
        isPopular: false,
        year: '2023',
        specifications: {
          weight: '7.5-8.0oz',
          gripSize: '4 1/4"',
          paddleType: 'Control',
          surface: 'Textured',
          coreType: 'Polymer',
          shape: 'Elongated',
          usapaApproved: true
        }
      },
      {
        name: 'Vanguard Power Air Invikta',
        isPopular: true,
        year: '2023',
        specifications: {
          weight: '8.0-8.5oz',
          gripSize: '4 1/4"',
          paddleType: 'Power',
          surface: 'Gritty',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      },
      {
        name: 'Vanguard Power Air Epic',
        isPopular: false,
        year: '2023',
        specifications: {
          weight: '7.5-8.0oz',
          gripSize: '4 1/4"',
          paddleType: 'Power',
          surface: 'Gritty',
          coreType: 'Polymer',
          shape: 'Elongated',
          usapaApproved: true
        }
      },
      {
        name: 'SLK Halo Control Max',
        isPopular: true,
        year: '2024',
        specifications: {
          weight: '8.0-8.5oz',
          gripSize: '4 1/4"',
          paddleType: 'Control',
          surface: 'Textured',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      },
      {
        name: 'SLK Halo Power Max',
        isPopular: true,
        year: '2024',
        specifications: {
          weight: '8.0-8.5oz',
          gripSize: '4 1/4"',
          paddleType: 'Power',
          surface: 'Gritty',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      }
    ]
  },

  // Paddletek - Enhanced data
  {
    category: 'Pickleball Paddles',
    brand: 'Paddletek',
    sortOrder: 3,
    models: [
      {
        name: 'Bantam TS-5 Pro',
        isPopular: true,
        year: '2023',
        specifications: {
          weight: '8.0-8.5oz',
          gripSize: '4 1/4"',
          paddleType: 'Control',
          surface: 'Textured',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      },
      {
        name: 'Bantam EX-L Pro',
        isPopular: false,
        year: '2023',
        specifications: {
          weight: '7.5-8.0oz',
          gripSize: '4 1/4"',
          paddleType: 'Control',
          surface: 'Textured',
          coreType: 'Polymer',
          shape: 'Elongated',
          usapaApproved: true
        }
      },
      {
        name: 'Tempest Wave Pro',
        isPopular: true,
        year: '2022',
        specifications: {
          weight: '8.0-8.5oz',
          gripSize: '4 1/4"',
          paddleType: 'All-Around',
          surface: 'Textured',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      },
      {
        name: 'Tempest Wave II',
        isPopular: false,
        year: '2022',
        specifications: {
          weight: '7.5-8.0oz',
          gripSize: '4 1/8"',
          paddleType: 'All-Around',
          surface: 'Smooth',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      },
      {
        name: 'Phoenix LTE',
        isPopular: false,
        year: '2021',
        specifications: {
          weight: '7.5-8.0oz',
          gripSize: '4 1/4"',
          paddleType: 'Control',
          surface: 'Textured',
          coreType: 'Nomex',
          shape: 'Traditional',
          usapaApproved: true
        }
      }
    ]
  },

  // CRBN - New brand
  {
    category: 'Pickleball Paddles',
    brand: 'CRBN',
    sortOrder: 4,
    models: [
      {
        name: 'CRBN¹ X',
        isPopular: true,
        year: '2023',
        specifications: {
          weight: '8.0-8.5oz',
          gripSize: '4 1/4"',
          paddleType: 'Power',
          surface: 'Gritty',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      },
      {
        name: 'CRBN² Power Series',
        isPopular: true,
        year: '2023',
        specifications: {
          weight: '8.0-8.5oz',
          gripSize: '4 1/4"',
          paddleType: 'Power',
          surface: 'Gritty',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      },
      {
        name: 'CRBN¹ Control',
        isPopular: false,
        year: '2023',
        specifications: {
          weight: '7.5-8.0oz',
          gripSize: '4 1/4"',
          paddleType: 'Control',
          surface: 'Textured',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      }
    ]
  },

  // Gearbox - New brand
  {
    category: 'Pickleball Paddles',
    brand: 'Gearbox',
    sortOrder: 5,
    models: [
      {
        name: 'Pro Control',
        isPopular: true,
        year: '2023',
        specifications: {
          weight: '8.0-8.5oz',
          gripSize: '4 1/4"',
          paddleType: 'Control',
          surface: 'Textured',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      },
      {
        name: 'Pro Power',
        isPopular: true,
        year: '2023',
        specifications: {
          weight: '8.0-8.5oz',
          gripSize: '4 1/4"',
          paddleType: 'Power',
          surface: 'Gritty',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      },
      {
        name: 'CX11E Control',
        isPopular: false,
        year: '2022',
        specifications: {
          weight: '7.5-8.0oz',
          gripSize: '4 1/8"',
          paddleType: 'Control',
          surface: 'Textured',
          coreType: 'Polymer',
          shape: 'Elongated',
          usapaApproved: true
        }
      }
    ]
  },

  // Engage - Enhanced data
  {
    category: 'Pickleball Paddles',
    brand: 'Engage',
    sortOrder: 6,
    models: [
      {
        name: 'Pursuit MX 6.0',
        isPopular: true,
        year: '2023',
        specifications: {
          weight: '8.0-8.5oz',
          gripSize: '4 1/4"',
          paddleType: 'All-Around',
          surface: 'Textured',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      },
      {
        name: 'Pursuit EX 6.0',
        isPopular: false,
        year: '2023',
        specifications: {
          weight: '7.5-8.0oz',
          gripSize: '4 1/4"',
          paddleType: 'All-Around',
          surface: 'Textured',
          coreType: 'Polymer',
          shape: 'Elongated',
          usapaApproved: true
        }
      },
      {
        name: 'Elite Pro Maverick',
        isPopular: true,
        year: '2022',
        specifications: {
          weight: '8.0-8.5oz',
          gripSize: '4 1/4"',
          paddleType: 'Power',
          surface: 'Gritty',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      },
      {
        name: 'Elite Pro Encore',
        isPopular: false,
        year: '2022',
        specifications: {
          weight: '7.5-8.0oz',
          gripSize: '4 1/4"',
          paddleType: 'Control',
          surface: 'Textured',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      }
    ]
  },

  // Six Zero - New brand
  {
    category: 'Pickleball Paddles',
    brand: 'Six Zero',
    sortOrder: 7,
    models: [
      {
        name: 'Black Diamond',
        isPopular: true,
        year: '2023',
        specifications: {
          weight: '8.0-8.5oz',
          gripSize: '4 1/4"',
          paddleType: 'Power',
          surface: 'Gritty',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      },
      {
        name: 'Double Black Diamond',
        isPopular: true,
        year: '2023',
        specifications: {
          weight: '8.0-8.5oz',
          gripSize: '4 1/4"',
          paddleType: 'Power',
          surface: 'Gritty',
          coreType: 'Polymer',
          shape: 'Elongated',
          usapaApproved: true
        }
      },
      {
        name: 'Ruby',
        isPopular: false,
        year: '2023',
        specifications: {
          weight: '7.5-8.0oz',
          gripSize: '4 1/4"',
          paddleType: 'Control',
          surface: 'Textured',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      }
    ]
  },

  // HEAD - Enhanced data
  {
    category: 'Pickleball Paddles',
    brand: 'HEAD',
    sortOrder: 8,
    models: [
      {
        name: 'Radical Elite',
        isPopular: true,
        year: '2023',
        specifications: {
          weight: '8.0-8.5oz',
          gripSize: '4 1/4"',
          paddleType: 'All-Around',
          surface: 'Textured',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      },
      {
        name: 'Radical Tour',
        isPopular: false,
        year: '2023',
        specifications: {
          weight: '7.5-8.0oz',
          gripSize: '4 1/4"',
          paddleType: 'All-Around',
          surface: 'Textured',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      },
      {
        name: 'Extreme Elite',
        isPopular: false,
        year: '2023',
        specifications: {
          weight: '8.0-8.5oz',
          gripSize: '4 1/4"',
          paddleType: 'Power',
          surface: 'Gritty',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      },
      {
        name: 'Gravity Pro',
        isPopular: false,
        year: '2022',
        specifications: {
          weight: '7.5-8.0oz',
          gripSize: '4 1/8"',
          paddleType: 'Control',
          surface: 'Textured',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      }
    ]
  },

  // Onix - Enhanced data
  {
    category: 'Pickleball Paddles',
    brand: 'Onix',
    sortOrder: 9,
    models: [
      {
        name: 'Z5 Graphite',
        isPopular: true,
        year: '2022',
        specifications: {
          weight: '7.5-8.0oz',
          gripSize: '4 1/4"',
          paddleType: 'All-Around',
          surface: 'Smooth',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      },
      {
        name: 'Evoke Premier',
        isPopular: false,
        year: '2023',
        specifications: {
          weight: '8.0-8.5oz',
          gripSize: '4 1/4"',
          paddleType: 'Power',
          surface: 'Textured',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      },
      {
        name: 'Evoke Pro',
        isPopular: false,
        year: '2022',
        specifications: {
          weight: '7.5-8.0oz',
          gripSize: '4 1/4"',
          paddleType: 'All-Around',
          surface: 'Textured',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      },
      {
        name: 'Stryker 4',
        isPopular: false,
        year: '2021',
        specifications: {
          weight: '8.0-8.5oz',
          gripSize: '4 1/4"',
          paddleType: 'Power',
          surface: 'Gritty',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      }
    ]
  },

  // Electrum - New brand
  {
    category: 'Pickleball Paddles',
    brand: 'Electrum',
    sortOrder: 10,
    models: [
      {
        name: 'Model E',
        isPopular: true,
        year: '2023',
        specifications: {
          weight: '8.0-8.5oz',
          gripSize: '4 1/4"',
          paddleType: 'Power',
          surface: 'Gritty',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      },
      {
        name: 'Model E Pro',
        isPopular: false,
        year: '2023',
        specifications: {
          weight: '8.0-8.5oz',
          gripSize: '4 1/4"',
          paddleType: 'Power',
          surface: 'Gritty',
          coreType: 'Polymer',
          shape: 'Elongated',
          usapaApproved: true
        }
      }
    ]
  },

  // ProKennex - New brand
  {
    category: 'Pickleball Paddles',
    brand: 'ProKennex',
    sortOrder: 11,
    models: [
      {
        name: 'Pro Speed',
        isPopular: false,
        year: '2023',
        specifications: {
          weight: '8.0-8.5oz',
          gripSize: '4 1/4"',
          paddleType: 'Power',
          surface: 'Textured',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      },
      {
        name: 'Ovation Speed',
        isPopular: false,
        year: '2022',
        specifications: {
          weight: '7.5-8.0oz',
          gripSize: '4 1/4"',
          paddleType: 'All-Around',
          surface: 'Textured',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      }
    ]
  },

  // Aniviia - New brand
  {
    category: 'Pickleball Paddles',
    brand: 'Aniviia',
    sortOrder: 12,
    models: [
      {
        name: 'Elite Pro',
        isPopular: true,
        year: '2024',
        specifications: {
          weight: '8.0-8.5oz',
          gripSize: '4 1/4"',
          paddleType: 'Power',
          surface: 'Textured',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      },
      {
        name: 'Control Master',
        isPopular: true,
        year: '2024',
        specifications: {
          weight: '7.5-8.0oz',
          gripSize: '4 1/8"',
          paddleType: 'Control',
          surface: 'Smooth',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      },
      {
        name: 'All-Court Pro',
        isPopular: false,
        year: '2024',
        specifications: {
          weight: '8.0-8.5oz',
          gripSize: '4 1/4"',
          paddleType: 'All-Around',
          surface: 'Textured',
          coreType: 'Polymer',
          shape: 'Elongated',
          usapaApproved: true
        }
      },
      {
        name: 'Power Elite',
        isPopular: true,
        year: '2023',
        specifications: {
          weight: '8.0-8.5oz',
          gripSize: '4 1/4"',
          paddleType: 'Power',
          surface: 'Gritty',
          coreType: 'Polymer',
          shape: 'Traditional',
          usapaApproved: true
        }
      }
    ]
  },

  // Dura - Enhanced pickleball balls
  {
    category: 'Pickleball Balls',
    brand: 'Dura',
    sortOrder: 1,
    models: [
      {
        name: 'Fast 40 Outdoor',
        isPopular: true,
        specifications: {
          indoorOutdoor: 'Outdoor',
          usapaApproved: true
        }
      },
      {
        name: 'Big Hole Outdoor',
        isPopular: false,
        specifications: {
          indoorOutdoor: 'Outdoor',
          usapaApproved: true
        }
      },
      {
        name: 'Competition 74',
        isPopular: false,
        specifications: {
          indoorOutdoor: 'Outdoor',
          usapaApproved: true
        }
      }
    ]
  },

  // Franklin - Enhanced pickleball balls
  {
    category: 'Pickleball Balls',
    brand: 'Franklin',
    sortOrder: 2,
    models: [
      {
        name: 'X-40 Performance Outdoor',
        isPopular: true,
        specifications: {
          indoorOutdoor: 'Outdoor',
          usapaApproved: true
        }
      },
      {
        name: 'X-40 Competition Indoor',
        isPopular: true,
        specifications: {
          indoorOutdoor: 'Indoor',
          usapaApproved: true
        }
      },
      {
        name: 'Pro Tournament',
        isPopular: false,
        specifications: {
          indoorOutdoor: 'Both',
          usapaApproved: true
        }
      },
      {
        name: 'Recreational',
        isPopular: false,
        specifications: {
          indoorOutdoor: 'Both',
          usapaApproved: false
        }
      }
    ]
  }
];

const seedEnhancedPickleball = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tennis-marketplace';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Remove existing pickleball data
    await BrandModel.deleteMany({
      category: { $in: ['Pickleball Paddles', 'Pickleball Balls'] }
    });
    console.log('🗑️  Cleared existing pickleball data');

    // Insert enhanced pickleball data
    await BrandModel.insertMany(enhancedPickleballData);
    console.log(`✅ Successfully seeded ${enhancedPickleballData.length} enhanced pickleball records`);

    // Log summary
    const summary = {};
    enhancedPickleballData.forEach(item => {
      if (!summary[item.category]) summary[item.category] = { brands: 0, models: 0 };
      summary[item.category].brands += 1;
      summary[item.category].models += item.models.length;
    });

    console.log('\n📊 Enhanced Pickleball Seeding Summary:');
    Object.entries(summary).forEach(([category, counts]) => {
      console.log(`   ${category}: ${counts.models} models across ${counts.brands} brands`);
    });

    // Test advanced search
    console.log('\n🔍 Testing Advanced Pickleball Search:');

    const powerPaddles = await BrandModel.searchPickleballPaddles({ paddleType: 'Power' });
    console.log(`   Power paddles: ${powerPaddles.reduce((sum, brand) => sum + brand.models.length, 0)} models found`);

    const controlPaddles = await BrandModel.searchPickleballPaddles({ paddleType: 'Control' });
    console.log(`   Control paddles: ${controlPaddles.reduce((sum, brand) => sum + brand.models.length, 0)} models found`);

    const heavyPaddles = await BrandModel.searchPickleballPaddles({ weight: '8.0-8.5oz' });
    console.log(`   Heavy paddles (8.0-8.5oz): ${heavyPaddles.reduce((sum, brand) => sum + brand.models.length, 0)} models found`);

    const grittySurface = await BrandModel.searchPickleballPaddles({ surface: 'Gritty' });
    console.log(`   Gritty surface paddles: ${grittySurface.reduce((sum, brand) => sum + brand.models.length, 0)} models found`);

    // Test specifications endpoint
    const specs = await BrandModel.getPickleballSpecifications();
    if (specs.length > 0) {
      console.log('\n🔧 Available Specifications:');
      console.log(`   Paddle Types: ${specs[0].paddleTypes.join(', ')}`);
      console.log(`   Weights: ${specs[0].weights.join(', ')}`);
      console.log(`   Surfaces: ${specs[0].surfaces.join(', ')}`);
      console.log(`   Core Types: ${specs[0].coreTypes.join(', ')}`);
    }

  } catch (error) {
    console.error('❌ Error seeding enhanced pickleball data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  }
};

seedEnhancedPickleball();