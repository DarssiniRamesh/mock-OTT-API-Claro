/**
 * Cache Service
 * Provides a generic in-memory caching mechanism with TTL, LRU eviction, and memory monitoring
 */

const logger = require('../utils/logger');

/**
 * Node representing an entry in the LRU linked list
 * @private
 */
class Node {
  constructor(key, value, ttl = 0) {
    this.key = key;
    this.value = value;
    this.ttl = ttl;
    this.expiry = ttl > 0 ? Date.now() + ttl : 0;
    this.next = null;
    this.prev = null;
    this.size = this._calculateSize(value);
  }

  /**
   * Calculate the approximate size of a value in bytes
   * @param {*} value - The value to calculate the size of
   * @returns {number} - The approximate size in bytes
   * @private
   */
  _calculateSize(value) {
    if (value === null || value === undefined) return 0;
    
    const type = typeof value;
    
    // Handle primitive types
    if (type === 'boolean') return 4;
    if (type === 'number') return 8;
    if (type === 'string') return value.length * 2; // UTF-16 characters are 2 bytes each
    
    // Handle objects
    if (type === 'object') {
      if (value instanceof Date) return 8;
      if (Array.isArray(value)) {
        return value.reduce((size, item) => size + this._calculateSize(item), 0);
      }
      
      // For objects, calculate the size of each property
      return Object.entries(value).reduce((size, [key, val]) => {
        return size + (key.length * 2) + this._calculateSize(val);
      }, 0);
    }
    
    // Default size for other types
    return 8;
  }

  /**
   * Check if the entry has expired
   * @returns {boolean} - True if the entry has expired, false otherwise
   */
  isExpired() {
    return this.ttl > 0 && Date.now() > this.expiry;
  }
}

/**
 * Cache service that provides in-memory caching with TTL and LRU eviction
 */
class CacheService {
  /**
   * Create a new cache service
   * @param {Object} options - Cache options
   * @param {number} options.maxSize - Maximum size of the cache in bytes (default: 100MB)
   * @param {number} options.defaultTTL - Default TTL for cache entries in milliseconds (default: 1 hour)
   * @param {number} options.pruneInterval - Interval to prune expired entries in milliseconds (default: 5 minutes)
   */
  constructor(options = {}) {
    // Cache options
    this.maxSize = options.maxSize || 100 * 1024 * 1024; // 100MB default
    this.defaultTTL = options.defaultTTL || 3600000; // 1 hour default
    this.pruneInterval = options.pruneInterval || 300000; // 5 minutes default
    
    // Cache storage
    this.cache = new Map();
    this.currentSize = 0;
    
    // LRU tracking
    this.head = null; // Most recently used
    this.tail = null; // Least recently used
    
    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      expirations: 0,
    };
    
    // Eviction callback
    this.evictionCallback = null;
    
    // Start pruning interval
    this._startPruneInterval();
    
