import express from 'express';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Request verification (authenticated users)
router.post('/request', authenticate, async (req, res) => {
  try {
    const { documents } = req.body;
    
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ error: 'At least one verification document is required' });
    }
    
    // Validate document structure
    for (const doc of documents) {
      if (!doc.type || !doc.url) {
        return res.status(400).json({ error: 'Each document must have type and url' });
      }
      if (!['government_id', 'proof_of_address', 'business_permit'].includes(doc.type)) {
        return res.status(400).json({ error: 'Invalid document type' });
      }
    }
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await user.requestVerification(documents);
    
    res.status(200).json({
      message: 'Verification request submitted successfully',
      verification: user.verification
    });
  } catch (error) {
    console.error('Verification request error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get verification status (authenticated users)
router.get('/status', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('verification.reviewedBy', 'firstName lastName')
      .select('isVerified verification');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json({
      isVerified: user.isVerified,
      verification: user.verification,
      canRequestVerification: user.canRequestVerification()
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({ error: 'Failed to get verification status' });
  }
});

// Get all pending verifications (admin only)
router.get('/pending', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const users = await User.find({
      'verification.status': 'pending'
    })
    .select('firstName lastName email phoneNumber location verification createdAt')
    .sort({ 'verification.requestedAt': -1 })
    .skip(skip)
    .limit(limit);
    
    const total = await User.countDocuments({
      'verification.status': 'pending'
    });
    
    res.status(200).json({
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({ error: 'Failed to get pending verifications' });
  }
});

// Get verification history (admin only)
router.get('/history', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status; // 'approved' or 'rejected'
    
    const query = {};
    if (status && ['approved', 'rejected'].includes(status)) {
      query['verification.status'] = status;
    } else {
      query['verification.status'] = { $in: ['approved', 'rejected'] };
    }
    
    const users = await User.find(query)
    .select('firstName lastName email verification isVerified')
    .populate('verification.reviewedBy', 'firstName lastName')
    .sort({ 'verification.reviewedAt': -1 })
    .skip(skip)
    .limit(limit);
    
    const total = await User.countDocuments(query);
    
    res.status(200).json({
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get verification history error:', error);
    res.status(500).json({ error: 'Failed to get verification history' });
  }
});

// Approve verification (admin only)
router.post('/approve/:userId', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { notes } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await user.approveVerification(req.user.userId, notes);
    
    res.status(200).json({
      message: 'User verification approved successfully',
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        isVerified: user.isVerified,
        verification: user.verification
      }
    });
  } catch (error) {
    console.error('Approve verification error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Reject verification (admin only)
router.post('/reject/:userId', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, notes } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await user.rejectVerification(req.user.userId, reason, notes);
    
    res.status(200).json({
      message: 'User verification rejected successfully',
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        isVerified: user.isVerified,
        verification: user.verification
      }
    });
  } catch (error) {
    console.error('Reject verification error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get verification statistics (admin only)
router.get('/stats', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const [pending, approved, rejected, totalVerified] = await Promise.all([
      User.countDocuments({ 'verification.status': 'pending' }),
      User.countDocuments({ 'verification.status': 'approved' }),
      User.countDocuments({ 'verification.status': 'rejected' }),
      User.countDocuments({ isVerified: true })
    ]);
    
    res.status(200).json({
      pending,
      approved,
      rejected,
      totalVerified,
      totalRequests: pending + approved + rejected
    });
  } catch (error) {
    console.error('Get verification stats error:', error);
    res.status(500).json({ error: 'Failed to get verification statistics' });
  }
});

export default router;