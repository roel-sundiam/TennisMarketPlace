import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import CoinTransaction from '../models/CoinTransaction.js';
import User from '../models/User.js';

const router = express.Router();

// GET /api/admin/coins/stats - Get coin system statistics
router.get('/stats', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const [
      totalUsers,
      totalCoinsInCirculation,
      totalTransactions,
      totalEarned,
      totalSpent,
      totalPurchased,
      recentTransactions,
      topUsers,
      dailyActivity
    ] = await Promise.all([
      // Total users
      User.countDocuments({ isActive: true }),
      
      // Total coins in circulation
      User.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, total: { $sum: '$coins.balance' } } }
      ]),
      
      // Total transactions
      CoinTransaction.countDocuments(),
      
      // Total earned coins
      CoinTransaction.aggregate([
        { $match: { type: { $in: ['earn', 'purchase'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      
      // Total spent coins
      CoinTransaction.aggregate([
        { $match: { type: 'spend' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      
      // Total purchased coins
      CoinTransaction.aggregate([
        { $match: { type: 'purchase' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      
      // Recent transactions (last 10)
      CoinTransaction.find()
        .populate('user', 'firstName lastName email')
        .populate('relatedProduct', 'title')
        .sort({ createdAt: -1 })
        .limit(10),
      
      // Top 10 users by coin balance
      User.find({ isActive: true })
        .select('firstName lastName email coins')
        .sort({ 'coins.balance': -1 })
        .limit(10),
      
      // Daily activity (last 7 days)
      CoinTransaction.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              type: '$type'
            },
            count: { $sum: 1 },
            amount: { $sum: '$amount' }
          }
        },
        { $sort: { '_id.date': 1 } }
      ])
    ]);

    res.json({
      summary: {
        totalUsers,
        totalCoinsInCirculation: totalCoinsInCirculation[0]?.total || 0,
        totalTransactions,
        totalEarned: totalEarned[0]?.total || 0,
        totalSpent: totalSpent[0]?.total || 0,
        totalPurchased: totalPurchased[0]?.total || 0
      },
      recentTransactions,
      topUsers,
      dailyActivity
    });
  } catch (error) {
    console.error('Error fetching coin stats:', error);
    res.status(500).json({ error: 'Failed to fetch coin statistics' });
  }
});

// POST /api/admin/coins/award - Award coins to user
router.post('/award', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { userId, amount, reason, description } = req.body;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'User ID and positive amount required' });
    }

    if (amount > 1000) {
      return res.status(400).json({ error: 'Cannot award more than 1000 coins at once' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create transaction
    await CoinTransaction.createTransaction(
      userId,
      'earn',
      amount,
      reason || 'admin_award',
      description || `Admin awarded ${amount} coins`,
      {
        metadata: {
          adminId: req.user.id,
          adminEmail: req.user.email
        }
      }
    );

    res.json({
      message: `Successfully awarded ${amount} coins to ${user.firstName} ${user.lastName}`,
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        newBalance: user.coins.balance + amount
      }
    });
  } catch (error) {
    console.error('Error awarding coins:', error);
    res.status(500).json({ error: 'Failed to award coins' });
  }
});

// POST /api/admin/coins/deduct - Deduct coins from user
router.post('/deduct', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { userId, amount, reason, description } = req.body;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'User ID and positive amount required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.coins.balance < amount) {
      return res.status(400).json({ 
        error: 'User has insufficient coins',
        userBalance: user.coins.balance,
        requestedAmount: amount
      });
    }

    // Create transaction
    await CoinTransaction.createTransaction(
      userId,
      'spend',
      amount,
      reason || 'admin_deduct',
      description || `Admin deducted ${amount} coins`,
      {
        metadata: {
          adminId: req.user.id,
          adminEmail: req.user.email
        }
      }
    );

    res.json({
      message: `Successfully deducted ${amount} coins from ${user.firstName} ${user.lastName}`,
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        newBalance: user.coins.balance - amount
      }
    });
  } catch (error) {
    console.error('Error deducting coins:', error);
    res.status(500).json({ error: 'Failed to deduct coins' });
  }
});

// GET /api/admin/coins/user/:id - Get user's coin details
router.get('/user/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const user = await User.findById(id).select('firstName lastName email coins isActive createdAt');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const history = await CoinTransaction.getUserHistory(id, { page, limit });

    res.json({
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        coins: user.coins,
        isActive: user.isActive,
        joinedAt: user.createdAt
      },
      transactions: history
    });
  } catch (error) {
    console.error('Error fetching user coin details:', error);
    res.status(500).json({ error: 'Failed to fetch user coin details' });
  }
});

// POST /api/admin/coins/refund - Refund transaction
router.post('/refund', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { transactionId, reason } = req.body;

    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID required' });
    }

    const originalTransaction = await CoinTransaction.findById(transactionId).populate('user');
    if (!originalTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (originalTransaction.type !== 'spend') {
      return res.status(400).json({ error: 'Can only refund spend transactions' });
    }

    // Check if already refunded
    const existingRefund = await CoinTransaction.findOne({
      'metadata.originalTransactionId': transactionId,
      type: 'refund'
    });

    if (existingRefund) {
      return res.status(400).json({ error: 'Transaction already refunded' });
    }

    // Create refund transaction
    await CoinTransaction.createTransaction(
      originalTransaction.user._id,
      'refund',
      originalTransaction.amount,
      'admin_refund',
      reason || `Admin refund for transaction ${transactionId}`,
      {
        metadata: {
          adminId: req.user.id,
          adminEmail: req.user.email,
          originalTransactionId: transactionId,
          originalReason: originalTransaction.reason
        }
      }
    );

    res.json({
      message: 'Transaction refunded successfully',
      refundAmount: originalTransaction.amount,
      user: {
        id: originalTransaction.user._id,
        name: `${originalTransaction.user.firstName} ${originalTransaction.user.lastName}`,
        email: originalTransaction.user.email
      }
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// GET /api/admin/coins/suspicious - Get suspicious activities
router.get('/suspicious', authenticate, authorize(['admin']), async (req, res) => {
  try {
    // Find users with suspicious activities
    const [
      highEarners,
      rapidSpenders,
      unusualPatterns,
      failedTransactions
    ] = await Promise.all([
      // Users who earned a lot of coins recently
      User.find({
        'coins.totalEarned': { $gt: 500 },
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }).select('firstName lastName email coins createdAt').limit(10),

      // Users who spent a lot quickly
      CoinTransaction.aggregate([
        {
          $match: {
            type: 'spend',
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: '$user',
            totalSpent: { $sum: '$amount' },
            transactionCount: { $sum: 1 }
          }
        },
        { $match: { totalSpent: { $gt: 100 } } },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 }
      ]),

      // Users with unusual daily bonus claiming patterns
      CoinTransaction.aggregate([
        {
          $match: {
            reason: 'daily_login',
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: '$user',
            bonusCount: { $sum: 1 }
          }
        },
        { $match: { bonusCount: { $gt: 7 } } }, // More than once per day
        { $sort: { bonusCount: -1 } }
      ]),

      // Recent failed transactions (if any)
      []
    ]);

    res.json({
      highEarners,
      rapidSpenders,
      unusualPatterns,
      failedTransactions
    });
  } catch (error) {
    console.error('Error fetching suspicious activities:', error);
    res.status(500).json({ error: 'Failed to fetch suspicious activities' });
  }
});

export default router;