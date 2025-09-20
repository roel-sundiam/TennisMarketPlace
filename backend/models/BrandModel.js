import mongoose from 'mongoose';

const brandModelSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['Racquets', 'Pickleball Paddles', 'Strings', 'Bags', 'Balls', 'Pickleball Balls', 'Shoes', 'Apparel', 'Accessories']
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  models: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    isPopular: {
      type: Boolean,
      default: false
    },
    discontinued: {
      type: Boolean,
      default: false
    },
    year: {
      type: String,
      required: false
    },
    // Equipment-specific specifications
    specifications: {
      // Pickleball paddle specifications
      weight: {
        type: String,
        required: false,
        enum: ['7.0-7.5oz', '7.5-8.0oz', '8.0-8.5oz', '8.5oz+', 'Unknown']
      },
      gripSize: {
        type: String,
        required: false,
        enum: ['4"', '4 1/8"', '4 1/4"', '4 3/8"', '4 1/2"', 'Unknown']
      },
      paddleType: {
        type: String,
        required: false,
        enum: ['Control', 'Power', 'All-Around', 'Hybrid', 'Unknown']
      },
      surface: {
        type: String,
        required: false,
        enum: ['Smooth', 'Textured', 'Gritty', 'Hybrid', 'Unknown']
      },
      coreType: {
        type: String,
        required: false,
        enum: ['Polymer', 'Nomex', 'Aluminum', 'Hybrid', 'Unknown']
      },
      shape: {
        type: String,
        required: false,
        enum: ['Traditional', 'Elongated', 'Wide Body', 'Hybrid', 'Unknown']
      },
      usapaApproved: {
        type: Boolean,
        default: true
      },
      indoorOutdoor: {
        type: String,
        required: false,
        enum: ['Indoor', 'Outdoor', 'Both', 'Unknown']
      },

      // Tennis racket specifications
      headSize: {
        type: String,
        required: false,
        enum: ['85 sq in', '90 sq in', '95 sq in', '97 sq in', '98 sq in', '100 sq in', '102 sq in', '104 sq in', '105 sq in', '107 sq in', '110 sq in', '115 sq in', 'Unknown']
      },
      racketWeight: {
        type: String,
        required: false,
        enum: ['260g', '270g', '280g', '290g', '295g', '300g', '305g', '310g', '315g', '320g', '325g', '330g', '335g', '340g', '345g', 'Unknown']
      },
      stringPattern: {
        type: String,
        required: false,
        enum: ['16x19', '16x20', '18x20', '18x19', '14x18', 'Unknown']
      },
      balance: {
        type: String,
        required: false,
        enum: ['Head Light', 'Even Balance', 'Head Heavy', 'Unknown']
      },
      stiffness: {
        type: String,
        required: false,
        enum: ['Flexible (50-59)', 'Medium (60-69)', 'Stiff (70+)', 'Unknown']
      },
      swingWeight: {
        type: String,
        required: false,
        enum: ['310', '315', '320', '325', '330', '335', '340', '345', '350', 'Unknown']
      },
      playerLevel: {
        type: String,
        required: false,
        enum: ['Beginner', 'Intermediate', 'Advanced', 'Professional', 'Unknown']
      },
      playStyle: {
        type: String,
        required: false,
        enum: ['Baseline', 'All-Court', 'Serve & Volley', 'Aggressive', 'Defensive', 'Unknown']
      }
    }
  }],
  logo: {
    type: String,
    required: false
  },
  website: {
    type: String,
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for faster queries
brandModelSchema.index({ category: 1, brand: 1 });
brandModelSchema.index({ category: 1, sortOrder: 1, brand: 1 });
brandModelSchema.index({ brand: 1 });
brandModelSchema.index({ 'models.name': 1 });
// Pickleball-specific indexes
brandModelSchema.index({ 'models.specifications.paddleType': 1 });
brandModelSchema.index({ 'models.specifications.weight': 1 });
brandModelSchema.index({ 'models.specifications.surface': 1 });
brandModelSchema.index({ 'models.specifications.usapaApproved': 1 });
// Tennis racket-specific indexes
brandModelSchema.index({ 'models.specifications.headSize': 1 });
brandModelSchema.index({ 'models.specifications.racketWeight': 1 });
brandModelSchema.index({ 'models.specifications.stringPattern': 1 });
brandModelSchema.index({ 'models.specifications.balance': 1 });
brandModelSchema.index({ 'models.specifications.stiffness': 1 });
brandModelSchema.index({ 'models.specifications.playerLevel': 1 });
brandModelSchema.index({ 'models.specifications.playStyle': 1 });

// Static method to get brands by category
brandModelSchema.statics.getBrandsByCategory = function(category) {
  return this.find({ 
    category: category, 
    isActive: true 
  })
  .select('brand logo sortOrder')
  .sort({ sortOrder: 1, brand: 1 });
};

// Static method to get models by brand and category
brandModelSchema.statics.getModelsByBrand = function(category, brand) {
  return this.findOne({ 
    category: category, 
    brand: brand,
    isActive: true 
  })
  .select('models');
};

// Static method to get all brands for dropdown population
brandModelSchema.statics.getAllBrandsGrouped = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$category',
        brands: {
          $push: {
            brand: '$brand',
            logo: '$logo',
            sortOrder: '$sortOrder'
          }
        }
      }
    },
    {
      $project: {
        category: '$_id',
        brands: {
          $sortArray: {
            input: '$brands',
            sortBy: { sortOrder: 1, brand: 1 }
          }
        }
      }
    }
  ]);
};

