import express from 'express';
import Analytics from '../models/Analytics.js';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Helper function to parse user agent for device info
const parseUserAgent = (userAgent) => {
  if (!userAgent) return { type: 'unknown', browser: null, os: null };
  
  const ua = userAgent.toLowerCase();
  
  // Detect device type
  let deviceType = 'desktop';
  if (ua.includes('mobile') || ua.includes('android')) deviceType = 'mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) deviceType = 'tablet';
  
  // Detect browser
  let browser = null;
  if (ua.includes('chrome') && !ua.includes('edge')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('edge')) browser = 'Edge';
  else if (ua.includes('opera')) browser = 'Opera';
  
  // Detect OS
  let os = null;
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  
  return { type: deviceType, browser, os };
};

// Helper function to get client IP (optimized for Render deployment)
const getClientIP = (req) => {
  // Priority order for IP detection (Render uses x-forwarded-for)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // Get the first IP in the chain (original client IP)
    const firstIP = forwardedFor.split(',')[0].trim();
    if (firstIP && firstIP !== 'unknown') {
      return firstIP;
    }
  }

  // Fallback options
  return req.headers['x-real-ip'] ||
         req.headers['cf-connecting-ip'] || // Cloudflare
         req.headers['x-client-ip'] ||
         req.ip ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         'unknown';
};

// POST /api/analytics/track - Track an analytics event
router.post('/track', async (req, res) => {
  try {
    const {
      eventType,
      path,
      referrer,
      fingerprint,
      sessionId,
      data = {},
      performance = {}
    } = req.body;

    // Validate required fields
    if (!eventType || !path) {
      return res.status(400).json({ 
        error: 'Missing required fields: eventType and path' 
      });
    }

    // Get device info from user agent
    const deviceInfo = parseUserAgent(req.headers['user-agent']);
    
    // Get client IP
    const ipAddress = getClientIP(req);
    
    // Check if user is authenticated and if they're admin
    let userId = null;
    let isAdminActivity = false;
    
    // Extract user from token if present
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        userId = decoded.userId;
        
        // Check if user is admin
        const user = await User.findById(userId);
        if (user && user.role === 'admin') {
          isAdminActivity = true;
        }
      } catch (error) {
        // Invalid token, continue as anonymous
        console.log('Invalid token in analytics tracking:', error.message);
      }
    }

    // Create analytics entry
    const analyticsEntry = new Analytics({
      eventType,
      path,
      referrer: referrer || req.headers.referer,
      fingerprint,
      sessionId,
      userId,
      data: {
        productId: data.productId || null,
        searchQuery: data.searchQuery || null,
        filterData: data.filterData || {},
        errorCode: data.errorCode || null,
        custom: data.custom || {}
      },
      userAgent: req.headers['user-agent'],
      ipAddress,
      device: {
        type: deviceInfo.type,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        screenSize: data.screenSize || {}
      },
      performance: {
        loadTime: performance.loadTime || null,
        timeOnPage: performance.timeOnPage || null
      },
      isAdminActivity
    });

    await analyticsEntry.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Event tracked successfully' 
    });

  } catch (error) {
    console.error('Error tracking analytics:', error);
    res.status(500).json({ 
      error: 'Failed to track event' 
    });
  }
});

// GET /api/analytics/stats - Get analytics statistics (admin only)
router.get('/stats', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate = new Date(),
      excludeAdmin = 'true'
    } = req.query;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const excludeAdminBool = excludeAdmin === 'true';

    // Get visitor statistics
    const visitorStats = await Analytics.getVisitorStats(start, end, excludeAdminBool);
    
    // Get daily trends
    const dailyTrends = await Analytics.getDailyTrends(30, excludeAdminBool);
    
    // Get device statistics
    const deviceStats = await Analytics.getDeviceStats(start, end, excludeAdminBool);
    
    // Get popular products
    const popularProducts = await Analytics.getPopularProducts(start, end, 10, excludeAdminBool);
    
    // Get search statistics
    const searchStats = await Analytics.getSearchStats(start, end, 20, excludeAdminBool);

    res.json({
      success: true,
      data: {
        overview: visitorStats,
        trends: dailyTrends,
        devices: deviceStats,
        popularProducts,
        searchStats,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString()
        },
        excludedAdmin: excludeAdminBool
      }
    });

  } catch (error) {
    console.error('Error fetching analytics stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analytics statistics' 
    });
  }
});

