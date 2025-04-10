/**
 * Geolocation Controller
 * Handles HTTP requests for geolocation endpoints
 */

const geolocationService = require('../services/geolocation.service');
const { parseIpFromRequest } = require('../utils/geoip.utils');
const logger = require('../utils/logger');

/**
 * PUBLIC_INTERFACE
 * Detect location from client IP
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with location data
 */
const detectLocation = async (req, res) => {
  try {
    // Get IP from request or query parameter
    const ip = req.query.ip || parseIpFromRequest(req);
    
    // Get location from IP
    const location = await geolocationService.getLocationFromIp(ip);
    
    if (!location) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Location not found',
          details: `Could not determine location for IP: ${ip}`,
        },
      });
    }
    
    // Check for override in session
    if (req.session && req.session.locationOverride) {
      logger.debug(`Using location override for session: ${req.sessionID}`);
      return res.status(200).json({
        success: true,
        data: {
          location: req.session.locationOverride,
          source: 'override',
        },
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        location,
        source: 'geoip',
      },
    });
  } catch (error) {
    logger.error(`Error detecting location: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Error detecting location',
        details: error.message,
      },
    });
  }
};

/**
 * PUBLIC_INTERFACE
 * Get region-specific configurations
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with region configurations
 */
const getRegionConfig = async (req, res) => {
  try {
    const { regionCode, type } = req.params;
    
    if (!regionCode) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Region code is required',
        },
      });
    }
    
    const config = await geolocationService.getRegionConfigurations(regionCode, type);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Configuration not found',
          details: `No configuration found for region: ${regionCode}${type ? ` and type: ${type}` : ''}`,
        },
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        config,
        regionCode,
        type: type || 'all',
      },
    });
  } catch (error) {
    logger.error(`Error getting region config: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Error getting region configuration',
        details: error.message,
      },
    });
  }
};

/**
 * PUBLIC_INTERFACE
 * Get country-specific configurations
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with country configurations
 */
const getCountryConfig = async (req, res) => {
  try {
    const { countryCode, type } = req.params;
    
    if (!countryCode) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Country code is required',
        },
      });
    }
    
    const config = await geolocationService.getCountryConfigurations(countryCode, type);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Configuration not found',
          details: `No configuration found for country: ${countryCode}${type ? ` and type: ${type}` : ''}`,
        },
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        config,
        countryCode,
        type: type || 'all',
      },
    });
  } catch (error) {
    logger.error(`Error getting country config: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Error getting country configuration',
        details: error.message,
      },
    });
  }
};

/**
 * PUBLIC_INTERFACE
 * Get configurations based on client location
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with location-based configurations
 */
const getLocationConfig = async (req, res) => {
  try {
    const { type } = req.params;
    
    // Get IP from request or query parameter
    const ip = req.query.ip || parseIpFromRequest(req);
    
    // Check for override in session
    let location;
    if (req.session && req.session.locationOverride) {
      location = req.session.locationOverride;
    } else {
      // Get location from IP
      location = await geolocationService.getLocationFromIp(ip);
    }
    
    if (!location) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Location not found',
          details: `Could not determine location for IP: ${ip}`,
        },
      });
    }
    
    const config = await geolocationService.getConfigurationsByLocation(location, type);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Configuration not found',
          details: `No configuration found for the detected location${type ? ` and type: ${type}` : ''}`,
        },
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        config,
        location: {
          country: location.country ? location.country.code : null,
          region: location.region ? location.region.code : null,
        },
        type: type || 'all',
      },
    });
  } catch (error) {
    logger.error(`Error getting location config: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Error getting location configuration',
        details: error.message,
      },
    });
  }
};

/**
 * PUBLIC_INTERFACE
 * Override location for the current session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with override status
 */
const overrideLocation = async (req, res) => {
  try {
    const { location } = req.body;
    
    // Validate location override
    const validation = geolocationService.validateLocationOverride(location);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid location override',
          details: validation.errors,
        },
      });
    }
    
    // Store override in session
    if (!req.session) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Session not available',
          details: 'Cannot store location override without a session',
        },
      });
    }
    
    req.session.locationOverride = location;
    
    return res.status(200).json({
      success: true,
      data: {
        message: 'Location override applied',
        location,
      },
    });
  } catch (error) {
    logger.error(`Error overriding location: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Error overriding location',
        details: error.message,
      },
    });
  }
};

/**
 * PUBLIC_INTERFACE
 * Clear location override for the current session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with clear status
 */
const clearLocationOverride = async (req, res) => {
  try {
    if (!req.session) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Session not available',
          details: 'Cannot clear location override without a session',
        },
      });
    }
    
    // Clear override from session
    delete req.session.locationOverride;
    
    return res.status(200).json({
      success: true,
      data: {
        message: 'Location override cleared',
      },
    });
  } catch (error) {
    logger.error(`Error clearing location override: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Error clearing location override',
        details: error.message,
      },
    });
  }
};

/**
 * PUBLIC_INTERFACE
 * Clear geolocation caches
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with clear status
 */
const clearCache = async (req, res) => {
  try {
    const { type } = req.query;
    const validTypes = ['location', 'config', 'all'];
    
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid cache type',
          details: `Type must be one of: ${validTypes.join(', ')}`,
        },
      });
    }
    
    const clearedCount = geolocationService.clearCache(type || 'all');
    
    return res.status(200).json({
      success: true,
      data: {
        message: `Cache cleared (${type || 'all'})`,
        clearedCount,
      },
    });
  } catch (error) {
    logger.error(`Error clearing cache: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Error clearing cache',
        details: error.message,
      },
    });
  }
};

module.exports = {
  detectLocation,
  getRegionConfig,
  getCountryConfig,
  getLocationConfig,
  overrideLocation,
  clearLocationOverride,
  clearCache,
};