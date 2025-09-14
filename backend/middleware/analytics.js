import Analytics from '../models/Analytics.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Helper function to generate session ID
const generateSessionId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Helper function to parse user agent
const parseUserAgent = (userAgent) => {
  if (!userAgent) return { type: 'unknown', browser: null, os: null };
  
  const ua = userAgent.toLowerCase();
  
  let deviceType = 'desktop';
  if (ua.includes('mobile') || ua.includes('android')) deviceType = 'mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) deviceType = 'tablet';
  
  let browser = null;
  if (ua.includes('chrome') && !ua.includes('edge')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('edge')) browser = 'Edge';
  else if (ua.includes('opera')) browser = 'Opera';
  
  let os = null;
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  
  return { type: deviceType, browser, os };
};

// Helper function to get client IP
const getClientIP = (req) => {
  return req.ip || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         'unknown';
};

// Middleware to track page views automatically
export const trackPageView = async (req, res, next) => {
  // Only track GET requests to avoid tracking API calls
  if (req.method !== 'GET') {
    return next();
  }

  // Skip tracking for static assets, API endpoints, and health checks
  const skipPaths = [
    '/api/',
    '/favicon.ico',
    '/manifest.json',
    '/sw.js',
    '.js',
    '.css',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.ico',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot'
  ];

  const shouldSkip = skipPaths.some(path => req.url.includes(path));
  if (shouldSkip) {
    return next();
  }

  try {
    // Extract user info if authenticated
    let userId = null;
    let isAdminActivity = false;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        userId = decoded.userId;
        
        const user = await User.findById(userId);
        if (user && user.role === 'admin') {
          isAdminActivity = true;
        }
      } catch (error) {
        // Invalid token, continue as anonymous
      }
    }

    // Get device info
    const deviceInfo = parseUserAgent(req.headers['user-agent']);
    
    // Get fingerprint from header if provided by frontend
    const fingerprint = req.headers['x-fingerprint'] || null;
    
    // Get session ID from header or generate one
    const sessionId = req.headers['x-session-id'] || generateSessionId();

    // Create analytics entry for page view
    const analyticsEntry = new Analytics({
      eventType: 'page_view',
      path: req.url,
      referrer: req.headers.referer || null,
      fingerprint,
      sessionId,
      userId,
      userAgent: req.headers['user-agent'],
      ipAddress: getClientIP(req),
      device: {
        type: deviceInfo.type,
        browser: deviceInfo.browser,
        os: deviceInfo.os
      },
      isAdminActivity
    });

    // Save asynchronously without blocking the response
    analyticsEntry.save().catch(error => {
      console.error('Failed to save page view analytics:', error);
    });

    // Add session ID to response headers for frontend tracking
    res.setHeader('X-Session-ID', sessionId);

  } catch (error) {
    console.error('Error in trackPageView middleware:', error);
  }

  next();
};

// Middleware to track API usage
export const trackApiUsage = (eventType = 'api_call') => {
  return async (req, res, next) => {
    try {
      // Extract user info if authenticated
      let userId = null;
      let isAdminActivity = false;

      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
          userId = decoded.userId;
          
          const user = await User.findById(userId);
          if (user && user.role === 'admin') {
            isAdminActivity = true;
          }
        } catch (error) {
          // Invalid token, continue as anonymous
        }
      }

      // Get device info
      const deviceInfo = parseUserAgent(req.headers['user-agent']);
      
      // Get fingerprint from header if provided by frontend
      const fingerprint = req.headers['x-fingerprint'] || null;
      const sessionId = req.headers['x-session-id'] || generateSessionId();

      // Capture the original json method to track response data
      const originalJson = res.json;
      let responseData = null;

      res.json = function(data) {
        responseData = data;
        return originalJson.call(this, data);
      };

      // Listen for response finish to track the API call
      res.on('finish', async () => {
        try {
          // Determine specific event type based on API endpoint
          let specificEventType = eventType;
          const path = req.url;
          
          if (path.includes('/products') && req.method === 'GET') {
            specificEventType = 'product_browse';
          } else if (path.includes('/products/') && req.method === 'GET') {
            specificEventType = 'product_view';
          } else if (path.includes('/search')) {
            specificEventType = 'search';
          } else if (path.includes('/auth/login')) {
            specificEventType = 'user_login';
          } else if (path.includes('/auth/register')) {
            specificEventType = 'user_register';
          }

          const analyticsEntry = new Analytics({
            eventType: specificEventType,
            path,
            fingerprint,
            sessionId,
            userId,
            data: {
              method: req.method,
              statusCode: res.statusCode,
              custom: {
                endpoint: path,
                success: res.statusCode < 400
              }
            },
            userAgent: req.headers['user-agent'],
            ipAddress: getClientIP(req),
            device: {
              type: deviceInfo.type,
              browser: deviceInfo.browser,
              os: deviceInfo.os
            },
            isAdminActivity
          });

          await analyticsEntry.save();
        } catch (error) {
          console.error('Failed to save API usage analytics:', error);
        }
      });

    } catch (error) {
      console.error('Error in trackApiUsage middleware:', error);
    }

    next();
  };
};

