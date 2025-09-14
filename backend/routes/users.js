import express from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /api/users/approval-stats - Get user approval statistics (admin only)
router.get('/approval-stats', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const [pendingUsers, activeUsers, totalUsers] = await Promise.all([
      User.countDocuments({ isActive: false }),
      User.countDocuments({ isActive: true }),
      User.countDocuments({})
    ]);
    
    res.json({
      pendingUsers,
      activeUsers,
      totalUsers,
      approvalRate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0
    });
  } catch (error) {
    console.error('Error fetching approval stats:', error);
    res.status(500).json({ error: 'Failed to fetch approval statistics' });
  }
});

// GET /api/users/pending-approval - Get users pending approval (admin only)
router.get('/pending-approval', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find({ isActive: false })
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments({ isActive: false });

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalUsers: total,
        hasNext: skip + users.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({ error: 'Failed to fetch pending users' });
  }
});

// GET /api/users/:id - Get user profile (public information)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -email -phoneNumber'); // Remove sensitive info

    if (!user || !user.isActive) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's active listings
    const listings = await Product.find({
      seller: user._id,
      isApproved: 'approved',
      availability: 'available'
    })
    .select('title price category condition images createdAt')
    .sort({ createdAt: -1 })
    .limit(10);

    res.json({
      ...user.toJSON(),
      activeListings: listings.length,
      recentListings: listings
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// GET /api/users/me/products - Get current user's products (own listings) - MUST BE BEFORE /:id/products
router.get('/me/products', authenticate, async (req, res) => {
  try {
    console.log('📦 /me/products called for user:', req.user?.email);
    const { page = 1, limit = 20, status = 'all' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    if (!req.user) {
      console.error('❌ No authenticated user found');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    console.log('🔍 User ID:', req.user._id);
    
    // Build query for current user's products
    const query = { seller: req.user._id };
    console.log('🔍 Query:', JSON.stringify(query));
    
    // Filter by status if specified
    if (status !== 'all') {
      if (status === 'active') {
        query.availability = 'available';
        query.isApproved = 'approved';
      } else if (status === 'sold') {
        query.availability = 'sold';
      } else if (status === 'pending') {
        query.isApproved = 'pending';
      } else if (status === 'rejected') {
        query.isApproved = 'rejected';
      }
    }
    
    console.log('🔍 Final query:', JSON.stringify(query));
    
    const products = await Product.find(query)
      .populate('seller', 'firstName lastName rating profilePicture isVerified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log('✅ Found products:', products.length);

    const total = await Product.countDocuments(query);
    console.log('✅ Total products:', total);

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
    console.error('❌ Error fetching user products:', error.name, error.message);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch user products' });
  }
});

// GET /api/users/:id/products - Get user's products
router.get('/:id/products', async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all' } = req.query;
    
    const user = await User.findById(req.params.id);
    if (!user || !user.isActive) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build query
    const query = { seller: user._id };
    
    // Filter by status if specified
    if (status !== 'all') {
      if (status === 'active') {
        query.availability = 'available';
        query.isApproved = 'approved';
      } else if (status === 'sold') {
        query.availability = 'sold';
      } else if (status === 'pending') {
        query.isApproved = 'pending';
      }
    }

    // For public view, only show approved and available products
    if (!req.user || req.user._id.toString() !== user._id.toString()) {
      query.isApproved = 'approved';
      query.availability = 'available';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await Product.find(query)
      .populate('seller', 'firstName lastName rating profilePicture isVerified')
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
    console.error('Error fetching user products:', error);
    res.status(500).json({ error: 'Failed to fetch user products' });
  }
});

// POST /api/users/favorites/:productId - Add product to favorites
router.post('/favorites/:productId', authenticate, async (req, res) => {
  try {
    const productId = req.params.productId;
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const user = req.user;
    
    // Check if already in favorites
    if (user.favorites.includes(productId)) {
      return res.status(400).json({ error: 'Product already in favorites' });
    }

    // Add to favorites
    user.favorites.push(productId);
    await user.save();

    // Update product favorites count
    await Product.findByIdAndUpdate(productId, {
      $inc: { favorites: 1 }
    });

    res.json({ message: 'Product added to favorites' });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({ error: 'Failed to add to favorites' });
  }
});

// DELETE /api/users/favorites/:productId - Remove product from favorites
router.delete('/favorites/:productId', authenticate, async (req, res) => {
  try {
    const productId = req.params.productId;
    const user = req.user;
    
    // Check if in favorites
    if (!user.favorites.includes(productId)) {
      return res.status(400).json({ error: 'Product not in favorites' });
    }

    // Remove from favorites
    user.favorites = user.favorites.filter(id => id.toString() !== productId);
    await user.save();

    // Update product favorites count
    await Product.findByIdAndUpdate(productId, {
      $inc: { favorites: -1 }
    });

    res.json({ message: 'Product removed from favorites' });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({ error: 'Failed to remove from favorites' });
  }
});

// GET /api/users/me/favorites - Get user's favorites
router.get('/me/favorites', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const user = await User.findById(req.user._id)
      .populate({
        path: 'favorites',
        match: { isApproved: 'approved', availability: 'available' },
        populate: {
          path: 'seller',
          select: 'firstName lastName rating profilePicture isVerified location'
        },
        options: {
          sort: { createdAt: -1 },
          skip: (parseInt(page) - 1) * parseInt(limit),
          limit: parseInt(limit)
        }
      });

    const favorites = user.favorites;
    const total = await User.aggregate([
      { $match: { _id: user._id } },
      { $project: { favoritesCount: { $size: '$favorites' } } }
    ]);

    res.json({
      products: favorites,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total[0]?.favoritesCount / parseInt(limit)) || 0,
        totalProducts: total[0]?.favoritesCount || 0,
        hasNext: (parseInt(page) * parseInt(limit)) < (total[0]?.favoritesCount || 0),
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// POST /api/users/me/subscription - Update subscription
router.post('/me/subscription', authenticate, async (req, res) => {
  try {
    const { plan, duration = 30 } = req.body;
    
    if (!['free', 'basic', 'pro'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid subscription plan' });
    }

    const user = req.user;
    user.updateSubscription(plan, duration);
    await user.save();

    res.json({ 
      message: 'Subscription updated successfully',
      subscription: user.subscription 
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// Admin routes
// GET /api/users - Get all users (admin only)
router.get('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 50, role = '', status = 'all' } = req.query;
    
    const query = {};
    
    if (role) {
      query.role = role;
    }
    
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalUsers: total,
        hasNext: skip + users.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PUT /api/users/:id/status - Update user status (admin only)
router.put('/:id/status', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { isActive, role } = req.body;
    
    const updates = {};
    if (typeof isActive === 'boolean') {
      updates.isActive = isActive;
    }
    if (role && ['buyer', 'seller', 'admin'].includes(role)) {
      updates.role = role;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User status updated successfully', user });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// POST /api/users/:id/approve - Approve user account (admin only)
router.post('/:id/approve', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { notes } = req.body;
    
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isActive) {
      return res.status(400).json({ error: 'User account is already approved' });
    }

    // Activate user account
    user.isActive = true;
    
    // Initialize free tier benefits if not already initialized
    if (user.subscription.plan === 'free' && user.coins.balance === 0) {
      user.initializeFreeTier();
    }
    
    await user.save();

    // Create signup bonus transaction now that user is approved
    try {
      const CoinTransaction = (await import('../models/CoinTransaction.js')).default;
      await CoinTransaction.createTransaction(
        user._id,
        'earn',
        50,
        'signup_bonus',
        'Welcome bonus for new user approval',
        {}
      );
    } catch (transactionError) {
      console.error('Failed to create signup bonus transaction:', transactionError);
      // Continue with approval even if transaction creation fails
    }

    res.json({ 
      message: 'User account approved successfully',
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

// POST /api/users/approve-all - Approve all pending users (admin only)
router.post('/approve-all', authenticate, authorize(['admin']), async (req, res) => {
  try {
    // Get all pending users
    const pendingUsers = await User.find({ isActive: false });
    
    if (pendingUsers.length === 0) {
      return res.json({ 
        message: 'No pending users to approve',
        approvedCount: 0
      });
    }

    const CoinTransaction = (await import('../models/CoinTransaction.js')).default;
    let approvedCount = 0;

    // Process each user individually to properly initialize benefits
    for (const user of pendingUsers) {
      try {
        // Activate user account
        user.isActive = true;
        
        // Initialize free tier benefits if not already initialized
        if (user.subscription.plan === 'free' && user.coins.balance === 0) {
          user.initializeFreeTier();
        }
        
        await user.save();

        // Create signup bonus transaction
        try {
          await CoinTransaction.createTransaction(
            user._id,
            'earn',
            50,
            'signup_bonus',
            'Welcome bonus for new user approval',
            {}
          );
        } catch (transactionError) {
          console.error(`Failed to create signup bonus for user ${user._id}:`, transactionError);
          // Continue processing other users
        }

        approvedCount++;
      } catch (error) {
        console.error(`Failed to approve user ${user._id}:`, error);
        // Continue processing other users
      }
    }

    res.json({ 
      message: `Successfully approved ${approvedCount} user accounts`,
      approvedCount: approvedCount
    });
  } catch (error) {
    console.error('Error approving all users:', error);
    res.status(500).json({ error: 'Failed to approve all users' });
  }
});

// GET /api/users/:id/registration-info - Get user registration details (admin only)
router.get('/:id/registration-info', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('registration createdAt email firstName lastName');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const similarRegistrations = await User.find({
      $or: [
        { 'registration.ipAddress': user.registration.ipAddress },
        { 'registration.deviceFingerprint': user.registration.deviceFingerprint }
      ],
      _id: { $ne: user._id }
    }).select('email firstName lastName createdAt registration.ipAddress registration.deviceFingerprint registration.isDuplicateApproved');

    res.json({
      user: {
        id: user._id,
        email: user.email,
        fullName: `${user.firstName} ${user.lastName}`,
        registrationInfo: user.registration,
        createdAt: user.createdAt
      },
      similarRegistrations: similarRegistrations.map(u => ({
        id: u._id,
        email: u.email,
        fullName: `${u.firstName} ${u.lastName}`,
        createdAt: u.createdAt,
        ipAddress: u.registration.ipAddress,
        deviceFingerprint: u.registration.deviceFingerprint,
        isDuplicateApproved: u.registration.isDuplicateApproved
      }))
    });
  } catch (error) {
    console.error('Error fetching registration info:', error);
    res.status(500).json({ error: 'Failed to fetch registration info' });
  }
});

// POST /api/users/:id/approve-duplicate - Approve duplicate registration (admin only)
router.post('/:id/approve-duplicate', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: 'Approval reason is required' });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.registration.isDuplicateApproved = true;
    user.registration.approvedBy = req.user._id;
    user.registration.approvalReason = reason;
    
    await user.save();

    res.json({ 
      message: 'Duplicate registration approved successfully',
      user: {
        id: user._id,
        email: user.email,
        fullName: `${user.firstName} ${user.lastName}`,
        approvalInfo: {
          isDuplicateApproved: true,
          approvedBy: req.user._id,
          approvalReason: reason,
          approvedAt: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Error approving duplicate registration:', error);
    res.status(500).json({ error: 'Failed to approve duplicate registration' });
  }
});

// GET /api/users/registration-violations - Get registration violations (admin only)
router.get('/registration-violations', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { type = 'all', page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let pipeline = [];

    if (type === 'duplicate-ip') {
      pipeline = [
        {
          $group: {
            _id: '$registration.ipAddress',
            users: {
              $push: {
                id: '$_id',
                email: '$email',
                fullName: { $concat: ['$firstName', ' ', '$lastName'] },
                createdAt: '$createdAt',
                isActive: '$isActive',
                isDuplicateApproved: '$registration.isDuplicateApproved'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $match: { count: { $gt: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $skip: skip },
        { $limit: parseInt(limit) }
      ];
    } else if (type === 'duplicate-device') {
      pipeline = [
        {
          $group: {
            _id: '$registration.deviceFingerprint',
            users: {
              $push: {
                id: '$_id',
                email: '$email',
                fullName: { $concat: ['$firstName', ' ', '$lastName'] },
                createdAt: '$createdAt',
                isActive: '$isActive',
                isDuplicateApproved: '$registration.isDuplicateApproved'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $match: { count: { $gt: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $skip: skip },
        { $limit: parseInt(limit) }
      ];
    } else {
      const duplicateIPs = await User.aggregate([
        {
          $group: {
            _id: '$registration.ipAddress',
            count: { $sum: 1 },
            users: { $push: { id: '$_id', email: '$email', createdAt: '$createdAt' } }
          }
        },
        { $match: { count: { $gt: 1 } } }
      ]);

      const duplicateDevices = await User.aggregate([
        {
          $group: {
            _id: '$registration.deviceFingerprint',
            count: { $sum: 1 },
            users: { $push: { id: '$_id', email: '$email', createdAt: '$createdAt' } }
          }
        },
        { $match: { count: { $gt: 1 } } }
      ]);

      return res.json({
        summary: {
          duplicateIPs: duplicateIPs.length,
          duplicateDevices: duplicateDevices.length,
          totalAffectedUsers: duplicateIPs.reduce((sum, group) => sum + group.count, 0) + 
                              duplicateDevices.reduce((sum, group) => sum + group.count, 0)
        },
        duplicateIPs: duplicateIPs.slice(0, 5),
        duplicateDevices: duplicateDevices.slice(0, 5)
      });
    }

    const violations = await User.aggregate(pipeline);

    res.json({
      violations,
      pagination: {
        currentPage: parseInt(page),
        hasNext: violations.length === parseInt(limit),
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching registration violations:', error);
    res.status(500).json({ error: 'Failed to fetch registration violations' });
  }
});

// PUT /api/users/:id/suspend - Suspend user account (admin only)
router.put('/:id/suspend', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { reason, type = 'temporary', duration, notes, reportId } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Suspension reason is required' });
    }

    const validTypes = ['temporary', 'indefinite', 'permanent'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid suspension type' });
    }

    if (type === 'temporary' && !duration) {
      return res.status(400).json({ error: 'Duration is required for temporary suspensions' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot suspend admin users' });
    }

    if (user.suspension.isSuspended && user.suspension.suspensionType === 'permanent') {
      return res.status(400).json({ error: 'User is already permanently banned' });
    }

    // Suspend the user
    await user.suspendUser(req.user._id, reason, type, duration, reportId, notes);

    console.log(`🚫 User ${user.email} suspended (${type}) by admin ${req.user.email}: ${reason}`);

    res.json({
      message: `User ${type === 'permanent' ? 'permanently banned' : 'suspended'} successfully`,
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        suspension: {
          isSuspended: user.suspension.isSuspended,
          suspensionType: user.suspension.suspensionType,
          suspensionReason: user.suspension.suspensionReason,
          suspendedAt: user.suspension.suspendedAt,
          suspensionEnd: user.suspension.suspensionEnd,
          timeRemaining: user.suspension.timeRemaining
        }
      }
    });
  } catch (error) {
    console.error('Error suspending user:', error);
    res.status(500).json({ error: 'Failed to suspend user' });
  }
});

// PUT /api/users/:id/unsuspend - Unsuspend user account (admin only)
router.put('/:id/unsuspend', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { reason, notes } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Unsuspension reason is required' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.suspension.isSuspended) {
      return res.status(400).json({ error: 'User is not currently suspended' });
    }

    if (user.suspension.suspensionType === 'permanent') {
      return res.status(400).json({
        error: 'Cannot unsuspend permanently banned users. Contact system administrator.'
      });
    }

    // Unsuspend the user
    await user.unsuspendUser(req.user._id, reason, notes);

    console.log(`✅ User ${user.email} unsuspended by admin ${req.user.email}: ${reason}`);

    res.json({
      message: 'User unsuspended successfully',
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        isActive: user.isActive,
        suspension: {
          isSuspended: user.suspension.isSuspended
        }
      }
    });
  } catch (error) {
    console.error('Error unsuspending user:', error);
    res.status(500).json({ error: 'Failed to unsuspend user' });
  }
});

// POST /api/users/:id/warn - Issue warning to user (admin only)
router.post('/:id/warn', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { reason, notes, reportId } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Warning reason is required' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot warn admin users' });
    }

    // Issue warning
    await user.issueWarning(req.user._id, reason, reportId, notes);

    console.log(`⚠️ Warning issued to ${user.email} by admin ${req.user.email}: ${reason}`);

    res.json({
      message: 'Warning issued successfully',
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        warningCount: user.suspension.warningCount
      }
    });
  } catch (error) {
    console.error('Error issuing warning:', error);
    res.status(500).json({ error: 'Failed to issue warning' });
  }
});

// GET /api/users/:id/suspension-history - Get user suspension history (admin only)
router.get('/:id/suspension-history', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('suspension.history.actionBy', 'firstName lastName email role')
      .populate('suspension.history.relatedReport', '_id type reason createdAt');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const history = user.getSuspensionHistory();

    res.json({
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        currentStatus: user.getDisplayStatus(),
        warningCount: user.suspension.warningCount
      },
      history: history.map(entry => ({
        id: entry._id,
        action: entry.action,
        reason: entry.reason,
        actionDate: entry.actionDate,
        duration: entry.duration,
        notes: entry.notes,
        actionBy: entry.actionBy ? {
          id: entry.actionBy._id,
          name: `${entry.actionBy.firstName} ${entry.actionBy.lastName}`,
          email: entry.actionBy.email,
          role: entry.actionBy.role
        } : null,
        relatedReport: entry.relatedReport ? {
          id: entry.relatedReport._id,
          type: entry.relatedReport.type,
          reason: entry.relatedReport.reason,
          createdAt: entry.relatedReport.createdAt
        } : null
      }))
    });
  } catch (error) {
    console.error('Error fetching suspension history:', error);
    res.status(500).json({ error: 'Failed to fetch suspension history' });
  }
});

// GET /api/users/suspended - Get all suspended users (admin only)
router.get('/suspended', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 20, type = 'all' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { 'suspension.isSuspended': true };

    if (type !== 'all') {
      query['suspension.suspensionType'] = type;
    }

    const users = await User.find(query)
      .select('-password')
      .populate('suspension.suspendedBy', 'firstName lastName email role')
      .sort({ 'suspension.suspendedAt': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users: users.map(user => ({
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        suspension: {
          suspensionType: user.suspension.suspensionType,
          suspensionReason: user.suspension.suspensionReason,
          suspendedAt: user.suspension.suspendedAt,
          suspensionEnd: user.suspension.suspensionEnd,
          timeRemaining: user.suspension.timeRemaining,
          warningCount: user.suspension.warningCount,
          suspendedBy: user.suspension.suspendedBy ? {
            name: `${user.suspension.suspendedBy.firstName} ${user.suspension.suspendedBy.lastName}`,
            role: user.suspension.suspendedBy.role
          } : null
        },
        canAppeal: user.canAppeal(),
        status: user.getDisplayStatus()
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalUsers: total,
        hasNext: skip + users.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching suspended users:', error);
    res.status(500).json({ error: 'Failed to fetch suspended users' });
  }
});

// DELETE /api/users/clear-test-data - Clear test user accounts (for cleanup)
router.delete('/clear-test-data', async (req, res) => {
  try {
    const testUserEmails = [
      'sample@tennismarket.ph',
      'test@tennis.com',
      'demo@tennis.ph',
      'mockuser@tennis.com'
    ];
    
    const deleteResult = await User.deleteMany({
      email: { $in: testUserEmails }
    });
    
    console.log(`Cleared ${deleteResult.deletedCount} test users`);
    
    res.json({
      message: `Successfully deleted ${deleteResult.deletedCount} test users`,
      deletedCount: deleteResult.deletedCount,
      clearedEmails: testUserEmails
    });
  } catch (error) {
    console.error('Error clearing test users:', error);
    res.status(500).json({ error: 'Failed to clear test users' });
  }
});

export default router;