// GET /api/analytics/realtime - Get real-time analytics (admin only)
router.get('/realtime', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const excludeAdmin = req.query.excludeAdmin === 'true';
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);

    const filter = {
      createdAt: { $gte: lastHour }
    };
    
    if (excludeAdmin) {
      filter.isAdminActivity = { $ne: true };
    }

    // Get recent activity
    const recentActivity = await Analytics
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('userId', 'firstName lastName email')
      .populate('data.productId', 'title price');

    // Count active users (unique fingerprints + users in last hour)
    const [activeAnonymous, activeUsers] = await Promise.all([
      Analytics.distinct('fingerprint', { 
        ...filter, 
        fingerprint: { $ne: null },
        userId: null 
      }).then(result => result.length),
      
      Analytics.distinct('userId', { 
        ...filter, 
        userId: { $ne: null } 
      }).then(result => result.length)
    ]);

    res.json({
      success: true,
      data: {
        activeUsers: activeAnonymous + activeUsers,
        activeAnonymous,
        activeRegistered: activeUsers,
        recentActivity: recentActivity.map(activity => ({
          eventType: activity.eventType,
          path: activity.path,
          user: activity.userId ? {
            name: activity.userId.firstName + ' ' + activity.userId.lastName,
            email: activity.userId.email
          } : null,
          fingerprint: activity.fingerprint,
          product: activity.data.productId ? {
            title: activity.data.productId.title,
            price: activity.data.productId.price
          } : null,
          timestamp: activity.createdAt,
          device: activity.device.type,
          browser: activity.device.browser
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching real-time analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch real-time analytics' 
    });
  }
});

// GET /api/analytics/export - Export analytics data (admin only)
router.get('/export', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate = new Date(),
      format = 'json',
      eventTypes,
      excludeAdmin = 'true'
    } = req.query;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const excludeAdminBool = excludeAdmin === 'true';

    const filter = {
      createdAt: { $gte: start, $lte: end }
    };

    if (excludeAdminBool) {
      filter.isAdminActivity = { $ne: true };
    }

    if (eventTypes) {
      const types = eventTypes.split(',');
      filter.eventType = { $in: types };
    }

    const analytics = await Analytics
      .find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'firstName lastName email')
      .populate('data.productId', 'title price category')
      .limit(10000); // Limit for performance

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeaders = [
        'Timestamp', 'Event Type', 'Path', 'User Email', 'User Name',
        'Fingerprint', 'Device Type', 'Browser', 'IP Address', 'Product Title',
        'Search Query'
      ];

      const csvData = analytics.map(record => [
        record.createdAt.toISOString(),
        record.eventType,
        record.path,
        record.userId?.email || '',
        record.userId ? `${record.userId.firstName} ${record.userId.lastName}` : '',
        record.fingerprint || '',
        record.device.type,
        record.device.browser || '',
        record.ipAddress,
        record.data.productId?.title || '',
        record.data.searchQuery || ''
      ]);

      const csvContent = [csvHeaders, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-export-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);

    } else {
      // JSON format
      res.json({
        success: true,
        data: analytics,
        metadata: {
          totalRecords: analytics.length,
          dateRange: { start: start.toISOString(), end: end.toISOString() },
          excludedAdmin: excludeAdminBool
        }
      });
    }

  } catch (error) {
    console.error('Error exporting analytics data:', error);
    res.status(500).json({ 
      error: 'Failed to export analytics data' 
    });
  }
});

