/**
 * Unit tests for Geolocation Service
 * Tests the location detection, configuration retrieval, and cache management functionality
 */

const mongoose = require('mongoose');
const geoipService = require('../../../src/services/geoip.service');
const cacheService = require('../../../src/services/cache.service');
const { isValidIpAddress, normalizeIpAddress } = require('../../../src/utils/geoip.utils');
const logger = require('../../../src/utils/logger');

// Import models
const Region = require('../../../src/models/Region');
const Country = require('../../../src/models/Country');
const RegionConfig = require('../../../src/models/RegionConfig');

// Mock dependencies
jest.mock('../../../src/services/geoip.service');
jest.mock('../../../src/services/cache.service');
jest.mock('../../../src/utils/geoip.utils');
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));
jest.mock('../../../src/models/Region');
jest.mock('../../../src/models/Country');
jest.mock('../../../src/models/RegionConfig');

// Import the geolocation service after mocking dependencies
const geolocationService = require('../../../src/services/geolocation.service');

describe('Geolocation Service', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock utility functions
    isValidIpAddress.mockImplementation((ip) => 
      ip === '192.168.1.1' || ip === '10.0.0.1' || ip === '2001:db8::1');
    normalizeIpAddress.mockImplementation((ip) => {
      if (ip === '192.168.1.1') return '192.168.1.1';
      if (ip === '10.0.0.1') return '10.0.0.1';
      if (ip === '2001:db8::1') return '2001:db8::1';
      return null;
    });
  });

  // Sample data for tests
  const mockLocationData = {
    ip: '192.168.1.1',
    country: {
      code: 'US',
      name: 'United States',
    },
    region: {
      code: 'CA',
      name: 'California',
    },
    city: {
      name: 'San Francisco',
    },
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy_radius: 10,
      time_zone: 'America/Los_Angeles',
    },
    timestamp: new Date().toISOString(),
  };

  const mockCountryData = {
    _id: 'country123',
    name: 'United States',
    code: 'US',
    currency: {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
    },
    languages: ['en'],
    timezone: 'America/New_York',
    region: {
      _id: 'region123',
      name: 'North America',
      code: 'NA',
      description: 'North American region',
    },
    populate: jest.fn().mockImplementation(function() {
      return Promise.resolve(this);
    }),
  };

  const mockRegionData = {
    _id: 'region123',
    name: 'North America',
    code: 'NA',
    description: 'North American region',
  };

  const mockRegionConfig = {
    _id: 'config123',
    region: mockRegionData._id,
    configType: 'streaming',
    configData: {
      maxQuality: '4K',
      allowDownloads: true,
      restrictions: ['some-content-type'],
    },
    description: 'Streaming configuration for North America',
  };

  describe('getLocationFromIp', () => {
    it('should return null for invalid IP addresses', async () => {
      isValidIpAddress.mockReturnValueOnce(false);
      
      const result = await geolocationService.getLocationFromIp('invalid-ip');
      
      expect(result).toBeNull();
      expect(isValidIpAddress).toHaveBeenCalledWith('invalid-ip');
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Invalid IP address'));
    });

    it('should return cached location data if available', async () => {
      // Mock cache hit
      cacheService.get.mockReturnValueOnce(mockLocationData);
      
      const result = await geolocationService.getLocationFromIp('192.168.1.1');
      
      expect(result).toEqual(mockLocationData);
      expect(cacheService.get).toHaveBeenCalledWith(expect.stringContaining('192.168.1.1'));
      expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('Location cache hit'));
      expect(geoipService.getLocationByIp).not.toHaveBeenCalled();
    });

    it('should fetch location data from GeoIP service when not in cache', async () => {
      // Mock cache miss and GeoIP service response
      cacheService.get.mockReturnValueOnce(null);
      geoipService.getLocationByIp.mockResolvedValueOnce(mockLocationData);
      
      // Mock Country.findOne to return null (no enhancement)
      Country.findOne.mockResolvedValueOnce(null);
      
      const result = await geolocationService.getLocationFromIp('192.168.1.1');
      
      expect(result).toEqual(mockLocationData);
      expect(cacheService.get).toHaveBeenCalledWith(expect.stringContaining('192.168.1.1'));
      expect(geoipService.getLocationByIp).toHaveBeenCalledWith('192.168.1.1');
      expect(cacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('192.168.1.1'),
        mockLocationData,
        expect.any(Number)
      );
    });

    it('should enhance location data with country information', async () => {
      // Mock cache miss and GeoIP service response
      cacheService.get.mockReturnValueOnce(null);
      geoipService.getLocationByIp.mockResolvedValueOnce({...mockLocationData});
      
      // Mock Country.findOne to return country data
      Country.findOne.mockResolvedValueOnce(mockCountryData);
      
      const result = await geolocationService.getLocationFromIp('192.168.1.1');
      
      expect(result).toHaveProperty('country.currency', mockCountryData.currency);
      expect(result).toHaveProperty('country.languages', mockCountryData.languages);
      expect(result).toHaveProperty('country.timezone', mockCountryData.timezone);
      expect(Country.findOne).toHaveBeenCalledWith({ code: 'US' });
      expect(mockCountryData.populate).toHaveBeenCalledWith('region');
    });

    it('should return null when GeoIP service returns no location', async () => {
      // Mock cache miss and GeoIP service returning null
      cacheService.get.mockReturnValueOnce(null);
      geoipService.getLocationByIp.mockResolvedValueOnce(null);
      
      const result = await geolocationService.getLocationFromIp('192.168.1.1');
      
      expect(result).toBeNull();
      expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('No location found'));
    });

    it('should handle errors during location lookup', async () => {
      // Mock cache miss and GeoIP service throwing error
      cacheService.get.mockReturnValueOnce(null);
      geoipService.getLocationByIp.mockImplementationOnce(() => {
        throw new Error('GeoIP service error');
      });
      
      const result = await geolocationService.getLocationFromIp('192.168.1.1');
      
      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error getting location from IP'),
        expect.objectContaining({ error: expect.any(Error) })
      );
    });
  });

  describe('getRegionConfigurations', () => {
    it('should return null when region code is not provided', async () => {
      const result = await geolocationService.getRegionConfigurations();
      
      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith('Region code is required');
    });

    it('should return cached region configurations if available', async () => {
      // Mock cache hit
      const mockConfigs = [mockRegionConfig];
      cacheService.get.mockReturnValueOnce(mockConfigs);
      
      const result = await geolocationService.getRegionConfigurations('NA');
      
      expect(result).toEqual(mockConfigs);
      expect(cacheService.get).toHaveBeenCalledWith(expect.stringContaining('NA'));
      expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('Region config cache hit'));
      expect(Region.findOne).not.toHaveBeenCalled();
    });

    it('should fetch region configurations when not in cache', async () => {
      // Mock cache miss
      cacheService.get.mockReturnValueOnce(null);
      
      // Mock Region.findOne
      Region.findOne.mockResolvedValueOnce(mockRegionData);
      
      // Mock RegionConfig.getConfigsByRegion
      const mockConfigs = [mockRegionConfig];
      RegionConfig.getConfigsByRegion.mockResolvedValueOnce(mockConfigs);
      
      const result = await geolocationService.getRegionConfigurations('NA');
      
      expect(result).toEqual(mockConfigs);
      expect(cacheService.get).toHaveBeenCalledWith(expect.stringContaining('NA'));
      expect(Region.findOne).toHaveBeenCalledWith({ code: 'NA' });
      expect(RegionConfig.getConfigsByRegion).toHaveBeenCalledWith(mockRegionData._id);
      expect(cacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('NA'),
        mockConfigs,
        expect.any(Number)
      );
    });

    it('should fetch specific configuration type when provided', async () => {
      // Mock cache miss
      cacheService.get.mockReturnValueOnce(null);
      
      // Mock Region.findOne
      Region.findOne.mockResolvedValueOnce(mockRegionData);
      
      // Mock RegionConfig.getConfigByType
      RegionConfig.getConfigByType.mockResolvedValueOnce(mockRegionConfig);
      
      const result = await geolocationService.getRegionConfigurations('NA', 'streaming');
      
      expect(result).toEqual(mockRegionConfig.configData);
      expect(cacheService.get).toHaveBeenCalledWith(expect.stringContaining('NA:streaming'));
      expect(Region.findOne).toHaveBeenCalledWith({ code: 'NA' });
      expect(RegionConfig.getConfigByType).toHaveBeenCalledWith(mockRegionData._id, 'streaming');
    });

    it('should return null when region is not found', async () => {
      // Mock cache miss
      cacheService.get.mockReturnValueOnce(null);
      
      // Mock Region.findOne returning null
      Region.findOne.mockResolvedValueOnce(null);
      
      const result = await geolocationService.getRegionConfigurations('XX');
      
      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Region not found'));
    });

    it('should handle errors during configuration retrieval', async () => {
      // Mock cache miss
      cacheService.get.mockReturnValueOnce(null);
      
      // Mock Region.findOne throwing error
      Region.findOne.mockImplementationOnce(() => {
        throw new Error('Database error');
      });
      
      const result = await geolocationService.getRegionConfigurations('NA');
      
      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error getting region configurations'),
        expect.objectContaining({ error: expect.any(Error) })
      );
    });
  });

  describe('getCountryConfigurations', () => {
    it('should return null when country code is not provided', async () => {
      const result = await geolocationService.getCountryConfigurations();
      
      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith('Country code is required');
    });

    it('should return cached country configurations if available', async () => {
      // Mock cache hit
      const mockConfigs = [mockRegionConfig];
      cacheService.get.mockReturnValueOnce(mockConfigs);
      
      const result = await geolocationService.getCountryConfigurations('US');
      
      expect(result).toEqual(mockConfigs);
      expect(cacheService.get).toHaveBeenCalledWith(expect.stringContaining('US'));
      expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('Country config cache hit'));
      expect(Country.findOne).not.toHaveBeenCalled();
    });

    it('should fetch country configurations when not in cache', async () => {
      // Mock cache miss
      cacheService.get.mockReturnValueOnce(null);
      
      // Mock Country.findOne with proper populate method
      const populateMock = jest.fn().mockResolvedValueOnce({
        ...mockCountryData,
        region: mockRegionData
      });
      
      Country.findOne.mockReturnValueOnce({
        ...mockCountryData,
        populate: populateMock
      });
      
      // Mock getRegionConfigurations
      const mockConfigs = [mockRegionConfig];
      jest.spyOn(geolocationService, 'getRegionConfigurations').mockResolvedValueOnce(mockConfigs);
      
      const result = await geolocationService.getCountryConfigurations('US');
      
      expect(result).toEqual(mockConfigs);
      expect(cacheService.get).toHaveBeenCalledWith(expect.stringContaining('US'));
      expect(Country.findOne).toHaveBeenCalledWith({ code: 'US' });
      expect(populateMock).toHaveBeenCalledWith('region');
      expect(geolocationService.getRegionConfigurations).toHaveBeenCalledWith('NA', undefined);
      expect(cacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('US'),
        mockConfigs,
        expect.any(Number)
      );
    });

    it('should fetch specific configuration type when provided', async () => {
      // Mock cache miss
      cacheService.get.mockReturnValueOnce(null);
      
      // Mock Country.findOne with proper populate method
      const populateMock = jest.fn().mockResolvedValueOnce({
        ...mockCountryData,
        region: mockRegionData
      });
      
      Country.findOne.mockReturnValueOnce({
        ...mockCountryData,
        populate: populateMock
      });
      
      // Mock getRegionConfigurations
      const mockConfig = mockRegionConfig.configData;
      jest.spyOn(geolocationService, 'getRegionConfigurations').mockResolvedValueOnce(mockConfig);
      
      const result = await geolocationService.getCountryConfigurations('US', 'streaming');
      
      expect(result).toEqual(mockConfig);
      expect(cacheService.get).toHaveBeenCalledWith(expect.stringContaining('US:streaming'));
      expect(Country.findOne).toHaveBeenCalledWith({ code: 'US' });
      expect(populateMock).toHaveBeenCalledWith('region');
      expect(geolocationService.getRegionConfigurations).toHaveBeenCalledWith('NA', 'streaming');
    });

    it('should return null when country is not found', async () => {
      // Mock cache miss
      cacheService.get.mockReturnValueOnce(null);
      
      // Mock Country.findOne returning null
      Country.findOne.mockResolvedValueOnce(null);
      
      const result = await geolocationService.getCountryConfigurations('XX');
      
      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Country not found'));
    });

    it('should return null when country has no region', async () => {
      // Mock cache miss
      cacheService.get.mockReturnValueOnce(null);
      
      // Mock Country.findOne with no region
      const populateMock = jest.fn().mockResolvedValueOnce({
        ...mockCountryData,
        region: null
      });
      
      Country.findOne.mockReturnValueOnce({
        ...mockCountryData,
        populate: populateMock
      });
      
      const result = await geolocationService.getCountryConfigurations('US');
      
      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('No region found for country'));
    });

    it('should handle errors during configuration retrieval', async () => {
      // Mock cache miss
      cacheService.get.mockReturnValueOnce(null);
      
      // Mock Country.findOne throwing error
      Country.findOne.mockImplementationOnce(() => {
        throw new Error('Database error');
      });
      
      const result = await geolocationService.getCountryConfigurations('US');
      
      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error getting country configurations'),
        expect.objectContaining({ error: expect.any(Error) })
      );
    });
  });

  describe('getConfigurationsByLocation', () => {
    it('should return null when location is not provided', async () => {
      const result = await geolocationService.getConfigurationsByLocation();
      
      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith('Location is required');
    });

    it('should try to get country-specific configurations first', async () => {
      // Mock location with country
      const location = { ...mockLocationData };
      
      // Mock getCountryConfigurations to return configs
      const mockConfigs = [mockRegionConfig];
      jest.spyOn(geolocationService, 'getCountryConfigurations').mockResolvedValueOnce(mockConfigs);
      
      const result = await geolocationService.getConfigurationsByLocation(location);
      
      expect(result).toEqual(mockConfigs);
      expect(geolocationService.getCountryConfigurations).toHaveBeenCalledWith('US', undefined);
      expect(geolocationService.getRegionConfigurations).not.toHaveBeenCalled();
    });

    it('should fall back to region-specific configurations when country configs not found', async () => {
      // Mock location with country and region
      const location = { ...mockLocationData };
      
      // Mock getCountryConfigurations to return null
      jest.spyOn(geolocationService, 'getCountryConfigurations').mockResolvedValueOnce(null);
      
      // Mock getRegionConfigurations to return configs
      const mockConfigs = [mockRegionConfig];
      jest.spyOn(geolocationService, 'getRegionConfigurations').mockResolvedValueOnce(mockConfigs);
      
      const result = await geolocationService.getConfigurationsByLocation(location);
      
      expect(result).toEqual(mockConfigs);
      expect(geolocationService.getCountryConfigurations).toHaveBeenCalledWith('US', undefined);
      expect(geolocationService.getRegionConfigurations).toHaveBeenCalledWith('CA', undefined);
    });

    it('should fetch specific configuration type when provided', async () => {
      // Mock location with country
      const location = { ...mockLocationData };
      
      // Mock getCountryConfigurations to return configs
      const mockConfig = mockRegionConfig.configData;
      jest.spyOn(geolocationService, 'getCountryConfigurations').mockResolvedValueOnce(mockConfig);
      
      const result = await geolocationService.getConfigurationsByLocation(location, 'streaming');
      
      expect(result).toEqual(mockConfig);
      expect(geolocationService.getCountryConfigurations).toHaveBeenCalledWith('US', 'streaming');
    });

    it('should return null when no country or region code is found', async () => {
      // Mock location without country or region
      const location = { ip: '192.168.1.1' };
      
      const result = await geolocationService.getConfigurationsByLocation(location);
      
      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith('No country or region code found in location');
    });

    it('should handle errors during configuration retrieval', async () => {
      // Mock location with country
      const location = { ...mockLocationData };
      
      // Mock getCountryConfigurations to throw error
      jest.spyOn(geolocationService, 'getCountryConfigurations').mockImplementationOnce(() => {
        throw new Error('Config error');
      });
      
      const result = await geolocationService.getConfigurationsByLocation(location);
      
      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error getting configurations by location'),
        expect.objectContaining({ error: expect.any(Error) })
      );
    });
  });

  describe('validateLocationOverride', () => {
    it('should validate a valid location override', () => {
      const override = {
        country: {
          code: 'US',
          name: 'United States'
        },
        region: {
          code: 'CA',
          name: 'California'
        }
      };
      
      const result = geolocationService.validateLocationOverride(override);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for missing override', () => {
      const result = geolocationService.validateLocationOverride();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Location override is required');
    });

    it('should return errors for missing country', () => {
      const override = {
        region: {
          code: 'CA',
          name: 'California'
        }
      };
      
      const result = geolocationService.validateLocationOverride(override);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Country is required');
    });

    it('should return errors for invalid country format', () => {
      const override = {
        country: 'US', // Should be an object
        region: {
          code: 'CA',
          name: 'California'
        }
      };
      
      const result = geolocationService.validateLocationOverride(override);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Country must be an object');
    });

    it('should return errors for missing country code', () => {
      const override = {
        country: {
          name: 'United States'
          // Missing code
        },
        region: {
          code: 'CA',
          name: 'California'
        }
      };
      
      const result = geolocationService.validateLocationOverride(override);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Country code is required');
    });

    it('should return errors for invalid country code type', () => {
      const override = {
        country: {
          code: 123, // Should be a string
          name: 'United States'
        },
        region: {
          code: 'CA',
          name: 'California'
        }
      };
      
      const result = geolocationService.validateLocationOverride(override);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Country code must be a string');
    });

    it('should return errors for invalid country code length', () => {
      const override = {
        country: {
          code: 'USAA', // Too long
          name: 'United States'
        },
        region: {
          code: 'CA',
          name: 'California'
        }
      };
      
      const result = geolocationService.validateLocationOverride(override);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Country code must be 2 or 3 characters');
    });

    it('should return errors for invalid region code type', () => {
      const override = {
        country: {
          code: 'US',
          name: 'United States'
        },
        region: {
          code: 123, // Should be a string
          name: 'California'
        }
      };
      
      const result = geolocationService.validateLocationOverride(override);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Region code must be a string');
    });

    it('should return errors for invalid region code length', () => {
      const override = {
        country: {
          code: 'US',
          name: 'United States'
        },
        region: {
          code: 'CALIF', // Too long
          name: 'California'
        }
      };
      
      const result = geolocationService.validateLocationOverride(override);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Region code must be 2 or 3 characters');
    });

    it('should allow valid override with only country (no region)', () => {
      const override = {
        country: {
          code: 'US',
          name: 'United States'
        }
        // No region
      };
      
      const result = geolocationService.validateLocationOverride(override);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('clearCache', () => {
    it('should clear all caches when type is "all"', () => {
      // Mock cacheService.deletePattern
      cacheService.deletePattern.mockImplementation(() => 5);
      
      const result = geolocationService.clearCache('all');
      
      expect(result).toBe(15); // 5 + 5 + 5
      expect(cacheService.deletePattern).toHaveBeenCalledTimes(3);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Cleared 15 geolocation cache entries'));
    });

    it('should clear only location cache when type is "location"', () => {
      // Mock cacheService.deletePattern
      cacheService.deletePattern.mockImplementation(() => 5);
      
      const result = geolocationService.clearCache('location');
      
      expect(result).toBe(5);
      expect(cacheService.deletePattern).toHaveBeenCalledTimes(1);
      expect(cacheService.deletePattern).toHaveBeenCalledWith(expect.any(RegExp));
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Cleared 5 geolocation cache entries'));
    });

    it('should clear only config caches when type is "config"', () => {
      // Mock cacheService.deletePattern
      cacheService.deletePattern.mockImplementation(() => 5);
      
      const result = geolocationService.clearCache('config');
      
      expect(result).toBe(10); // 5 + 5
      expect(cacheService.deletePattern).toHaveBeenCalledTimes(2);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Cleared 10 geolocation cache entries'));
    });

    it('should default to "all" when no type is provided', () => {
      // Mock cacheService.deletePattern
      cacheService.deletePattern.mockImplementation(() => 5);
      
      const result = geolocationService.clearCache();
      
      expect(result).toBe(15); // 5 + 5 + 5
      expect(cacheService.deletePattern).toHaveBeenCalledTimes(3);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Cleared 15 geolocation cache entries'));
    });
  });
});
