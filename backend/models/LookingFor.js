import mongoose from 'mongoose';

const responseSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  contactInfo: {
    phone: String,
    whatsapp: String,
    preferredContact: {
      type: String,
      enum: ['phone', 'whatsapp', 'both'],
      default: 'phone'
    }
  },
  price: {
    type: Number,
    min: 0
  },
  negotiable: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'contacted', 'closed'],
    default: 'active'
  }
}, {
  timestamps: true
});

const lookingForSchema = new mongoose.Schema({
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
  category: {
    type: String,
    required: true,
    enum: ['Racquets', 'Pickleball Paddles', 'Strings', 'Bags', 'Balls', 'Pickleball Balls', 'Shoes', 'Apparel', 'Accessories']
  },
  subcategory: {
    type: String,
    required: false
  },
  budget: {
    min: {
      type: Number,
      min: 0,
      required: true
    },
    max: {
      type: Number,
      min: 0,
      required: true
    },
    currency: {
      type: String,
      default: 'PHP'
    }
  },
  condition: [{
    type: String,
    enum: ['New', 'Like New', 'Excellent', 'Good', 'Fair']
  }],
  preferredBrands: [{
    type: String,
    trim: true
  }],
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
  location: {
    city: {
      type: String,
      required: false
    },
    region: {
      type: String,
      required: false
    },
    meetupLocations: [{
      type: String
    }],
    willingToTravel: {
      type: Boolean,
      default: false
    },
    maxTravelDistance: {
      type: Number,
      default: 0
    }
  },
  urgency: {
    type: String,
    enum: ['asap', 'within_week', 'within_month', 'flexible'],
    default: 'flexible'
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'fulfilled', 'expired', 'cancelled'],
    default: 'active'
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    }
  },
  responses: [responseSchema],
  views: {
    type: Number,
    default: 0
  },
  favorites: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  shippingPreferences: {
    meetup: { type: Boolean, default: true },
    delivery: { type: Boolean, default: false },
    shipping: { type: Boolean, default: false }
  },
  additionalNotes: {
    type: String,
    maxlength: 500
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  isPriority: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for faster queries
lookingForSchema.index({ category: 1, status: 1 });
lookingForSchema.index({ buyer: 1 });
lookingForSchema.index({ 'location.city': 1 });
lookingForSchema.index({ 'budget.min': 1, 'budget.max': 1 });
lookingForSchema.index({ status: 1, expiresAt: 1 });
lookingForSchema.index({ title: 'text', description: 'text', tags: 'text' });
lookingForSchema.index({ createdAt: -1 });
lookingForSchema.index({ isPriority: -1, isUrgent: -1, createdAt: -1 });

// Virtual for response count
lookingForSchema.virtual('responseCount').get(function() {
  return this.responses ? this.responses.length : 0;
});

// Virtual for active responses
lookingForSchema.virtual('activeResponses').get(function() {
  return this.responses ? this.responses.filter(r => r.status === 'active') : [];
});

// Method to check if expired
lookingForSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Method to increment views
lookingForSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save({ validateBeforeSave: false });
};

// Method to add response
lookingForSchema.methods.addResponse = function(responseData) {
  this.responses.push(responseData);
  return this.save();
};

// Method to mark as fulfilled
lookingForSchema.methods.markFulfilled = function() {
  this.status = 'fulfilled';
  return this.save();
};

// Method to extend expiry
lookingForSchema.methods.extendExpiry = function(days = 30) {
  this.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  // Return this for chaining instead of saving immediately
  return this;
};

// Pre-save middleware to handle expiration
lookingForSchema.pre('save', function(next) {
  if (this.isExpired() && this.status === 'active') {
    this.status = 'expired';
  }
  next();
});

// Transform on JSON serialization
lookingForSchema.set('toJSON', {
  transform: function(doc, ret) {
    // Add computed fields
    ret.responseCount = doc.responseCount;
    ret.isExpired = doc.isExpired();
    ret.daysLeft = Math.ceil((doc.expiresAt - new Date()) / (1000 * 60 * 60 * 24));

    return ret;
  }
});

// Static method to get Looking For posts with filters
lookingForSchema.statics.getFiltered = function(filters = {}) {
  const query = { status: 'active' };

  if (filters.category && filters.category !== 'All') {
    query.category = filters.category;
  }

  if (filters.condition && filters.condition.length > 0) {
    query.condition = { $in: filters.condition };
  }

  if (filters.budgetMin !== undefined || filters.budgetMax !== undefined) {
    if (filters.budgetMin !== undefined) {
      query['budget.max'] = { $gte: filters.budgetMin };
    }
    if (filters.budgetMax !== undefined) {
      query['budget.min'] = { $lte: filters.budgetMax };
    }
  }

  if (filters.city) {
    query['location.city'] = new RegExp(filters.city, 'i');
  }

  if (filters.urgency) {
    query.urgency = filters.urgency;
  }

  if (filters.search) {
    query.$text = { $search: filters.search };
  }

  // Sort: priority first, then urgent, then newest
  const sort = { isPriority: -1, isUrgent: -1, createdAt: -1 };

  return this.find(query)
    .populate('buyer', 'firstName lastName rating profilePicture location isVerified')
    .populate('responses.seller', 'firstName lastName rating profilePicture isVerified')
    .populate('responses.product', 'title price images mainImage')
    .sort(sort);
};

// Static method to expire old posts
lookingForSchema.statics.expireOldPosts = async function() {
  const result = await this.updateMany(
    {
      status: 'active',
      expiresAt: { $lt: new Date() }
    },
    {
      status: 'expired'
    }
  );
  return result;
};

const LookingFor = mongoose.model('LookingFor', lookingForSchema);

export default LookingFor;