// Method to add a new model to existing brand
brandModelSchema.methods.addModel = function(modelName, isPopular = false, year = null) {
  // Check if model already exists
  const existingModel = this.models.find(m => m.name === modelName);
  if (existingModel) {
    return false; // Model already exists
  }
  
  this.models.push({
    name: modelName,
    isPopular: isPopular,
    year: year
  });
  
  return true;
};

// Method to remove a model
brandModelSchema.methods.removeModel = function(modelName) {
  const modelIndex = this.models.findIndex(m => m.name === modelName);
  if (modelIndex > -1) {
    this.models.splice(modelIndex, 1);
    return true;
  }
  return false;
};

// Advanced search method for pickleball paddles with specifications
brandModelSchema.statics.searchPickleballPaddles = function(filters = {}) {
  const match = {
    category: 'Pickleball Paddles',
    isActive: true
  };

  const pipeline = [
    { $match: match },
    { $unwind: '$models' },
    { $match: { 'models.discontinued': { $ne: true } } }
  ];

  // Add specification filters
  if (filters.paddleType) {
    pipeline.push({ $match: { 'models.specifications.paddleType': filters.paddleType } });
  }
  if (filters.weight) {
    pipeline.push({ $match: { 'models.specifications.weight': filters.weight } });
  }
  if (filters.surface) {
    pipeline.push({ $match: { 'models.specifications.surface': filters.surface } });
  }
  if (filters.gripSize) {
    pipeline.push({ $match: { 'models.specifications.gripSize': filters.gripSize } });
  }
  if (filters.coreType) {
    pipeline.push({ $match: { 'models.specifications.coreType': filters.coreType } });
  }
  if (filters.usapaApproved !== undefined) {
    pipeline.push({ $match: { 'models.specifications.usapaApproved': filters.usapaApproved } });
  }

  // Group back and sort
  pipeline.push(
    {
      $group: {
        _id: '$_id',
        brand: { $first: '$brand' },
        sortOrder: { $first: '$sortOrder' },
        logo: { $first: '$logo' },
        models: { $push: '$models' }
      }
    },
    {
      $sort: { sortOrder: 1, brand: 1 }
    },
    {
      $project: {
        brand: 1,
        logo: 1,
        sortOrder: 1,
        models: {
          $sortArray: {
            input: '$models',
            sortBy: { isPopular: -1, name: 1 }
          }
        }
      }
    }
  );

  return this.aggregate(pipeline);
};

// Get unique specification values for filtering UI
brandModelSchema.statics.getPickleballSpecifications = function() {
  return this.aggregate([
    { $match: { category: 'Pickleball Paddles', isActive: true } },
    { $unwind: '$models' },
    { $match: { 'models.discontinued': { $ne: true } } },
    {
      $group: {
        _id: null,
        paddleTypes: { $addToSet: '$models.specifications.paddleType' },
        weights: { $addToSet: '$models.specifications.weight' },
        surfaces: { $addToSet: '$models.specifications.surface' },
        gripSizes: { $addToSet: '$models.specifications.gripSize' },
        coreTypes: { $addToSet: '$models.specifications.coreType' },
        shapes: { $addToSet: '$models.specifications.shape' }
      }
    },
    {
      $project: {
        _id: 0,
        paddleTypes: { $filter: { input: '$paddleTypes', cond: { $ne: ['$$this', 'Unknown'] } } },
        weights: { $filter: { input: '$weights', cond: { $ne: ['$$this', 'Unknown'] } } },
        surfaces: { $filter: { input: '$surfaces', cond: { $ne: ['$$this', 'Unknown'] } } },
        gripSizes: { $filter: { input: '$gripSizes', cond: { $ne: ['$$this', 'Unknown'] } } },
        coreTypes: { $filter: { input: '$coreTypes', cond: { $ne: ['$$this', 'Unknown'] } } },
        shapes: { $filter: { input: '$shapes', cond: { $ne: ['$$this', 'Unknown'] } } }
      }
    }
  ]);
};