// Middleware to track specific product interactions
export const trackProductInteraction = (interactionType) => {
  return async (req, res, next) => {
    try {
      let userId = null;
      let isAdminActivity = false;

      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
          userId = decoded.userId;
          
          const user = await User.findById(userId);
          if (user && user.role === 'admin') {
            isAdminActivity = true;
          }
        } catch (error) {
          // Invalid token, continue as anonymous
        }
      }

      const deviceInfo = parseUserAgent(req.headers['user-agent']);
      const fingerprint = req.headers['x-fingerprint'] || null;
      const sessionId = req.headers['x-session-id'] || generateSessionId();

      res.on('finish', async () => {
        try {
          // Only track successful interactions
          if (res.statusCode < 400) {
            const productId = req.params.id || req.params.productId || req.body.productId;
            
            const analyticsEntry = new Analytics({
              eventType: interactionType,
              path: req.url,
              fingerprint,
              sessionId,
              userId,
              data: {
                productId: productId || null
              },
              userAgent: req.headers['user-agent'],
              ipAddress: getClientIP(req),
              device: {
                type: deviceInfo.type,
                browser: deviceInfo.browser,
                os: deviceInfo.os
              },
              isAdminActivity
            });

            await analyticsEntry.save();
          }
        } catch (error) {
          console.error('Failed to save product interaction analytics:', error);
        }
      });

    } catch (error) {
      console.error('Error in trackProductInteraction middleware:', error);
    }

    next();
  };
};

// Middleware to track errors
export const trackError = async (error, req, res, next) => {
  try {
    let userId = null;
    let isAdminActivity = false;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        userId = decoded.userId;
        
        const user = await User.findById(userId);
        if (user && user.role === 'admin') {
          isAdminActivity = true;
        }
      } catch (error) {
        // Invalid token, continue as anonymous
      }
    }

    const deviceInfo = parseUserAgent(req.headers['user-agent']);
    const fingerprint = req.headers['x-fingerprint'] || null;
    const sessionId = req.headers['x-session-id'] || generateSessionId();

    const analyticsEntry = new Analytics({
      eventType: 'error',
      path: req.url,
      fingerprint,
      sessionId,
      userId,
      data: {
        errorCode: error.status || 500,
        custom: {
          errorMessage: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : null
        }
      },
      userAgent: req.headers['user-agent'],
      ipAddress: getClientIP(req),
      device: {
        type: deviceInfo.type,
        browser: deviceInfo.browser,
        os: deviceInfo.os
      },
      isAdminActivity
    });

    // Save error analytics asynchronously
    analyticsEntry.save().catch(saveError => {
      console.error('Failed to save error analytics:', saveError);
    });

  } catch (analyticsError) {
    console.error('Error in trackError middleware:', analyticsError);
  }

  // Continue with normal error handling
  next(error);
};

export default {
  trackPageView,
  trackApiUsage,
  trackProductInteraction,
  trackError
};