// GET /api/analytics/user-visits - Get detailed user visits report (admin only)
router.get('/user-visits', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate = new Date(),
      page = 1,
      limit = 50,
      excludeAdmin = 'true',
      sortBy = 'lastVisit' // lastVisit, firstVisit, visitCount, username
    } = req.query;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const excludeAdminBool = excludeAdmin === 'true';
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const matchStage = Analytics.getBaseFilter({
      createdAt: { $gte: start, $lte: end }
    }, excludeAdminBool);

    // Aggregate user visits data
    const userVisitsAggregation = [
      { 
        $match: { 
          ...matchStage,
          userId: { $ne: null } // Only include records with valid userId
        } 
      },
      {
        $group: {
          _id: '$userId',
          firstVisit: { $min: '$createdAt' },
          lastVisit: { $max: '$createdAt' },
          totalPageViews: { $sum: 1 },
          uniqueSessions: { $addToSet: '$sessionId' },
          eventTypes: { $addToSet: '$eventType' },
          devices: { $addToSet: '$device.type' },
          browsers: { $addToSet: '$device.browser' },
          paths: { $addToSet: '$path' },
          ipAddresses: { $addToSet: '$ipAddress' }
        }
      },
      {
        $addFields: {
          sessionCount: { $size: '$uniqueSessions' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: {
          path: '$userInfo',
          preserveNullAndEmptyArrays: false // Only include records with valid user info
        }
      },
      {
        $project: {
          _id: 1,
          username: { $concat: ['$userInfo.firstName', ' ', '$userInfo.lastName'] },
          email: '$userInfo.email',
          userRole: '$userInfo.role',
          subscription: '$userInfo.subscription',
          isVerified: '$userInfo.isVerified',
          firstVisit: 1,
          lastVisit: 1,
          totalPageViews: 1,
          sessionCount: 1,
          eventTypes: 1,
          devices: 1,
          browsers: 1,
          uniquePathsCount: { $size: '$paths' },
          ipAddresses: 1,
          uniqueIPsCount: { $size: '$ipAddresses' },
          avgPagesPerSession: {
            $round: [{ $divide: ['$totalPageViews', '$sessionCount'] }, 1]
          }
        }
      }
    ];

    // Add sorting
    let sortStage = {};
    switch (sortBy) {
      case 'firstVisit':
        sortStage = { firstVisit: -1 };
        break;
      case 'visitCount':
        sortStage = { totalPageViews: -1 };
        break;
      case 'username':
        sortStage = { username: 1 };
        break;
      default: // lastVisit
        sortStage = { lastVisit: -1 };
    }

    userVisitsAggregation.push({ $sort: sortStage });

    // Get total count for pagination
    const countAggregation = [
      { 
        $match: { 
          ...matchStage,
          userId: { $ne: null }
        } 
      },
      {
        $group: {
          _id: '$userId'
        }
      },
      { $count: 'total' }
    ];
    const countResult = await Analytics.aggregate(countAggregation);
    const totalUsers = countResult[0]?.total || 0;

    // Add pagination
    userVisitsAggregation.push({ $skip: skip });
    userVisitsAggregation.push({ $limit: limitNum });

    const userVisits = await Analytics.aggregate(userVisitsAggregation);

    // Get anonymous visitors count
    const anonymousVisitorsCount = await Analytics.aggregate([
      { 
        $match: { 
          ...matchStage, 
          userId: null,
          fingerprint: { $ne: null }
        } 
      },
      {
        $group: {
          _id: '$fingerprint',
          visitCount: { $sum: 1 },
          lastVisit: { $max: '$createdAt' }
        }
      },
      { $count: 'total' }
    ]);

    const anonymousCount = anonymousVisitorsCount[0]?.total || 0;

    // Calculate summary stats
    const totalPages = Math.ceil(totalUsers / limitNum);

    res.json({
      success: true,
      data: {
        users: userVisits,
        summary: {
          totalRegisteredVisitors: totalUsers,
          totalAnonymousVisitors: anonymousCount,
          totalVisitors: totalUsers + anonymousCount,
          dateRange: {
            start: start.toISOString(),
            end: end.toISOString()
          }
        },
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: totalUsers,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
          limit: limitNum
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user visits:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user visits data' 
    });
  }
});

