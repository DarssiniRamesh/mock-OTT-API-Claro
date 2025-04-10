/**
 * Custom Error Classes
 * Provides a set of custom error classes for different types of errors
 */

/**
 * PUBLIC_INTERFACE
 * Base Error class for all custom errors
 * @extends Error
 */
class BaseError extends Error {
  /**
   * Create a new BaseError
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} errorCode - Custom error code
   * @param {boolean} isOperational - Whether the error is operational or programming
   */
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR', isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    
    // Capture stack trace, excluding the constructor call from the stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * PUBLIC_INTERFACE
 * Validation Error for request validation failures
 * @extends BaseError
 */
class ValidationError extends BaseError {
  /**
   * Create a new ValidationError
   * @param {string} message - Error message
   * @param {Object} [errors] - Validation errors object
   * @param {string} [errorCode] - Custom error code
   */
  constructor(message = 'Validation Error', errors = {}, errorCode = 'VALIDATION_ERROR') {
    super(message, 400, errorCode, true);
    this.errors = errors;
  }
}

/**
 * PUBLIC_INTERFACE
 * Authentication Error for authentication failures
 * @extends BaseError
 */
class AuthenticationError extends BaseError {
  /**
   * Create a new AuthenticationError
   * @param {string} message - Error message
   * @param {string} [errorCode] - Custom error code
   */
  constructor(message = 'Authentication Error', errorCode = 'AUTHENTICATION_ERROR') {
    super(message, 401, errorCode, true);
  }
}

/**
 * PUBLIC_INTERFACE
 * Authorization Error for permission failures
 * @extends BaseError
 */
class AuthorizationError extends BaseError {
  /**
   * Create a new AuthorizationError
   * @param {string} message - Error message
   * @param {string} [errorCode] - Custom error code
   */
  constructor(message = 'Authorization Error', errorCode = 'AUTHORIZATION_ERROR') {
    super(message, 403, errorCode, true);
  }
}

/**
 * PUBLIC_INTERFACE
 * Not Found Error for resource not found
 * @extends BaseError
 */
class NotFoundError extends BaseError {
  /**
   * Create a new NotFoundError
   * @param {string} message - Error message
   * @param {string} [errorCode] - Custom error code
   */
  constructor(message = 'Resource Not Found', errorCode = 'NOT_FOUND_ERROR') {
    super(message, 404, errorCode, true);
  }
}

/**
 * PUBLIC_INTERFACE
 * Conflict Error for resource conflicts
 * @extends BaseError
 */
class ConflictError extends BaseError {
  /**
   * Create a new ConflictError
   * @param {string} message - Error message
   * @param {string} [errorCode] - Custom error code
   */
  constructor(message = 'Resource Conflict', errorCode = 'CONFLICT_ERROR') {
    super(message, 409, errorCode, true);
  }
}

/**
 * PUBLIC_INTERFACE
 * Rate Limit Error for rate limiting
 * @extends BaseError
 */
class RateLimitError extends BaseError {
  /**
   * Create a new RateLimitError
   * @param {string} message - Error message
   * @param {string} [errorCode] - Custom error code
   */
  constructor(message = 'Too Many Requests', errorCode = 'RATE_LIMIT_ERROR') {
    super(message, 429, errorCode, true);
  }
}

/**
 * PUBLIC_INTERFACE
 * Service Unavailable Error for service unavailability
 * @extends BaseError
 */
class ServiceUnavailableError extends BaseError {
  /**
   * Create a new ServiceUnavailableError
   * @param {string} message - Error message
   * @param {string} [errorCode] - Custom error code
   */
  constructor(message = 'Service Unavailable', errorCode = 'SERVICE_UNAVAILABLE') {
    super(message, 503, errorCode, true);
  }
}

/**
 * PUBLIC_INTERFACE
 * Database Error for database failures
 * @extends BaseError
 */
class DatabaseError extends BaseError {
  /**
   * Create a new DatabaseError
   * @param {string} message - Error message
   * @param {string} [errorCode] - Custom error code
   */
  constructor(message = 'Database Error', errorCode = 'DATABASE_ERROR') {
    super(message, 500, errorCode, true);
  }
}

/**
 * PUBLIC_INTERFACE
 * External Service Error for external service failures
 * @extends BaseError
 */
class ExternalServiceError extends BaseError {
  /**
   * Create a new ExternalServiceError
   * @param {string} message - Error message
   * @param {string} [errorCode] - Custom error code
   * @param {Object} [serviceDetails] - Details about the external service
   */
  constructor(message = 'External Service Error', errorCode = 'EXTERNAL_SERVICE_ERROR', serviceDetails = {}) {
    super(message, 502, errorCode, true);
    this.serviceDetails = serviceDetails;
  }
}

module.exports = {
  BaseError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServiceUnavailableError,
  DatabaseError,
  ExternalServiceError,
};
