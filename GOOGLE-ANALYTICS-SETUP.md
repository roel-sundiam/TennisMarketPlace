# Google Analytics 4 Setup Instructions

## Step 1: Create Google Analytics Account

1. Visit [Google Analytics](https://analytics.google.com/)
2. Click "Start measuring" 
3. Create a new account for "Tennis Marketplace Philippines"
4. Set up a property for your website
5. Select "Web" as the platform

## Step 2: Get Your Measurement ID

1. In your Google Analytics dashboard, go to **Admin** (gear icon)
2. Under **Property**, click **Data Streams**
3. Click on your web stream
4. Copy the **Measurement ID** (format: G-XXXXXXXXXX)

## Step 3: Update Your Website

Replace both instances of `G-XXXXXXXXXX` in `/src/index.html` with your actual Measurement ID:

```html
<!-- Line 13 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR_ACTUAL_ID"></script>

<!-- Line 18 -->
gtag('config', 'YOUR_ACTUAL_ID', {
```

## Step 4: Enable Enhanced Measurement (Recommended)

In Google Analytics:
1. Go to **Admin** > **Data Streams** > Your stream
2. Click **Enhanced measurement**
3. Enable these features:
   - ✅ Page views
   - ✅ Scrolls  
   - ✅ Outbound clicks (crucial for affiliate tracking)
   - ✅ Site search
   - ✅ Video engagement
   - ✅ File downloads

## Step 5: Set Up Custom Events for Blog

The following events will be automatically tracked:
- `affiliate_click` - When users click affiliate links
- `pwa_install` - When users install the PWA
- `blog_view` - When users read blog posts
- `product_view` - When users view products

## Step 6: Connect to Google Search Console

1. In Google Analytics, go to **Admin** > **Property** > **Product Links**
2. Click **Link** for Search Console
3. Select your Tennis Marketplace property
4. This will show search performance data in Analytics

## Expected Blog Traffic Goals

With proper setup, expect to track:
- **30 days:** 1,000+ pageviews, 500+ users
- **90 days:** 5,000+ pageviews, 2,000+ users  
- **6 months:** 15,000+ pageviews, 7,500+ users

Focus on tracking these key metrics:
- Blog post engagement time
- Affiliate link click-through rates
- Product page conversions
- Search console keyword performance

## Quick Test

After setup, test by:
1. Visiting your website
2. Checking Google Analytics **Realtime** report
3. You should see 1 active user (yourself)

Your analytics are now ready to track tennis marketplace traffic and optimize for ₱25,000+ monthly revenue!