// GET /api/analytics/anonymous-visits - Get detailed anonymous visitors report (admin only)
router.get('/anonymous-visits', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate = new Date(),
      page = 1,
      limit = 50,
      sortBy = 'lastVisit' // lastVisit, firstVisit, visitCount
    } = req.query;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const matchStage = Analytics.getBaseFilter({
      createdAt: { $gte: start, $lte: end },
      userId: null,
      fingerprint: { $ne: null }
    }, true); // exclude admin activity

    // Aggregate anonymous visitors data
    const anonymousVisitsAggregation = [
      { $match: matchStage },
      {
        $group: {
          _id: '$fingerprint',
          firstVisit: { $min: '$createdAt' },
          lastVisit: { $max: '$createdAt' },
          totalPageViews: { $sum: 1 },
          uniqueSessions: { $addToSet: '$sessionId' },
          eventTypes: { $addToSet: '$eventType' },
          devices: { $addToSet: '$device.type' },
          browsers: { $addToSet: '$device.browser' },
          paths: { $addToSet: '$path' },
          ipAddresses: { $addToSet: '$ipAddress' },
          userAgents: { $addToSet: '$userAgent' }
        }
      },
      {
        $addFields: {
          sessionCount: { $size: '$uniqueSessions' },
          deviceCount: { $size: '$devices' },
          uniquePathsCount: { $size: '$paths' },
          uniqueIPs: { $size: '$ipAddresses' }
        }
      },
      {
        $project: {
          fingerprint: '$_id',
          firstVisit: 1,
          lastVisit: 1,
          totalPageViews: 1,
          sessionCount: 1,
          deviceCount: 1,
          uniquePathsCount: 1,
          uniqueIPs: 1,
          eventTypes: 1,
          devices: 1,
          browsers: 1,
          paths: 1,
          ipAddresses: 1,
          primaryDevice: { $arrayElemAt: ['$devices', 0] },
          primaryBrowser: { $arrayElemAt: ['$browsers', 0] },
          primaryIP: { $arrayElemAt: ['$ipAddresses', 0] },
          avgPagesPerSession: {
            $round: [{ $divide: ['$totalPageViews', '$sessionCount'] }, 1]
          }
        }
      }
    ];

    // Add sorting
    let sortStage = {};
    switch (sortBy) {
      case 'firstVisit':
        sortStage = { firstVisit: -1 };
        break;
      case 'visitCount':
        sortStage = { totalPageViews: -1 };
        break;
      default: // lastVisit
        sortStage = { lastVisit: -1 };
    }
    anonymousVisitsAggregation.push({ $sort: sortStage });

    // Get total count for pagination
    const countResult = await Analytics.aggregate([
      { $match: matchStage },
      { $group: { _id: '$fingerprint' } },
      { $count: 'total' }
    ]);
    const totalVisitors = countResult[0]?.total || 0;

    // Add pagination
    anonymousVisitsAggregation.push({ $skip: skip });
    anonymousVisitsAggregation.push({ $limit: limitNum });

    const anonymousVisits = await Analytics.aggregate(anonymousVisitsAggregation);

    // Get summary statistics
    const summaryStats = await Analytics.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalPageViews: { $sum: 1 },
          uniqueFingerprints: { $addToSet: '$fingerprint' },
          uniqueSessions: { $addToSet: '$sessionId' },
          uniqueIPs: { $addToSet: '$ipAddress' },
          devices: { $addToSet: '$device.type' },
          browsers: { $addToSet: '$device.browser' }
        }
      },
      {
        $project: {
          totalPageViews: 1,
          uniqueVisitors: { $size: '$uniqueFingerprints' },
          totalSessions: { $size: '$uniqueSessions' },
          uniqueIPs: { $size: '$uniqueIPs' },
          deviceBreakdown: '$devices',
          browserBreakdown: '$browsers'
        }
      }
    ]);

    const summary = summaryStats[0] || {
      totalPageViews: 0,
      uniqueVisitors: 0,
      totalSessions: 0,
      uniqueIPs: 0,
      deviceBreakdown: [],
      browserBreakdown: []
    };

    const totalPages = Math.ceil(totalVisitors / limitNum);

    res.json({
      success: true,
      data: {
        visitors: anonymousVisits,
        summary: {
          ...summary,
          dateRange: {
            start: start.toISOString(),
            end: end.toISOString()
          }
        },
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: totalVisitors,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
          limit: limitNum
        }
      }
    });

  } catch (error) {
    console.error('Error fetching anonymous visits:', error);
    res.status(500).json({ 
      error: 'Failed to fetch anonymous visits data' 
    });
  }
});

