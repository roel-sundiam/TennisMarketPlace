import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import CoinTransaction from '../models/CoinTransaction.js';
import { authenticate } from '../middleware/auth.js';
import { 
  extractClientInfo, 
  checkRegistrationLimits, 
  logRegistrationAttempt 
} from '../middleware/registration.js';

const router = express.Router();

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/register - Register new user
router.post('/register', extractClientInfo, checkRegistrationLimits, logRegistrationAttempt, async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      location,
      role = 'buyer'
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Check phone number uniqueness
    const existingPhone = await User.findOne({ phoneNumber });
    if (existingPhone) {
      return res.status(400).json({ error: 'User with this phone number already exists' });
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      phoneNumber,
      location,
      role: role === 'admin' ? 'buyer' : role, // Prevent direct admin registration
      isActive: false, // New users require admin approval before access
      registration: {
        ipAddress: req.clientInfo.ipAddress,
        deviceFingerprint: req.clientInfo.deviceFingerprint,
        userAgent: req.clientInfo.userAgent,
        registeredAt: new Date(),
        isDuplicateApproved: false,
        approvedBy: null,
        approvalReason: null
      }
    });

    await user.save();

    // Don't create signup bonus transaction yet - wait for approval
    // The bonus will be created when admin approves the account

    // Remove password from response
    const userResponse = user.toJSON();

    let message = 'Registration successful! Your account is pending admin approval. You will receive access once approved.';
    let warnings = [];

    if (req.flaggedRegistration) {
      if (req.flaggedRegistration.reason === 'MULTIPLE_FROM_IP') {
        warnings.push(`Multiple registrations detected from your IP address (${req.flaggedRegistration.ipCount} existing)`);
      }
    }

    res.status(201).json({
      message,
      user: userResponse,
      requiresApproval: true,
      warnings: warnings.length > 0 ? warnings : undefined,
      flagged: req.flaggedRegistration || undefined
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    res.status(500).json({ error: 'Failed to register user' });
  }
});

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ 
      email: email.toLowerCase()
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user account is approved/active
    if (!user.isActive) {
      return res.status(403).json({ 
        error: 'Your account is pending admin approval. Please wait for approval before logging in.',
        requiresApproval: true 
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user._id);

    // Update last login (optional)
    user.lastLoginAt = new Date();
    await user.save();

    // Remove password from response
    const userResponse = user.toJSON();

    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// POST /api/auth/logout - Logout user (client-side token removal)
router.post('/logout', authenticate, (req, res) => {
  // In a stateless JWT setup, logout is handled client-side
  // Here we just confirm the logout
  res.json({ message: 'Logout successful' });
});

// GET /api/auth/me - Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('favorites', 'title price mainImage category condition');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user account is approved/active
    if (!user.isActive) {
      return res.status(403).json({ 
        error: 'Your account is pending admin approval. Please wait for approval before accessing your profile.',
        requiresApproval: true 
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// PUT /api/auth/me - Update current user profile
router.put('/me', authenticate, async (req, res) => {
  try {
    const allowedUpdates = [
      'firstName', 
      'lastName', 
      'phoneNumber', 
      'location', 
      'profilePicture'
    ];

    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating user profile:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// PUT /api/auth/change-password - Change password
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user._id);

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// POST /api/auth/forgot-password - Forgot password (placeholder)
router.post('/forgot-password', async (req, res) => {
  // In a real application, you would:
  // 1. Generate a reset token
  // 2. Send email with reset link
  // 3. Store token in database with expiration
  
  res.json({ 
    message: 'Password reset instructions have been sent to your email (Feature coming soon)' 
  });
});

// GET /api/auth/verify-token - Verify if token is valid
router.get('/verify-token', authenticate, (req, res) => {
  res.json({ 
    valid: true, 
    user: req.user 
  });
});

export default router;