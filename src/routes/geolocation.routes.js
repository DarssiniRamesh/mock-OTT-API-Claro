const express = require('express');
const geolocationController = require('../controllers/geolocation.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { routeCache } = require('../middleware/cache.middleware');

const router = express.Router();

/**
 * @route GET /api/geolocation/detect
 * @desc Detect location from client IP
 * @access Public
 */
router.get('/detect', routeCache({ ttl: 300000 }), geolocationController.detectLocation);

/**
 * @route GET /api/geolocation/region/:regionCode
 * @desc Get region-specific configurations
 * @access Public
 */
router.get('/region/:regionCode', routeCache({ ttl: 1800000 }), geolocationController.getRegionConfig);

/**
 * @route GET /api/geolocation/region/:regionCode/:type
 * @desc Get specific type of region configuration
 * @access Public
 */
router.get('/region/:regionCode/:type', routeCache({ ttl: 1800000 }), geolocationController.getRegionConfig);

/**
 * @route GET /api/geolocation/country/:countryCode
 * @desc Get country-specific configurations
 * @access Public
 */
router.get('/country/:countryCode', routeCache({ ttl: 1800000 }), geolocationController.getCountryConfig);

/**
 * @route GET /api/geolocation/country/:countryCode/:type
 * @desc Get specific type of country configuration
 * @access Public
 */
router.get('/country/:countryCode/:type', routeCache({ ttl: 1800000 }), geolocationController.getCountryConfig);

/**
 * @route GET /api/geolocation/config
 * @desc Get configurations based on client location
 * @access Public
 */
router.get('/config', routeCache({ ttl: 300000 }), geolocationController.getLocationConfig);

/**
 * @route GET /api/geolocation/config/:type
 * @desc Get specific type of configuration based on client location
 * @access Public
 */
router.get('/config/:type', routeCache({ ttl: 300000 }), geolocationController.getLocationConfig);

/**
 * @route POST /api/geolocation/override
 * @desc Override location for the current session
 * @access Private
 */
router.post('/override', authenticate, geolocationController.overrideLocation);

/**
 * @route DELETE /api/geolocation/override
 * @desc Clear location override for the current session
 * @access Private
 */
router.delete('/override', authenticate, geolocationController.clearLocationOverride);

/**
 * @route DELETE /api/geolocation/cache
 * @desc Clear geolocation caches
 * @access Private/Admin
 */
router.delete('/cache', authenticate, authorize(['admin']), geolocationController.clearCache);

module.exports = router;