// GET /api/analytics/ip-debug - Debug IP detection (admin only)
router.get('/ip-debug', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const detectedIP = getClientIP(req);

    res.json({
      success: true,
      ipDebug: {
        detectedIP,
        headers: {
          'x-forwarded-for': req.headers['x-forwarded-for'],
          'x-real-ip': req.headers['x-real-ip'],
          'cf-connecting-ip': req.headers['cf-connecting-ip'],
          'x-client-ip': req.headers['x-client-ip']
        },
        expressIP: req.ip,
        connectionRemoteAddress: req.connection?.remoteAddress,
        socketRemoteAddress: req.socket?.remoteAddress,
        trustProxy: req.app.get('trust proxy')
      }
    });
  } catch (error) {
    console.error('Error in IP debug:', error);
    res.status(500).json({ error: 'Failed to debug IP detection' });
  }
});

// GET /api/analytics/debug - Debug analytics data (admin only)
router.get('/debug', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get recent analytics entries
    const recentEntries = await Analytics
      .find({})
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('userId', 'firstName lastName email role');
    
    // Get counts by event type
    const eventCounts = await Analytics.aggregate([
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get user vs anonymous counts
    const userCounts = await Analytics.aggregate([
      {
        $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          authenticatedEvents: { $sum: { $cond: [{ $ne: ['$userId', null] }, 1, 0] } },
          anonymousEvents: { $sum: { $cond: [{ $eq: ['$userId', null] }, 1, 0] } },
          uniqueUsers: { $addToSet: '$userId' },
          uniqueFingerprints: { $addToSet: '$fingerprint' }
        }
      },
      {
        $project: {
          totalEvents: 1,
          authenticatedEvents: 1,
          anonymousEvents: 1,
          uniqueUsers: { $size: { $filter: { input: '$uniqueUsers', cond: { $ne: ['$$this', null] } } } },
          uniqueFingerprints: { $size: { $filter: { input: '$uniqueFingerprints', cond: { $ne: ['$$this', null] } } } }
        }
      }
    ]);

    res.json({
      success: true,
      debug: {
        recentEntries,
        eventCounts,
        summary: userCounts[0] || {
          totalEvents: 0,
          authenticatedEvents: 0,
          anonymousEvents: 0,
          uniqueUsers: 0,
          uniqueFingerprints: 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching debug analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch debug analytics' 
    });
  }
});

// POST /api/analytics/cleanup - Clean up old analytics data (admin only)
router.post('/cleanup', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { daysToKeep = 365 } = req.body;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const result = await Analytics.deleteMany({
      createdAt: { $lt: cutoffDate }
    });

    res.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} analytics records older than ${daysToKeep} days`
    });

  } catch (error) {
    console.error('Error cleaning up analytics data:', error);
    res.status(500).json({ 
      error: 'Failed to clean up analytics data' 
    });
  }
});

export default router;