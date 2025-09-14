# Tennis Marketplace Backend API

Express.js backend API for the Tennis Marketplace application.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Product Management**: CRUD operations for tennis gear listings
- **User Management**: User profiles, subscriptions, and favorites
- **Image Upload**: Firebase Storage integration for product and profile images
- **Subscription System**: Free, Basic, and Pro subscription tiers
- **Admin Panel**: Product approval and user management
- **Security**: Rate limiting, input validation, and secure password hashing

## Tech Stack

- **Runtime**: Node.js with ES6 modules
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcryptjs
- **File Storage**: Firebase Storage
- **Security**: express-rate-limit, CORS protection
- **Environment**: dotenv for configuration

## Installation & Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Update the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/tennis-marketplace

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Firebase (Optional - for image uploads)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
# ... other Firebase credentials
```

### 3. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# Using MongoDB service
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Run the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `POST /logout` - User logout
- `GET /me` - Get current user profile
- `PUT /me` - Update user profile
- `PUT /change-password` - Change password

### Products (`/api/products`)
- `GET /` - Get products with filtering and pagination
- `GET /categories` - Get product categories with counts
- `GET /featured` - Get boosted/featured products
- `GET /:id` - Get single product
- `POST /` - Create new product (authenticated)
- `PUT /:id` - Update product (owner only)
- `DELETE /:id` - Delete product (owner/admin)
- `POST /:id/boost` - Boost product listing

### Users (`/api/users`)
- `GET /:id` - Get user profile (public)
- `GET /:id/products` - Get user's products
- `POST /favorites/:productId` - Add to favorites
- `DELETE /favorites/:productId` - Remove from favorites
- `GET /me/favorites` - Get user's favorites
- `POST /me/subscription` - Update subscription

### Upload (`/api/upload`)
- `POST /image` - Upload single image
- `POST /images` - Upload multiple images
- `DELETE /image/:fileName` - Delete image
- `GET /health` - Check upload service health

### Admin Routes
- `PUT /products/:id/approve` - Approve/reject products
- `GET /users` - Get all users
- `PUT /users/:id/status` - Update user status

## Database Models

### User Schema
```javascript
{
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  phoneNumber: String,
  profilePicture: String,
  location: { city: String, region: String },
  role: ['buyer', 'seller', 'admin'],
  subscription: {
    plan: ['free', 'basic', 'pro'],
    expiresAt: Date,
    remainingListings: Number,
    remainingBoosts: Number
  },
  favorites: [ObjectId],
  rating: { average: Number, totalReviews: Number },
  isVerified: Boolean,
  isActive: Boolean
}
```

### Product Schema
```javascript
{
  title: String,
  description: String,
  price: Number,
  category: ['Racquets', 'Strings', 'Bags', 'Balls', 'Shoes', 'Apparel', 'Accessories'],
  condition: ['New', 'Like New', 'Excellent', 'Good', 'Fair'],
  brand: String,
  model: String,
  specifications: Object,
  images: [{ url: String, alt: String, isMain: Boolean }],
  seller: ObjectId,
  location: { city: String, region: String },
  availability: ['available', 'pending', 'sold', 'reserved'],
  tags: [String],
  views: Number,
  favorites: Number,
  isBoosted: Boolean,
  boostExpiresAt: Date,
  isApproved: ['pending', 'approved', 'rejected'],
  negotiable: Boolean,
  shippingOptions: { meetup: Boolean, delivery: Boolean, shipping: Boolean }
}
```

## Subscription Plans

| Plan | Listings/Month | Free Boosts | Price |
|------|---------------|-------------|-------|
| Free | 3 | 0 | ₱0 |
| Basic | 20 | 1 | ₱299 |
| Pro | Unlimited | 5 | ₱999 |

## Firebase Storage Setup (Optional)

For image uploads, you'll need to configure Firebase:

1. Create a Firebase project
2. Enable Firebase Storage
3. Generate a service account key
4. Add Firebase credentials to `.env`

Without Firebase, image upload endpoints will return errors.

## Development

### Adding New Routes

1. Create route file in `routes/` directory
2. Import and use in `server.js`
3. Add authentication/authorization as needed

### Database Queries

Use MongoDB indexes for better performance:
```javascript
// Example: Product search with indexes
productSchema.index({ category: 1, availability: 1 });
productSchema.index({ title: 'text', description: 'text' });
```

### Error Handling

All routes include proper error handling:
```javascript
try {
  // Route logic
} catch (error) {
  console.error('Route error:', error);
  res.status(500).json({ error: 'Operation failed' });
}
```

## Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Mongoose schema validation
- **Password Security**: bcrypt with salt rounds
- **JWT Security**: Secret key and expiration
- **CORS Protection**: Configured for frontend domain
- **File Upload Security**: Type and size validation

## Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://your-production-db
JWT_SECRET=your-production-secret
FRONTEND_URL=https://your-frontend-domain.com
```

### PM2 Process Manager

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name "tennis-marketplace-api"

# Monitor
pm2 monitor
```

## API Testing

Use tools like Postman or curl to test endpoints:

```bash
# Health check
curl http://localhost:5000/api/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"John","lastName":"Doe","phoneNumber":"09123456789","location":{"city":"Manila","region":"NCR"}}'
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check if MongoDB is running
   - Verify connection string in `.env`

2. **JWT Token Invalid**
   - Check JWT_SECRET in environment
   - Verify token format in requests

3. **Firebase Upload Failed**
   - Verify Firebase credentials
   - Check storage bucket permissions

4. **CORS Errors**
   - Update FRONTEND_URL in `.env`
   - Check CORS configuration in `server.js`