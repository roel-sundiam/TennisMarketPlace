import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reportedProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null,
    index: true
  },
  type: {
    type: String,
    enum: [
      'fraud',
      'harassment',
      'fake_products',
      'inappropriate_behavior',
      'spam',
      'scam',
      'fake_listing',
      'no_show',
      'payment_issues',
      'other'
    ],
    required: true,
    index: true
  },
  reason: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  evidence: [{
    type: {
      type: String,
      enum: ['image', 'screenshot', 'document', 'link'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    description: {
      type: String,
      maxlength: 200
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'under_review', 'resolved', 'dismissed', 'escalated'],
    default: 'pending',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  adminNotes: {
    type: String,
    maxlength: 1000,
    default: null
  },
  resolution: {
    action: {
      type: String,
      enum: [
        'no_action',
        'warning_issued',
        'user_suspended',
        'user_banned',
        'product_removed',
        'user_educated',
        'policy_clarified'
      ],
      default: null
    },
    reason: {
      type: String,
      maxlength: 500,
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  followUp: {
    required: {
      type: Boolean,
      default: false
    },
    scheduledFor: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      maxlength: 500,
      default: null
    }
  },
  metadata: {
    reporterIP: {
      type: String,
      default: null
    },
    userAgent: {
      type: String,
      default: null
    },
    reportSource: {
      type: String,
      enum: ['profile', 'product', 'message', 'review', 'other'],
      default: 'other'
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ type: 1, status: 1 });
reportSchema.index({ reporter: 1, createdAt: -1 });
reportSchema.index({ reportedUser: 1, createdAt: -1 });
reportSchema.index({ priority: 1, status: 1, createdAt: -1 });

// Compound index for admin filtering
reportSchema.index({ status: 1, type: 1, priority: 1, createdAt: -1 });

// Virtual for report age
reportSchema.virtual('ageInHours').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60));
});

// Virtual for resolution time
reportSchema.virtual('resolutionTimeInHours').get(function() {
  if (!this.resolution.resolvedAt) return null;
  return Math.floor((this.resolution.resolvedAt - this.createdAt) / (1000 * 60 * 60));
});

// Static method to get reports with filtering and pagination
reportSchema.statics.getFiltered = async function(filters = {}, options = {}) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    status,
    type,
    priority,
    reportedUser,
    reporter,
    dateFrom,
    dateTo,
    search
  } = filters;

  const query = {};

  // Filter by status
  if (status && status !== 'all') {
    if (Array.isArray(status)) {
      query.status = { $in: status };
    } else {
      query.status = status;
    }
  }

  // Filter by type
  if (type && type !== 'all') {
    if (Array.isArray(type)) {
      query.type = { $in: type };
    } else {
      query.type = type;
    }
  }

  // Filter by priority
  if (priority && priority !== 'all') {
    query.priority = priority;
  }

  // Filter by reported user
  if (reportedUser) {
    query.reportedUser = reportedUser;
  }

  // Filter by reporter
  if (reporter) {
    query.reporter = reporter;
  }

  // Date range filter
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) {
      query.createdAt.$gte = new Date(dateFrom);
    }
    if (dateTo) {
      query.createdAt.$lte = new Date(dateTo);
    }
  }

  // Search in reason or description
  if (search) {
    query.$or = [
      { reason: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { adminNotes: { $regex: search, $options: 'i' } }
    ];
  }

  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [reports, total] = await Promise.all([
    this.find(query)
      .populate('reporter', 'firstName lastName email profilePicture role')
      .populate('reportedUser', 'firstName lastName email profilePicture role isActive')
      .populate('reportedProduct', 'title price images category')
      .populate('resolution.resolvedBy', 'firstName lastName email role')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    this.countDocuments(query)
  ]);

  return {
    reports,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalReports: total,
      hasNext: skip + reports.length < total,
      hasPrev: parseInt(page) > 1
    }
  };
};

// Static method to get report statistics
reportSchema.statics.getStatistics = async function(dateRange = {}) {
  const { from, to } = dateRange;
  const matchStage = {};

  if (from || to) {
    matchStage.createdAt = {};
    if (from) matchStage.createdAt.$gte = new Date(from);
    if (to) matchStage.createdAt.$lte = new Date(to);
  }

  const pipeline = [
    ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
    {
      $group: {
        _id: null,
        totalReports: { $sum: 1 },
        pendingReports: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        resolvedReports: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        dismissedReports: { $sum: { $cond: [{ $eq: ['$status', 'dismissed'] }, 1, 0] } },
        highPriorityReports: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
        urgentReports: { $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] } },
        avgResolutionTime: {
          $avg: {
            $cond: [
              { $ne: ['$resolution.resolvedAt', null] },
              { $divide: [{ $subtract: ['$resolution.resolvedAt', '$createdAt'] }, 1000 * 60 * 60] },
              null
            ]
          }
        }
      }
    }
  ];

  const [stats] = await this.aggregate(pipeline);

  // Get type breakdown
  const typeBreakdown = await this.aggregate([
    ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } }
      }
    },
    { $sort: { count: -1 } }
  ]);

  return {
    ...stats,
    typeBreakdown
  };
};

// Method to update status
reportSchema.methods.updateStatus = function(status, adminId, notes = null) {
  this.status = status;
  this.adminNotes = notes;

  if (status === 'resolved' || status === 'dismissed') {
    this.resolution.resolvedAt = new Date();
    this.resolution.resolvedBy = adminId;
  }

  return this.save();
};

// Method to resolve report with action
reportSchema.methods.resolve = function(action, reason, adminId, adminNotes = null) {
  this.status = 'resolved';
  this.resolution.action = action;
  this.resolution.reason = reason;
  this.resolution.resolvedAt = new Date();
  this.resolution.resolvedBy = adminId;

  if (adminNotes) {
    this.adminNotes = adminNotes;
  }

  return this.save();
};

// Method to escalate report
reportSchema.methods.escalate = function(priority = 'high', notes = null) {
  this.status = 'escalated';
  this.priority = priority;

  if (notes) {
    this.adminNotes = notes;
  }

  return this.save();
};

// Method to check if report is actionable
reportSchema.methods.isActionable = function() {
  return ['pending', 'under_review', 'escalated'].includes(this.status);
};

// Method to add evidence
reportSchema.methods.addEvidence = function(evidenceData) {
  this.evidence.push({
    ...evidenceData,
    uploadedAt: new Date()
  });
  return this.save();
};

// Pre-save middleware to set priority based on type and content
reportSchema.pre('save', function(next) {
  if (this.isNew) {
    // Auto-escalate certain types of reports
    const highPriorityTypes = ['fraud', 'scam', 'harassment'];
    const urgentKeywords = ['threat', 'danger', 'illegal', 'stolen', 'police'];

    if (highPriorityTypes.includes(this.type)) {
      this.priority = 'high';
    }

    const description = this.description.toLowerCase();
    const reason = this.reason.toLowerCase();

    if (urgentKeywords.some(keyword =>
      description.includes(keyword) || reason.includes(keyword)
    )) {
      this.priority = 'urgent';
    }
  }

  next();
});

// Remove sensitive data from JSON output
reportSchema.methods.toJSON = function() {
  const report = this.toObject();

  // Remove sensitive metadata for non-admin responses
  if (!this._includeMetadata) {
    delete report.metadata;
  }

  return report;
};

const Report = mongoose.model('Report', reportSchema);

export default Report;