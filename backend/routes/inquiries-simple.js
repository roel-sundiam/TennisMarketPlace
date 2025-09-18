import express from 'express';
import Inquiry from '../models/Inquiry.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Debug middleware for all inquiry routes
router.use((req, res, next) => {
  console.log('🚀🚀🚀 INQUIRY ROUTE CALLED:', req.method, req.path);
  console.log('🚀🚀🚀 Query params:', req.query);
  console.log('🚀🚀🚀 User:', req.user?.email || 'Not authenticated');
  next();
});

// Simple test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Inquiry routes working!' });
});

// Get all inquiries (admin only) - working version
router.get('/all', authenticate, authorize(['admin']), async (req, res) => {
  try {
    console.log('🔍 Admin requesting all inquiries...');
    console.log('🔍 Request path:', req.path);
    console.log('🔍 Request query:', req.query);
    console.log('🔍 User:', req.user?.email);

    const inquiries = await Inquiry.find({})
      .populate('buyerId', 'firstName lastName email')
      .populate('sellerId', 'firstName lastName email')
      .populate('productId', 'title price images')
      .sort({ createdAt: -1 })
      .limit(100);

    console.log('✅ Found', inquiries.length, 'inquiries in database');
    console.log('🔍 Sample inquiry IDs:', inquiries.map(i => i._id).slice(0, 3));

    res.json({
      inquiries,
      pagination: {
        currentPage: 1,
        totalPages: Math.ceil(inquiries.length / 100),
        totalInquiries: inquiries.length,
        hasNext: false,
        hasPrev: false
      }
    });
  } catch (error) {
    console.error('Get all inquiries error:', error);
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
});

// Create inquiry - working version
router.post('/', authenticate, async (req, res) => {
  try {
    const { productId, message, buyerPhone } = req.body;
    const buyerId = req.user.id;

    console.log('📨 Received inquiry request:', req.body);
    console.log('🔑 User:', req.user.email, 'ID:', buyerId);

    // Validate required fields
    if (!productId || !message || !buyerPhone) {
      return res.status(400).json({
        error: 'Product ID, message, and phone number are required'
      });
    }

    // Get product and seller details
    const product = await Product.findById(productId).populate('seller', 'firstName lastName email');
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get buyer details
    const buyer = await User.findById(buyerId);
    if (!buyer) {
      return res.status(404).json({ error: 'Buyer not found' });
    }

    // Prevent buyers from inquiring about their own products
    if (product.seller._id.toString() === buyerId) {
      return res.status(400).json({
        error: 'Cannot inquire about your own product'
      });
    }

    console.log('📋 Creating inquiry for product:', product.title);
    console.log('👤 Buyer:', buyer.firstName, buyer.lastName);
    console.log('👤 Seller:', product.seller.firstName, product.seller.lastName);

    // Create new inquiry
    const inquiry = new Inquiry({
      productId,
      productTitle: product.title,
      buyerId,
      buyerName: `${buyer.firstName} ${buyer.lastName}`,
      buyerEmail: buyer.email,
      buyerPhone,
      sellerId: product.seller._id,
      sellerName: `${product.seller.firstName} ${product.seller.lastName}`,
      message
    });

    console.log('💾 About to save inquiry to database...');
    await inquiry.save();
    console.log('✅ Inquiry saved to database with ID:', inquiry._id);
    console.log('🔍 Inquiry data:', {
      productTitle: inquiry.productTitle,
      buyerName: inquiry.buyerName,
      sellerName: inquiry.sellerName,
      message: inquiry.message.substring(0, 50) + '...'
    });

    // Populate references for response
    await inquiry.populate([
      { path: 'buyerId', select: 'firstName lastName email' },
      { path: 'sellerId', select: 'firstName lastName email' },
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

// Get user inquiries - actual implementation
router.get('/my-inquiries', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const type = req.query.type; // 'sent', 'received', or undefined for all
    console.log('👤 Getting inquiries for user:', req.user.email, 'ID:', userId, 'Type:', type);

    let query;
    if (type === 'sent') {
      // Inquiries where user is the buyer (sent inquiries)
      query = { buyerId: userId };
    } else if (type === 'received') {
      // Inquiries where user is the seller (received inquiries)
      query = { sellerId: userId };
    } else {
      // All inquiries (both sent and received)
      query = {
        $or: [
          { buyerId: userId },
          { sellerId: userId }
        ]
      };
    }

    const inquiries = await Inquiry.find(query)
      .populate('buyerId', 'firstName lastName email')
      .populate('sellerId', 'firstName lastName email')
      .populate('productId', 'title price images')
      .sort({ createdAt: -1 })
      .limit(100);

    console.log('✅ Found', inquiries.length, 'inquiries for user (type:', type + ')');

    res.json({
      inquiries,
      pagination: {
        currentPage: 1,
        totalPages: Math.ceil(inquiries.length / 100),
        totalInquiries: inquiries.length,
        hasNext: false,
        hasPrev: false
      }
    });
  } catch (error) {
    console.error('Get user inquiries error:', error);
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
});

// Reply to inquiry - working version
router.post('/:inquiryId/reply', authenticate, async (req, res) => {
  try {
    const { inquiryId } = req.params;
    const { message } = req.body;
    const userId = req.user._id;

    console.log('💬 Reply request:', { inquiryId, userId: userId.toString(), message: message?.substring(0, 50) + '...' });

    // Validate required fields
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Reply message is required' });
    }

    if (message.length > 1000) {
      return res.status(400).json({ error: 'Reply message must be less than 1000 characters' });
    }

    // Find the inquiry
    const inquiry = await Inquiry.findById(inquiryId)
      .populate('buyerId', 'firstName lastName email')
      .populate('sellerId', 'firstName lastName email');

    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    console.log('🔍 Inquiry found:', {
      buyerId: inquiry.buyerId._id.toString(),
      sellerId: inquiry.sellerId._id.toString(),
      currentUser: userId.toString()
    });

    // Check if user is either buyer or seller
    const isBuyer = inquiry.buyerId._id.toString() === userId.toString();
    const isSeller = inquiry.sellerId._id.toString() === userId.toString();

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ error: 'You are not authorized to reply to this inquiry' });
    }

    // Add the reply using the model's method
    const senderName = isBuyer ? inquiry.buyerId.firstName + ' ' + inquiry.buyerId.lastName : inquiry.sellerId.firstName + ' ' + inquiry.sellerId.lastName;

    console.log('💬 Adding reply from:', senderName);
    await inquiry.addMessage(userId, senderName, message.trim());

    console.log('✅ Reply added successfully');

    // Return updated inquiry with populated references
    const updatedInquiry = await Inquiry.findById(inquiryId)
      .populate('buyerId', 'firstName lastName email')
      .populate('sellerId', 'firstName lastName email')
      .populate('productId', 'title price images');

    res.json({
      message: 'Reply sent successfully',
      inquiry: updatedInquiry
    });

  } catch (error) {
    console.error('Reply to inquiry error:', error);
    res.status(500).json({ error: 'Failed to send reply' });
  }
});

export default router;