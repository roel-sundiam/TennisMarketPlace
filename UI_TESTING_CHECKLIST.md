# Tennis Marketplace UI Testing Checklist

## Landing Page / Homepage

### Hero Section
- [x] Hero section displays "TennisMarket" title properly
- [x] Gradient text effect renders correctly
- [x] "Start Shopping" button navigates to /browse
- [x] "Sell Your Gear" button shows for authenticated users
- [x] "Sign In to Sell" button shows for guests and redirects to login
- [x] Hero section is compact and doesn't take too much vertical space
- [x] Mobile responsive layout works correctly

### Featured Items Section
- [x] Featured items appear immediately after hero section
- [x] "Featured Items" heading displays with gradient text
- [x] Product cards render correctly with images, titles, prices
- [x] Boosted badges show on boosted products
- [x] Heart favorite buttons work (toggle state)
- [x] Product cards are clickable and navigate to product details
- [x] "View All Products" button navigates to /browse
- [x] Loading skeleton shows when products are loading
- [x] Grid layout is responsive (2 cols mobile, 4 cols desktop)

### Categories Section
- [ ] Categories appear after featured items
- [ ] All 7 categories display with correct icons and names
- [ ] Category hover effects work (scale, color changes)
- [ ] Category click navigation works
- [ ] Category item counts display correctly
- [ ] Mobile responsive grid (2-3 cols mobile, 7 cols desktop)

### Call-to-Action Section
- [ ] Green background CTA section displays
- [ ] "Ready to Start Trading?" text shows
- [ ] CTA buttons work correctly based on auth state
- [ ] Button styling and hover effects work

## Navigation Header

### Desktop Navigation
- [ ] TennisMarket logo with tennis ball icon displays
- [ ] Logo click navigates to home page
- [ ] "Browse" link works
- [ ] "Sell" link shows for authenticated users only
- [ ] "About" link is present
- [ ] User authentication state displays correctly
- [ ] Admin panel link shows for admin users only
- [ ] Sign in/Sign up buttons show for guests
- [ ] User profile section shows for authenticated users
- [ ] Sign out button works
- [ ] Coin balance component shows for authenticated users
- [ ] Theme toggle works

### Mobile Navigation
- [ ] Hamburger menu button appears on mobile
- [ ] Mobile menu opens/closes correctly
- [ ] Mobile menu backdrop click closes menu
- [ ] All navigation items work in mobile menu
- [ ] Mobile menu is properly styled and accessible

## Authentication Pages

### Login Page
- [ ] Login form displays correctly
- [ ] Email/password validation works
- [ ] Login submission works
- [ ] Error messages display for invalid credentials
- [ ] "Sign Up" link works
- [ ] Redirect after login works (returnUrl parameter)

### Registration Page
- [ ] Registration form displays all required fields
- [ ] Form validation works for all fields
- [ ] Password confirmation validation works
- [ ] Registration submission works
- [ ] Success message and redirect works
- [ ] "Sign In" link works

## Product Browsing

### Browse Page
- [ ] Product grid displays correctly
- [ ] Search functionality works
- [ ] Category filtering works
- [ ] Price range filtering works
- [ ] Condition filtering works
- [ ] Location filtering works
- [ ] Pagination works correctly
- [ ] "No products found" message shows when appropriate
- [ ] Product card interactions work (favorites, clicks)

### Product Details Page
- [ ] Product details display correctly
- [ ] Image gallery/carousel works
- [ ] Product information is complete
- [ ] Seller contact information shows
- [ ] Favorite toggle works
- [ ] Back navigation works
- [ ] Related products show (if implemented)

## Selling Features (Authenticated Users)

### Sell Page
- [ ] Sell form displays all required fields
- [ ] Image upload works correctly
- [ ] Form validation works
- [ ] Category selection works
- [ ] Condition selection works
- [ ] Price input validation works
- [ ] Form submission works
- [ ] Success message and redirect works
- [ ] Error handling works for failed submissions

### User Profile
- [ ] Profile information displays correctly
- [ ] User's listings show
- [ ] Favorite items show
- [ ] Profile editing works (if implemented)
- [ ] Subscription status shows correctly

## Admin Features (Admin Users Only)

### Admin Panel
- [ ] Admin dashboard displays correctly
- [ ] Product approval queue shows
- [ ] User management features work
- [ ] Statistics/analytics display correctly
- [ ] Admin-only features are properly secured

## Responsive Design

### Mobile (320px - 768px)
- [ ] All pages render correctly on mobile
- [ ] Touch interactions work properly
- [ ] Text is readable without zooming
- [ ] Buttons are properly sized for touch
- [ ] Images scale correctly
- [ ] Navigation is usable

### Tablet (768px - 1024px)
- [ ] Layout adapts properly to tablet sizes
- [ ] Grid layouts adjust correctly
- [ ] Navigation remains functional

### Desktop (1024px+)
- [ ] Full desktop layout displays correctly
- [ ] All hover effects work
- [ ] Grid layouts show optimal number of columns

## Dark Mode Support

### Theme Toggle
- [ ] Theme toggle button works
- [ ] Theme preference persists across sessions
- [ ] All components support dark mode
- [ ] Text contrast is sufficient in both themes
- [ ] Images and icons work in both themes

## Performance & Accessibility

### Loading States
- [ ] Loading skeletons display during data fetching
- [ ] Smooth transitions between states
- [ ] Error states display appropriately

### Accessibility
- [ ] Keyboard navigation works throughout the app
- [ ] Screen reader support (basic alt texts, labels)
- [ ] Focus indicators are visible
- [ ] Color contrast meets standards

## Browser Compatibility

### Chrome
- [ ] All features work correctly
- [ ] Styling renders properly
- [ ] Animations/transitions work

### Firefox
- [ ] All features work correctly
- [ ] Styling renders properly
- [ ] Animations/transitions work

### Safari
- [ ] All features work correctly
- [ ] Styling renders properly
- [ ] Animations/transitions work

### Edge
- [ ] All features work correctly
- [ ] Styling renders properly
- [ ] Animations/transitions work

## Network Conditions

### Slow Connection
- [ ] App remains usable on slow connections
- [ ] Loading states provide good feedback
- [ ] Images load progressively

### Offline Behavior
- [ ] App gracefully handles offline state
- [ ] Appropriate error messages show
- [ ] Basic navigation still works

---

## Testing Notes

**Date Started:** ___________  
**Date Completed:** ___________  
**Tested By:** ___________  
**Browser/Device:** ___________  

### Issues Found:
- 
- 
- 

### Additional Notes:
- 
- 
- 