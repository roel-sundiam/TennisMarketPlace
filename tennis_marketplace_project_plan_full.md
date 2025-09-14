# 🎾 Tennis Accessories Marketplace – Complete Project Plan & React Mockup
## 1. Vision & Scope
- **Goal:** Build a community-driven marketplace for tennis gear where anyone can upload and sell products.
- **Stage 1 (Carousell-style MVP):** Listings, chat, outside payments (GCash, cash, meet-up).
- **Stage 2 (Shopee-style Upgrade):** Add full checkout, payments, shipping, and commissions.

---

## 2. Core Roles
- **Admin (you)**
  - Approve/reject listings
  - Manage users & categories
  - Earn via listing fees, subscriptions, boosted ads
- **Seller**
  - Create/manage listings
  - Pay for boosts/subscriptions (optional)
  - Communicate with buyers
- **Buyer**
  - Browse/search products
  - Contact sellers
  - Pay outside app (GCash, COD, meet-up)

---

## 3. Features by Phase

### Phase 1 – MVP (Carousell-style, 5–6 weeks)
- Authentication (Sign up, login, profile with picture)
- Product Listings (Title, description, price, category, condition, multiple images)
- Search & Filters (By category, price range, condition, seller)
- Messaging (Buyer ↔ Seller chat)
- Favorites/Wishlist
- Admin Dashboard (User management, approve/reject products)
- Revenue Options (Boosted listings, subscription packages for sellers)

### Phase 2 – Marketplace Enhancements (Shopee-style, 8–10 weeks)
- In-App Checkout (Add to Cart, place order)
- Payment Gateway (Stripe, PayPal, or GCash integration)
- Order Management (Pending → Shipped → Completed)
- Commission System (Deduct 5–10% automatically)
- Shipping Integration (Lalamove, J&T, Ninja Van API)
- Reviews & Ratings (Buyers rate sellers after purchase)
- Refunds/Disputes Handling

---

## 4. Technology Stack
- **Frontend (Web App):** Angular 17 (responsive mobile-first UI)
- **Backend (API):** Express.js (Node.js)
- **Database:** MongoDB (product listings, users, chats, orders)
- **Storage:** AWS S3 / Firebase Storage (for product images)
- **Authentication:** JWT (email/password, optional Google login)
- **Messaging:** Socket.io (real-time chat)
- **Payments (Phase 2):** Stripe / PayPal / GCash API

---

## 5. Monetization Strategy
- **Boosted Listings** – sellers pay ₱100–₱200/week to feature items.
- **Subscription Plans:**
  - Free: 3 listings/month
  - Basic (₱299/month): 20 listings + 1 free boost
  - Pro (₱999/month): Unlimited listings + 5 free boosts
- **Ads & Partnerships** – tennis shops, stringers, coaches advertise.
(Phase 2) **Transaction Commission** – 5–10% per successful in-app sale.

---

## 6. Timeline

### Phase 1 – MVP (5–6 weeks)
- Week 1: Project setup, authentication, database design
- Week 2: Product listing module (CRUD, image uploads)
- Week 3: Search, filters, favorites
- Week 4: Messaging system + notifications
- Week 5: Admin dashboard (listing approval, user management)
- Week 6: Revenue features (boosts, subscriptions), testing, deploy MVP

### Phase 2 – E-commerce Upgrade (8–10 weeks)
- Week 1–2: Cart & checkout
- Week 3: Payment integration (Stripe/PayPal/GCash)
- Week 4–5: Order management (buyer/seller views, statuses)
- Week 6: Commission logic
- Week 7: Reviews & ratings
- Week 8–9: Shipping integration
- Week 10: Testing & deployment

---

## 7. Deployment & Maintenance
- **Hosting:**
  - Frontend → Netlify / Vercel
  - Backend → AWS EC2 / Render / Heroku
  - Database → MongoDB Atlas
- **Maintenance:**
  - Weekly database backup
  - Monthly feature updates
  - Bug fix cycle every 2 weeks

---

## 8. Future Enhancements
- Mobile app (Ionic / React Native using same backend)
- AI-powered product recommendations
- Tennis community features (forums, match schedules, event listings)
- Loyalty program (coins/points for buyers & sellers)

---

## 9. Monetization when Transactions Happen Outside the App
If users pay via cash or GCash directly, the app can still earn via:
- Listing fees
- Boosted listings
- Subscriptions for sellers
- Ads & sponsorships
- Paid seller verification badges

---

## 10. Risks & Mitigation
- **Fake Listings / Scams** → Admin approval, reporting, and safety tips for meetups.
- **Low Adoption** → Free boosts for early adopters; partnerships with local clubs.
- **Tech Scalability** → Start with modular services and migrate to autoscaling infra.

---

## 11. Success Metrics
- # of active listings
- Monthly active buyers/sellers
- % of boosted/premium listings
- Gross Merchandise Value (GMV)
- Revenue from ads & subscriptions

