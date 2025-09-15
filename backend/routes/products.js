import express from 'express';
import Product from '../models/Product.js';
import User from '../models/User.js';
import CoinTransaction from '../models/CoinTransaction.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { trackApiUsage, trackProductInteraction } from '../middleware/analytics.js';

const router = express.Router();

// GET /api/products - Get all products with filtering and pagination
router.get('/', trackApiUsage('product_browse'), async (req, res) => {
  try {
    const {
      category = '',
      condition = '',
      priceMin,
      priceMax,
      city = '',
      search = '',
      page = 1,
      limit = 20,
      sortBy = 'newest'
    } = req.query;

    // Build filter object
    const filters = {};
    
    if (category && category !== 'All') {
      filters.category = category;
    }
    
    if (condition && condition !== '') {
      const conditionArray = condition.split(',').map(c => c.trim());
      filters.condition = conditionArray;
    }
    
    if (priceMin) filters.priceMin = parseFloat(priceMin);
    if (priceMax) filters.priceMax = parseFloat(priceMax);
    if (city) filters.city = city;
    if (search) filters.search = search;

    // Get products using the static method
    let query = Product.getFiltered(filters);

    // Apply additional sorting if needed
    if (sortBy === 'price-low') {
      query = query.sort({ price: 1 });
    } else if (sortBy === 'price-high') {
      query = query.sort({ price: -1 });
    } else if (sortBy === 'boosted') {
      // Sort by boosted first, then by creation date
      query = query.sort({ isBoosted: -1, createdAt: -1 });
    } else {
      // Default: newest first
      query = query.sort({ createdAt: -1 });
    }

    // Apply pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const products = await query.skip(skip).limit(parseInt(limit));

    // Transform image URLs to full URLs (since toJSON transform doesn't work with populated queries)
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
    const transformedProducts = products.map(product => {
      const productObj = product.toJSON();
      if (productObj.images && Array.isArray(productObj.images)) {
        productObj.images = productObj.images.map(img => {
          if (img.url && img.url.startsWith('/uploads/')) {
            return { ...img, url: `${baseUrl}${img.url}` };
          }
          return img;
        });
      }
      return productObj;
    });

    // Get total count for pagination
    const totalQuery = Product.find(query.getQuery());
    const total = await totalQuery.countDocuments();

    res.json({
      products: transformedProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total,
        hasNext: skip + products.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/categories - Get all categories with counts
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { isApproved: 'approved', availability: 'available' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json(categories.map(cat => ({
      name: cat._id,
      count: cat.count
    })));
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/products/featured - Get featured/boosted products
router.get('/featured', async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    
    const products = await Product.find({
      isApproved: 'approved',
      availability: 'available',
      isBoosted: true
    })
    .populate('seller', 'firstName lastName rating profilePicture location isVerified')
    .sort({ boostExpiresAt: -1, createdAt: -1 })
    .limit(parseInt(limit));

    // Transform image URLs to full URLs
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
    const transformedProducts = products.map(product => {
      const productObj = product.toJSON();
      if (productObj.images && Array.isArray(productObj.images)) {
        productObj.images = productObj.images.map(img => {
          if (img.url && img.url.startsWith('/uploads/')) {
            return { ...img, url: `${baseUrl}${img.url}` };
          }
          return img;
        });
      }
      return productObj;
    });

    res.json(transformedProducts);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
});

// GET /api/products/:id - Get single product by ID
router.get('/:id', trackProductInteraction('product_view'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'firstName lastName rating profilePicture location isVerified phoneNumber email');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Increment view count
    await product.incrementViews();

    // Transform image URLs to full URLs
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
    const productObj = product.toJSON();
    if (productObj.images && Array.isArray(productObj.images)) {
      productObj.images = productObj.images.map(img => {
        if (img.url && img.url.startsWith('/uploads/')) {
          return { ...img, url: `${baseUrl}${img.url}` };
        }
        return img;
      });
    }

    res.json(productObj);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/products - Create new product (requires authentication)
router.post('/', authenticate, trackApiUsage('product_create'), async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      category,
      condition,
      brand,
      model,
      specifications,
      images,
      location,
      tags,
      negotiable,
      shippingOptions,
      reasonForSelling
    } = req.body;

    // Check if user has remaining listings
    const user = req.user;
    
    // Initialize subscription if it doesn't exist (for users created before subscription schema)
    if (!user.subscription) {
      user.subscription = {
        plan: 'free',
        remainingListings: -1, // Unlimited listings
        remainingBoosts: 0,
        expiresAt: null,
        renewalDate: null
      };
      await user.save();
    }

    // Removed listing limits - all users can create unlimited listings

    const product = new Product({
      title,
      description,
      price,
      category,
      condition,
      brand,
      model,
      specifications,
      images,
      location,
      tags,
      seller: user._id,
      negotiable,
      shippingOptions,
      reasonForSelling
    });

    await product.save();

    // Removed: No longer decreasing listing counts - unlimited listings for all users

    await product.populate('seller', 'firstName lastName rating profilePicture location isVerified');

    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({ error: 'Failed to create product', details: error.message });
  }
});

// PUT /api/products/:id - Update product (requires authentication and ownership)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if user owns the product
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only edit your own products' });
    }

    // Update allowed fields
    const allowedUpdates = [
      'title', 'description', 'price', 'condition', 'specifications',
      'location', 'tags', 'negotiable', 'shippingOptions', 'reasonForSelling'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    // Reset approval status if significant changes are made
    const significantFields = ['title', 'description', 'price', 'category'];
    const hasSignificantChanges = significantFields.some(field => req.body[field] !== undefined);
    
    if (hasSignificantChanges) {
      product.isApproved = 'pending';
      product.approvedBy = null;
      product.approvalNotes = '';
    }

    await product.save();
    await product.populate('seller', 'firstName lastName rating profilePicture location isVerified');

    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).json({ error: 'Failed to update product', details: error.message });
  }
});

