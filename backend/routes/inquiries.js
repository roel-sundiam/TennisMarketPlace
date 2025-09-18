import express from 'express';
import Inquiry from '../models/Inquiry.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Create a new inquiry (buyer to seller)
router.post('/', authenticate, async (req, res) => {
  try {
    const { productId, message, buyerPhone } = req.body;
    const buyerId = req.user.id;

    // Validate required fields
    if (!productId || !message || !buyerPhone) {
      return res.status(400).json({
        error: 'Product ID, message, and phone number are required'
      });
    }

    // Get product details
    const product = await Product.findById(productId).populate('sellerId', 'name email');
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get buyer details
    const buyer = await User.findById(buyerId);
    if (!buyer) {
      return res.status(404).json({ error: 'Buyer not found' });
    }

    // Prevent buyers from inquiring about their own products
    if (product.sellerId._id.toString() === buyerId) {
      return res.status(400).json({
        error: 'Cannot inquire about your own product'
      });
    }

    // Check if buyer already has a pending inquiry for this product
    const existingInquiry = await Inquiry.findOne({
      productId,
      buyerId,
      status: { $in: ['pending', 'responded'] }
    });

    if (existingInquiry) {
      return res.status(400).json({
        error: 'You already have an active inquiry for this product'
      });
    }

    // Create new inquiry
    const inquiry = new Inquiry({
      productId,
      productTitle: product.title,
      buyerId,
      buyerName: buyer.name,
      buyerEmail: buyer.email,
      buyerPhone,
      sellerId: product.sellerId._id,
      sellerName: product.sellerId.name,
      message
    });

    await inquiry.save();

    // Populate references for response
    await inquiry.populate([
      { path: 'buyerId', select: 'name email' },
      { path: 'sellerId', select: 'name email' },
      { path: 'productId', select: 'title price images' }
    ]);

    res.status(201).json({
      message: 'Inquiry sent successfully',
      inquiry
    });

  } catch (error) {
    console.error('Create inquiry error:', error);
    res.status(500).json({ error: 'Failed to send inquiry' });
  }
});

// Get inquiries for current user (buyer or seller)
router.get('/my-inquiries', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 20,
      status,
      type = 'all' // 'sent' (as buyer), 'received' (as seller), 'all'
    } = req.query;

    let filter = {};

    if (type === 'sent') {
      filter.buyerId = userId;
    } else if (type === 'received') {
      filter.sellerId = userId;
    } else {
      filter.$or = [
        { buyerId: userId },
        { sellerId: userId }
      ];
    }

    if (status) {
      filter.status = status;
    }

    const inquiries = await Inquiry.find(filter)
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email')
      .populate('productId', 'title price images')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Inquiry.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.json({
      inquiries,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalInquiries: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get user inquiries error:', error);
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
});

// Get all inquiries (admin only)
router.get('/all', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      isReviewed,
      buyerId,
      sellerId,
      productId,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const inquiries = await Inquiry.getFiltered({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      isReviewed: isReviewed !== undefined ? isReviewed === 'true' : undefined,
      buyerId,
      sellerId,
      productId,
      sortBy,
      sortOrder
    });

    const filter = {};
    if (status) filter.status = status;
    if (isReviewed !== undefined) filter.isReviewed = isReviewed === 'true';
    if (buyerId) filter.buyerId = buyerId;
    if (sellerId) filter.sellerId = sellerId;
    if (productId) filter.productId = productId;

    const total = await Inquiry.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.json({
      inquiries,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalInquiries: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get all inquiries error:', error);
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
});

// Get inquiry statistics (admin only)
router.get('/stats', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const stats = await Inquiry.getStats();

    const result = stats[0] || {
      total: 0,
      pending: { count: 0 },
      responded: { count: 0 },
      resolved: { count: 0 },
      closed: { count: 0 }
    };

    res.json({
      total: result.total,
      pending: result.pending?.count || 0,
      responded: result.responded?.count || 0,
      resolved: result.resolved?.count || 0,
      closed: result.closed?.count || 0
    });

  } catch (error) {
    console.error('Get inquiry stats error:', error);
    res.status(500).json({ error: 'Failed to fetch inquiry statistics' });
  }
});

