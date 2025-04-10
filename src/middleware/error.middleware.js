/**
 * Error Middleware
 * Provides centralized error handling for the application
 */

const logger = require('../utils/logger');
const { BaseError } = require('../utils/errors');

/**
 * PUBLIC_INTERFACE
 * Request ID middleware
 * Adds a unique request ID to each request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const requestIdMiddleware = (req, res, next) => {
  // Generate a unique request ID
  const requestId = logger.generateRequestId();
  
  // Set the request ID on the request object
  logger.setRequestId(req, requestId);
  
  // Add the request ID to the response headers
  res.setHeader('X-Request-ID', requestId);
  
  next();
};

/**
 * PUBLIC_INTERFACE
 * Not found middleware
 * Handles 404 errors for routes that don't exist
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const notFoundMiddleware = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * PUBLIC_INTERFACE
 * Error handler middleware
 * Handles all errors in the application
 * @param {Object} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandlerMiddleware = (err, req, res, next) => {
  // Get request logger with request ID context
  const reqLogger = logger.createRequestLogger(req);
  
  // Determine if this is an operational error (expected) or programming error (unexpected)
  const isOperationalError = err instanceof BaseError ? err.isOperational : false;
  
  // Set default values
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'Something went wrong';
  
  // Log the error with appropriate level
  if (isOperationalError) {
    // Operational errors are expected and can be logged as warnings or info
    if (statusCode >= 500) {
      reqLogger.error(`Operational Error: ${message}`, { 
        statusCode, 
        errorCode,
        path: req.originalUrl,
        method: req.method,
      });
    } else if (statusCode >= 400) {
      reqLogger.warn(`Operational Error: ${message}`, { 
        statusCode, 
        errorCode,
        path: req.originalUrl,
        method: req.method,
      });
    } else {
      reqLogger.info(`Operational Error: ${message}`, { 
        statusCode, 
        errorCode,
        path: req.originalUrl,
        method: req.method,
      });
    }
  } else {
    // Programming errors are unexpected and should always be logged as errors
    reqLogger.error(`Programming Error: ${message}`, { 
      statusCode, 
      errorCode,
      path: req.originalUrl,
      method: req.method,
      stack: err.stack,
    });
  }
  
  // Prepare the error response
  const errorResponse = {
    success: false,
    error: {
      message,
      code: errorCode,
      statusCode,
    },
  };
  
  // Add validation errors if available
  if (err.errors) {
    errorResponse.error.details = err.errors;
  }
  
  // Add service details for external service errors
  if (err.serviceDetails) {
    errorResponse.error.serviceDetails = err.serviceDetails;
  }
  
  // Include stack trace in development mode only
  if (process.env.NODE_ENV === 'development' && !isOperationalError) {
    errorResponse.error.stack = err.stack;
  }
  
  // Send the error response
  res.status(statusCode).json(errorResponse);
};

/**
 * PUBLIC_INTERFACE
 * Async handler to catch errors in async route handlers
 * @param {Function} fn - Async route handler function
 * @returns {Function} - Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  requestIdMiddleware,
  notFoundMiddleware,
  errorHandlerMiddleware,
  asyncHandler,
};
