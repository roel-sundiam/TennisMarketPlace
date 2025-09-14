import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BrandModel from '../models/BrandModel.js';

dotenv.config();

const seedData = [
  // Racquets
  {
    category: 'Racquets',
    brand: 'Wilson',
    sortOrder: 1,
    models: [
      { name: 'Pro Staff 97 v14', isPopular: true, year: '2023' },
      { name: 'Pro Staff 97L v14', isPopular: true, year: '2023' },
      { name: 'Pro Staff 97S v14', isPopular: false, year: '2023' },
      { name: 'Pro Staff 97UL v14', isPopular: false, year: '2023' },
      { name: 'Pro Staff Six.One 95', isPopular: false, year: '2019' },
      { name: 'Blade 98 v8', isPopular: true, year: '2022' },
      { name: 'Blade 100L v8', isPopular: false, year: '2022' },
      { name: 'Blade 104 v8', isPopular: false, year: '2022' },
      { name: 'Blade 93 v8', isPopular: false, year: '2022' },
      { name: 'Blade SW104 v8', isPopular: false, year: '2022' },
      { name: 'Clash 100 v2', isPopular: true, year: '2023' },
      { name: 'Clash 108 v2', isPopular: false, year: '2023' },
      { name: 'Clash 100L v2', isPopular: false, year: '2023' },
      { name: 'Clash 100 Pro v2', isPopular: false, year: '2023' },
      { name: 'Ultra 100 v4', isPopular: true, year: '2023' },
      { name: 'Ultra 95 v4', isPopular: false, year: '2023' },
      { name: 'Ultra 100L v4', isPopular: false, year: '2023' },
      { name: 'Ultra 108 v4', isPopular: false, year: '2023' },
      { name: 'Burn 100S v5', isPopular: false, year: '2023' },
      { name: 'Burn 100LS v5', isPopular: false, year: '2023' },
      { name: 'H22', isPopular: false, year: '2022' }
    ]
  },
  {
    category: 'Racquets',
    brand: 'Babolat',
    sortOrder: 2,
    models: [
      { name: 'Pure Drive', isPopular: true, year: '2021' },
      { name: 'Pure Drive 107', isPopular: false, year: '2021' },
      { name: 'Pure Drive 110', isPopular: false, year: '2021' },
      { name: 'Pure Drive Lite', isPopular: false, year: '2021' },
      { name: 'Pure Drive Team', isPopular: false, year: '2021' },
      { name: 'Pure Aero', isPopular: true, year: '2023' },
      { name: 'Pure Aero 98', isPopular: false, year: '2023' },
      { name: 'Pure Aero Team', isPopular: false, year: '2023' },
      { name: 'Pure Aero Lite', isPopular: false, year: '2023' },
      { name: 'Pure Aero Plus', isPopular: false, year: '2023' },
      { name: 'Pure Aero Rafa', isPopular: true, year: '2023' },
      { name: 'Pure Strike 98', isPopular: true, year: '2022' },
      { name: 'Pure Strike 100', isPopular: false, year: '2022' },
      { name: 'Pure Strike Team', isPopular: false, year: '2022' },
      { name: 'Pure Strike VS', isPopular: false, year: '2022' },
      { name: 'Pure Control 95', isPopular: false, year: '2020' },
      { name: 'Boost Drive', isPopular: false, year: '2023' },
      { name: 'Boost Aero', isPopular: false, year: '2023' }
    ]
  },
  {
    category: 'Racquets',
    brand: 'Head',
    sortOrder: 3,
    models: [
      { name: 'Speed MP', isPopular: true, year: '2023' },
      { name: 'Speed Pro', isPopular: false, year: '2023' },
      { name: 'Speed Team', isPopular: false, year: '2023' },
      { name: 'Speed Lite', isPopular: false, year: '2023' },
      { name: 'Speed S', isPopular: false, year: '2023' },
      { name: 'Radical MP', isPopular: true, year: '2023' },
      { name: 'Radical Pro', isPopular: false, year: '2023' },
      { name: 'Radical Team', isPopular: false, year: '2023' },
      { name: 'Radical S', isPopular: false, year: '2023' },
      { name: 'Prestige MP', isPopular: true, year: '2022' },
      { name: 'Prestige Pro', isPopular: false, year: '2022' },
      { name: 'Prestige Team', isPopular: false, year: '2022' },
      { name: 'Prestige S', isPopular: false, year: '2022' },
      { name: 'Gravity MP', isPopular: true, year: '2023' },
      { name: 'Gravity Pro', isPopular: false, year: '2023' },
      { name: 'Gravity Team', isPopular: false, year: '2023' },
      { name: 'Gravity S', isPopular: false, year: '2023' },
      { name: 'Instinct MP', isPopular: false, year: '2022' },
      { name: 'Instinct Pro', isPopular: false, year: '2022' },
      { name: 'Extreme MP', isPopular: false, year: '2022' },
      { name: 'Extreme Pro', isPopular: false, year: '2022' },
      { name: 'Boom MP', isPopular: false, year: '2023' },
      { name: 'Boom Pro', isPopular: false, year: '2023' }
    ]
  },
  {
    category: 'Racquets',
    brand: 'Yonex',
    sortOrder: 4,
    models: [
      { name: 'EZONE 98', isPopular: true, year: '2022' },
      { name: 'EZONE 100', isPopular: true, year: '2022' },
      { name: 'EZONE 100L', isPopular: false, year: '2022' },
      { name: 'EZONE 98L', isPopular: false, year: '2022' },
      { name: 'EZONE Ace', isPopular: false, year: '2022' },
      { name: 'VCORE 98', isPopular: true, year: '2023' },
      { name: 'VCORE 100', isPopular: false, year: '2023' },
      { name: 'VCORE 100L', isPopular: false, year: '2023' },
      { name: 'VCORE 95', isPopular: false, year: '2023' },
      { name: 'VCORE Pro 97', isPopular: false, year: '2023' },
      { name: 'VCORE Pro 100', isPopular: false, year: '2023' },
      { name: 'Percept 97', isPopular: true, year: '2023' },
      { name: 'Percept 97D', isPopular: false, year: '2023' },
      { name: 'Percept 97L', isPopular: false, year: '2023' },
      { name: 'Astrel 100', isPopular: false, year: '2022' },
      { name: 'Astrel 105', isPopular: false, year: '2022' },
      { name: 'Regna 100', isPopular: false, year: '2022' },
      { name: 'Regna 108', isPopular: false, year: '2022' }
    ]
  },
  {
    category: 'Racquets',
    brand: 'Tecnifibre',
    sortOrder: 5,
    models: [
      { name: 'TFight 315 RS', isPopular: true, year: '2023' },
      { name: 'TFight 300 RS', isPopular: true, year: '2023' },
      { name: 'TFight 305 RS', isPopular: false, year: '2023' },
      { name: 'TFight 315 Ltd', isPopular: false, year: '2023' },
      { name: 'TFight 300 XTC', isPopular: false, year: '2023' },
      { name: 'TF40 315', isPopular: true, year: '2022' },
      { name: 'TF40 300', isPopular: false, year: '2022' },
      { name: 'TF40 305', isPopular: false, year: '2022' },
      { name: 'Tempo 298', isPopular: false, year: '2023' },
      { name: 'Tempo 285', isPopular: false, year: '2023' },
      { name: 'Tour Endurance RS', isPopular: false, year: '2022' },
      { name: 'Tour Endurance', isPopular: false, year: '2022' },
      { name: 'T-Fit 26', isPopular: false, year: '2023' },
      { name: 'T-Fit 25', isPopular: false, year: '2023' }
    ]
  },
  {
    category: 'Racquets',
    brand: 'Prince',
    sortOrder: 6,
    models: [
      { name: 'Textreme Tour 100P', isPopular: false, year: '2021' },
      { name: 'Textreme Tour 95', isPopular: false, year: '2021' },
      { name: 'Textreme Tour 100L', isPopular: false, year: '2021' },
      { name: 'Phantom 100X', isPopular: false, year: '2022' },
      { name: 'Phantom 93P', isPopular: false, year: '2022' },
      { name: 'Phantom 107', isPopular: false, year: '2022' },
      { name: 'Beast 100', isPopular: false, year: '2020' },
      { name: 'Beast 104', isPopular: false, year: '2020' },
      { name: 'Warrior 100', isPopular: false, year: '2021' },
      { name: 'Warrior 107', isPopular: false, year: '2021' },
      { name: 'TXT2 Beast 100', isPopular: false, year: '2019' },
      { name: 'Tour 100P', isPopular: false, year: '2020' }
    ]
  },

  // Strings
  {
    category: 'Strings',
    brand: 'Luxilon',
    sortOrder: 1,
    models: [
      { name: 'ALU Power', isPopular: true },
      { name: 'ALU Power Rough', isPopular: false },
      { name: 'ALU Power 125', isPopular: false },
      { name: 'ALU Power Soft', isPopular: false },
      { name: 'Element', isPopular: true },
      { name: '4G', isPopular: true },
      { name: '4G Rough', isPopular: false },
      { name: '4G Soft', isPopular: false },
      { name: 'Big Banger Original', isPopular: false },
      { name: 'Big Banger Rough', isPopular: false },
      { name: 'Savage', isPopular: true },
      { name: 'Savage Black', isPopular: false },
      { name: 'Natural Gut', isPopular: false },
      { name: 'Adrenaline', isPopular: false },
      { name: 'Resonance', isPopular: false },
      { name: 'M2 Pro', isPopular: false }
    ]
  },
  {
    category: 'Strings',
    brand: 'Wilson',
    sortOrder: 2,
    models: [
      { name: 'Natural Gut', isPopular: true },
      { name: 'Champion\'s Choice', isPopular: true },
      { name: 'Champion\'s Choice Duo', isPopular: false },
      { name: 'Revolve', isPopular: false },
      { name: 'Revolve Twist', isPopular: false },
      { name: 'Sensation', isPopular: false },
      { name: 'Sensation Plus', isPopular: false },
      { name: 'Pro Staff Classic', isPopular: false },
      { name: 'Poly Pro', isPopular: false },
      { name: 'Synthetic Gut Power', isPopular: false },
      { name: 'NXT', isPopular: false },
      { name: 'Multipower', isPopular: false },
      { name: 'Enduro Pro', isPopular: false }
    ]
  },
  {
    category: 'Strings',
    brand: 'Babolat',
    sortOrder: 3,
    models: [
      { name: 'RPM Blast', isPopular: true },
      { name: 'RPM Blast Rough', isPopular: false },
      { name: 'RPM Team', isPopular: false },
      { name: 'RPM Power', isPopular: false },
      { name: 'VS Touch', isPopular: true },
      { name: 'VS Team', isPopular: false },
      { name: 'Xcel', isPopular: false },
      { name: 'Pro Hurricane Tour', isPopular: false },
      { name: 'Pro Last', isPopular: false },
      { name: 'Addiction', isPopular: false },
      { name: 'Origin', isPopular: false },
      { name: 'Synthetic Gut', isPopular: false },
      { name: 'Ballistic', isPopular: false },
      { name: 'SG Spiraltek', isPopular: false }
    ]
  },
  {
    category: 'Strings',
    brand: 'Yonex',
    sortOrder: 4,
    models: [
      { name: 'Poly Tour Pro', isPopular: true },
      { name: 'Poly Tour Strike', isPopular: false },
      { name: 'Poly Tour Spin', isPopular: false },
      { name: 'Poly Tour Rev', isPopular: false },
      { name: 'Multi Sonic', isPopular: false },
      { name: 'Aerobite', isPopular: false },
      { name: 'Tour Super 850', isPopular: false },
      { name: 'Rexis', isPopular: false },
      { name: 'Dynawire', isPopular: false },
      { name: 'BG65', isPopular: false },
      { name: 'BG66 Ultimax', isPopular: false }
    ]
  },
  {
    category: 'Strings',
    brand: 'Solinco',
    sortOrder: 5,
    models: [
      { name: 'Hyper-G', isPopular: true },
      { name: 'Hyper-G Heaven', isPopular: false },
      { name: 'Hyper-G Soft', isPopular: false },
      { name: 'Tour Bite', isPopular: true },
      { name: 'Tour Bite Soft', isPopular: false },
      { name: 'Tour Bite Diamond Rough', isPopular: false },
      { name: 'Confidential', isPopular: false },
      { name: 'Revolution', isPopular: false },
      { name: 'Outlast', isPopular: false },
      { name: 'Vanquish', isPopular: false },
      { name: 'Barb Wire', isPopular: false },
      { name: 'X-Natural', isPopular: false }
    ]
  },
  {
    category: 'Strings',
    brand: 'Tecnifibre',
    sortOrder: 6,
    models: [
      { name: 'Razor Code', isPopular: true },
      { name: 'Black Code', isPopular: true },
      { name: 'Pro RedCode', isPopular: false },
      { name: 'Ice Code', isPopular: false },
      { name: 'Synthetic Gut', isPopular: false },
      { name: 'Multi-Feel', isPopular: false },
      { name: 'X-One Biphase', isPopular: false },
      { name: 'Duramix HD', isPopular: false },
      { name: '305 Green', isPopular: false }
    ]
  },
  {
    category: 'Strings',
    brand: 'Kirschbaum',
    sortOrder: 7,
    models: [
      { name: 'Pro Line II', isPopular: true },
      { name: 'Pro Line Evolution', isPopular: false },
      { name: 'Max Power', isPopular: false },
      { name: 'Competition', isPopular: false },
      { name: 'Super Smash', isPopular: false },
      { name: 'Helix', isPopular: false }
    ]
  },

  // Shoes
  {
    category: 'Shoes',
    brand: 'Nike',
    sortOrder: 1,
    models: [
      { name: 'Court Air Zoom Vapor Cage 4', isPopular: true },
      { name: 'Court Air Zoom Vapor Pro', isPopular: false },
      { name: 'Court Air Zoom Zero', isPopular: true },
      { name: 'Court Air Zoom NXT', isPopular: false },
      { name: 'Court Lite 2', isPopular: false },
      { name: 'Court Lite 3', isPopular: false },
      { name: 'Air Max Wildcard', isPopular: false },
      { name: 'Court Vision Low', isPopular: false },
      { name: 'Court Borough Low', isPopular: false },
      { name: 'Court Legacy', isPopular: false },
      { name: 'Air Zoom Prestige', isPopular: false },
      { name: 'React Vapor NXT', isPopular: false }
    ]
  },
  {
    category: 'Shoes',
    brand: 'Adidas',
    sortOrder: 2,
    models: [
      { name: 'Adizero Ubersonic 4', isPopular: true },
      { name: 'Adizero Ubersonic 4.1', isPopular: false },
      { name: 'CourtJam Bounce', isPopular: true },
      { name: 'CourtJam Control', isPopular: false },
      { name: 'GameCourt', isPopular: false },
      { name: 'GameCourt 2.0', isPopular: false },
      { name: 'SoleCourt Boost', isPopular: false },
      { name: 'Barricade', isPopular: true },
      { name: 'Barricade 13', isPopular: false },
      { name: 'Stycon', isPopular: false },
      { name: 'Defiant Speed', isPopular: false },
      { name: 'Approach', isPopular: false }
    ]
  },
  {
    category: 'Shoes',
    brand: 'Asics',
    sortOrder: 3,
    models: [
      { name: 'Gel-Resolution 8', isPopular: true },
      { name: 'Gel-Resolution 9', isPopular: true },
      { name: 'Gel-Court FF 2', isPopular: true },
      { name: 'Gel-Court FF 3', isPopular: false },
      { name: 'Solution Speed FF', isPopular: false },
      { name: 'Solution Speed FF 2', isPopular: false },
      { name: 'Gel-Dedicate 7', isPopular: false },
      { name: 'Gel-Game 8', isPopular: false },
      { name: 'Court Control FF', isPopular: false },
      { name: 'Gel-Challenger 13', isPopular: false },
      { name: 'Upcourt 4', isPopular: false }
    ]
  },
  {
    category: 'Shoes',
    brand: 'New Balance',
    sortOrder: 4,
    models: [
      { name: 'FuelCell 996v4', isPopular: true },
      { name: 'FuelCell 996v5', isPopular: false },
      { name: 'Fresh Foam LAV', isPopular: false },
      { name: 'Fresh Foam Lav v2', isPopular: false },
      { name: '996v3', isPopular: false },
      { name: 'MC806', isPopular: false },
      { name: 'MC696v4', isPopular: false },
      { name: '60v1', isPopular: false }
    ]
  },
  {
    category: 'Shoes',
    brand: 'K-Swiss',
    sortOrder: 5,
    models: [
      { name: 'Hypercourt Express 2', isPopular: true },
      { name: 'Hypercourt Supreme', isPopular: false },
      { name: 'Bigshot Light 3', isPopular: false },
      { name: 'Bigshot Light 4', isPopular: false },
      { name: 'Ultrashot 3', isPopular: false },
      { name: 'Court Express', isPopular: false },
      { name: 'Aero Court', isPopular: false },
      { name: 'Performance Trainer', isPopular: false }
    ]
  },
  {
    category: 'Shoes',
    brand: 'Wilson',
    sortOrder: 6,
    models: [
      { name: 'Kaos Swift', isPopular: true },
      { name: 'Kaos 3.0', isPopular: false },
      { name: 'Rush Pro 3.5', isPopular: false },
      { name: 'Rush Pro 4.0', isPopular: false },
      { name: 'Amplifeel 2.0', isPopular: false },
      { name: 'Court Zone', isPopular: false }
    ]
  },

  // Bags
  {
    category: 'Bags',
    brand: 'Wilson',
    sortOrder: 1,
    models: [
      { name: 'Pro Staff 6 Pack', isPopular: true },
      { name: 'Tour 6 Pack', isPopular: false },
      { name: 'Clash 6 Pack', isPopular: true },
      { name: 'Super Tour 3 Comp', isPopular: false },
      { name: 'Team Backpack', isPopular: false }
    ]
  },
  {
    category: 'Bags',
    brand: 'Babolat',
    sortOrder: 2,
    models: [
      { name: 'Pure 6 Pack', isPopular: true },
      { name: 'Pure 12 Pack', isPopular: false },
      { name: 'Pure 3 Pack', isPopular: false },
      { name: 'Team Backpack', isPopular: false }
    ]
  },
  {
    category: 'Bags',
    brand: 'Head',
    sortOrder: 3,
    models: [
      { name: 'Tour Team 6R Combi', isPopular: true },
      { name: 'Tour Team 12R Monstercombi', isPopular: false },
      { name: 'Speed 6R Combi', isPopular: false },
      { name: 'Gravity 6R Combi', isPopular: false }
    ]
  },
  {
    category: 'Bags',
    brand: 'Yonex',
    sortOrder: 4,
    models: [
      { name: 'Pro 6 Pack', isPopular: true },
      { name: 'Tournament 6 Pack', isPopular: false },
      { name: 'Team 3 Pack', isPopular: false }
    ]
  },

  // Apparel
  {
    category: 'Apparel',
    brand: 'Nike',
    sortOrder: 1,
    models: [
      { name: 'Court Dri-FIT Polo', isPopular: true },
      { name: 'Court Dri-FIT Shorts', isPopular: true },
      { name: 'Court Victory Skirt', isPopular: true },
      { name: 'Court Tank Top', isPopular: false },
      { name: 'Court Hoodie', isPopular: false }
    ]
  },
  {
    category: 'Apparel',
    brand: 'Adidas',
    sortOrder: 2,
    models: [
      { name: 'Club 3-Stripes Polo', isPopular: true },
      { name: 'Ergo 7-inch Shorts', isPopular: true },
      { name: 'Club Skirt', isPopular: false },
      { name: 'Match Tank', isPopular: false }
    ]
  },
  {
    category: 'Apparel',
    brand: 'Wilson',
    sortOrder: 3,
    models: [
      { name: 'Team Polo', isPopular: false },
      { name: 'Team Shorts', isPopular: false },
      { name: 'Competition Seamless Tank', isPopular: false }
    ]
  },
  {
    category: 'Apparel',
    brand: 'Under Armour',
    sortOrder: 4,
    models: [
      { name: 'Performance Polo 2.0', isPopular: true },
      { name: 'Launch SW 7-inch Shorts', isPopular: false },
      { name: 'Iso-Chill Tank', isPopular: false }
    ]
  },

  // Accessories
  {
    category: 'Accessories',
    brand: 'Wilson',
    sortOrder: 1,
    models: [
      { name: 'Pro Overgrip', isPopular: true },
      { name: 'Comfort Hybrid Grip', isPopular: false },
      { name: 'Vibration Dampener', isPopular: true },
      { name: 'String Savers', isPopular: false }
    ]
  },
  {
    category: 'Accessories',
    brand: 'Babolat',
    sortOrder: 2,
    models: [
      { name: 'VS Original Overgrip', isPopular: true },
      { name: 'My Overgrip', isPopular: false },
      { name: 'Custom Dampener', isPopular: false },
      { name: 'Loony Dampener', isPopular: false }
    ]
  },
  {
    category: 'Accessories',
    brand: 'Head',
    sortOrder: 3,
    models: [
      { name: 'Super Comp Overgrip', isPopular: true },
      { name: 'Prestige Pro Overgrip', isPopular: false },
      { name: 'Djokovic Dampener', isPopular: false }
    ]
  },
  {
    category: 'Accessories',
    brand: 'Yonex',
    sortOrder: 4,
    models: [
      { name: 'Super Grap Overgrip', isPopular: true },
      { name: 'AC102EX Overgrip', isPopular: false },
      { name: 'Vibration Stopper', isPopular: false }
    ]
  },

  // Balls
  {
    category: 'Balls',
    brand: 'Wilson',
    sortOrder: 1,
    models: [
      { name: 'US Open Tennis Balls', isPopular: true },
      { name: 'Championship Tennis Balls', isPopular: true },
      { name: 'Tour Premier Tennis Balls', isPopular: false },
      { name: 'Starter Tennis Balls', isPopular: false }
    ]
  },
  {
    category: 'Balls',
    brand: 'Penn',
    sortOrder: 2,
    models: [
      { name: 'Championship Tennis Balls', isPopular: true },
      { name: 'Pro Marathon Tennis Balls', isPopular: false },
      { name: 'Tribute Tennis Balls', isPopular: false }
    ]
  },
  {
    category: 'Balls',
    brand: 'Dunlop',
    sortOrder: 3,
    models: [
      { name: 'Australian Open Tennis Balls', isPopular: true },
      { name: 'Championship Tennis Balls', isPopular: false },
      { name: 'Fort Tennis Balls', isPopular: false }
    ]
  },
  {
    category: 'Balls',
    brand: 'Babolat',
    sortOrder: 4,
    models: [
      { name: 'French Open Tennis Balls', isPopular: true },
      { name: 'Championship Tennis Balls', isPopular: false },
      { name: 'Gold Tennis Balls', isPopular: false }
    ]
  },

  // Pickleball Paddles
  {
    category: 'Pickleball Paddles',
    brand: 'JOOLA',
    sortOrder: 1,
    models: [
      { name: 'Ben Johns Hyperion CFS', isPopular: true, year: '2023' },
      { name: 'Ben Johns Perseus CFS', isPopular: true, year: '2023' },
      { name: 'Vision CGS', isPopular: false, year: '2023' },
      { name: 'Radius CGS', isPopular: false, year: '2022' },
      { name: 'Solaire CFS', isPopular: false, year: '2023' },
      { name: 'Essentials', isPopular: false, year: '2022' }
    ]
  },
  {
    category: 'Pickleball Paddles',
    brand: 'Selkirk',
    sortOrder: 2,
    models: [
      { name: 'LUXX Control Air Invikta', isPopular: true, year: '2023' },
      { name: 'LUXX Control Air Epic', isPopular: false, year: '2023' },
      { name: 'Vanguard Power Air Invikta', isPopular: true, year: '2023' },
      { name: 'Vanguard Power Air Epic', isPopular: false, year: '2023' },
      { name: 'SLK Halo Control', isPopular: false, year: '2022' },
      { name: 'SLK Halo Power', isPopular: false, year: '2022' },
      { name: 'Amped Invikta', isPopular: false, year: '2021' },
      { name: 'Amped Epic', isPopular: false, year: '2021' }
    ]
  },
  {
    category: 'Pickleball Paddles',
    brand: 'Paddletek',
    sortOrder: 3,
    models: [
      { name: 'Bantam TS-5 Pro', isPopular: true, year: '2023' },
      { name: 'Bantam EX-L Pro', isPopular: false, year: '2023' },
      { name: 'Tempest Wave Pro', isPopular: true, year: '2022' },
      { name: 'Tempest Wave II', isPopular: false, year: '2022' },
      { name: 'Phoenix LTE', isPopular: false, year: '2021' },
      { name: 'Phoenix Pro', isPopular: false, year: '2021' }
    ]
  },
  {
    category: 'Pickleball Paddles',
    brand: 'HEAD',
    sortOrder: 4,
    models: [
      { name: 'Radical Elite', isPopular: true, year: '2023' },
      { name: 'Radical Tour', isPopular: false, year: '2023' },
      { name: 'Extreme Elite', isPopular: false, year: '2023' },
      { name: 'Extreme Tour', isPopular: false, year: '2023' },
      { name: 'Gravity', isPopular: false, year: '2022' },
      { name: 'Speed', isPopular: false, year: '2022' }
    ]
  },
  {
    category: 'Pickleball Paddles',
    brand: 'Engage',
    sortOrder: 5,
    models: [
      { name: 'Pursuit MX 6.0', isPopular: true, year: '2023' },
      { name: 'Pursuit EX 6.0', isPopular: false, year: '2023' },
      { name: 'Elite Pro Maverick', isPopular: true, year: '2022' },
      { name: 'Elite Pro Encore', isPopular: false, year: '2022' },
      { name: 'Poach Advantage', isPopular: false, year: '2021' },
      { name: 'Poach Icon', isPopular: false, year: '2021' }
    ]
  },
  {
    category: 'Pickleball Paddles',
    brand: 'Babolat',
    sortOrder: 6,
    models: [
      { name: 'RNGD Power', isPopular: false, year: '2023' },
      { name: 'RNGD Touch', isPopular: false, year: '2023' },
      { name: 'MNSTR Power', isPopular: false, year: '2022' },
      { name: 'MNSTR Touch', isPopular: false, year: '2022' }
    ]
  },
  {
    category: 'Pickleball Paddles',
    brand: 'Wilson',
    sortOrder: 7,
    models: [
      { name: 'Surge Pro', isPopular: false, year: '2023' },
      { name: 'Blaze Pro', isPopular: false, year: '2023' },
      { name: 'Energy Pro', isPopular: false, year: '2022' },
      { name: 'Clash', isPopular: false, year: '2022' }
    ]
  },
  {
    category: 'Pickleball Paddles',
    brand: 'Prince',
    sortOrder: 8,
    models: [
      { name: 'Response Pro', isPopular: false, year: '2023' },
      { name: 'Spectrum Pro', isPopular: false, year: '2023' },
      { name: 'Legacy Pro', isPopular: false, year: '2022' }
    ]
  },
  {
    category: 'Pickleball Paddles',
    brand: 'Onix',
    sortOrder: 9,
    models: [
      { name: 'Z5 Graphite', isPopular: true, year: '2022' },
      { name: 'Evoke Premier', isPopular: false, year: '2023' },
      { name: 'Evoke Pro', isPopular: false, year: '2022' },
      { name: 'Stryker 4', isPopular: false, year: '2021' },
      { name: 'React', isPopular: false, year: '2021' }
    ]
  },

  // Pickleball Balls
  {
    category: 'Pickleball Balls',
    brand: 'Dura',
    sortOrder: 1,
    models: [
      { name: 'Fast 40 Outdoor', isPopular: true },
      { name: 'Big Hole Outdoor', isPopular: false },
      { name: 'Competition 74', isPopular: false }
    ]
  },
  {
    category: 'Pickleball Balls',
    brand: 'Franklin',
    sortOrder: 2,
    models: [
      { name: 'X-40 Performance Outdoor', isPopular: true },
      { name: 'X-40 Competition Indoor', isPopular: true },
      { name: 'Pro Tournament', isPopular: false },
      { name: 'Recreational', isPopular: false }
    ]
  },
  {
    category: 'Pickleball Balls',
    brand: 'Onix',
    sortOrder: 3,
    models: [
      { name: 'Fuse G2 Outdoor', isPopular: true },
      { name: 'Fuse Indoor', isPopular: true },
      { name: 'Pure 2 Outdoor', isPopular: false },
      { name: 'Pure 2 Indoor', isPopular: false }
    ]
  },
  {
    category: 'Pickleball Balls',
    brand: 'Penn',
    sortOrder: 4,
    models: [
      { name: '40 Outdoor', isPopular: false },
      { name: '26 Indoor', isPopular: false }
    ]
  },
  {
    category: 'Pickleball Balls',
    brand: 'Wilson',
    sortOrder: 5,
    models: [
      { name: 'FUSE Outdoor', isPopular: false },
      { name: 'Tournament Select', isPopular: false }
    ]
  },
  {
    category: 'Pickleball Balls',
    brand: 'HEAD',
    sortOrder: 6,
    models: [
      { name: 'Tour Outdoor', isPopular: false },
      { name: 'Pro Indoor', isPopular: false }
    ]
  }
];

const seedBrandModels = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tennis-marketplace';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await BrandModel.deleteMany({});
    console.log('🗑️  Cleared existing brand model data');

    // Insert seed data
    await BrandModel.insertMany(seedData);
    console.log(`✅ Successfully seeded ${seedData.length} brand records`);

    // Log summary
    const summary = {};
    seedData.forEach(item => {
      if (!summary[item.category]) summary[item.category] = 0;
      summary[item.category] += item.models.length;
    });

    console.log('\n📊 Seeding Summary:');
    Object.entries(summary).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} models across multiple brands`);
    });

    // Test a query
    const racquetBrands = await BrandModel.getBrandsByCategory('Racquets');
    console.log(`\n🔍 Test Query - Racquet brands: ${racquetBrands.map(b => b.brand).join(', ')}`);

    const wilsonRacquets = await BrandModel.getModelsByBrand('Racquets', 'Wilson');
    console.log(`🔍 Test Query - Wilson racquet models: ${wilsonRacquets.models.map(m => m.name).join(', ')}`);

  } catch (error) {
    console.error('❌ Error seeding brand models:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  }
};

seedBrandModels();