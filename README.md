# 🎾 Tennis Marketplace - MVP

A modern, mobile-first tennis gear marketplace built with Angular 17 and Express.js, following the Carousell-style MVP approach for the Philippines market.

## 📋 Project Overview

This is **Phase 1 (MVP)** of the Tennis Marketplace project - a community-driven platform where tennis players can buy and sell gear directly with each other. Users communicate through external channels (phone/WhatsApp) and handle payments outside the app (GCash, cash, meetup).

## ✨ Features Implemented

### Frontend (Angular 17)
- ✅ **Modern Landing Page** - Tennis-themed with green color scheme
- ✅ **ProductCard Component** - Following React sample design with boosted badges, favorites, and hover effects
- ✅ **Price Component** - Philippine peso formatting (₱)
- ✅ **Category System** - Racquets, Strings, Shoes, Bags with interactive cards
- ✅ **Responsive Design** - Mobile-first with Tailwind CSS
- ✅ **Tailwind CSS Setup** - Custom tennis-themed styling

### Backend (Express.js + MongoDB)
- ✅ **Complete REST API** - Products, Users, Authentication, Upload endpoints
- ✅ **JWT Authentication** - Secure login/register system
- ✅ **MongoDB Integration** - User and Product models with proper indexing
- ✅ **Firebase Storage** - Image upload service for product photos
- ✅ **Subscription System** - Free, Basic (₱299), Pro (₱999) tiers
- ✅ **Admin Features** - Product approval workflow
- ✅ **Security Features** - Rate limiting, input validation, CORS

## 🏗️ Architecture

```
tennis-marketplace/
├── tennis-marketplace/ (Angular Frontend)
│   ├── src/app/
│   │   ├── components/
│   │   │   ├── product-card.component.ts
│   │   │   └── price.component.ts
│   │   ├── app.html (Landing page)
│   │   └── app.ts (Main component)
│   ├── tailwind.config.js
│   └── package.json
├── backend/ (Express.js API)
│   ├── models/ (User, Product schemas)
│   ├── routes/ (API endpoints)
│   ├── services/ (Firebase integration)
│   ├── middleware/ (Authentication)
│   └── server.js
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- Firebase project (optional, for images)

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure .env with your MongoDB URI and JWT secret
npm run dev
```

### 2. Frontend Setup
```bash
cd tennis-marketplace
npm install
npm start
```

### 3. Access the Application
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## 🎨 Design System

