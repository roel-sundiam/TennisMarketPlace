import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import userRoutes from './routes/users.js';
import uploadRoutes from './routes/upload.js';
import brandRoutes from './routes/brands.js';
import locationRoutes from './routes/locations.js';
import coinRoutes from './routes/coins.js';
import paymentRoutes from './routes/payments.js';
import adminCoinRoutes from './routes/admin-coins.js';
import verificationRoutes from './routes/verification.js';
import analyticsRoutes from './routes/analytics.js';
import reportRoutes from './routes/reports.js';

// Import analytics middleware
import { trackPageView, trackError } from './middleware/analytics.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure Express to trust proxy headers (required for Render, Heroku, etc.)
app.set('trust proxy', true);

// Rate limiting - More permissive for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit for development: 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health check and development
    return req.path === '/api/health' || process.env.NODE_ENV === 'development';
  }
});

// CORS configuration - Allow frontend ports and production URLs
const getAllowedOrigins = () => {
  const developmentOrigins = [
    'http://localhost:4200',  // Angular dev server default
    'http://localhost:4202',  // Angular dev server alternate
    'http://localhost:3000',  // Alternative port
    'http://127.0.0.1:4200',
    'http://127.0.0.1:4202',
    'http://127.0.0.1:3000'
  ];

  const productionOrigins = [
    process.env.FRONTEND_URL,
    'https://tennis-marketplace.netlify.app'  // Explicit production frontend URL
  ].filter(Boolean);

  // Always allow both development and production origins for flexibility
  return [...developmentOrigins, ...productionOrigins];
};

const corsOptions = {
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Fingerprint', 'X-Session-ID']
};

// Middleware
app.use(limiter);
app.use(cors(corsOptions));

// Analytics tracking middleware (before routes)
app.use(trackPageView);

// Serve static files from public directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Apply JSON and URL encoding middleware to specific routes only
const jsonMiddleware = express.json({ 
  limit: '10mb',
  type: 'application/json'
});

const urlencodedMiddleware = express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  type: 'application/x-www-form-urlencoded'
});

// Upload routes WITHOUT JSON parsing middleware
app.use('/api/upload', uploadRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Tennis Marketplace API is running',
    timestamp: new Date().toISOString()
  });
});

// Other routes WITH JSON parsing middleware
app.use('/api/auth', jsonMiddleware, urlencodedMiddleware, authRoutes);
app.use('/api/products', jsonMiddleware, urlencodedMiddleware, productRoutes);
app.use('/api/users', jsonMiddleware, urlencodedMiddleware, userRoutes);
app.use('/api/brands', jsonMiddleware, urlencodedMiddleware, brandRoutes);
app.use('/api/locations', jsonMiddleware, urlencodedMiddleware, locationRoutes);
app.use('/api/coins', jsonMiddleware, urlencodedMiddleware, coinRoutes);
app.use('/api/payments', jsonMiddleware, urlencodedMiddleware, paymentRoutes);
app.use('/api/admin/coins', jsonMiddleware, urlencodedMiddleware, adminCoinRoutes);
app.use('/api/verification', jsonMiddleware, urlencodedMiddleware, verificationRoutes);
app.use('/api/analytics', jsonMiddleware, urlencodedMiddleware, analyticsRoutes);
app.use('/api/reports', jsonMiddleware, urlencodedMiddleware, reportRoutes);

// Error handling middleware with analytics tracking
app.use(trackError);
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tennis-marketplace';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('⚠️  Server starting without database connection');
    console.log('🔧 To fix this:');
    console.log('   - Install MongoDB locally, or');
    console.log('   - Set MONGODB_URI to a cloud database (MongoDB Atlas)');
    return false;
  }
};

// Start server
const startServer = async () => {
  const dbConnected = await connectDB();
  app.listen(PORT, () => {
    console.log(`🎾 Tennis Marketplace API running on port ${PORT}`);
    console.log(`🚀 Health check: http://localhost:${PORT}/api/health`);
    if (!dbConnected) {
      console.log('⚠️  Database features will not work until MongoDB is connected');
    }
  });
};

startServer().catch(console.error);

export default app;