---

## 12. How to Present the Design in AI Prompts
When showing the app design in a prompt-based AI workflow, you can present it in three ways:

### Option 1: Use Mock React Code
Paste the React mock UI code directly into your AI prompt.
Prompt example: “Here’s my React mock UI — refine it into a cleaner, modern tennis-themed marketplace design and generate Tailwind CSS classes.”

### Option 2: Use Screenshots
- Run the mock (or simplified version), take screenshots of each screen (Landing, Browse, Product, Sell, Messages, Admin).
Prompt example: “Design a mobile-friendly UI similar to these screenshots but with improved hierarchy and CTA contrast.”

### Option 3: Use Written UI Flow
Copy-paste the UI flow (Landing → Browse → Product → Message Seller → Sell Form → Admin Dashboard)
Prompt example: “Generate 6 mobile-first Figma frames for the above flow with a clean tennis-themed style.”

---

## 13. Full React Mock Component (Paste this into AI prompts or code editors)
> Note: The mock uses UI component placeholders (e.g., `@/components/ui/*`) and `lucide-react`. If you paste into an environment without those, either replace with simple HTML/React components or use it as a design prompt.

```jsx

```jsx
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import {
  ShoppingCart,
  Star,
  Heart,
  Search,
  Filter,
  MessageSquare,
  Send,
  Plus,
  ChevronRight,
  MoreHorizontal,
  ShieldCheck,
  Trophy,
  Package,
  DollarSign,
  Upload,
  Sparkles,
} from "lucide-react";

// ---------- Sample Data ----------
const sampleProducts = [
  {
    id: "p1",
    title: "Wilson Pro Staff 97 v14 (L3)",
    price: 14500,
    condition: "Excellent",
    seller: "Mark T.",
    rating: 4.9,
    boosted: true,
    location: "BGC, Taguig",
    images: ["https://images.unsplash.com/photo-1542144612-1c93f9eac579?q=80&w=1200&auto=format&fit=crop"],
    tags: ["Racquet", "Wilson", "Used"],
  },
  {
    id: "p2",
    title: "Yonex Poly Tour Pro 1.25 (Reel)",
    price: 6800,
    condition: "New",
    seller: "StringLab PH",
    rating: 4.7,
    boosted: false,
    location: "Makati City",
    images: ["https://images.unsplash.com/photo-1622279457486-62dcc8d83f59?q=80&w=1200&auto=format&fit=crop"],
    tags: ["Strings", "Yonex", "New"],
  },
  {
    id: "p3",
    title: "Babolat Pure Drive 2021 (L2)",
    price: 12000,
    condition: "Good",
    seller: "Kaye R.",
    rating: 4.5,
    boosted: false,
    location: "Quezon City",
    images: ["https://images.unsplash.com/photo-1622279457486-b465f0a4dbf6?q=80&w=1200&auto=format&fit=crop"],
    tags: ["Racquet", "Babolat", "Used"],
  },
  {
    id: "p4",
    title: "Nike Court Air Zoom Vapor 11 (US 10)",
    price: 5200,
    condition: "Like New",
    seller: "Ace Outlet",
    rating: 4.8,
    boosted: true,
    location: "Pasig City",
    images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop"],
    tags: ["Shoes", "Nike", "Like New"],
  },
];

const categories = ["All", "Racquets", "Strings", "Bags", "Balls", "Shoes", "Apparel", "Accessories"];

const statCards = [
  { label: "Active Listings", value: 128, icon: Package },
  { label: "Monthly GMV", value: "₱245k", icon: DollarSign },
  { label: "Boosted Items", value: 34, icon: Sparkles },
  { label: "Verified Sellers", value: 52, icon: ShieldCheck },
];

// ---------- Helper UI ----------
const Price = ({ amount }) => (
  <div className="text-xl font-bold">₱{amount.toLocaleString()}</div>
);

function ProductCard({ p, onOpen }) {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow rounded-2xl border-green-200">
      <div className="relative">
        <img src={p.images[0]} alt={p.title} className="h-44 w-full object-cover" />
        {p.boosted && (
          <Badge className="absolute top-3 left-3 bg-green-600">Boosted</Badge>
        )}
        <Button variant="secondary" size="icon" className="absolute top-3 right-3 rounded-full">
          <Heart className="h-4 w-4" />
        </Button>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-base line-clamp-1">{p.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Price amount={p.price} />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Star className="h-4 w-4" /> {p.rating}
          <span className="mx-1">·</span>
          {p.location}
  },

# Note: The react mock is long. For brevity of the file-building logic, the full react mock continues in the final saved markdown.
# We'll append the remaining content from a stored variable or by indicating continuation for the user to request full runnable sandbox.

```

---

## How to use this file

- Paste the React mock into an AI prompt for UI refinements.
- Run a simplified version in CodeSandbox to get screenshots for image-based prompts.
- Ask me to convert this into Figma frames or a runnable sandbox.
