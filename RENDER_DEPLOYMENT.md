# Tennis Marketplace - Render Deployment Guide

This guide explains how to deploy the Tennis Marketplace application to Render.

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code must be in a GitHub repository
3. **MongoDB Atlas**: Set up a MongoDB cloud database (or use Render's PostgreSQL if you prefer)
4. **Firebase Project**: Set up Firebase for image storage (optional but recommended)

## Deployment Steps

### 1. Deploy Backend API Service

1. Go to your Render dashboard
2. Click "New +" and select "Web Service"
3. Connect your GitHub account and select this repository
4. Configure the service:
   - **Name**: `tennis-marketplace-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 2. Deploy Frontend Service

1. Click "New +" and select "Static Site"
2. Connect the same GitHub repository
3. Configure the service:
   - **Name**: `tennis-marketplace-frontend`
   - **Root Directory**: `tennis-marketplace`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist/baseline-gearhub`

### 3. Set Environment Variables

#### Backend Service Environment Variables

Set these in the Render dashboard for your `tennis-marketplace-api` service:

**Required:**
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Generate a secure random string (32+ characters)
- `NODE_ENV`: `production`

**Firebase (Optional but recommended):**
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `FIREBASE_PRIVATE_KEY`: Your Firebase private key (including newlines)
- `FIREBASE_CLIENT_EMAIL`: Your Firebase service account email
- `FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket name

**Auto-configured by Render:**
- `PORT`: Automatically set by Render
- `FRONTEND_URL`: Set this to your frontend service URL (e.g., `https://tennis-marketplace-frontend.onrender.com`)

#### Frontend Service Environment Variables

The frontend is a static site, so environment variables are handled during build time. You'll need to update the API URL in `tennis-marketplace/src/environments/environment.prod.ts` to match your backend service URL.

### 3. Database Setup

#### Option A: MongoDB Atlas (Recommended)
1. Create a MongoDB Atlas cluster
2. Get your connection string
3. Set `MONGODB_URI` in Render environment variables

#### Option B: Use Render's Managed Database
1. The `render.yaml` includes a PostgreSQL database
2. You'll need to modify the backend to use PostgreSQL instead of MongoDB
3. Install `pg` package and update the database connection code

### 4. Update API URL and Deploy

1. After your backend service is deployed, note its URL (e.g., `https://tennis-marketplace-api.onrender.com`)
2. Update `tennis-marketplace/src/environments/environment.prod.ts` with your actual backend URL:
   ```typescript
   export const environment = {
     production: true,
     apiUrl: 'https://your-actual-backend-url.onrender.com/api'
   };
   ```
3. Commit and push this change
4. Both services will automatically redeploy
5. Monitor the build logs in the Render dashboard

## Service URLs

After deployment, your services will be available at:

- **API**: `https://tennis-marketplace-api.onrender.com`
- **Frontend**: `https://tennis-marketplace-frontend.onrender.com`
- **Health Check**: `https://tennis-marketplace-api.onrender.com/api/health`

## Configuration Files Created

- `render.yaml`: Blueprint configuration (optional - can use Web Service approach instead)
- `tennis-marketplace/src/environments/environment.prod.ts`: Production environment settings
- `backend/.env.production`: Production environment template
- `backend/health.js`: Health check endpoint

## Alternative: Blueprint Deployment

If you prefer to use the Blueprint approach instead of individual Web Services:

1. Click "New +" and select "Blueprint"
2. Connect your GitHub repository
3. Render will automatically detect the `render.yaml` file and create both services
4. This approach is faster but gives you less control over individual service settings

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Ensure all dependencies are in package.json
   - Review build logs in Render dashboard

2. **Database Connection Issues**
   - Verify MongoDB URI is correct
   - Check firewall settings in MongoDB Atlas
   - Ensure database user has correct permissions

3. **CORS Errors**
   - Verify `FRONTEND_URL` environment variable is set correctly
   - Check CORS configuration in `backend/server.js`

4. **File Upload Issues**
   - Verify Firebase credentials are set correctly
   - Check Firebase Storage bucket permissions
   - Ensure storage bucket name is correct

### Checking Logs

- Go to Render dashboard
- Select your service
- Click on "Logs" tab
- Monitor real-time logs for errors

## Production Optimizations

### Backend
- Rate limiting is configured (1000 requests/15 minutes)
- Health check endpoint for monitoring
- Error handling with proper HTTP status codes
- CORS configured for production domains

### Frontend
- Angular production build with optimization
- Output hashing for cache busting
- Asset compression and minification
- Environment-specific API URLs

## Scaling

Render automatically handles:
- Load balancing
- SSL certificates
- Health checks
- Auto-restarts on failures

For higher traffic, consider upgrading to:
- Render Pro plans for better performance
- Dedicated database instances
- CDN for static assets

## Security

- Environment variables are encrypted
- HTTPS is enforced by default
- Rate limiting prevents abuse
- JWT tokens for authentication
- CORS configured for production domains

## Monitoring

Set up monitoring for:
- Service uptime
- Response times
- Error rates
- Database performance

Consider integrating:
- Render's built-in monitoring
- External monitoring services (e.g., Datadog, New Relic)
- Log aggregation services

## Support

If you encounter issues:
1. Check the Render documentation
2. Review the service logs
3. Contact Render support through their dashboard
4. Check this repository's issues section