import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  // Event identification
  eventType: {
    type: String,
    required: true,
    enum: [
      'page_view',
      'page_view_end',
      'product_view', 
      'product_favorite',
      'product_unfavorite',
      'search',
      'filter_use',
      'product_contact',
      'user_register',
      'user_login',
      'listing_create',
      'listing_boost',
      'coin_purchase',
      'error_404',
      'session_start',
      'session_end',
      'api_call',
      'product_browse',
      'product_create',
      'product_boost'
    ],
    index: true
  },
  
  // User identification (for tracking but privacy-compliant)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  
  // Anonymous user tracking via fingerprint
  fingerprint: {
    type: String,
    default: null,
    index: true
  },
  
  // Session tracking
  sessionId: {
    type: String,
    default: null,
    index: true
  },
  
  // Page/Resource being accessed
  path: {
    type: String,
    required: true,
    index: true
  },
  
  // Referrer information
  referrer: {
    type: String,
    default: null
  },
  
  // Event-specific data
  data: {
    // For product views
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null
    },
    
    // For searches
    searchQuery: {
      type: String,
      default: null
    },
    
    // For filters
    filterData: {
      category: String,
      priceRange: String,
      location: String,
      condition: String
    },
    
    // For errors
    errorCode: {
      type: Number,
      default: null
    },
    
    // Custom event data
    custom: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  
  // Technical details
  userAgent: {
    type: String,
    default: null
  },
  
  ipAddress: {
    type: String,
    default: null,
    index: true
  },
  
  // Device information
  device: {
    type: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown'
    },
    browser: {
      type: String,
      default: null
    },
    os: {
      type: String,
      default: null
    },
    screenSize: {
      width: Number,
      height: Number
    }
  },
  
  // Geographic data (if available)
  location: {
    country: String,
    city: String,
    region: String
  },
  
  // Performance data
  performance: {
    loadTime: {
      type: Number,
      default: null
    },
    timeOnPage: {
      type: Number,
      default: null
    }
  },
  
  // Admin exclusion flag
  isAdminActivity: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for performance
analyticsSchema.index({ eventType: 1, createdAt: -1 });
analyticsSchema.index({ fingerprint: 1, createdAt: -1 });
analyticsSchema.index({ userId: 1, createdAt: -1 });
analyticsSchema.index({ isAdminActivity: 1, createdAt: -1 });
analyticsSchema.index({ path: 1, eventType: 1 });
analyticsSchema.index({ 'data.productId': 1 });
analyticsSchema.index({ createdAt: 1 }); // For time-based queries
analyticsSchema.index({ sessionId: 1, createdAt: 1 }); // For session tracking

// Static methods for analytics queries

// Get visitor statistics
analyticsSchema.statics.getVisitorStats = async function(startDate, endDate, excludeAdmin = true) {
  const filter = {
    eventType: 'page_view',
    createdAt: { $gte: startDate, $lte: endDate }
  };
  
  if (excludeAdmin) {
    filter.isAdminActivity = { $ne: true };
  }

  const [
    totalViews,
    uniqueVisitors,
    uniqueUsers,
    topPages
  ] = await Promise.all([
    // Total page views
    this.countDocuments(filter),
    
    // Unique visitors (by fingerprint)
    this.distinct('fingerprint', { ...filter, fingerprint: { $ne: null } }).then(result => result.length),
    
    // Unique registered users
    this.distinct('userId', { ...filter, userId: { $ne: null } }).then(result => result.length),
    
    // Top pages
    this.aggregate([
      { $match: filter },
      { $group: { _id: '$path', views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 10 }
    ])
  ]);

  return {
    totalViews,
    uniqueVisitors,
    uniqueUsers,
    topPages: topPages.map(page => ({ path: page._id, views: page.views }))
  };
};

// Get daily visitor trends
analyticsSchema.statics.getDailyTrends = async function(days = 30, excludeAdmin = true) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const filter = {
    eventType: 'page_view',
    createdAt: { $gte: startDate },
    isAdminActivity: excludeAdmin ? { $ne: true } : undefined
  };
  
  if (!excludeAdmin) {
    delete filter.isAdminActivity;
  }

  const trends = await this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        views: { $sum: 1 },
        uniqueVisitors: { $addToSet: '$fingerprint' }
      }
    },
    {
      $project: {
        date: {
          $dateFromParts: {
            year: '$_id.year',
            month: '$_id.month',
            day: '$_id.day'
          }
        },
        views: 1,
        uniqueVisitors: { $size: { $filter: { input: '$uniqueVisitors', cond: { $ne: ['$$this', null] } } } }
      }
    },
    { $sort: { date: 1 } }
  ]);

  return trends;
};

// Get device/browser breakdown
analyticsSchema.statics.getDeviceStats = async function(startDate, endDate, excludeAdmin = true) {
  const filter = {
    eventType: 'page_view',
    createdAt: { $gte: startDate, $lte: endDate }
  };
  
  if (excludeAdmin) {
    filter.isAdminActivity = { $ne: true };
  }

  const [deviceTypes, browsers] = await Promise.all([
    this.aggregate([
      { $match: filter },
      { $group: { _id: '$device.type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    
    this.aggregate([
      { $match: filter },
      { $group: { _id: '$device.browser', count: { $sum: 1 } } },
      { $match: { _id: { $ne: null } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])
  ]);

  // Transform device data to match frontend expectations
  const deviceCounts = { desktop: 0, mobile: 0, tablet: 0 };
  deviceTypes.forEach(device => {
    if (device._id && deviceCounts.hasOwnProperty(device._id)) {
      deviceCounts[device._id] = device.count;
    }
  });

  return {
    devices: deviceCounts,
    browsers: browsers.map(b => ({ browser: b._id, count: b.count }))
  };
};

// Get popular products
analyticsSchema.statics.getPopularProducts = async function(startDate, endDate, limit = 10, excludeAdmin = true) {
  const filter = {
    eventType: 'product_view',
    'data.productId': { $ne: null },
    createdAt: { $gte: startDate, $lte: endDate }
  };
  
  if (excludeAdmin) {
    filter.isAdminActivity = { $ne: true };
  }

  const products = await this.aggregate([
    { $match: filter },
    { $group: { _id: '$data.productId', views: { $sum: 1 } } },
    { $sort: { views: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $project: {
        productId: '$_id',
        views: 1,
        title: '$product.title',
        price: '$product.price'
      }
    }
  ]);

  return products;
};

// Get search analytics
analyticsSchema.statics.getSearchStats = async function(startDate, endDate, limit = 20, excludeAdmin = true) {
  const filter = {
    eventType: 'search',
    'data.searchQuery': { $ne: null, $ne: '' },
    createdAt: { $gte: startDate, $lte: endDate }
  };
  
  if (excludeAdmin) {
    filter.isAdminActivity = { $ne: true };
  }

  const searches = await this.aggregate([
    { $match: filter },
    { $group: { _id: '$data.searchQuery', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);

  return searches.map(s => ({ query: s._id, count: s.count }));
};

// Helper method to determine if event is from admin
analyticsSchema.methods.checkIfAdminActivity = async function() {
  if (this.userId) {
    const User = mongoose.model('User');
    const user = await User.findById(this.userId);
    return user && user.role === 'admin';
  }
  return false;
};

const Analytics = mongoose.model('Analytics', analyticsSchema);

export default Analytics;