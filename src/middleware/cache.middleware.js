/**
 * Cache Middleware
 * Provides middleware for caching API responses
 */

const crypto = require('crypto');
const cacheService = require('../services/cache.service');
const logger = require('../utils/logger');

/**
 * Generate a cache key from the request
 * @param {Object} req - Express request object
 * @returns {string} - Cache key
 * @private
 */
const _generateCacheKey = (req) => {
  // Use URL path and query parameters as the base key
  const baseKey = `${req.method}:${req.originalUrl}`;
  
  // For GET requests, this is usually sufficient
  if (req.method === 'GET') {
    return baseKey;
  }
  
  // For other methods, include the request body in the key
  if (req.body && Object.keys(req.body).length > 0) {
    const bodyHash = crypto
      .createHash('md5')
      .update(JSON.stringify(req.body))
      .digest('hex');
    return `${baseKey}:${bodyHash}`;
  }
  
  return baseKey;
};

/**
 * Check if a request should be cached
 * @param {Object} req - Express request object
 * @returns {boolean} - True if the request should be cached, false otherwise
 * @private
 */
const _shouldCache = (req) => {
  // Only cache GET requests by default
  if (req.method !== 'GET') {
    return false;
  }
  
  // Don't cache if the request has a no-cache header
  if (req.headers['cache-control'] === 'no-cache' || 
      req.headers['pragma'] === 'no-cache') {
    return false;
  }
  
  return true;
};

/**
 * Serialize response data for caching
 * @param {Object} data - Response data
 * @returns {string} - Serialized data
 * @private
 */
const _serializeResponse = (data) => {
  try {
    return JSON.stringify(data);
  } catch (error) {
    logger.error(`Error serializing response: ${error.message}`);
    return null;
  }
};

/**
 * Deserialize cached response data
 * @param {string} data - Serialized data
 * @returns {Object} - Deserialized data
 * @private
 */
const _deserializeResponse = (data) => {
  try {
    return JSON.parse(data);
  } catch (error) {
    logger.error(`Error deserializing response: ${error.message}`);
    return null;
  }
};

/**
 * PUBLIC_INTERFACE
 * Create a middleware function that caches API responses
 * @param {Object} options - Cache options
 * @param {number} options.ttl - TTL for cached responses in milliseconds (default: 60 seconds)
 * @param {Function} options.key - Function to generate a cache key (default: based on URL and method)
 * @param {Function} options.condition - Function to determine if a response should be cached (default: GET requests)
 * @param {Function} options.serialize - Function to serialize the response (default: JSON.stringify)
 * @param {Function} options.deserialize - Function to deserialize the response (default: JSON.parse)
 * @param {string} options.cacheHeader - Header to include in the response to indicate cache status (default: X-Cache)
 * @returns {Function} - Express middleware function
 */
const cacheMiddleware = (options = {}) => {
  const {
    ttl = 60000, // 60 seconds default
    key = _generateCacheKey,
    condition = _shouldCache,
    serialize = _serializeResponse,
    deserialize = _deserializeResponse,
    cacheHeader = 'X-Cache',
  } = options;
  
  return (req, res, next) => {
    // Skip caching if condition is not met
    if (!condition(req)) {
      return next();
    }
    
    // Generate cache key
    const cacheKey = key(req);
    
    // Check if response is in cache
    const cachedResponse = cacheService.get(cacheKey);
    
    if (cachedResponse) {
      // Return cached response
      logger.debug(`Cache hit for ${cacheKey}`);
      
      // Add cache header if enabled
      if (cacheHeader) {
        res.setHeader(cacheHeader, 'HIT');
      }
      
      return res.status(cachedResponse.status).json(cachedResponse.data);
    }
    
    // Add cache header if enabled
    if (cacheHeader) {
      res.setHeader(cacheHeader, 'MISS');
    }
    
    // Store the original res.json method
    const originalJson = res.json;
    
    // Override res.json method to cache the response
    res.json = function(data) {
      // Restore the original method to avoid recursion
      res.json = originalJson;
      
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const serializedData = serialize(data);
        
        if (serializedData) {
          // Cache the response
          cacheService.set(cacheKey, {
            status: res.statusCode,
            data: data,
          }, ttl);
          
          logger.debug(`Cached response for ${cacheKey} with TTL ${ttl}ms`);
        }
      }
      
      // Call the original method
      return res.json(data);
    };
    
    next();
  };
};

/**
 * PUBLIC_INTERFACE
 * Clear the cache based on a pattern
 * @param {RegExp|string} pattern - Pattern to match against cache keys
 * @returns {number} - Number of entries cleared
 */
const clearCache = (pattern) => {
  return cacheService.deletePattern(pattern);
};

/**
 * PUBLIC_INTERFACE
 * Invalidate a specific cache entry
 * @param {string} key - Cache key to invalidate
 * @returns {boolean} - True if the entry was invalidated, false otherwise
 */
const invalidateCache = (key) => {
  return cacheService.delete(key);
};

/**
 * PUBLIC_INTERFACE
 * Create a route-specific cache middleware with custom options
 * @param {Object} options - Cache options (same as cacheMiddleware)
 * @returns {Function} - Express middleware function
 */
const routeCache = (options = {}) => {
  return cacheMiddleware(options);
};

/**
 * PUBLIC_INTERFACE
 * Get cache statistics
 * @returns {Object} - Cache statistics
 */
const getCacheStats = () => {
  return cacheService.getStats();
};

/**
 * PUBLIC_INTERFACE
 * Create a middleware that bypasses cache
 * @returns {Function} - Express middleware function
 */
const bypassCache = () => {
  return (req, res, next) => {
    // Add a flag to the request to bypass cache
    req.bypassCache = true;
    
    // Add cache header
    res.setHeader('X-Cache', 'BYPASS');
    
    next();
  };
};

module.exports = {
  cacheMiddleware,
  routeCache,
  clearCache,
  invalidateCache,
  getCacheStats,
  bypassCache,
};
