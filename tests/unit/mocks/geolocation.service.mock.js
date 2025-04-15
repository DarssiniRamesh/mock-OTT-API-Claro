/**
 * Mock Geolocation Service for Testing
 * This is a complete mock implementation of the Geolocation service using a factory pattern
 */

const logger = require('../../../src/utils/logger');

/**
 * Create a fresh instance of the Geolocation service for testing
 * @param {Object} options - Configuration options for the mock
 * @returns {Object} A mock Geolocation service instance
 */
const createMockGeolocationService = (options = {}) => {
  // Default dependencies
  const dependencies = {
    geoipService: {
      getLocationByIp: jest.fn(),
    },
    cacheService: {
      get: jest.fn(),
      set: jest.fn(),
      deletePattern: jest.fn(),
    },
    utils: {
      isValidIpAddress: jest.fn(),
      normalizeIpAddress: jest.fn(),
    },
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    },
    models: {
      Region: {
        findOne: jest.fn(),
      },
      Country: {
        findOne: jest.fn(),
      },
      RegionConfig: {
        getConfigsByRegion: jest.fn(),
        getConfigByType: jest.fn(),
      },
    },
    ...options.dependencies,
  };

  // Cache TTL values
  const LOCATION_CACHE_TTL = options.locationCacheTtl || 3600000; // 1 hour
  const CONFIG_CACHE_TTL = options.configCacheTtl || 1800000; // 30 minutes

  // Cache key prefixes
  const LOCATION_CACHE_PREFIX = 'geolocation:location:';
  const REGION_CONFIG_CACHE_PREFIX = 'geolocation:config:region:';
  const COUNTRY_CONFIG_CACHE_PREFIX = 'geolocation:config:country:';

  /**
   * Get location information from an IP address
   * @param {string} ip - The IP address to look up
   * @returns {Promise<Object|null>} - Location information or null if not found
   */
  const getLocationFromIp = async (ip) => {
    try {
      // Validate IP address
      if (!dependencies.utils.isValidIpAddress(ip)) {
        dependencies.logger.warn(`Invalid IP address: ${ip}`);
        return null;
      }
      
      const normalizedIp = dependencies.utils.normalizeIpAddress(ip);
      const cacheKey = `${LOCATION_CACHE_PREFIX}${normalizedIp}`;
      
      // Check cache first
      const cachedLocation = dependencies.cacheService.get(cacheKey);
      if (cachedLocation) {
        dependencies.logger.debug(`Location cache hit for IP: ${normalizedIp}`);
        return cachedLocation;
      }
      
      // Get location from GeoIP service
      const location = await dependencies.geoipService.getLocationByIp(normalizedIp);
      
      if (!location) {
        dependencies.logger.debug(`No location found for IP: ${normalizedIp}`);
        return null;
      }
      
      // Enhance location data with additional information
      const enhancedLocation = await enhanceLocationData(location);
      
      // Cache the result
      dependencies.cacheService.set(cacheKey, enhancedLocation, LOCATION_CACHE_TTL);
      
      return enhancedLocation;
    } catch (error) {
      dependencies.logger.error(`Error getting location from IP ${ip}: ${error.message}`, { error });
      return null;
    }
  };

  /**
   * Enhance location data with additional information from the database
   * @param {Object} location - Basic location data from GeoIP
   * @returns {Promise<Object>} - Enhanced location data
   * @private
   */
  const enhanceLocationData = async (location) => {
    try {
      if (!location || !location.country || !location.country.code) {
        return location;
      }
      
      // Get country information from database
      const countryCode = location.country.code;
      const country = await dependencies.models.Country.findOne({ code: countryCode });
      
      if (country) {
        // Add additional country information
        location.country.currency = country.currency;
        location.country.languages = country.languages;
        location.country.timezone = country.timezone || location.location?.time_zone;
        
        // Add region information if available
        if (country.region) {
          await country.populate('region');
          if (country.region) {
            location.region = location.region || {};
            location.region.code = country.region.code;
            location.region.name = country.region.name;
            location.region.description = country.region.description;
          }
        }
      }
      
      return location;
    } catch (error) {
      dependencies.logger.error(`Error enhancing location data: ${error.message}`, { error });
      return location;
    }
  };

  /**
   * Get region-specific configurations
   * @param {string} regionCode - The region code
   * @param {string} [configType] - Optional configuration type filter
   * @returns {Promise<Object|Array|null>} - Region configurations or null if not found
   */
  const getRegionConfigurations = async (regionCode, configType = null) => {
    try {
      if (!regionCode) {
        dependencies.logger.warn('Region code is required');
        return null;
      }
      
      const cacheKey = configType
        ? `${REGION_CONFIG_CACHE_PREFIX}${regionCode}:${configType}`
        : `${REGION_CONFIG_CACHE_PREFIX}${regionCode}`;
      
      // Check cache first
      const cachedConfig = dependencies.cacheService.get(cacheKey);
      if (cachedConfig) {
        dependencies.logger.debug(`Region config cache hit for ${regionCode}${configType ? `:${configType}` : ''}`);
        return cachedConfig;
      }
      
      // Find the region
      const region = await dependencies.models.Region.findOne({ code: regionCode.toUpperCase() });
      
      if (!region) {
        dependencies.logger.warn(`Region not found: ${regionCode}`);
        return null;
      }
      
      let configs;
      
      if (configType) {
        // Get specific configuration type
        configs = await dependencies.models.RegionConfig.getConfigByType(region._id, configType);
      } else {
        // Get all configurations for the region
        configs = await dependencies.models.RegionConfig.getConfigsByRegion(region._id);
      }
      
      // Format the result
      const result = configType && configs ? configs.configData : configs;
      
      // Cache the result
      dependencies.cacheService.set(cacheKey, result, CONFIG_CACHE_TTL);
      
      return result;
    } catch (error) {
      dependencies.logger.error(`Error getting region configurations for ${regionCode}: ${error.message}`, { error });
      return null;
    }
  };

  /**
   * Get country-specific configurations
   * @param {string} countryCode - The country code
   * @param {string} [configType] - Optional configuration type filter
   * @returns {Promise<Object|Array|null>} - Country configurations or null if not found
   */
  const getCountryConfigurations = async (countryCode, configType = null) => {
    try {
      if (!countryCode) {
        dependencies.logger.warn('Country code is required');
        return null;
      }
      
      const cacheKey = configType
        ? `${COUNTRY_CONFIG_CACHE_PREFIX}${countryCode}:${configType}`
        : `${COUNTRY_CONFIG_CACHE_PREFIX}${countryCode}`;
      
      // Check cache first
      const cachedConfig = dependencies.cacheService.get(cacheKey);
      if (cachedConfig) {
        dependencies.logger.debug(`Country config cache hit for ${countryCode}${configType ? `:${configType}` : ''}`);
        return cachedConfig;
      }
      
      // Find the country and its region
      const country = await dependencies.models.Country.findOne({ code: countryCode.toUpperCase() })
        .populate('region');
      
      if (!country) {
        dependencies.logger.warn(`Country not found: ${countryCode}`);
        return null;
      }
      
      // Get country-specific configurations (not implemented yet)
      // For now, we'll return the region configurations
      if (!country.region) {
        dependencies.logger.warn(`No region found for country: ${countryCode}`);
        return null;
      }
      
      const regionConfigs = await getRegionConfigurations(country.region.code, configType);
      
      // Cache the result
      dependencies.cacheService.set(cacheKey, regionConfigs, CONFIG_CACHE_TTL);
      
      return regionConfigs;
    } catch (error) {
      dependencies.logger.error(`Error getting country configurations for ${countryCode}: ${error.message}`, { error });
      return null;
    }
  };

  /**
   * Get configurations based on location
   * @param {Object} location - Location object with country and region information
   * @param {string} [configType] - Optional configuration type filter
   * @returns {Promise<Object|Array|null>} - Location-based configurations or null if not found
   */
  const getConfigurationsByLocation = async (location, configType = null) => {
    try {
      if (!location) {
        dependencies.logger.warn('Location is required');
        return null;
      }
      
      // Try to get country-specific configurations first
      if (location.country && location.country.code) {
        const countryConfigs = await getCountryConfigurations(location.country.code, configType);
        if (countryConfigs) {
          return countryConfigs;
        }
      }
      
      // Fall back to region-specific configurations
      if (location.region && location.region.code) {
        return await getRegionConfigurations(location.region.code, configType);
      }
      
      dependencies.logger.warn('No country or region code found in location');
      return null;
    } catch (error) {
      dependencies.logger.error(`Error getting configurations by location: ${error.message}`, { error });
      return null;
    }
  };

  /**
   * Validate a location override object
   * @param {Object} override - Location override object
   * @returns {Object} - Validation result with isValid flag and errors array
   */
  const validateLocationOverride = (override) => {
    const errors = [];
    
    if (!override) {
      errors.push('Location override is required');
      return { isValid: false, errors };
    }
    
    // Check country
    if (override.country) {
      if (typeof override.country !== 'object') {
        errors.push('Country must be an object');
      } else if (!override.country.code) {
        errors.push('Country code is required');
      } else if (typeof override.country.code !== 'string') {
        errors.push('Country code must be a string');
      } else if (override.country.code.length < 2 || override.country.code.length > 3) {
        errors.push('Country code must be 2 or 3 characters');
      }
    } else {
      errors.push('Country is required');
    }
    
    // Check region (optional)
    if (override.region && typeof override.region === 'object') {
      if (override.region.code && typeof override.region.code !== 'string') {
        errors.push('Region code must be a string');
      } else if (override.region.code && (override.region.code.length < 2 || override.region.code.length > 3)) {
        errors.push('Region code must be 2 or 3 characters');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  /**
   * Clear geolocation caches
   * @param {string} [type='all'] - Cache type to clear ('location', 'config', or 'all')
   * @returns {number} - Number of cache entries cleared
   */
  const clearCache = (type = 'all') => {
    let clearedCount = 0;
    
    if (type === 'location' || type === 'all') {
      clearedCount += dependencies.cacheService.deletePattern(new RegExp(`^${LOCATION_CACHE_PREFIX}`));
    }
    
    if (type === 'config' || type === 'all') {
      clearedCount += dependencies.cacheService.deletePattern(new RegExp(`^${REGION_CONFIG_CACHE_PREFIX}`));
      clearedCount += dependencies.cacheService.deletePattern(new RegExp(`^${COUNTRY_CONFIG_CACHE_PREFIX}`));
    }
    
    dependencies.logger.info(`Cleared ${clearedCount} geolocation cache entries (type: ${type})`);
    return clearedCount;
  };

  // Return the public API
  return {
    getLocationFromIp,
    getRegionConfigurations,
    getCountryConfigurations,
    getConfigurationsByLocation,
    validateLocationOverride,
    clearCache,
    // Expose for testing
    _dependencies: dependencies,
    _constants: {
      LOCATION_CACHE_TTL,
      CONFIG_CACHE_TTL,
      LOCATION_CACHE_PREFIX,
      REGION_CONFIG_CACHE_PREFIX,
      COUNTRY_CONFIG_CACHE_PREFIX,
    },
  };
};

module.exports = { createMockGeolocationService };