// DELETE /api/products/:id - Delete product (requires authentication and ownership)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if user owns the product or is admin
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only delete your own products' });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// POST /api/products/:id/boost - Boost a product (requires authentication and ownership)
router.post('/:id/boost', authenticate, trackProductInteraction('product_boost'), async (req, res) => {
  try {
    const { duration = 7 } = req.body;
    
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if user owns the product
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only boost your own products' });
    }

    // Check if user has remaining boosts
    if (req.user.subscription.remainingBoosts === 0) {
      return res.status(400).json({ 
        error: 'You have no remaining boosts. Please upgrade your subscription.' 
      });
    }

    // Boost the product
    product.boostListing(duration);
    await product.save();

    // Decrease remaining boosts
    req.user.subscription.remainingBoosts -= 1;
    await req.user.save();

    res.json({ message: 'Product boosted successfully', product });
  } catch (error) {
    console.error('Error boosting product:', error);
    res.status(500).json({ error: 'Failed to boost product' });
  }
});

// POST /api/products/:id/mark-sold - Mark product as sold by seller
router.post('/:id/mark-sold', authenticate, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if user owns the product
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only mark your own products as sold' });
    }

    // Check if already sold
    if (product.availability === 'sold') {
      return res.status(400).json({ error: 'Product is already marked as sold' });
    }

    // Calculate 10% transaction fee
    const feePercentage = 0.10;
    const baseFeeRate = 1; // 1 peso = 1 coin (adjust as needed)
    const transactionFee = Math.ceil(product.price * feePercentage * baseFeeRate);

    // Get user for coin balance check
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Allow negative balance - don't block the sale
    // Users can go negative and will need to purchase coins or earn more later

    // Mark product as sold
    await product.markAsSold(req.user._id, 'seller_marked');

    // Deduct transaction fee
    await CoinTransaction.createTransaction(
      user._id,
      'spend',
      transactionFee,
      'transaction_fee',
      `Transaction fee for selling ${product.title} (10% of ₱${product.price})`,
      { 
        relatedProduct: product._id,
        metadata: { 
          originalPrice: product.price,
          feePercentage: feePercentage * 100,
          saleMethod: 'seller_marked'
        }
      }
    );

    // Mark fee as applied
    product.saleStatus.transactionFeeApplied = true;
    await product.save();

    res.json({
      message: 'Product marked as sold successfully',
      product,
      transactionFee,
      feePercentage: feePercentage * 100,
      newCoinBalance: user.coins.balance - transactionFee
    });
  } catch (error) {
    console.error('Error marking product as sold:', error);
    res.status(500).json({ 
      error: 'Failed to mark product as sold', 
      details: error.message 
    });
  }
});

// Admin routes
// POST /api/products/:id/admin-mark-sold - Mark product as sold by admin
router.post('/:id/admin-mark-sold', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { reason = 'Admin marked as sold' } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if already sold
    if (product.availability === 'sold') {
      return res.status(400).json({ error: 'Product is already marked as sold' });
    }

    // Calculate 10% transaction fee
    const feePercentage = 0.10;
    const baseFeeRate = 1; // 1 peso = 1 coin (adjust as needed)
    const transactionFee = Math.ceil(product.price * feePercentage * baseFeeRate);

    // Get seller for coin balance check
    const seller = await User.findById(product.seller);
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Allow negative balance for seller - don't block admin actions
    // Seller can go negative and will need to purchase coins or earn more later

    // Mark product as sold
    await product.markAsSold(req.user._id, 'admin_marked');

    // Deduct transaction fee from seller
    await CoinTransaction.createTransaction(
      seller._id,
      'spend',
      transactionFee,
      'transaction_fee',
      `Transaction fee for selling ${product.title} (10% of ₱${product.price}) - Admin marked`,
      { 
        relatedProduct: product._id,
        relatedUser: req.user._id, // Admin who marked it
        metadata: { 
          originalPrice: product.price,
          feePercentage: feePercentage * 100,
          saleMethod: 'admin_marked',
          adminReason: reason
        }
      }
    );

    // Mark fee as applied
    product.saleStatus.transactionFeeApplied = true;
    await product.save();

    res.json({
      message: 'Product marked as sold by admin successfully',
      product,
      transactionFee,
      feePercentage: feePercentage * 100,
      sellerNewCoinBalance: seller.coins.balance - transactionFee,
      adminReason: reason
    });
  } catch (error) {
    console.error('Error marking product as sold by admin:', error);
    res.status(500).json({ 
      error: 'Failed to mark product as sold', 
      details: error.message 
    });
  }
});

