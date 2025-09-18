import express from 'express';
import LookingFor from '../models/LookingFor.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { trackApiUsage, trackProductInteraction } from '../middleware/analytics.js';

const router = express.Router();

// GET /api/lookingfor - Get all Looking For posts with filtering and pagination
router.get('/', trackApiUsage('looking_for_browse'), async (req, res) => {
  console.log('🔍 LOOKING FOR ROUTE HIT:', req.method, req.path);
  console.log('🔍 Query params:', req.query);
  try {
    const {
      category = '',
      condition = '',
      budgetMin,
      budgetMax,
      city = '',
      urgency = '',
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

    if (budgetMin) filters.budgetMin = parseFloat(budgetMin);
    if (budgetMax) filters.budgetMax = parseFloat(budgetMax);
    if (city) filters.city = city;
    if (urgency) filters.urgency = urgency;
    if (search) filters.search = search;

    // Get Looking For posts using the static method
    let query = LookingFor.getFiltered(filters);

    // Apply additional sorting if needed
    if (sortBy === 'budget-low') {
      query = query.sort({ 'budget.max': 1 });
    } else if (sortBy === 'budget-high') {
      query = query.sort({ 'budget.max': -1 });
    } else if (sortBy === 'urgent') {
      query = query.sort({ urgency: 1, isUrgent: -1, createdAt: -1 });
    } else if (sortBy === 'responses') {
      // Sort by response count - handled in aggregation if needed
      query = query.sort({ createdAt: -1 });
    } else {
      // Default: newest first
      query = query.sort({ createdAt: -1 });
    }

    // Apply pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const lookingForPosts = await query.skip(skip).limit(parseInt(limit));

    // Get total count for pagination
    const totalQuery = LookingFor.find(query.getQuery());
    const total = await totalQuery.countDocuments();

    res.json({
      lookingForPosts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalPosts: total,
        hasNext: skip + lookingForPosts.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching Looking For posts:', error);
    res.status(500).json({ error: 'Failed to fetch Looking For posts' });
  }
});

// GET /api/lookingfor/categories - Get all categories with counts
router.get('/categories', async (req, res) => {
  try {
    const categories = await LookingFor.aggregate([
      { $match: { status: 'active' } },
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

// GET /api/lookingfor/urgent - Get urgent Looking For posts
router.get('/urgent', async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const urgentPosts = await LookingFor.find({
      status: 'active',
      $or: [
        { isUrgent: true },
        { urgency: 'asap' },
        { urgency: 'within_week' }
      ]
    })
    .populate('buyer', 'firstName lastName rating profilePicture location isVerified')
    .sort({ isUrgent: -1, urgency: 1, createdAt: -1 })
    .limit(parseInt(limit));

    res.json(urgentPosts);
  } catch (error) {
    console.error('Error fetching urgent posts:', error);
    res.status(500).json({ error: 'Failed to fetch urgent posts' });
  }
});

// GET /api/lookingfor/:id - Get single Looking For post by ID
router.get('/:id', trackProductInteraction('looking_for_view'), async (req, res) => {
  try {
    const lookingForPost = await LookingFor.findById(req.params.id)
      .populate('buyer', 'firstName lastName rating profilePicture location isVerified phoneNumber email')
      .populate('responses.seller', 'firstName lastName rating profilePicture location isVerified phoneNumber email')
      .populate('responses.product', 'title price images condition brand model location');

    if (!lookingForPost) {
      return res.status(404).json({ error: 'Looking For post not found' });
    }

    // Increment view count
    await lookingForPost.incrementViews();

    res.json(lookingForPost);
  } catch (error) {
    console.error('Error fetching Looking For post:', error);
    res.status(500).json({ error: 'Failed to fetch Looking For post' });
  }
});

// POST /api/lookingfor - Create new Looking For post (requires authentication)
router.post('/', authenticate, trackApiUsage('looking_for_create'), async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      subcategory,
      budget,
      condition,
      preferredBrands,
      specifications,
      location,
      urgency,
      tags,
      shippingPreferences,
      additionalNotes,
      isUrgent
    } = req.body;

    // Check if user has remaining Looking For posts based on subscription
    const user = req.user;

    // Initialize subscription if it doesn't exist
    if (!user.subscription) {
      user.subscription = {
        plan: 'free',
        remainingListings: -1,
        remainingBoosts: 0,
        expiresAt: null,
        renewalDate: null
      };
      await user.save();
    }

    // Check Looking For post limits based on subscription
    const activePosts = await LookingFor.countDocuments({
      buyer: user._id,
      status: 'active'
    });

    let maxPosts;
    switch (user.subscription.plan) {
      case 'free':
        maxPosts = 2;
        break;
      case 'basic':
        maxPosts = 5;
        break;
      case 'pro':
        maxPosts = -1; // Unlimited
        break;
      default:
        maxPosts = 2;
    }

    if (maxPosts !== -1 && activePosts >= maxPosts) {
      return res.status(400).json({
        error: `You have reached your limit of ${maxPosts} active Looking For posts. Please upgrade your subscription or wait for existing posts to expire.`
      });
    }

    const lookingForPost = new LookingFor({
      title,
      description,
      category,
      subcategory,
      budget,
      condition,
      preferredBrands,
      specifications,
      location,
      urgency,
      tags,
      buyer: user._id,
      shippingPreferences,
      additionalNotes,
      isUrgent: isUrgent || false
    });

    await lookingForPost.save();
    await lookingForPost.populate('buyer', 'firstName lastName rating profilePicture location isVerified');

    res.status(201).json(lookingForPost);
  } catch (error) {
    console.error('Error creating Looking For post:', error);
    res.status(400).json({ error: 'Failed to create Looking For post', details: error.message });
  }
});

// PUT /api/lookingfor/:id - Update Looking For post (requires authentication and ownership)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const lookingForPost = await LookingFor.findById(req.params.id);

    if (!lookingForPost) {
      return res.status(404).json({ error: 'Looking For post not found' });
    }

    // Check if user owns the post
    if (lookingForPost.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only edit your own Looking For posts' });
    }

    // Update allowed fields
    const allowedUpdates = [
      'title', 'description', 'budget', 'condition', 'preferredBrands',
      'specifications', 'location', 'urgency', 'tags', 'shippingPreferences',
      'additionalNotes', 'isUrgent'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        lookingForPost[field] = req.body[field];
      }
    });

    // Extend expiry when updated
    lookingForPost.extendExpiry(30);

    await lookingForPost.save();
    await lookingForPost.populate('buyer', 'firstName lastName rating profilePicture location isVerified');

    res.json(lookingForPost);
  } catch (error) {
    console.error('Error updating Looking For post:', error);
    res.status(400).json({ error: 'Failed to update Looking For post', details: error.message });
  }
});

