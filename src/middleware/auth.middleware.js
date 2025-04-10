const jwt = require('jsonwebtoken');
const config = require('../config');
const authService = require('../services/auth.service');
const logger = require('../utils/logger');

/**
 * Extract JWT token from request headers
 * @param {Object} req - Express request object
 * @returns {string|null} - JWT token or null if not found
 * @private
 */
const _extractToken = (req) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};

/**
 * PUBLIC_INTERFACE
 * Middleware to verify JWT token and attach user to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from request headers
    const token = _extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required. No token provided.',
        },
      });
    }

    try {
      // Verify token
      const decoded = authService.verifyToken(token);

      // Check if token is blacklisted
      const isBlacklisted = await authService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Invalid token. Please log in again.',
          },
        });
      }

      // Attach user to request
      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Token expired. Please log in again.',
          },
        });
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Invalid token. Please log in again.',
          },
        });
      }

      logger.error(`Authentication error: ${error.message}`);
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication failed. Please log in again.',
        },
      });
    }
  } catch (error) {
    logger.error(`Authentication middleware error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error during authentication.',
      },
    });
  }
};

/**
 * PUBLIC_INTERFACE
 * Middleware to authorize user roles
 * @param {string[]} roles - Array of allowed roles
 * @returns {Function} - Express middleware function
 */
const authorize = (roles = []) => {
  // Convert string to array if only one role is provided
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    try {
      // Check if user exists and has roles
      if (!req.user || !req.user.roles) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Forbidden. User not authenticated or missing roles.',
          },
        });
      }

      // Check if user has required role
      const hasRole = req.user.roles.some(role => roles.includes(role));

      if (roles.length > 0 && !hasRole) {
        logger.warn(`Authorization failed: User ${req.user.username} does not have required roles`);
        return res.status(403).json({
          success: false,
          error: {
            message: 'Forbidden. You do not have the required permissions.',
          },
        });
      }

      next();
    } catch (error) {
      logger.error(`Authorization middleware error: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error during authorization.',
        },
      });
    }
  };
};

module.exports = {
  authenticate,
  authorize,
};