    logger.info(`Cache service initialized with maxSize=${this.maxSize} bytes, defaultTTL=${this.defaultTTL}ms`);
  }

  /**
   * Start the interval to prune expired entries
   * @private
   */
  _startPruneInterval() {
    this.pruneIntervalId = setInterval(() => {
      this.prune();
    }, this.pruneInterval);
    
    // Prevent the interval from keeping the process alive
    if (this.pruneIntervalId.unref) {
      this.pruneIntervalId.unref();
    }
  }

  /**
   * Stop the pruning interval
   * @private
   */
  _stopPruneInterval() {
    if (this.pruneIntervalId) {
      clearInterval(this.pruneIntervalId);
      this.pruneIntervalId = null;
    }
  }

  /**
   * Add a node to the front of the LRU list (most recently used)
   * @param {Node} node - The node to add
   * @private
   */
  _addToFront(node) {
    if (!this.head) {
      this.head = node;
      this.tail = node;
    } else {
      node.next = this.head;
      this.head.prev = node;
      this.head = node;
    }
  }

  /**
   * Remove a node from the LRU list
   * @param {Node} node - The node to remove
   * @private
   */
  _removeNode(node) {
    if (node === this.head) {
      this.head = node.next;
    } else if (node.prev) {
      node.prev.next = node.next;
    }
    
    if (node === this.tail) {
      this.tail = node.prev;
    } else if (node.next) {
      node.next.prev = node.prev;
    }
    
    node.prev = null;
    node.next = null;
  }

  /**
   * Move a node to the front of the LRU list (mark as recently used)
   * @param {Node} node - The node to move
   * @private
   */
  _moveToFront(node) {
    this._removeNode(node);
    this._addToFront(node);
  }

  /**
   * Evict entries until the cache size is below the maximum size
   * @private
   */
  _evictEntries() {
    while (this.currentSize > this.maxSize && this.tail) {
      const node = this.tail;
      this._removeNode(node);
      this.cache.delete(node.key);
      this.currentSize -= node.size;
      this.stats.evictions++;
      
      // Call eviction callback if set
      if (this.evictionCallback) {
        try {
          this.evictionCallback(node.key, node.value);
        } catch (error) {
          logger.error(`Error in cache eviction callback: ${error.message}`);
        }
      }
      
      logger.debug(`Evicted cache entry: ${node.key}, size=${node.size} bytes, currentSize=${this.currentSize} bytes`);
    }
  }

  /**
   * PUBLIC_INTERFACE
   * Set a value in the cache
   * @param {string} key - The cache key
   * @param {*} value - The value to cache
   * @param {number} [ttl] - Time to live in milliseconds (0 for no expiry, defaults to this.defaultTTL)
   * @returns {boolean} - True if the value was set, false otherwise
   */
  set(key, value, ttl = this.defaultTTL) {
    try {
      // Remove existing entry if it exists
      if (this.cache.has(key)) {
        this.delete(key);
      }
      
      // Create new node
      const node = new Node(key, value, ttl);
      
      // Add to cache and LRU list
      this.cache.set(key, node);
      this._addToFront(node);
      this.currentSize += node.size;
      this.stats.sets++;
      
      // Evict entries if necessary
      if (this.currentSize > this.maxSize) {
        this._evictEntries();
      }
      
      return true;
    } catch (error) {
      logger.error(`Error setting cache entry ${key}: ${error.message}`);
      return false;
    }
  }

  /**
   * PUBLIC_INTERFACE
   * Get a value from the cache
   * @param {string} key - The cache key
   * @returns {*} - The cached value or undefined if not found
   */
  get(key) {
    const node = this.cache.get(key);
    
    if (!node) {
      this.stats.misses++;
      return undefined;
    }
    
    // Check if the entry has expired
    if (node.isExpired()) {
      this.delete(key);
      this.stats.expirations++;
      this.stats.misses++;
      return undefined;
    }
    
    // Move to front of LRU list
    this._moveToFront(node);
    this.stats.hits++;
    
    return node.value;
  }

  /**
   * PUBLIC_INTERFACE
   * Check if a key exists in the cache and is not expired
   * @param {string} key - The cache key
   * @returns {boolean} - True if the key exists and is not expired, false otherwise
   */
  has(key) {
    const node = this.cache.get(key);
    
    if (!node) {
      return false;
    }
    
    // Check if the entry has expired
    if (node.isExpired()) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * PUBLIC_INTERFACE
   * Delete a value from the cache
   * @param {string} key - The cache key
   * @returns {boolean} - True if the value was deleted, false otherwise
   */
  delete(key) {
    const node = this.cache.get(key);
    
    if (!node) {
      return false;
    }
    
    // Remove from LRU list and cache
    this._removeNode(node);
    this.cache.delete(key);
    this.currentSize -= node.size;
    this.stats.deletes++;
    
    return true;
  }

  /**
   * PUBLIC_INTERFACE
   * Clear the entire cache
   */
  clear() {
    this.cache.clear();
    this.head = null;
    this.tail = null;
    this.currentSize = 0;
    logger.info('Cache cleared');
  }

  /**
   * PUBLIC_INTERFACE
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      currentSize: this.currentSize,
      maxSize: this.maxSize,
      usagePercentage: (this.currentSize / this.maxSize) * 100,
      ...this.stats,
    };
  }

  /**
   * PUBLIC_INTERFACE
   * Set multiple values in the cache
   * @param {Object} entries - Object with key-value pairs to cache
   * @param {number} [ttl] - Time to live in milliseconds (0 for no expiry, defaults to this.defaultTTL)
   * @returns {boolean} - True if all values were set, false otherwise
   */
  setMany(entries, ttl = this.defaultTTL) {
    try {
      Object.entries(entries).forEach(([key, value]) => {
        this.set(key, value, ttl);
      });
      return true;
    } catch (error) {
      logger.error(`Error setting multiple cache entries: ${error.message}`);
      return false;
    }
  }

  /**
   * PUBLIC_INTERFACE
   * Get multiple values from the cache
   * @param {string[]} keys - Array of cache keys
   * @returns {Object} - Object with key-value pairs of found entries
   */
  getMany(keys) {
    const result = {};
    
    keys.forEach(key => {
      const value = this.get(key);
      if (value !== undefined) {
        result[key] = value;
      }
    });
    
    return result;
  }

  /**
   * PUBLIC_INTERFACE
   * Delete multiple values from the cache
   * @param {string[]} keys - Array of cache keys
   * @returns {number} - Number of entries deleted
   */
  deleteMany(keys) {
    let deletedCount = 0;
    
    keys.forEach(key => {
      if (this.delete(key)) {
        deletedCount++;
      }
    });
    
    return deletedCount;
  }

  /**
   * PUBLIC_INTERFACE
   * Get all keys in the cache
   * @returns {string[]} - Array of cache keys
   */
  keys() {
    return Array.from(this.cache.keys());
  }

  /**
   * PUBLIC_INTERFACE
   * Get all values in the cache
   * @returns {Array} - Array of cached values
   */
  values() {
    const values = [];
    
    for (const [key, node] of this.cache.entries()) {
      if (!node.isExpired()) {
        values.push(node.value);
      } else {
        this.delete(key);
      }
    }
    
    return values;
  }

  /**
   * PUBLIC_INTERFACE
   * Get all entries in the cache
   * @returns {Array} - Array of [key, value] pairs
   */
  entries() {
    const entries = [];
    
    for (const [key, node] of this.cache.entries()) {
      if (!node.isExpired()) {
        entries.push([key, node.value]);
      } else {
        this.delete(key);
      }
    }
    
    return entries;
  }

  /**
   * PUBLIC_INTERFACE
   * Remove expired entries from the cache
   * @returns {number} - Number of entries pruned
   */
  prune() {
    let prunedCount = 0;
    const now = Date.now();
    
    for (const [key, node] of this.cache.entries()) {
      if (node.ttl > 0 && now > node.expiry) {
        this.delete(key);
        prunedCount++;
        this.stats.expirations++;
      }
    }
    
    if (prunedCount > 0) {
      logger.debug(`Pruned ${prunedCount} expired cache entries`);
    }
    
    return prunedCount;
  }

  /**
   * PUBLIC_INTERFACE
   * Set the maximum size of the cache
   * @param {number} size - Maximum size in bytes
   */
  setMaxSize(size) {
    this.maxSize = size;
    
    // Evict entries if necessary
    if (this.currentSize > this.maxSize) {
      this._evictEntries();
    }
    
    logger.info(`Cache max size set to ${size} bytes`);
  }

  /**
   * PUBLIC_INTERFACE
   * Set the default TTL for cache entries
   * @param {number} ttl - Default TTL in milliseconds
   */
  setDefaultTTL(ttl) {
    this.defaultTTL = ttl;
    logger.info(`Cache default TTL set to ${ttl}ms`);
  }

  /**
   * PUBLIC_INTERFACE
   * Set a callback to be called when an entry is evicted
   * @param {Function} callback - Function to call when an entry is evicted
   */
  onEviction(callback) {
    if (typeof callback === 'function') {
      this.evictionCallback = callback;
    } else {
      this.evictionCallback = null;
    }
  }

  /**
   * PUBLIC_INTERFACE
   * Delete entries that match a pattern
   * @param {RegExp|string} pattern - Pattern to match against keys
   * @returns {number} - Number of entries deleted
   */
  deletePattern(pattern) {
    let deletedCount = 0;
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.delete(key);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      logger.debug(`Deleted ${deletedCount} cache entries matching pattern ${pattern}`);
    }
    
    return deletedCount;
  }

  /**
   * Destroy the cache service and clean up resources
   */
  destroy() {
    this._stopPruneInterval();
    this.clear();
    logger.info('Cache service destroyed');
  }
}

// Create a singleton instance
const cacheService = new CacheService();

// Clean up on process exit
process.on('exit', () => {
  cacheService.destroy();
});

module.exports = cacheService;