// PUT /api/products/:id/approve - Approve/reject product (admin only)
router.put('/:id/approve', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { status, notes = '' } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid approval status' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        isApproved: status,
        approvedBy: req.user._id,
        approvalNotes: notes
      },
      { new: true }
    ).populate('seller', 'firstName lastName email');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: `Product ${status} successfully`, product });
  } catch (error) {
    console.error('Error approving product:', error);
    res.status(500).json({ error: 'Failed to approve product' });
  }
});

// DELETE /api/products/admin/clear-all - Clear all products (admin only) - for development
router.delete('/admin/clear-all', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const deleteResult = await Product.deleteMany({});
    console.log(`Admin cleared ${deleteResult.deletedCount} products`);
    
    res.json({
      message: `Successfully deleted ${deleteResult.deletedCount} products`,
      deletedCount: deleteResult.deletedCount
    });
  } catch (error) {
    console.error('Error clearing all products:', error);
    res.status(500).json({ error: 'Failed to clear products' });
  }
});

// DELETE /api/products/admin/clear-test-data - Clear specific test products (no auth required for cleanup)
router.delete('/admin/clear-test-data', async (req, res) => {
  try {
    const testProductTitles = [
      'Wilson Pro Staff 97 v14',
      'Babolat Pure Drive 2023',
      'Nike Court Air Zoom GP Turbo',
      'Head Speed MP 2024',
      'Yonex Poly Tour Pro 125'
    ];
    
    const deleteResult = await Product.deleteMany({
      title: { $in: testProductTitles }
    });
    
    console.log(`Cleared ${deleteResult.deletedCount} test products`);
    
    res.json({
      message: `Successfully deleted ${deleteResult.deletedCount} test products`,
      deletedCount: deleteResult.deletedCount,
      clearedTitles: testProductTitles
    });
  } catch (error) {
    console.error('Error clearing test products:', error);
    res.status(500).json({ error: 'Failed to clear test products' });
  }
});

// GET /api/products/admin/all - Get all products for admin (including pending)
router.get('/admin/all', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      status = 'all',
      search = ''
    } = req.query;

    // Build query for admin - can see all products regardless of approval status
    let query = {};
    
    if (status !== 'all') {
      query.isApproved = status;
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    // Get products with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const products = await Product.find(query)
      .populate('seller', 'firstName lastName email phoneNumber rating profilePicture location isVerified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total,
        hasNext: skip + products.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching all products for admin:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/admin/pending - Get pending products for admin
router.get('/admin/pending', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const products = await Product.find({ isApproved: 'pending' })
      .populate('seller', 'firstName lastName email phoneNumber rating profilePicture location isVerified')
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    console.error('Error fetching pending products:', error);
    res.status(500).json({ error: 'Failed to fetch pending products' });
  }
});

// GET /api/products/admin/stats - Get admin statistics
router.get('/admin/stats', authenticate, authorize(['admin']), async (req, res) => {
  try {
    // Get product stats
    const [
      totalListings,
      activeListings, 
      pendingApproval,
      boostedListings,
      totalUsers,
      freeUsers,
      basicUsers,
      proUsers
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isApproved: 'approved', availability: 'available' }),
      Product.countDocuments({ isApproved: 'pending' }),
      Product.countDocuments({ isBoosted: true }),
      User.countDocuments(),
      User.countDocuments({ 'subscription.plan': 'free' }),
      User.countDocuments({ 'subscription.plan': 'basic' }),
      User.countDocuments({ 'subscription.plan': 'pro' })
    ]);

    // Calculate real statistics
    const stats = {
      totalUsers,
      totalListings,
      activeListings,
      pendingApproval,
      totalTransactions: 0, // No transaction system implemented yet
      monthlyRevenue: 0,    // No payment system implemented yet
      boostedListings,
      subscriptions: {
        free: freeUsers,
        basic: basicUsers,
        pro: proUsers
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch admin statistics' });
  }
});

export default router;