Following the React sample design with:
- **Color Scheme**: Green-themed (#16a34a primary, #bbf7d0 accents)
- **Typography**: Modern sans-serif with proper hierarchy
- **Components**: Card-based layout with hover effects
- **Mobile-First**: Responsive design for all screen sizes
- **Philippine Locale**: Peso formatting, local cities

## 📱 UI Components

### ProductCard Component
- **Boosted Badge**: Green highlight for premium listings
- **Heart Favorite**: Toggle functionality with state management
- **Price Display**: Philippine peso format with proper locale
- **Rating System**: Star ratings from seller reviews
- **Hover Effects**: Scale transforms and shadow transitions
- **Responsive Grid**: 1-4 columns based on screen size

### Price Component
- **Currency Symbol**: ₱ peso sign
- **Number Formatting**: Thousands separators (₱14,500)
- **Size Variants**: sm, md, lg, xl
- **Color Themes**: primary, secondary, dark, light

## 🔐 Authentication & Authorization

- **JWT Tokens**: Secure authentication with expiration
- **Role-Based Access**: buyer, seller, admin roles
- **Password Security**: bcrypt hashing with salt
- **Protected Routes**: Middleware-based protection
- **Subscription Limits**: Feature access based on plan

## 💳 Subscription Plans

| Plan | Price | Listings/Month | Boosts | Features |
|------|-------|---------------|--------|----------|
| **Free** | ₱0 | 3 | 0 | Basic listing |
| **Basic** | ₱299 | 20 | 1 | Priority support |
| **Pro** | ₱999 | Unlimited | 5 | Featured placement |

## 📊 Database Schema

### User Model
```typescript
{
  email: string,
  password: string (hashed),
  firstName: string,
  lastName: string,
  phoneNumber: string (PH format),
  location: { city: string, region: string },
  role: 'buyer' | 'seller' | 'admin',
  subscription: {
    plan: 'free' | 'basic' | 'pro',
    remainingListings: number,
    remainingBoosts: number
  },
  favorites: ObjectId[],
  rating: { average: number, totalReviews: number }
}
```

### Product Model
```typescript
{
  title: string,
  description: string,
  price: number,
  category: 'Racquets' | 'Strings' | 'Bags' | 'Balls' | 'Shoes' | 'Apparel' | 'Accessories',
  condition: 'New' | 'Like New' | 'Excellent' | 'Good' | 'Fair',
  brand: string,
  images: { url: string, alt: string, isMain: boolean }[],
  seller: ObjectId,
  location: { city: string, region: string },
  isBoosted: boolean,
  isApproved: 'pending' | 'approved' | 'rejected'
}
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - List products with filters
- `GET /api/products/categories` - Get categories with counts
- `GET /api/products/featured` - Get boosted products
- `POST /api/products` - Create listing (auth required)
- `PUT /api/products/:id/boost` - Boost listing

### Upload
- `POST /api/upload/image` - Upload single image
- `POST /api/upload/images` - Upload multiple images

## 🔄 Next Steps (Phase 2)

The following features are planned for Phase 2 (Shopee-style upgrade):

- [ ] **Shopping Cart & Checkout** - In-app purchase flow
- [ ] **Payment Gateway** - Stripe/PayPal/GCash integration
- [ ] **Order Management** - Status tracking and fulfillment
- [ ] **Shipping Integration** - Lalamove, J&T Express APIs
- [ ] **Reviews & Ratings** - Post-purchase feedback system
- [ ] **Advanced Search** - Filters, sorting, and full-text search
- [ ] **Real-time Notifications** - Push notifications for updates
- [ ] **Mobile App** - React Native or Ionic version

## 🛠️ Development

### Code Structure
- **Components**: Reusable UI components with proper typing
- **Services**: Business logic and API integration
- **Models**: Database schemas with validation
- **Middleware**: Authentication and authorization
- **Utilities**: Helper functions and constants

### Best Practices
- **TypeScript**: Full type safety across the stack
- **ESLint + Prettier**: Code formatting and linting
- **Environment Variables**: Secure configuration management
- **Error Handling**: Comprehensive error responses
- **Logging**: Structured logging for debugging
- **Security**: Rate limiting, input validation, CORS

## 📈 Business Model

### Revenue Streams
- **Boosted Listings**: ₱100-₱200/week for featured placement
- **Subscriptions**: Monthly plans with listing limits and boosts
- **Advertising**: Tennis shops, stringers, coaches can advertise
- **Future**: Transaction fees (5-10%) in Phase 2

### Target Market
- Tennis players in the Philippines
- Tennis shops and retailers
- Equipment resellers and collectors
- Tennis clubs and communities

## 🚀 Deployment

### Frontend (Netlify/Vercel)
```bash
cd tennis-marketplace
npm run build
# Deploy dist/ folder
```

### Backend (Heroku/Railway/DigitalOcean)
```bash
cd backend
# Set environment variables
# Deploy with PM2 or container
```

### Database (MongoDB Atlas)
- Cloud MongoDB with backups
- Connection string in environment variables

## 🤝 Contributing

This project follows modern development practices:
- **Git Flow**: Feature branches and pull requests
- **Code Review**: All changes reviewed before merge
- **Testing**: Unit and integration tests
- **Documentation**: Comprehensive README and API docs

## 📄 License

MIT License - Feel free to use for educational or commercial projects.

---

**Built with ❤️ for the Filipino tennis community**

🎾 **Ready to serve up some great deals!** 🎾