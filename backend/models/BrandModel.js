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

const BrandModel = mongoose.model('BrandModel', brandModelSchema);

export default BrandModel;