// DELETE /api/lookingfor/:id - Delete Looking For post (requires authentication and ownership)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const lookingForPost = await LookingFor.findById(req.params.id);

    if (!lookingForPost) {
      return res.status(404).json({ error: 'Looking For post not found' });
    }

    // Check if user owns the post or is admin
    if (lookingForPost.buyer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only delete your own Looking For posts' });
    }

    await LookingFor.findByIdAndDelete(req.params.id);

    res.json({ message: 'Looking For post deleted successfully' });
  } catch (error) {
    console.error('Error deleting Looking For post:', error);
    res.status(500).json({ error: 'Failed to delete Looking For post' });
  }
});

// POST /api/lookingfor/:id/respond - Respond to a Looking For post (requires authentication)
router.post('/:id/respond', authenticate, trackProductInteraction('looking_for_respond'), async (req, res) => {
  try {
    const {
      message,
      productId,
      contactInfo,
      price,
      negotiable = true
    } = req.body;

    const lookingForPost = await LookingFor.findById(req.params.id);

    if (!lookingForPost) {
      return res.status(404).json({ error: 'Looking For post not found' });
    }

    // Check if post is still active
    if (lookingForPost.status !== 'active') {
      return res.status(400).json({ error: 'This Looking For post is no longer active' });
    }

    // Allow owner to respond only if they are replying to existing responses
    const isOwner = lookingForPost.buyer.toString() === req.user._id.toString();
    if (isOwner && lookingForPost.responses.length === 0) {
      return res.status(400).json({ error: 'You cannot respond to your own Looking For post until someone else responds first' });
    }

    // Check if user already responded (only prevent non-owners from responding multiple times)
    if (!isOwner) {
      const existingResponse = lookingForPost.responses.find(
        response => response.seller.toString() === req.user._id.toString()
      );

      if (existingResponse) {
        return res.status(400).json({ error: 'You have already responded to this Looking For post' });
      }
    }

    // Validate product if provided
    let product = null;
    if (productId) {
      product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Check if user owns the product
      if (product.seller.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'You can only respond with your own products' });
      }
    }

    const responseData = {
      seller: req.user._id,
      message,
      product: productId || null,
      contactInfo: {
        ...contactInfo,
        phone: contactInfo.phone || req.user.phoneNumber,
        whatsapp: contactInfo.whatsapp || req.user.phoneNumber
      },
      price,
      negotiable
    };

    await lookingForPost.addResponse(responseData);
    await lookingForPost.populate('responses.seller', 'firstName lastName rating profilePicture location isVerified');
    if (productId) {
      await lookingForPost.populate('responses.product', 'title price images condition brand model');
    }

    res.status(201).json({
      message: 'Response added successfully',
      lookingForPost,
      response: lookingForPost.responses[lookingForPost.responses.length - 1]
    });
  } catch (error) {
    console.error('Error responding to Looking For post:', error);
    res.status(400).json({ error: 'Failed to respond to Looking For post', details: error.message });
  }
});

