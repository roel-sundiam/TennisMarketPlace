import User from '../models/User.js';

export const extractClientInfo = (req, res, next) => {
  const getClientIP = (request) => {
    return (
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.headers['x-real-ip'] ||
      request.headers['x-client-ip'] ||
      request.headers['x-cluster-client-ip'] ||
      request.headers['cf-connecting-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.connection?.socket?.remoteAddress ||
      request.ip ||
      '127.0.0.1'
    );
  };

  req.clientInfo = {
    ipAddress: getClientIP(req),
    userAgent: req.headers['user-agent'] || null,
    deviceFingerprint: req.body.deviceFingerprint || null
  };

  next();
};

export const checkRegistrationLimits = async (req, res, next) => {
  try {
    const { ipAddress, deviceFingerprint } = req.clientInfo;

    if (!deviceFingerprint) {
      return res.status(400).json({
        error: 'Device fingerprint is required for registration security'
      });
    }

    const existingByFingerprint = await User.findOne({
      'registration.deviceFingerprint': deviceFingerprint,
      'registration.isDuplicateApproved': false
    });

    if (existingByFingerprint) {
      return res.status(409).json({
        error: 'A user account already exists from this device. Multiple accounts per device are not allowed.',
        code: 'DEVICE_LIMIT_EXCEEDED',
        existingUser: {
          email: existingByFingerprint.email,
          createdAt: existingByFingerprint.createdAt,
          isActive: existingByFingerprint.isActive
        }
      });
    }

    const usersFromIP = await User.countDocuments({
      'registration.ipAddress': ipAddress,
      'registration.isDuplicateApproved': false
    });

    if (usersFromIP >= 3) {
      return res.status(429).json({
        error: 'Too many accounts registered from this IP address. Contact support for assistance.',
        code: 'IP_LIMIT_EXCEEDED',
        limit: 3,
        current: usersFromIP
      });
    }

    if (usersFromIP >= 1) {
      req.flaggedRegistration = {
        reason: 'MULTIPLE_FROM_IP',
        ipCount: usersFromIP
      };
    }

    next();
  } catch (error) {
    console.error('Registration limit check error:', error);
    res.status(500).json({ error: 'Failed to validate registration limits' });
  }
};

export const logRegistrationAttempt = async (req, res, next) => {
  try {
    const { ipAddress, userAgent, deviceFingerprint } = req.clientInfo;
    const { email } = req.body;

    console.log('Registration attempt:', {
      email: email,
      ipAddress,
      deviceFingerprint,
      userAgent,
      timestamp: new Date().toISOString(),
      flagged: req.flaggedRegistration || null
    });

    next();
  } catch (error) {
    console.error('Registration logging error:', error);
    next();
  }
};