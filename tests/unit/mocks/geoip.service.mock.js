/**
 * Mock GeoIP Service for Testing
 * This is a complete mock implementation of the GeoIP service for testing purposes
 */

const logger = require('../../../src/utils/logger');
const { isValidIpAddress, normalizeIpAddress } = require('../../../src/utils/geoip.utils');

/**
 * Create a fresh instance of the GeoIP service for testing
 * @returns {Object} A mock GeoIP service instance
 */
const createMockGeoIPService = () => {
  // Create a fresh cache and reader for each instance
  const cache = new Map();
  let reader = null;
  const CACHE_TTL = 3600000; // 1 hour in milliseconds
  const CACHE_MAX_SIZE = 1000; // Maximum number of entries in the cache

  /**
   * Initialize the MaxMind GeoIP2 database
   * @returns {Promise<boolean>} - True if initialization was successful, false otherwise
   */
  const initialize = async () => {
    try {
      // Mock implementation
      if (reader) {
        return true; // Already initialized
      }
      
      // Check if the database file exists
      if (!global.__mockDbExists) {
        logger.warn('MaxMind database file not found. Please download it first.');
        return false;
      }
      
      // Initialize the reader
      reader = global.__mockReader || { get: () => null };
      logger.info('MaxMind GeoIP2 database initialized successfully');
      return true;
    } catch (error) {
      logger.error(`Failed to initialize MaxMind GeoIP2 database: ${error.message}`, { error });
      return false;
    }
  };

  /**
   * Clean up old entries from the cache
   */
  const cleanupCache = () => {
    const now = Date.now();
    let deletedCount = 0;
    
    // Remove expired entries
    for (const [key, value] of cache.entries()) {
      if (now > value.timestamp + CACHE_TTL) {
        cache.delete(key);
        deletedCount++;
      }
    }
    
    // If cache is still too large, remove oldest entries
    if (cache.size > CACHE_MAX_SIZE) {
      const entriesToDelete = [...cache.entries()]
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, cache.size - CACHE_MAX_SIZE);
      
      for (const [key] of entriesToDelete) {
        cache.delete(key);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      logger.debug(`Cleaned up ${deletedCount} entries from GeoIP cache. Current size: ${cache.size}`);
    }
  };

  /**
   * Get location information for an IP address
   * @param {string} ip - The IP address to look up
   * @returns {Object|null} - Location information or null if not found
   */
  const getLocationByIp = async (ip) => {
    try {
      // Validate and normalize the IP address
      if (!isValidIpAddress(ip)) {
        logger.warn(`Invalid IP address: ${ip}`);
        return null;
      }
      
      const normalizedIp = normalizeIpAddress(ip);
      if (!normalizedIp) {
        return null;
      }
      
      // Check if the result is in the cache
      if (cache.has(normalizedIp)) {
        const cachedResult = cache.get(normalizedIp);
        // Return the cached result if it's not expired
        if (Date.now() < cachedResult.timestamp + CACHE_TTL) {
          return cachedResult.data;
        }
        // Remove expired entry
        cache.delete(normalizedIp);
      }
      
      // Ensure the reader is initialized
      if (!reader) {
        const initialized = await initialize();
        if (!initialized) {
          logger.error('MaxMind GeoIP2 database is not initialized');
          return null;
        }
      }
      
      // Look up the IP address in the database
      const result = reader.get(normalizedIp);
      
      if (!result) {
        logger.debug(`No location data found for IP: ${normalizedIp}`);
        return null;
      }
      
      // Process the result into a standardized format
      const locationData = {
        ip: normalizedIp,
        country: result.country ? {
          code: result.country.iso_code,
          name: result.country.names ? result.country.names.en : null,
        } : null,
        region: result.subdivisions && result.subdivisions.length > 0 ? {
          code: result.subdivisions[0].iso_code,
          name: result.subdivisions[0].names ? result.subdivisions[0].names.en : null,
        } : null,
        city: result.city ? {
          name: result.city.names ? result.city.names.en : null,
        } : null,
        location: result.location ? {
          latitude: result.location.latitude,
          longitude: result.location.longitude,
          accuracy_radius: result.location.accuracy_radius,
          time_zone: result.location.time_zone,
        } : null,
        postal: result.postal ? {
          code: result.postal.code,
        } : null,
        continent: result.continent ? {
          code: result.continent.code,
          name: result.continent.names ? result.continent.names.en : null,
        } : null,
        timestamp: new Date().toISOString(),
      };
      
      // Cache the result
      cache.set(normalizedIp, {
        data: locationData,
        timestamp: Date.now(),
      });
      
      // Clean up the cache periodically
      if (cache.size % 100 === 0) {
        cleanupCache();
      }
      
      return locationData;
    } catch (error) {
      logger.error(`Error getting location for IP ${ip}: ${error.message}`, { error });
      return null;
    }
  };

  /**
   * Get country information for an IP address
   * @param {string} ip - The IP address to look up
   * @returns {Object|null} - Country information or null if not found
   */
  const getCountryByIp = async (ip) => {
    const location = await getLocationByIp(ip);
    return location ? location.country : null;
  };

  /**
   * Get region information for an IP address
   * @param {string} ip - The IP address to look up
   * @returns {Object|null} - Region information or null if not found
   */
  const getRegionByIp = async (ip) => {
    const location = await getLocationByIp(ip);
    return location ? location.region : null;
  };

  /**
   * Get city information for an IP address
   * @param {string} ip - The IP address to look up
   * @returns {Object|null} - City information or null if not found
   */
  const getCityByIp = async (ip) => {
    const location = await getLocationByIp(ip);
    return location ? location.city : null;
  };

  /**
   * Get coordinates for an IP address
   * @param {string} ip - The IP address to look up
   * @returns {Object|null} - Coordinates or null if not found
   */
  const getCoordinatesByIp = async (ip) => {
    const location = await getLocationByIp(ip);
    return location && location.location ? {
      latitude: location.location.latitude,
      longitude: location.location.longitude,
    } : null;
  };

  /**
   * Update the MaxMind GeoIP2 database
   * @param {string} licenseKey - MaxMind license key
   * @param {string} [edition='GeoLite2-City'] - Database edition to download
   * @returns {Promise<boolean>} - True if update was successful, false otherwise
   */
  const updateDatabase = async (licenseKey, edition = 'GeoLite2-City') => {
    if (!licenseKey) {
      logger.error('License key is required to update the MaxMind database');
      return false;
    }
    
    try {
      logger.info(`Downloading MaxMind ${edition} database...`);
      
      // Mock successful download and extraction
      logger.info('Extracting database file...');
      
      // Reinitialize the reader
      reader = null;
      const initialized = await initialize();
      
      if (initialized) {
        logger.info('MaxMind database updated successfully');
        clearCache();
        return true;
      } else {
        logger.error('Failed to initialize the updated database');
        return false;
      }
    } catch (error) {
      logger.error(`Error updating database: ${error.message}`, { error });
      return false;
    }
  };

  /**
   * Clear the IP address cache
   */
  const clearCache = () => {
    const size = cache.size;
    cache.clear();
    logger.info(`Cleared GeoIP cache (${size} entries)`);
  };

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  const getCacheStats = () => {
    return {
      size: cache.size,
      maxSize: CACHE_MAX_SIZE,
      ttl: CACHE_TTL,
    };
  };

  // Expose internal state for testing
  const _getInternalState = () => ({
    cache,
    reader,
    CACHE_TTL,
    CACHE_MAX_SIZE,
  });

  // Set internal state for testing
  const _setInternalState = (state) => {
    if (state.reader !== undefined) reader = state.reader;
    if (state.cache !== undefined) Object.defineProperty(module.exports, 'cache', { value: state.cache });
  };

  return {
    initialize,
    getLocationByIp,
    getCountryByIp,
    getRegionByIp,
    getCityByIp,
    getCoordinatesByIp,
    updateDatabase,
    clearCache,
    getCacheStats,
    cleanupCache,
    _getInternalState,
    _setInternalState,
  };
};

module.exports = { createMockGeoIPService };