// Advanced search method for tennis rackets with specifications
brandModelSchema.statics.searchTennisRackets = function(filters = {}) {
  const match = {
    category: 'Racquets',
    isActive: true
  };

  const pipeline = [
    { $match: match },
    { $unwind: '$models' },
    { $match: { 'models.discontinued': { $ne: true } } }
  ];

  // Add specification filters
  if (filters.headSize) {
    pipeline.push({ $match: { 'models.specifications.headSize': filters.headSize } });
  }
  if (filters.racketWeight) {
    pipeline.push({ $match: { 'models.specifications.racketWeight': filters.racketWeight } });
  }
  if (filters.stringPattern) {
    pipeline.push({ $match: { 'models.specifications.stringPattern': filters.stringPattern } });
  }
  if (filters.balance) {
    pipeline.push({ $match: { 'models.specifications.balance': filters.balance } });
  }
  if (filters.stiffness) {
    pipeline.push({ $match: { 'models.specifications.stiffness': filters.stiffness } });
  }
  if (filters.swingWeight) {
    pipeline.push({ $match: { 'models.specifications.swingWeight': filters.swingWeight } });
  }
  if (filters.playerLevel) {
    pipeline.push({ $match: { 'models.specifications.playerLevel': filters.playerLevel } });
  }
  if (filters.playStyle) {
    pipeline.push({ $match: { 'models.specifications.playStyle': filters.playStyle } });
  }

  // Group back and sort
  pipeline.push(
    {
      $group: {
        _id: '$_id',
        brand: { $first: '$brand' },
        sortOrder: { $first: '$sortOrder' },
        logo: { $first: '$logo' },
        models: { $push: '$models' }
      }
    },
    {
      $sort: { sortOrder: 1, brand: 1 }
    },
    {
      $project: {
        brand: 1,
        logo: 1,
        sortOrder: 1,
        models: {
          $sortArray: {
            input: '$models',
            sortBy: { isPopular: -1, name: 1 }
          }
        }
      }
    }
  );

  return this.aggregate(pipeline);
};

// Get unique tennis racket specification values for filtering UI
brandModelSchema.statics.getTennisRacketSpecifications = function() {
  return this.aggregate([
    { $match: { category: 'Racquets', isActive: true } },
    { $unwind: '$models' },
    { $match: { 'models.discontinued': { $ne: true } } },
    {
      $group: {
        _id: null,
        headSizes: { $addToSet: '$models.specifications.headSize' },
        racketWeights: { $addToSet: '$models.specifications.racketWeight' },
        stringPatterns: { $addToSet: '$models.specifications.stringPattern' },
        balances: { $addToSet: '$models.specifications.balance' },
        stiffnesses: { $addToSet: '$models.specifications.stiffness' },
        swingWeights: { $addToSet: '$models.specifications.swingWeight' },
        playerLevels: { $addToSet: '$models.specifications.playerLevel' },
        playStyles: { $addToSet: '$models.specifications.playStyle' }
      }
    },
    {
      $project: {
        _id: 0,
        headSizes: { $filter: { input: '$headSizes', cond: { $ne: ['$$this', 'Unknown'] } } },
        racketWeights: { $filter: { input: '$racketWeights', cond: { $ne: ['$$this', 'Unknown'] } } },
        stringPatterns: { $filter: { input: '$stringPatterns', cond: { $ne: ['$$this', 'Unknown'] } } },
        balances: { $filter: { input: '$balances', cond: { $ne: ['$$this', 'Unknown'] } } },
        stiffnesses: { $filter: { input: '$stiffnesses', cond: { $ne: ['$$this', 'Unknown'] } } },
        swingWeights: { $filter: { input: '$swingWeights', cond: { $ne: ['$$this', 'Unknown'] } } },
        playerLevels: { $filter: { input: '$playerLevels', cond: { $ne: ['$$this', 'Unknown'] } } },
        playStyles: { $filter: { input: '$playStyles', cond: { $ne: ['$$this', 'Unknown'] } } }
      }
    }
  ]);
};

const BrandModel = mongoose.model('BrandModel', brandModelSchema);

export default BrandModel;