// GET /api/lookingfor/:id/responses - Get responses for a Looking For post
router.get('/:id/responses', async (req, res) => {
  try {
    const lookingForPost = await LookingFor.findById(req.params.id)
      .populate('responses.seller', 'firstName lastName rating profilePicture location isVerified phoneNumber')
      .populate('responses.product', 'title price images condition brand model location');

    if (!lookingForPost) {
      return res.status(404).json({ error: 'Looking For post not found' });
    }

    res.json({
      responses: lookingForPost.responses,
      responseCount: lookingForPost.responseCount
    });
  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

// POST /api/lookingfor/:id/mark-fulfilled - Mark Looking For post as fulfilled
router.post('/:id/mark-fulfilled', authenticate, async (req, res) => {
  try {
    const lookingForPost = await LookingFor.findById(req.params.id);

    if (!lookingForPost) {
      return res.status(404).json({ error: 'Looking For post not found' });
    }

    // Check if user owns the post
    if (lookingForPost.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only mark your own Looking For posts as fulfilled' });
    }

    await lookingForPost.markFulfilled();

    res.json({ message: 'Looking For post marked as fulfilled successfully', lookingForPost });
  } catch (error) {
    console.error('Error marking Looking For post as fulfilled:', error);
    res.status(500).json({ error: 'Failed to mark Looking For post as fulfilled' });
  }
});

// POST /api/lookingfor/:id/extend - Extend expiry of Looking For post
router.post('/:id/extend', authenticate, async (req, res) => {
  try {
    const { days = 30 } = req.body;
    const lookingForPost = await LookingFor.findById(req.params.id);

    if (!lookingForPost) {
      return res.status(404).json({ error: 'Looking For post not found' });
    }

    // Check if user owns the post
    if (lookingForPost.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only extend your own Looking For posts' });
    }

    await lookingForPost.extendExpiry(days);

    res.json({
      message: `Looking For post extended by ${days} days successfully`,
      lookingForPost,
      newExpiryDate: lookingForPost.expiresAt
    });
  } catch (error) {
    console.error('Error extending Looking For post:', error);
    res.status(500).json({ error: 'Failed to extend Looking For post' });
  }
});

// Admin routes
// GET /api/lookingfor/admin/all - Get all Looking For posts for admin
router.get('/admin/all', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status = 'all',
      search = ''
    } = req.query;

    let query = {};

    if (status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const lookingForPosts = await LookingFor.find(query)
      .populate('buyer', 'firstName lastName email phoneNumber rating profilePicture location isVerified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await LookingFor.countDocuments(query);

    res.json({
      lookingForPosts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalPosts: total,
        hasNext: skip + lookingForPosts.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching all Looking For posts for admin:', error);
    res.status(500).json({ error: 'Failed to fetch Looking For posts' });
  }
});

// POST /api/lookingfor/admin/expire-old - Expire old Looking For posts (admin)
router.post('/admin/expire-old', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const result = await LookingFor.expireOldPosts();

    res.json({
      message: 'Old Looking For posts expired successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error expiring old Looking For posts:', error);
    res.status(500).json({ error: 'Failed to expire old Looking For posts' });
  }
});

// GET /api/lookingfor/admin/stats - Get Looking For statistics
router.get('/admin/stats', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const [
      totalPosts,
      activePosts,
      fulfilledPosts,
      expiredPosts,
      totalResponses
    ] = await Promise.all([
      LookingFor.countDocuments(),
      LookingFor.countDocuments({ status: 'active' }),
      LookingFor.countDocuments({ status: 'fulfilled' }),
      LookingFor.countDocuments({ status: 'expired' }),
      LookingFor.aggregate([
        { $unwind: '$responses' },
        { $count: 'total' }
      ])
    ]);

    const stats = {
      totalPosts,
      activePosts,
      fulfilledPosts,
      expiredPosts,
      totalResponses: totalResponses[0]?.total || 0,
      fulfillmentRate: totalPosts > 0 ? ((fulfilledPosts / totalPosts) * 100).toFixed(2) : 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching Looking For stats:', error);
    res.status(500).json({ error: 'Failed to fetch Looking For statistics' });
  }
});

export default router;