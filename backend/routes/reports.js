import express from 'express';
import Report from '../models/Report.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// POST /api/reports - Create a new report (authenticated users)
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      reportedUser,
      reportedProduct,
      type,
      reason,
      description,
      evidence = [],
      reportSource = 'other'
    } = req.body;

    // Validation
    if (!reportedUser) {
      return res.status(400).json({ error: 'Reported user is required' });
    }

    if (!type || !reason || !description) {
      return res.status(400).json({ error: 'Type, reason, and description are required' });
    }

    // Check if reporter is trying to report themselves
    if (req.user._id.toString() === reportedUser.toString()) {
      return res.status(400).json({ error: 'You cannot report yourself' });
    }

    // Verify reported user exists
    const targetUser = await User.findById(reportedUser);
    if (!targetUser) {
      return res.status(404).json({ error: 'Reported user not found' });
    }

    // Verify reported product exists if provided
    let targetProduct = null;
    if (reportedProduct) {
      targetProduct = await Product.findById(reportedProduct);
      if (!targetProduct) {
        return res.status(404).json({ error: 'Reported product not found' });
      }
    }

    // Check for duplicate reports (same reporter, same reported user, same type within 24 hours)
    const existingReport = await Report.findOne({
      reporter: req.user._id,
      reportedUser: reportedUser,
      type: type,
      createdAt: {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
      }
    });

    if (existingReport) {
      return res.status(409).json({
        error: 'You have already submitted a similar report for this user in the last 24 hours',
        existingReportId: existingReport._id
      });
    }

    // Create the report
    const report = new Report({
      reporter: req.user._id,
      reportedUser,
      reportedProduct,
      type,
      reason,
      description,
      evidence,
      metadata: {
        reporterIP: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        reportSource
      }
    });

    await report.save();

    // Populate the report for response
    await report.populate([
      {
        path: 'reporter',
        select: 'firstName lastName email profilePicture'
      },
      {
        path: 'reportedUser',
        select: 'firstName lastName email profilePicture role'
      },
      {
        path: 'reportedProduct',
        select: 'title price images category'
      }
    ]);

    console.log(`📢 New report created by ${req.user.email} against ${targetUser.email} for ${type}`);

    res.status(201).json({
      message: 'Report submitted successfully',
      report: {
        id: report._id,
        type: report.type,
        reason: report.reason,
        status: report.status,
        createdAt: report.createdAt,
        reportedUser: {
          id: report.reportedUser._id,
          name: `${report.reportedUser.firstName} ${report.reportedUser.lastName}`
        }
      }
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// GET /api/reports/my - Get user's submitted reports
router.get('/my', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all', type = 'all' } = req.query;

    const filters = {
      reporter: req.user._id,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    if (status !== 'all') {
      filters.status = status;
    }

    if (type !== 'all') {
      filters.type = type;
    }

    const result = await Report.getFiltered(filters);

    res.json({
      reports: result.reports.map(report => ({
        id: report._id,
        type: report.type,
        reason: report.reason,
        description: report.description,
        status: report.status,
        priority: report.priority,
        createdAt: report.createdAt,
        reportedUser: {
          id: report.reportedUser._id,
          name: `${report.reportedUser.firstName} ${report.reportedUser.lastName}`,
          profilePicture: report.reportedUser.profilePicture
        },
        reportedProduct: report.reportedProduct ? {
          id: report.reportedProduct._id,
          title: report.reportedProduct.title,
          price: report.reportedProduct.price,
          image: report.reportedProduct.images?.[0]
        } : null,
        resolution: report.resolution.action ? {
          action: report.resolution.action,
          reason: report.resolution.reason,
          resolvedAt: report.resolution.resolvedAt
        } : null
      })),
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// GET /api/reports/:id - Get specific report details (reporter or admin only)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reporter', 'firstName lastName email profilePicture role')
      .populate('reportedUser', 'firstName lastName email profilePicture role isActive')
      .populate('reportedProduct', 'title price images category seller')
      .populate('resolution.resolvedBy', 'firstName lastName email role');

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Check permissions: reporter, admin, or reported user (limited info)
    const isReporter = report.reporter._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isReportedUser = report.reportedUser._id.toString() === req.user._id.toString();

    if (!isReporter && !isAdmin && !isReportedUser) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Different response based on user role
    let response = {
      id: report._id,
      type: report.type,
      reason: report.reason,
      status: report.status,
      priority: report.priority,
      createdAt: report.createdAt,
      ageInHours: report.ageInHours
    };

    if (isReporter || isAdmin) {
      response = {
        ...response,
        description: report.description,
        evidence: report.evidence,
        reporter: {
          id: report.reporter._id,
          name: `${report.reporter.firstName} ${report.reporter.lastName}`,
          email: isAdmin ? report.reporter.email : undefined,
          profilePicture: report.reporter.profilePicture
        },
        reportedUser: {
          id: report.reportedUser._id,
          name: `${report.reportedUser.firstName} ${report.reportedUser.lastName}`,
          email: isAdmin ? report.reportedUser.email : undefined,
          profilePicture: report.reportedUser.profilePicture,
          role: report.reportedUser.role,
          isActive: report.reportedUser.isActive
        },
        reportedProduct: report.reportedProduct ? {
          id: report.reportedProduct._id,
          title: report.reportedProduct.title,
          price: report.reportedProduct.price,
          images: report.reportedProduct.images,
          category: report.reportedProduct.category
        } : null
      };

      if (report.resolution.action) {
        response.resolution = {
          action: report.resolution.action,
          reason: report.resolution.reason,
          resolvedAt: report.resolution.resolvedAt,
          resolvedBy: report.resolution.resolvedBy ? {
            name: `${report.resolution.resolvedBy.firstName} ${report.resolution.resolvedBy.lastName}`,
            role: report.resolution.resolvedBy.role
          } : null,
          resolutionTimeInHours: report.resolutionTimeInHours
        };
      }

      if (isAdmin) {
        response.adminNotes = report.adminNotes;
        response.followUp = report.followUp;
        report._includeMetadata = true;
        response.metadata = report.metadata;
      }
    } else if (isReportedUser) {
      // Limited info for reported user
      response.reportedUser = {
        id: report.reportedUser._id,
        name: `${report.reportedUser.firstName} ${report.reportedUser.lastName}`
      };
      if (report.resolution.action) {
        response.resolution = {
          action: report.resolution.action,
          resolvedAt: report.resolution.resolvedAt
        };
      }
    }

    res.json(response);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// Admin-only routes
// GET /api/reports - Get all reports (admin only)
router.get('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = 'all',
      type = 'all',
      priority = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      dateFrom,
      dateTo,
      reportedUser,
      reporter
    } = req.query;

    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
      search,
      dateFrom,
      dateTo,
      reportedUser,
      reporter
    };

    if (status !== 'all') {
      filters.status = status;
    }

    if (type !== 'all') {
      filters.type = type;
    }

    if (priority !== 'all') {
      filters.priority = priority;
    }

    const result = await Report.getFiltered(filters);

    // Include metadata for admin
    result.reports.forEach(report => {
      report._includeMetadata = true;
    });

    res.json({
      reports: result.reports,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// PUT /api/reports/:id/status - Update report status (admin only)
router.put('/:id/status', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['pending', 'under_review', 'resolved', 'dismissed', 'escalated'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    await report.updateStatus(status, req.user._id, notes);

    // Populate for response
    await report.populate([
      {
        path: 'reporter',
        select: 'firstName lastName email'
      },
      {
        path: 'reportedUser',
        select: 'firstName lastName email'
      }
    ]);

    console.log(`📋 Report ${report._id} status updated to ${status} by admin ${req.user.email}`);

    res.json({
      message: 'Report status updated successfully',
      report: {
        id: report._id,
        status: report.status,
        adminNotes: report.adminNotes,
        updatedAt: report.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({ error: 'Failed to update report status' });
  }
});

// PUT /api/reports/:id/resolve - Resolve report with action (admin only)
router.put('/:id/resolve', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { action, reason, adminNotes, userAction } = req.body;

    if (!action || !reason) {
      return res.status(400).json({ error: 'Action and reason are required' });
    }

    const validActions = [
      'no_action',
      'warning_issued',
      'user_suspended',
      'user_banned',
      'product_removed',
      'user_educated',
      'policy_clarified'
    ];

    if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (report.status === 'resolved' || report.status === 'dismissed') {
      return res.status(400).json({ error: 'Report is already resolved' });
    }

    // Resolve the report
    await report.resolve(action, reason, req.user._id, adminNotes);

    // Take additional action on the user if specified
    if (userAction && (action === 'warning_issued' || action === 'user_suspended' || action === 'user_banned')) {
      const reportedUser = await User.findById(report.reportedUser);

      if (reportedUser) {
        try {
          switch (action) {
            case 'warning_issued':
              await reportedUser.issueWarning(req.user._id, reason, report._id, adminNotes);
              break;

            case 'user_suspended':
              const { suspensionType = 'temporary', duration = 24 } = userAction;
              await reportedUser.suspendUser(
                req.user._id,
                reason,
                suspensionType,
                duration,
                report._id,
                adminNotes
              );
              break;

            case 'user_banned':
              await reportedUser.suspendUser(
                req.user._id,
                reason,
                'permanent',
                null,
                report._id,
                adminNotes
              );
              break;
          }

          console.log(`👨‍⚖️ User action ${action} applied to ${reportedUser.email} by admin ${req.user.email}`);
        } catch (userActionError) {
          console.error('Error applying user action:', userActionError);
          // Continue with report resolution even if user action fails
        }
      }
    }

    // Remove product if specified
    if (action === 'product_removed' && report.reportedProduct) {
      try {
        await Product.findByIdAndUpdate(report.reportedProduct, {
          availability: 'removed',
          isApproved: 'rejected'
        });
        console.log(`🗑️ Product ${report.reportedProduct} removed by admin ${req.user.email}`);
      } catch (productError) {
        console.error('Error removing product:', productError);
      }
    }

    console.log(`✅ Report ${report._id} resolved with action ${action} by admin ${req.user.email}`);

    res.json({
      message: 'Report resolved successfully',
      report: {
        id: report._id,
        status: report.status,
        resolution: report.resolution,
        updatedAt: report.updatedAt
      }
    });
  } catch (error) {
    console.error('Error resolving report:', error);
    res.status(500).json({ error: 'Failed to resolve report' });
  }
});

// GET /api/reports/statistics - Get report statistics (admin only)
router.get('/statistics', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { from, to } = req.query;

    const dateRange = {};
    if (from) dateRange.from = from;
    if (to) dateRange.to = to;

    const stats = await Report.getStatistics(dateRange);

    res.json({
      ...stats,
      dateRange: {
        from: from || 'All time',
        to: to || 'Present'
      }
    });
  } catch (error) {
    console.error('Error fetching report statistics:', error);
    res.status(500).json({ error: 'Failed to fetch report statistics' });
  }
});

// PUT /api/reports/:id/escalate - Escalate report priority (admin only)
router.put('/:id/escalate', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { priority = 'high', notes } = req.body;

    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority level' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    await report.escalate(priority, notes);

    console.log(`🚨 Report ${report._id} escalated to ${priority} by admin ${req.user.email}`);

    res.json({
      message: 'Report escalated successfully',
      report: {
        id: report._id,
        status: report.status,
        priority: report.priority,
        updatedAt: report.updatedAt
      }
    });
  } catch (error) {
    console.error('Error escalating report:', error);
    res.status(500).json({ error: 'Failed to escalate report' });
  }
});

// POST /api/reports/:id/evidence - Add evidence to report (reporter only, within 48 hours)
router.post('/:id/evidence', authenticate, async (req, res) => {
  try {
    const { type, url, description } = req.body;

    if (!type || !url) {
      return res.status(400).json({ error: 'Evidence type and URL are required' });
    }

    const validTypes = ['image', 'screenshot', 'document', 'link'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid evidence type' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Check if user is the reporter
    if (report.reporter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the reporter can add evidence' });
    }

    // Check if report is still within evidence submission window (48 hours)
    const hoursOld = (new Date() - report.createdAt) / (1000 * 60 * 60);
    if (hoursOld > 48) {
      return res.status(400).json({ error: 'Evidence can only be added within 48 hours of report submission' });
    }

    // Check if report is still actionable
    if (!report.isActionable()) {
      return res.status(400).json({ error: 'Cannot add evidence to resolved reports' });
    }

    await report.addEvidence({ type, url, description });

    res.json({
      message: 'Evidence added successfully',
      evidence: {
        type,
        url,
        description,
        uploadedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error adding evidence:', error);
    res.status(500).json({ error: 'Failed to add evidence' });
  }
});

export default router;