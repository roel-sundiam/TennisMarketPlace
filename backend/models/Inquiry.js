import mongoose from 'mongoose';

const inquirySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productTitle: {
    type: String,
    required: true
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  buyerName: {
    type: String,
    required: true
  },
  buyerEmail: {
    type: String,
    required: true
  },
  buyerPhone: {
    type: String,
    required: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerName: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true,
    maxLength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'responded', 'resolved', 'closed'],
    default: 'pending'
  },
  messages: [{
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderName: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true,
      maxLength: 1000
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  adminNotes: {
    type: String,
    maxLength: 500
  },
  isReviewed: {
    type: Boolean,
    default: false
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
inquirySchema.index({ productId: 1 });
inquirySchema.index({ buyerId: 1 });
inquirySchema.index({ sellerId: 1 });
inquirySchema.index({ status: 1 });
inquirySchema.index({ createdAt: -1 });
inquirySchema.index({ isReviewed: 1 });

// Virtual for inquiry age in hours
inquirySchema.virtual('ageInHours').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60));
});

// Static method to get inquiries with pagination and filtering
inquirySchema.statics.getFiltered = function(options = {}) {
  const {
    page = 1,
    limit = 20,
    status,
    buyerId,
    sellerId,
    productId,
    isReviewed,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  const filter = {};

  if (status) filter.status = status;
  if (buyerId) filter.buyerId = buyerId;
  if (sellerId) filter.sellerId = sellerId;
  if (productId) filter.productId = productId;
  if (typeof isReviewed === 'boolean') filter.isReviewed = isReviewed;

  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (page - 1) * limit;

  return this.find(filter)
    .populate('buyerId', 'name email')
    .populate('sellerId', 'name email')
    .populate('productId', 'title price images')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get inquiry statistics for admin dashboard
inquirySchema.statics.getStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$count' },
        statusBreakdown: {
          $push: {
            status: '$_id',
            count: '$count'
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        total: 1,
        pending: {
          $arrayElemAt: [
            {
              $filter: {
                input: '$statusBreakdown',
                cond: { $eq: ['$$this.status', 'pending'] }
              }
            }, 0
          ]
        },
        responded: {
          $arrayElemAt: [
            {
              $filter: {
                input: '$statusBreakdown',
                cond: { $eq: ['$$this.status', 'responded'] }
              }
            }, 0
          ]
        },
        resolved: {
          $arrayElemAt: [
            {
              $filter: {
                input: '$statusBreakdown',
                cond: { $eq: ['$$this.status', 'resolved'] }
              }
            }, 0
          ]
        },
        closed: {
          $arrayElemAt: [
            {
              $filter: {
                input: '$statusBreakdown',
                cond: { $eq: ['$$this.status', 'closed'] }
              }
            }, 0
          ]
        }
      }
    }
  ]);
};

// Instance method to add a message to the conversation
inquirySchema.methods.addMessage = function(senderId, senderName, message) {
  this.messages.push({
    senderId,
    senderName,
    message,
    timestamp: new Date()
  });

  // Update status to responded if seller is replying
  if (senderId.toString() === this.sellerId.toString() && this.status === 'pending') {
    this.status = 'responded';
  }

  return this.save();
};

// Instance method to mark as reviewed by admin
inquirySchema.methods.markReviewed = function(adminId) {
  this.isReviewed = true;
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  return this.save();
};

export default mongoose.model('Inquiry', inquirySchema);