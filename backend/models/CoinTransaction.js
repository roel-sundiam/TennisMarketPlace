import mongoose from 'mongoose';

const coinTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['earn', 'spend', 'purchase', 'refund'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  reason: {
    type: String,
    required: true,
    enum: [
      // Earning reasons
      'signup_bonus',
      'daily_login',
      'profile_completion',
      'successful_sale',
      'referral_bonus',
      'review_given',
      'review_received',
      'admin_award',
      
      // Spending reasons
      'create_listing',
      'boost_listing',
      'premium_boost',
      'extra_photos',
      'priority_support',
      'transaction_fee',
      'admin_deduct',
      
      // Purchase/refund
      'coin_purchase',
      'coin_purchase_pending',
      'refund',
      'admin_refund'
    ]
  },
  description: {
    type: String,
    required: true
  },
  relatedProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  balanceAfter: {
    type: Number,
    required: true
    // Removed min: 0 to allow negative balances
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for faster queries
coinTransactionSchema.index({ user: 1, createdAt: -1 });
coinTransactionSchema.index({ type: 1 });
coinTransactionSchema.index({ reason: 1 });
coinTransactionSchema.index({ relatedProduct: 1 });

// Static method to create transaction and update user balance
coinTransactionSchema.statics.createTransaction = async function(userId, type, amount, reason, description, options = {}) {
  const User = mongoose.model('User');
  
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Allow negative balances for transaction fees and other spending
    // Users can go negative and will need to earn or purchase more coins later
    
    // Update user balance
    if (type === 'earn' || type === 'purchase') {
      user.coins.balance += amount;
      user.coins.totalEarned += amount;
    } else if (type === 'spend') {
      user.coins.balance -= amount;
      user.coins.totalSpent += amount;
    } else if (type === 'refund') {
      user.coins.balance += amount;
    }
    
    await user.save({ session });
    
    // Create transaction record
    const transaction = new this({
      user: userId,
      type,
      amount,
      reason,
      description,
      balanceAfter: user.coins.balance,
      relatedProduct: options.relatedProduct || null,
      relatedUser: options.relatedUser || null,
      metadata: options.metadata || {}
    });
    
    await transaction.save({ session });
    
    await session.commitTransaction();
    return transaction;
    
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Static method to get user transaction history
coinTransactionSchema.statics.getUserHistory = async function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    type = null,
    reason = null,
    startDate = null,
    endDate = null
  } = options;
  
  const query = { user: userId };
  
  if (type) query.type = type;
  if (reason) query.reason = reason;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  const skip = (page - 1) * limit;
  
  const [transactions, total] = await Promise.all([
    this.find(query)
      .populate('relatedProduct', 'title')
      .populate('relatedUser', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    this.countDocuments(query)
  ]);
  
  return {
    transactions,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  };
};

const CoinTransaction = mongoose.model('CoinTransaction', coinTransactionSchema);

export default CoinTransaction;