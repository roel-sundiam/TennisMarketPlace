import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    match: [/^(\+639|09)\d{9}$/, 'Please enter a valid Philippine phone number']
  },
  profilePicture: {
    type: String,
    default: null
  },
  location: {
    city: {
      type: String,
      required: true
    },
    region: {
      type: String,
      required: true
    }
  },
  role: {
    type: String,
    enum: ['buyer', 'seller', 'admin'],
    default: 'buyer'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verification: {
    status: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none'
    },
    requestedAt: {
      type: Date,
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    documents: [{
      type: {
        type: String,
        enum: ['government_id', 'proof_of_address', 'business_permit'],
        required: true
      },
      url: {
        type: String,
        required: true
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    rejectionReason: {
      type: String,
      default: null
    },
    notes: {
      type: String,
      default: null
    }
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },
  coins: {
    balance: {
      type: Number,
      default: 50
      // Removed min: 0 to allow negative balances for transaction fees
    },
    totalEarned: {
      type: Number,
      default: 50,
      min: 0
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'pro'],
      default: 'free'
    },
    remainingListings: {
      type: Number,
      default: 3 // Free plan starts with 3 listings
    },
    remainingBoosts: {
      type: Number,
      default: 0 // Free plan has no boosts
    },
    expiresAt: {
      type: Date,
      default: null
    },
    renewalDate: {
      type: Date,
      default: null
    }
  },
  isActive: {
    type: Boolean,
    default: false // New users require admin approval
  },
  suspension: {
    isSuspended: {
      type: Boolean,
      default: false,
      index: true
    },
    suspendedAt: {
      type: Date,
      default: null
    },
    suspendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    suspensionReason: {
      type: String,
      maxlength: 500,
      default: null
    },
    suspensionType: {
      type: String,
      enum: ['temporary', 'indefinite', 'permanent'],
      default: 'temporary'
    },
    suspensionEnd: {
      type: Date,
      default: null
    },
    warningCount: {
      type: Number,
      default: 0,
      min: 0
    },
    history: [{
      action: {
        type: String,
        enum: ['warning', 'temporary_suspension', 'indefinite_suspension', 'permanent_ban', 'unsuspended'],
        required: true
      },
      reason: {
        type: String,
        required: true,
        maxlength: 500
      },
      actionBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      actionDate: {
        type: Date,
        default: Date.now
      },
      relatedReport: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report',
        default: null
      },
      duration: {
        type: Number, // Duration in hours for temporary suspensions
        default: null
      },
      notes: {
        type: String,
        maxlength: 1000,
        default: null
      }
    }],
    appealable: {
      type: Boolean,
      default: true
    },
    appealDeadline: {
      type: Date,
      default: null
    }
  },
  registration: {
    ipAddress: {
      type: String,
      required: true,
      index: true
    },
    deviceFingerprint: {
      type: String,
      required: true,
      index: true
    },
    userAgent: {
      type: String,
      default: null
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    isDuplicateApproved: {
      type: Boolean,
      default: false
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    approvalReason: {
      type: String,
      default: null
    }
  }
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ 'location.city': 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ 'registration.ipAddress': 1 });
userSchema.index({ 'registration.deviceFingerprint': 1 });
userSchema.index({ 'registration.ipAddress': 1, 'registration.deviceFingerprint': 1 });
userSchema.index({ 'suspension.isSuspended': 1 });
userSchema.index({ 'suspension.suspensionEnd': 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to add coins
userSchema.methods.addCoins = function(amount, reason = 'manual') {
  this.coins.balance += amount;
  this.coins.totalEarned += amount;
  return this.save();
};

// Method to spend coins
userSchema.methods.spendCoins = function(amount, reason = 'manual') {
  if (this.coins.balance < amount) {
    throw new Error('Insufficient coins');
  }
  this.coins.balance -= amount;
  this.coins.totalSpent += amount;
  return this.save();
};


// Method to request verification
userSchema.methods.requestVerification = function(documents) {
  if (this.verification.status === 'pending') {
    throw new Error('Verification request already pending');
  }
  if (this.isVerified) {
    throw new Error('User is already verified');
  }
  
  this.verification.status = 'pending';
  this.verification.requestedAt = new Date();
  this.verification.documents = documents;
  this.verification.rejectionReason = null;
  this.verification.reviewedAt = null;
  this.verification.reviewedBy = null;
  
  return this.save();
};

// Method to approve verification (admin only)
userSchema.methods.approveVerification = function(adminId, notes = null) {
  if (this.verification.status !== 'pending') {
    throw new Error('No pending verification request');
  }
  
  this.isVerified = true;
  this.verification.status = 'approved';
  this.verification.reviewedAt = new Date();
  this.verification.reviewedBy = adminId;
  this.verification.notes = notes;
  this.verification.rejectionReason = null;
  
  return this.save();
};

// Method to reject verification (admin only)
userSchema.methods.rejectVerification = function(adminId, reason, notes = null) {
  if (this.verification.status !== 'pending') {
    throw new Error('No pending verification request');
  }
  
  this.verification.status = 'rejected';
  this.verification.reviewedAt = new Date();
  this.verification.reviewedBy = adminId;
  this.verification.rejectionReason = reason;
  this.verification.notes = notes;
  
  return this.save();
};

// Method to check if user can request verification
userSchema.methods.canRequestVerification = function() {
  return !this.isVerified && this.verification.status !== 'pending';
};

// Method to initialize free tier benefits for new users
userSchema.methods.initializeFreeTier = function() {
  // Set free plan defaults
  this.subscription.plan = 'free';
  this.subscription.remainingListings = 3;
  this.subscription.remainingBoosts = 0;
  this.subscription.expiresAt = null;
  this.subscription.renewalDate = null;
  
  // Set initial coin balance
  this.coins.balance = 50;
  this.coins.totalEarned = 50;
  this.coins.totalSpent = 0;
  
  // Note: isActive is controlled by admin approval process
  // Don't set isActive here
  
  return this.save();
};

// Method to suspend user
userSchema.methods.suspendUser = function(adminId, reason, type = 'temporary', duration = null, reportId = null, notes = null) {
  const suspensionEntry = {
    action: type === 'permanent' ? 'permanent_ban' : 'temporary_suspension',
    reason,
    actionBy: adminId,
    actionDate: new Date(),
    relatedReport: reportId,
    duration: duration, // Duration in hours
    notes
  };

  this.suspension.isSuspended = true;
  this.suspension.suspendedAt = new Date();
  this.suspension.suspendedBy = adminId;
  this.suspension.suspensionReason = reason;
  this.suspension.suspensionType = type;
  this.suspension.history.push(suspensionEntry);

  // Set suspension end time for temporary suspensions
  if (type === 'temporary' && duration) {
    this.suspension.suspensionEnd = new Date(Date.now() + (duration * 60 * 60 * 1000));
    this.suspension.appealDeadline = new Date(Date.now() + (duration * 60 * 60 * 1000) + (7 * 24 * 60 * 60 * 1000)); // 7 days after suspension ends
  } else if (type === 'indefinite') {
    this.suspension.suspensionEnd = null;
    this.suspension.appealDeadline = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)); // 30 days to appeal
  } else if (type === 'permanent') {
    this.suspension.suspensionEnd = null;
    this.suspension.appealable = false;
    this.suspension.appealDeadline = null;
  }

  // Deactivate account for indefinite or permanent suspensions
  if (type === 'indefinite' || type === 'permanent') {
    this.isActive = false;
  }

  return this.save();
};

// Method to unsuspend user
userSchema.methods.unsuspendUser = function(adminId, reason, notes = null) {
  const unsuspensionEntry = {
    action: 'unsuspended',
    reason,
    actionBy: adminId,
    actionDate: new Date(),
    relatedReport: null,
    duration: null,
    notes
  };

  this.suspension.isSuspended = false;
  this.suspension.suspendedAt = null;
  this.suspension.suspendedBy = null;
  this.suspension.suspensionReason = null;
  this.suspension.suspensionType = 'temporary';
  this.suspension.suspensionEnd = null;
  this.suspension.appealable = true;
  this.suspension.appealDeadline = null;
  this.suspension.history.push(unsuspensionEntry);

  // Reactivate account
  this.isActive = true;

  return this.save();
};

// Method to issue warning
userSchema.methods.issueWarning = function(adminId, reason, reportId = null, notes = null) {
  const warningEntry = {
    action: 'warning',
    reason,
    actionBy: adminId,
    actionDate: new Date(),
    relatedReport: reportId,
    duration: null,
    notes
  };

  this.suspension.warningCount += 1;
  this.suspension.history.push(warningEntry);

  return this.save();
};

// Method to check if user is currently suspended
userSchema.methods.isCurrentlySuspended = function() {
  if (!this.suspension.isSuspended) return false;

  // Check if temporary suspension has expired
  if (this.suspension.suspensionType === 'temporary' && this.suspension.suspensionEnd) {
    if (new Date() > this.suspension.suspensionEnd) {
      // Auto-unsuspend expired temporary suspensions
      this.suspension.isSuspended = false;
      this.suspension.suspendedAt = null;
      this.suspension.suspendedBy = null;
      this.suspension.suspensionReason = null;
      this.suspension.suspensionEnd = null;
      this.isActive = true;
      this.save();
      return false;
    }
  }

  return true;
};

// Method to get user status for display
userSchema.methods.getDisplayStatus = function() {
  if (!this.isActive) return 'inactive';
  if (this.isCurrentlySuspended()) {
    switch (this.suspension.suspensionType) {
      case 'permanent': return 'banned';
      case 'indefinite': return 'suspended';
      case 'temporary': return 'suspended';
      default: return 'suspended';
    }
  }
  return 'active';
};

// Method to check if user can appeal
userSchema.methods.canAppeal = function() {
  if (!this.suspension.appealable) return false;
  if (!this.suspension.appealDeadline) return true;
  return new Date() <= this.suspension.appealDeadline;
};

// Method to get suspension history for admin view
userSchema.methods.getSuspensionHistory = function() {
  return this.suspension.history.sort((a, b) => new Date(b.actionDate) - new Date(a.actionDate));
};

// Virtual for suspension time remaining
userSchema.virtual('suspension.timeRemaining').get(function() {
  if (!this.suspension.isSuspended || !this.suspension.suspensionEnd) return null;
  const now = new Date();
  const end = new Date(this.suspension.suspensionEnd);
  const diff = end - now;

  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ${hours % 24} hour${(hours % 24) !== 1 ? 's' : ''}`;
  return `${hours} hour${hours !== 1 ? 's' : ''}`;
});

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

const User = mongoose.model('User', userSchema);

export default User;