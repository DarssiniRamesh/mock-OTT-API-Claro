/**
 * Logger Utility
 * Provides structured logging with Winston
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

// Create a symbol for storing the request ID on the request object
const REQUEST_ID_SYMBOL = Symbol('requestId');

// Sensitive data patterns to mask in logs
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'authorization',
  'cookie',
  'secret',
  'credential',
  'creditCard',
  'cardNumber',
  'cvv',
];

/**
 * Mask sensitive information in objects
 * @param {Object} obj - Object to mask
 * @returns {Object} - Masked object
 */
const maskSensitiveData = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const maskedObj = { ...obj };
  
  // Recursively mask sensitive data
  Object.keys(maskedObj).forEach((key) => {
    const lowerKey = key.toLowerCase();
    
    // Check if the key contains any sensitive field name
    const isSensitive = SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()));
    
    if (isSensitive) {
      maskedObj[key] = '[REDACTED]';
    } else if (typeof maskedObj[key] === 'object' && maskedObj[key] !== null) {
      // Recursively mask nested objects
      maskedObj[key] = maskSensitiveData(maskedObj[key]);
    }
  });
  
  return maskedObj;
};

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
  winston.format.printf((info) => {
    const { timestamp, level, message, metadata = {}, stack } = info;
    const requestId = metadata.requestId || 'no-request-id';
    
    // Mask sensitive data in metadata
    const maskedMetadata = maskSensitiveData(metadata);
    
    // Format the log message
    let log = `${timestamp} [${level}] [${requestId}]: ${message}`;
    
    // Add metadata if not empty
    if (Object.keys(maskedMetadata).length > 0 && maskedMetadata.requestId) {
      delete maskedMetadata.requestId; // Remove requestId from metadata as it's already in the log
    }
    
    if (Object.keys(maskedMetadata).length > 0) {
      log += ` ${JSON.stringify(maskedMetadata)}`;
    }
    
    // Add stack trace if available
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  }),
);

// Configure file rotation options
const fileRotationTransport = new DailyRotateFile({
  filename: 'logs/%DATE%-combined.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  zippedArchive: true,
});

const errorFileRotationTransport = new DailyRotateFile({
  filename: 'logs/%DATE%-error.log',
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '30d',
  zippedArchive: true,
});

// Create logger instance
const logger = winston.createLogger({
  level: config.logLevel || 'info',
  format: logFormat,
  defaultMeta: { service: 'geolocation-service' },
  transports: [
    fileRotationTransport,
    errorFileRotationTransport,
  ],
  // Don't exit on error
  exitOnError: false,
});

// If we're not in production, log to the console as well
if (config.env !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
    ),
  }));
}

/**
 * PUBLIC_INTERFACE
 * Generate a unique request ID
 * @returns {string} - UUID v4
 */
const generateRequestId = () => uuidv4();

/**
 * PUBLIC_INTERFACE
 * Get request ID from request object
 * @param {Object} req - Express request object
 * @returns {string} - Request ID
 */
const getRequestId = (req) => {
  return req[REQUEST_ID_SYMBOL] || 'no-request-id';
};

/**
 * PUBLIC_INTERFACE
 * Set request ID on request object
 * @param {Object} req - Express request object
 * @param {string} requestId - Request ID
 */
const setRequestId = (req, requestId) => {
  req[REQUEST_ID_SYMBOL] = requestId;
};

/**
 * PUBLIC_INTERFACE
 * Create a child logger with request context
 * @param {Object} req - Express request object
 * @returns {Object} - Winston logger with request context
 */
const createRequestLogger = (req) => {
  const requestId = getRequestId(req);
  return logger.child({ requestId });
};

/**
 * PUBLIC_INTERFACE
 * Log with request context
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} [req] - Express request object
 * @param {Object} [meta] - Additional metadata
 */
const logWithContext = (level, message, req, meta = {}) => {
  if (!req) {
    logger.log(level, message, meta);
    return;
  }
  
  const requestId = getRequestId(req);
  logger.log(level, message, { ...meta, requestId });
};

// Export the logger and helper functions
module.exports = {
  logger,
  generateRequestId,
  getRequestId,
  setRequestId,
  createRequestLogger,
  logWithContext,
  maskSensitiveData,
  REQUEST_ID_SYMBOL,
  // Convenience methods with context
  debug: (message, req, meta) => logWithContext('debug', message, req, meta),
  info: (message, req, meta) => logWithContext('info', message, req, meta),
  warn: (message, req, meta) => logWithContext('warn', message, req, meta),
  error: (message, req, meta) => logWithContext('error', message, req, meta),
};