// Get specific inquiry by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const inquiryId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const inquiry = await Inquiry.findById(inquiryId)
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email')
      .populate('productId', 'title price images condition location')
      .populate('reviewedBy', 'name email');

    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    // Check permissions - only buyer, seller, or admin can view
    const canView = userRole === 'admin' ||
                   inquiry.buyerId._id.toString() === userId ||
                   inquiry.sellerId._id.toString() === userId;

    if (!canView) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ inquiry });

  } catch (error) {
    console.error('Get inquiry error:', error);
    res.status(500).json({ error: 'Failed to fetch inquiry' });
  }
});

// Add message to inquiry conversation
router.post('/:id/messages', authenticate, async (req, res) => {
  try {
    const inquiryId = req.params.id;
    const userId = req.user.id;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const inquiry = await Inquiry.findById(inquiryId);
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    // Check permissions - only buyer or seller can add messages
    const canMessage = inquiry.buyerId.toString() === userId ||
                      inquiry.sellerId.toString() === userId;

    if (!canMessage) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add message to inquiry
    await inquiry.addMessage(userId, user.name, message.trim());

    // Populate and return updated inquiry
    await inquiry.populate([
      { path: 'buyerId', select: 'name email' },
      { path: 'sellerId', select: 'name email' },
      { path: 'productId', select: 'title price images' }
    ]);

    res.json({
      message: 'Message added successfully',
      inquiry
    });

  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({ error: 'Failed to add message' });
  }
});

// Update inquiry status
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const inquiryId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status } = req.body;

    const validStatuses = ['pending', 'responded', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const inquiry = await Inquiry.findById(inquiryId);
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    // Check permissions - buyer, seller, or admin can update status
    const canUpdate = userRole === 'admin' ||
                     inquiry.buyerId.toString() === userId ||
                     inquiry.sellerId.toString() === userId;

    if (!canUpdate) {
      return res.status(403).json({ error: 'Access denied' });
    }

    inquiry.status = status;
    await inquiry.save();

    await inquiry.populate([
      { path: 'buyerId', select: 'name email' },
      { path: 'sellerId', select: 'name email' },
      { path: 'productId', select: 'title price images' }
    ]);

    res.json({
      message: 'Status updated successfully',
      inquiry
    });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Mark inquiry as reviewed (admin only)
router.patch('/:id/review', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const inquiryId = req.params.id;
    const adminId = req.user.id;
    const { adminNotes } = req.body;

    const inquiry = await Inquiry.findById(inquiryId);
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    await inquiry.markReviewed(adminId);

    if (adminNotes) {
      inquiry.adminNotes = adminNotes;
      await inquiry.save();
    }

    await inquiry.populate([
      { path: 'buyerId', select: 'name email' },
      { path: 'sellerId', select: 'name email' },
      { path: 'productId', select: 'title price images' },
      { path: 'reviewedBy', select: 'name email' }
    ]);

    res.json({
      message: 'Inquiry marked as reviewed',
      inquiry
    });

  } catch (error) {
    console.error('Mark reviewed error:', error);
    res.status(500).json({ error: 'Failed to mark as reviewed' });
  }
});

// Delete inquiry (admin only)
router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const inquiryId = req.params.id;

    const inquiry = await Inquiry.findById(inquiryId);
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    await Inquiry.findByIdAndDelete(inquiryId);

    res.json({ message: 'Inquiry deleted successfully' });

  } catch (error) {
    console.error('Delete inquiry error:', error);
    res.status(500).json({ error: 'Failed to delete inquiry' });
  }
});

export default router;