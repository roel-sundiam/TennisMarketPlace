import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware to authenticate users
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    console.log('🔐 Auth header received:', authHeader ? `Bearer ${authHeader.substring(7, 20)}...` : 'None');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid authorization header');
      return res.status(401).json({ error: 'Access denied. No valid token provided.' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('🎫 Token received:', token.substring(0, 20) + '...');
    console.log('🎫 Token starts with mock?', token.startsWith('mock.'));

    let decoded;
    
    // Check if it's a mock token (for development)
    if (token.startsWith('mock.')) {
      console.log('🧪 Processing mock token...');
      try {
        // Parse mock token: mock.header.payload
        const parts = token.split('.');
        console.log('🧪 Mock token parts:', parts.length);
        
        if (parts.length !== 3) {
          throw new Error('Invalid mock token format');
        }
        
        const payload = JSON.parse(atob(parts[2]));
        console.log('🧪 Mock token payload:', { userId: payload.userId, email: payload.email, exp: payload.exp });
        
        decoded = {
          userId: payload.userId,
          email: payload.email,
          exp: payload.exp
        };
        
        // Check if mock token is expired
        const now = Date.now() / 1000;
        console.log('🧪 Token expiry check:', { exp: decoded.exp, now, expired: decoded.exp < now });
        
        if (decoded.exp < now) {
          console.log('❌ Mock token expired');
          return res.status(401).json({ error: 'Token expired.' });
        }
        
        console.log('✅ Mock token valid, userId:', decoded.userId);
      } catch (mockError) {
        console.error('❌ Mock token parsing error:', mockError);
        return res.status(401).json({ error: 'Invalid mock token.' });
      }
    } else {
      console.log('🔑 Processing real JWT token...');
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
      console.log('🔑 JWT_SECRET being used:', jwtSecret.substring(0, 10) + '...');
      // Verify real JWT token
      decoded = jwt.verify(token, jwtSecret);
      console.log('✅ Real JWT valid, userId:', decoded.userId);
    }
    
    // Get user from database
    console.log('👤 Looking up user:', decoded.userId);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      console.log('❌ User not found or inactive:', { found: !!user, active: user?.isActive });
      return res.status(401).json({ error: 'Invalid token or user not found.' });
    }

    console.log('✅ User authenticated:', user.email);
    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Authentication error:', error.name, error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }

    res.status(500).json({ error: 'Authentication failed.' });
  }
};

// Middleware to authorize specific roles
export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (roles.length === 0) {
      // No specific roles required, just need to be authenticated
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

// Optional authentication - adds user to request if token is provided
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      return next();
    }

    const token = authHeader.substring(7);
    let decoded;
    
    // Check if it's a mock token (for development)
    if (token.startsWith('mock.')) {
      try {
        // Parse mock token: mock.header.payload
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[2]));
          decoded = {
            userId: payload.userId,
            email: payload.email,
            exp: payload.exp
          };
          
          // Skip if mock token is expired
          if (decoded.exp < Date.now() / 1000) {
            return next();
          }
        }
      } catch (mockError) {
        // If mock token is invalid, continue without authentication
        return next();
      }
    } else {
      // Verify real JWT token
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    }
    
    if (decoded) {
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // If token is invalid, continue without authentication
    // Don't throw error for optional auth
    next();
  }
};

// Middleware to check coin balance for actions
export const checkCoinBalance = (requiredCoins, actionType) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const userBalance = req.user.coins.balance;
    
    if (userBalance < requiredCoins) {
      return res.status(403).json({ 
        error: `Insufficient coins for ${actionType}. You need ${requiredCoins} coins but only have ${userBalance}.`,
        required: requiredCoins,
        current: userBalance,
        actionType,
        packages: [
          { coins: 100, price: 99, currency: 'PHP' },
          { coins: 250, price: 199, currency: 'PHP' },
          { coins: 500, price: 349, currency: 'PHP' },
          { coins: 1000, price: 599, currency: 'PHP' }
        ]
      });
    }

    // Add required coins to request for later deduction
    req.requiredCoins = requiredCoins;
    req.actionType = actionType;
    next();
  };
};

// Middleware to check minimum coin balance (for premium features)
export const requireMinimumCoins = (minimumCoins) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const userBalance = req.user.coins.balance;
    
    if (userBalance < minimumCoins) {
      return res.status(403).json({ 
        error: `This feature requires a minimum of ${minimumCoins} coins. You currently have ${userBalance} coins.`,
        required: minimumCoins,
        current: userBalance,
        suggestion: 'Purchase more coins to access premium features.'
      });
    }

    next();
  };
};