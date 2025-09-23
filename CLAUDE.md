# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tennis Marketplace is a two-phase project for the Philippines market:
- **Phase 1 (MVP)**: Carousell-style marketplace with external payments (GCash, cash, meetup)
- **Phase 2**: Shopee-style e-commerce with integrated checkout and payments

The project follows a React sample design but is implemented in Angular 17 + Express.js.

## Architecture

```
tennis-marketplace/          # Angular 17 frontend
├── src/app/
│   ├── components/         # Reusable UI components
│   │   ├── product-card.component.ts    # Main product display component
│   │   └── price.component.ts          # Philippine peso formatting
│   ├── app.html           # Landing page template
│   └── app.ts             # Main component with sample data
├── tailwind.config.js     # Green tennis-themed styling
└── angular.json           # Angular 20.2.0 configuration

backend/                   # Express.js API server
├── models/               # MongoDB schemas
│   ├── User.js          # User with subscription system
│   └── Product.js       # Product with boosting/approval
├── routes/              # API endpoints
│   ├── auth.js         # JWT authentication
│   ├── products.js     # CRUD + filtering/search
│   ├── users.js        # Profiles/favorites
│   └── upload.js       # Firebase Storage integration
├── services/
│   └── firebase.js     # Image upload service
├── middleware/
│   └── auth.js         # JWT + role-based authorization
└── server.js           # Express server with rate limiting
```

## Key Development Commands

### Frontend (Angular 17)
```bash
cd tennis-marketplace
npm install              # Install dependencies (may need ajv, lmdb packages)
ng serve --open         # Development server at http://localhost:4200
ng build                # Production build
npm start               # Alternative to ng serve
```

### Backend (Express.js)
```bash
cd backend
npm install             # Install dependencies
npm run dev            # Development with nodemon at http://localhost:5000
npm start              # Production server
```

### Database Setup
```bash
# MongoDB required - local or MongoDB Atlas
# Configure MONGODB_URI in backend/.env
```

## Core Business Logic

### Subscription System
- **Free**: 3 listings/month, 0 boosts
- **Basic**: ₱299/month, 20 listings, 1 boost
- **Pro**: ₱999/month, unlimited listings, 5 boosts

### Product Workflow
1. Seller creates listing → `isApproved: 'pending'`
2. Admin approves/rejects → `isApproved: 'approved'/'rejected'` 
3. Seller can boost approved listings → `isBoosted: true`
4. Buyers contact via phone/WhatsApp (no in-app messaging in Phase 1)

### Authentication & Authorization
- JWT tokens with 7-day expiration
- Roles: `buyer`, `seller`, `admin`
- Middleware protects routes: `authenticate`, `authorize(['admin'])`
- Subscription limits enforced in middleware

## Design System

### React Sample Adherence
The Angular components exactly match the provided React sample:
- Green color scheme (#16a34a primary, #bbf7d0 accents)
- ProductCard with boosted badges, heart favorites, hover effects
- Philippine peso formatting (₱14,500)
- Mobile-first responsive grid (1-4 columns)
- Tennis categories: Racquets, Strings, Bags, Balls, Shoes, Apparel, Accessories

### Component Architecture
- **ProductCard**: Self-contained with product data, favorites state, click handlers
- **Price**: Reusable with size/color variants, proper locale formatting
- **Category Cards**: Interactive with hover animations
- **Landing Page**: Hero section, categories, featured products, CTA, footer

## Data Models

### Product Interface (Frontend)
```typescript
interface Product {
  id: string;
  title: string;
  price: number;
  condition: 'New' | 'Like New' | 'Excellent' | 'Good' | 'Fair';
  seller: string;
  rating: number;
  boosted: boolean;
  location: string;
  images: string[];
  tags: string[];
}
```

### API Response Patterns
- Pagination: `{ products: [], pagination: { currentPage, totalPages, hasNext, hasPrev } }`
- Filtering: Query params for category, condition, price range, location, search
- Authentication: `Authorization: Bearer <jwt-token>` header

## Firebase Integration

### Image Upload Flow
1. Frontend uploads to `/api/upload/image` or `/api/upload/images`
2. Multer handles file validation (5MB limit, image types only)
3. Firebase Storage saves with unique filenames
4. Returns public URLs for database storage

### Configuration Required
Set Firebase credentials in `backend/.env`:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-bucket
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

## Common Development Patterns

### Error Handling
All API routes use consistent error responses:
```javascript
try {
  // Route logic
} catch (error) {
  console.error('Route error:', error);
  res.status(500).json({ error: 'Operation failed' });
}
```

### Database Queries
Product filtering with MongoDB indexes:
```javascript
// Use Product.getFiltered() static method
const products = await Product.getFiltered({
  category: 'Racquets',
  priceMin: 1000,
  priceMax: 15000,
  search: 'Wilson'
});
```

### Frontend State Management
Simple Angular component state for MVP:
- Favorites stored in Set
- Sample data in component properties
- Event handlers for product/favorite clicks

## Security Considerations

- Rate limiting: 100 requests/15 minutes per IP
- JWT secret management via environment variables
- Input validation via Mongoose schemas
- File upload security: type/size validation
- CORS configured for frontend domain
- No sensitive data in frontend code

## Testing the Application

### Demo File Available
A standalone HTML demo (`tennis-marketplace-demo.html`) shows the complete UI working without Angular CLI dependency issues.

### Sample Data
The application includes realistic sample data:
- Wilson Pro Staff 97 v14 - ₱14,500 (Boosted)
- Yonex Poly Tour Pro - ₱6,800
- Nike Court Air Zoom - ₱5,200 (Boosted) 
- Babolat Pure Drive - ₱12,000

## Phase 2 Planning

Pending features for Shopee-style upgrade:
- Shopping cart and checkout flow
- Payment gateway integration (Stripe/PayPal/GCash)
- Order management and status tracking
- Shipping integration (Lalamove, J&T Express)
- Reviews and ratings system
- Advanced search and filtering
- Real-time notifications

The current architecture supports these additions without major refactoring.

## Git Management

Claude Code handles all git operations for this repository:
- I'll handle all `git add`, `git commit`, and `git push` operations when you request them
- **Trigger phrase**: When you say **"go git"**, I will automatically handle all git operations (add, commit, push)
- Simply ask to "commit changes" or "push updates" and I'll take care of the git workflow
- Commit messages follow project conventions with descriptive summaries
- memorize