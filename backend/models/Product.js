import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    max: 1000000
  },
  category: {
    type: String,
    required: true,
    enum: ['Racquets', 'Strings', 'Bags', 'Balls', 'Shoes', 'Apparel', 'Accessories']
  },
  subcategory: {
    type: String,
    required: false
  },
  condition: {
    type: String,
    required: true,
    enum: ['New', 'Like New', 'Excellent', 'Good', 'Fair']
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: false,
    trim: true
  },
  specifications: {
    // For racquets
    weight: { type: String },
    headSize: { type: String },
    stringPattern: { type: String },
    gripSize: { type: String },
    
    // For strings
    gauge: { type: String },
    length: { type: String },
    material: { type: String },
    
    // For shoes
    size: { type: String },
    width: { type: String },
    
    // For apparel
    clothingSize: { type: String },
    color: { type: String },
    
    // General
    year: { type: String }
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    },
    isMain: {
      type: Boolean,
      default: false
    }
  }],
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    city: {
      type: String,
      required: true
    },
    region: {
      type: String,
      required: true
    },
    meetupLocations: [{
      type: String
    }]
  },
  availability: {
    type: String,
    enum: ['available', 'pending', 'sold', 'reserved'],
    default: 'available'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  views: {
    type: Number,
    default: 0
  },
  favorites: {
    type: Number,
    default: 0
  },
  isBoosted: {
    type: Boolean,
    default: false
  },
  boostExpiresAt: {
    type: Date,
    default: null
  },
  isApproved: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvalNotes: {
    type: String,
    default: ''
  },
  negotiable: {
    type: Boolean,
    default: false
  },
  shippingOptions: {
    meetup: { type: Boolean, default: true },
    delivery: { type: Boolean, default: false },
    shipping: { type: Boolean, default: false }
  },
  reasonForSelling: {
    type: String,
    maxlength: 500
  },
  saleStatus: {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    confirmedBySeller: {
      type: Boolean,
      default: false
    },
    confirmedByBuyer: {
      type: Boolean,
      default: false
    },
    saleInitiatedAt: {
      type: Date,
      default: null
    },
    saleCompletedAt: {
      type: Date,
      default: null
    },
    coinsAwarded: {
      type: Boolean,
      default: false
    },
    soldAt: {
      type: Date,
      default: null
    },
    soldBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    saleMethod: {
      type: String,
      enum: ['buyer_confirmed', 'seller_marked', 'admin_marked'],
      default: null
    },
    transactionFeeApplied: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Indexes for faster queries
productSchema.index({ category: 1, availability: 1 });
productSchema.index({ seller: 1 });
productSchema.index({ 'location.city': 1 });
productSchema.index({ price: 1 });
productSchema.index({ isBoosted: -1, createdAt: -1 });
productSchema.index({ isApproved: 1 });
productSchema.index({ title: 'text', description: 'text', brand: 'text' });

// Virtual for main image
productSchema.virtual('mainImage').get(function() {
  const mainImg = this.images.find(img => img.isMain);
  return mainImg || this.images[0] || null;
});

// Method to boost listing
productSchema.methods.boostListing = function(duration = 7) {
  this.isBoosted = true;
  this.boostExpiresAt = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
};

// Method to check if boost is expired
productSchema.methods.isBoostedAndActive = function() {
  if (!this.isBoosted) return false;
  if (!this.boostExpiresAt) return true;
  return new Date() < this.boostExpiresAt;
};

// Method to increment views
productSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save({ validateBeforeSave: false });
};

// Method to initiate sale
productSchema.methods.initiateSale = function(buyerId) {
  this.saleStatus.buyer = buyerId;
  this.saleStatus.confirmedBySeller = true;
  this.saleStatus.saleInitiatedAt = new Date();
  this.availability = 'pending';
  return this.save();
};

// Method to confirm sale by buyer
productSchema.methods.confirmSaleBuyer = function() {
  if (!this.saleStatus.confirmedBySeller) {
    throw new Error('Sale not initiated by seller');
  }
  this.saleStatus.confirmedByBuyer = true;
  this.saleStatus.saleCompletedAt = new Date();
  this.availability = 'sold';
  return this.save();
};

// Method to check if sale is completed
productSchema.methods.isSaleCompleted = function() {
  return this.saleStatus.confirmedBySeller && this.saleStatus.confirmedByBuyer;
};

// Method to cancel sale
productSchema.methods.cancelSale = function() {
  this.saleStatus = {
    buyer: null,
    confirmedBySeller: false,
    confirmedByBuyer: false,
    saleInitiatedAt: null,
    saleCompletedAt: null,
    coinsAwarded: false,
    soldAt: null,
    soldBy: null,
    saleMethod: null,
    transactionFeeApplied: false
  };
  this.availability = 'available';
  return this.save();
};

// Method to mark product as sold (by seller or admin)
productSchema.methods.markAsSold = function(soldByUserId, saleMethod = 'seller_marked') {
  if (this.availability === 'sold') {
    throw new Error('Product is already marked as sold');
  }
  
  this.saleStatus.soldAt = new Date();
  this.saleStatus.soldBy = soldByUserId;
  this.saleStatus.saleMethod = saleMethod;
  this.saleStatus.saleCompletedAt = new Date();
  this.availability = 'sold';
  
  return this.save();
};

// Pre-save middleware to handle boost expiration
productSchema.pre('save', function(next) {
  if (this.isBoosted && this.boostExpiresAt && new Date() > this.boostExpiresAt) {
    this.isBoosted = false;
    this.boostExpiresAt = null;
  }
  next();
});

// Transform image URLs on JSON serialization
productSchema.set('toJSON', {
  transform: function(doc, ret) {
    // Transform relative URLs to full URLs for frontend consumption
    if (ret.images && Array.isArray(ret.images)) {
      ret.images = ret.images.map(img => {
        if (img.url && img.url.startsWith('/uploads/')) {
          // Convert relative URL to full URL
          const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
          return { ...img, url: `${baseUrl}${img.url}` };
        }
        return img;
      });
    }
    
    // Also transform the mainImage virtual if it exists
    if (ret.mainImage && ret.mainImage.url && ret.mainImage.url.startsWith('/uploads/')) {
      const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
      ret.mainImage.url = `${baseUrl}${ret.mainImage.url}`;
    }
    
    return ret;
  }
});

// Static method to get products with filters
productSchema.statics.getFiltered = function(filters = {}) {
  const query = { isApproved: 'approved', availability: 'available' };
  
  if (filters.category && filters.category !== 'All') {
    query.category = filters.category;
  }
  
  if (filters.condition && filters.condition.length > 0) {
    query.condition = { $in: filters.condition };
  }
  
  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    query.price = {};
    if (filters.priceMin !== undefined) query.price.$gte = filters.priceMin;
    if (filters.priceMax !== undefined) query.price.$lte = filters.priceMax;
  }
  
  if (filters.city) {
    query['location.city'] = new RegExp(filters.city, 'i');
  }
  
  if (filters.search) {
    query.$text = { $search: filters.search };
  }
  
  // Sort: boosted items first, then by creation date
  const sort = { isBoosted: -1, createdAt: -1 };
  
  return this.find(query)
    .populate('seller', 'firstName lastName rating profilePicture location isVerified')
    .sort(sort);
};

const Product = mongoose.model('Product', productSchema);

export default Product;