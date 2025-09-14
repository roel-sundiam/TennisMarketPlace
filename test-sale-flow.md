# Sale Flow Test Guide

This document explains how to test the new seller/admin mark-as-sold system with 10% transaction fees.

## What Changed

### Before (Old System)
- Buyer had to confirm purchases in the app (unrealistic for Phase 1)
- Sellers got +5 coins initially, +10 more on buyer confirmation
- Buyers got +5 coins for confirming
- Required both seller and buyer to have accounts

### After (New System)
- Sellers can mark their own products as sold
- Admins can mark any product as sold  
- 10% of product price deducted as transaction fee in coins
- No buyer account required (matches Phase 1 MVP design)
- Works with external payments (GCash, cash, meetup)

## API Endpoints

### Seller Mark as Sold
```
POST /api/products/:id/mark-sold
Authorization: Bearer <seller-token>
```

Response:
```json
{
  "message": "Product marked as sold successfully",
  "product": { ... },
  "transactionFee": 150,
  "feePercentage": 10,
  "newCoinBalance": 350
}
```

### Admin Mark as Sold  
```
POST /api/products/:id/admin-mark-sold
Authorization: Bearer <admin-token>
Body: { "reason": "Admin verified sale completion" }
```

### Deprecated Endpoints
- `/api/coins/earn/sale` → Returns 410 Gone
- `/api/coins/earn/sale/confirm` → Returns 410 Gone

## Transaction Fee Calculation

- **Fee Rate**: 10% of product price
- **Conversion**: 1 peso = 1 coin (configurable)
- **Example**: ₱1,500 product = 150 coin fee
- **Rounding**: Always rounds up (`Math.ceil()`)

## Frontend Changes

### Profile Page (`/profile`)
- Added "Mark as Sold" button for available products
- Button only appears if `product.availability !== 'sold'`
- Shows confirmation dialog with fee amount
- Updates coin balance in real-time

### Button Behavior
- Only visible to product owners
- Requires sufficient coin balance
- Confirms action with fee disclosure
- Updates product status immediately

## Testing Steps

### 1. Setup Test Data
1. Create user account with some coins (50 default)
2. Create a product listing (costs 10 coins)
3. Get product approved by admin

### 2. Test Seller Mark as Sold
1. Go to Profile → My Listings
2. Find available product
3. Click "Mark as Sold" button
4. Confirm action in dialog
5. Verify:
   - Product shows as "Sold" 
   - Coin balance decreased by 10% of price
   - Transaction appears in coin history

### 3. Test Insufficient Coins
1. Create expensive product (₱5000+)
2. Try to mark as sold with low coin balance
3. Verify error message about insufficient coins

### 4. Test Admin Mark as Sold
1. Login as admin
2. Use API endpoint to mark product sold
3. Verify seller's coin balance is deducted
4. Check transaction is logged properly

### 5. Test Deprecated Endpoints
1. Call old endpoints
2. Verify 410 Gone status with migration message

## Database Changes

### Product Model
- Added `soldAt`, `soldBy`, `saleMethod`, `transactionFeeApplied` fields
- New `markAsSold()` method

### CoinTransaction Model  
- Added `transaction_fee` as spending reason
- Tracks fee metadata (percentage, original price, method)

## Error Scenarios

1. **Insufficient Coins**: Clear error with required vs current balance
2. **Already Sold**: Prevents double-selling same product  
3. **Unauthorized**: Only owner/admin can mark as sold
4. **Product Not Found**: Handles missing product gracefully

## Success Metrics

- [x] Seller can mark products sold independently
- [x] 10% transaction fee properly calculated and deducted
- [x] Admin oversight capability maintained
- [x] Old buyer confirmation system safely deprecated
- [x] Frontend UI updated with new workflow
- [x] Complete audit trail of all transactions
- [x] No breaking changes to existing data

The new system is fully functional and ready for Phase 1 deployment!