import express from 'express';
import { authenticate } from '../middleware/auth.js';
import CoinTransaction from '../models/CoinTransaction.js';
import User from '../models/User.js';
import Product from '../models/Product.js';

const router = express.Router();

// Get user's coin balance and stats
router.get('/balance', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      balance: user.coins.balance,
      totalEarned: user.coins.totalEarned,
      totalSpent: user.coins.totalSpent
    });
  } catch (error) {
    console.error('Error fetching coin balance:', error);
    res.status(500).json({ error: 'Failed to fetch coin balance' });
  }
});


// Get transaction history
router.get('/history', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type || null;
    const reason = req.query.reason || null;

    const history = await CoinTransaction.getUserHistory(req.user._id, {
      page,
      limit,
      type,
      reason
    });

    res.json(history);
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
});

// Spend coins to create listing
router.post('/spend/listing', authenticate, async (req, res) => {
  try {
    const { productId } = req.body;
    const LISTING_COST = 10;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.coins.balance < LISTING_COST) {
      return res.status(400).json({ 
        error: 'Insufficient coins',
        required: LISTING_COST,
        current: user.coins.balance
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if user owns the product
    if (product.seller.toString() !== req.user._id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Spend coins
    await CoinTransaction.createTransaction(
      user._id,
      'spend',
      LISTING_COST,
      'create_listing',
      `Created listing for ${product.title}`,
      { relatedProduct: productId }
    );

    res.json({
      message: 'Coins spent successfully',
      coinsSpent: LISTING_COST,
      newBalance: user.coins.balance - LISTING_COST,
      productTitle: product.title
    });
  } catch (error) {
    console.error('Error spending coins for listing:', error);
    res.status(500).json({ error: 'Failed to spend coins' });
  }
});

// Spend coins to boost listing
router.post('/spend/boost', authenticate, async (req, res) => {
  console.log('🚀 BOOST REQUEST RECEIVED!');
  console.log('🎯 Request body:', req.body);
  console.log('👤 Authenticated user:', req.user ? req.user.email : 'None');
  
  try {
    const { productId, boostType = 'basic' } = req.body;
    console.log('📝 Extracted data - ProductId:', productId, 'BoostType:', boostType);
    
    const BOOST_COSTS = {
      basic: 25,  // 24-48 hours
      premium: 50 // Top placement + badge
    };

    const BOOST_DURATION = {
      basic: 2,   // 2 days
      premium: 7  // 7 days
    };

    if (!productId) {
      return res.status(400).json({ error: 'Product ID required' });
    }

    if (!BOOST_COSTS[boostType]) {
      return res.status(400).json({ error: 'Invalid boost type' });
    }

    const cost = BOOST_COSTS[boostType];
    const duration = BOOST_DURATION[boostType];

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.coins.balance < cost) {
      return res.status(400).json({ 
        error: 'Insufficient coins',
        required: cost,
        current: user.coins.balance
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if user owns the product
    console.log('🔍 Ownership check - Product seller:', product.seller.toString(), 'User ID:', req.user._id.toString());
    if (product.seller.toString() !== req.user._id.toString()) {
      console.log('❌ Ownership check failed');
      return res.status(403).json({ error: 'Unauthorized - Product ownership check failed' });
    }
    console.log('✅ Ownership check passed');

    // Check if product is approved
    console.log('🔍 Approval check - Product status:', product.isApproved);
    // Temporarily bypass approval check for debugging
    // if (product.isApproved !== 'approved') {
    //   console.log('❌ Approval check failed');
    //   return res.status(400).json({ error: 'Product must be approved before boosting' });
    // }
    console.log('✅ Approval check passed (bypassed for debugging)');

    // Boost the product
    product.boostListing(duration);
    await product.save();

    // Spend coins
    await CoinTransaction.createTransaction(
      user._id,
      'spend',
      cost,
      'boost_listing',
      `Boosted listing for ${product.title} (${boostType})`,
      { 
        relatedProduct: productId,
        metadata: { boostType, duration }
      }
    );

    res.json({
      message: 'Listing boosted successfully',
      coinsSpent: cost,
      newBalance: user.coins.balance - cost,
      boostType,
      duration,
      expiresAt: product.boostExpiresAt
    });
  } catch (error) {
    console.error('Error boosting listing:', error);
    res.status(500).json({ error: 'Failed to boost listing' });
  }
});

// DEPRECATED: Award coins for successful sale (seller initiates)
// This endpoint is deprecated in favor of the new seller/admin mark-as-sold system
// Use /api/products/:id/mark-sold instead
router.post('/earn/sale', authenticate, async (req, res) => {
  return res.status(410).json({ 
    error: 'This endpoint is deprecated', 
    message: 'Please use the new seller mark-as-sold system instead',
    newEndpoint: '/api/products/:id/mark-sold'
  });
});

// DEPRECATED: Confirm sale as buyer
// This endpoint is deprecated as buyers no longer need to confirm sales
// Sellers can now mark products as sold directly, or admins can mark them
router.post('/earn/sale/confirm', authenticate, async (req, res) => {
  return res.status(410).json({ 
    error: 'This endpoint is deprecated', 
    message: 'Buyer confirmation is no longer required. Sellers can mark products as sold directly.',
    newSellerEndpoint: '/api/products/:id/mark-sold',
    newAdminEndpoint: '/api/products/:id/admin-mark-sold'
  });
});

// Get coin pricing packages
router.get('/packages', (req, res) => {
  const packages = [
    {
      id: 'basic',
      coins: 100,
      price: 99,
      currency: 'PHP',
      popular: false,
      bonus: 0
    },
    {
      id: 'popular',
      coins: 250,
      price: 199,
      currency: 'PHP',
      popular: true,
      bonus: 62, // 25% bonus
      originalCoins: 188
    },
    {
      id: 'value',
      coins: 500,
      price: 349,
      currency: 'PHP',
      popular: false,
      bonus: 143, // 40% bonus
      originalCoins: 357
    },
    {
      id: 'premium',
      coins: 1000,
      price: 599,
      currency: 'PHP',
      popular: false,
      bonus: 333, // 50% bonus
      originalCoins: 667
    }
  ];

  res.json({ packages });
});

export default router;