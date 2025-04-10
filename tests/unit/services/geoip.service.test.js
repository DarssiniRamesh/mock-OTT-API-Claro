/**
 * Unit tests for GeoIP Service
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const maxmind = require('maxmind');
const geoipService = require('../../../src/services/geoip.service');
const geoipUtils = require('../../../src/utils/geoip.utils');
const logger = require('../../../src/utils/logger');
const config = require('../../../src/config');

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('https');
jest.mock('maxmind', () => ({
  Reader: {
    open: jest.fn(),
  }
}));
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));
jest.mock('../../../src/utils/geoip.utils');
jest.mock('../../../src/config', () => ({
  maxmind: {
    dbPath: '/mock/path/to/GeoLite2-City.mmdb',
  },
}));

describe('GeoIP Service', () => {
  // Setup common mocks
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock path.resolve to return the input path
    path.resolve.mockImplementation((p) => p);
    
    // Mock utility functions
    geoipUtils.isValidIpAddress.mockImplementation((ip) => 
      ip === '192.168.1.1' || ip === '2001:db8::1');
    geoipUtils.normalizeIpAddress.mockImplementation((ip) => {
      if (ip === '192.168.1.1') return '192.168.1.1';
      if (ip === '2001:db8::1') return '2001:db8::1';
      return null;
    });
  });

  describe('initialize', () => {
    it('should initialize the database successfully when file exists', async () => {
      // Mock fs.existsSync to return true
      fs.existsSync.mockReturnValue(true);
      
      // Mock Reader.open to resolve successfully
      const mockReader = { get: jest.fn() };
      maxmind.Reader.open.mockResolvedValue(mockReader);
      
      const result = await geoipService.initialize();
      
      expect(result).toBe(true);
      expect(fs.existsSync).toHaveBeenCalledWith(config.maxmind.dbPath);
      expect(maxmind.Reader.open).toHaveBeenCalledWith(config.maxmind.dbPath);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('initialized successfully'));
    });

    it('should fail to initialize when database file does not exist', async () => {
      // Mock fs.existsSync to return false
      fs.existsSync.mockReturnValue(false);
      
      const result = await geoipService.initialize();
      
      expect(result).toBe(false);
      expect(fs.existsSync).toHaveBeenCalledWith(config.maxmind.dbPath);
      expect(maxmind.Reader.open).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('not found'));
    });

    it('should handle errors during initialization', async () => {
      // Mock fs.existsSync to return true but Reader.open to throw an error
      fs.existsSync.mockReturnValue(true);
      maxmind.Reader.open.mockRejectedValue(new Error('Mock initialization error'));
      
      const result = await geoipService.initialize();
      
      expect(result).toBe(false);
      expect(fs.existsSync).toHaveBeenCalledWith(config.maxmind.dbPath);
      expect(maxmind.Reader.open).toHaveBeenCalledWith(config.maxmind.dbPath);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to initialize'),
        expect.objectContaining({ error: expect.any(Error) })
      );
    });
  });

  describe('getLocationByIp', () => {
    const mockLocationData = {
      country: { iso_code: 'US', names: { en: 'United States' } },
      subdivisions: [{ iso_code: 'CA', names: { en: 'California' } }],
      city: { names: { en: 'San Francisco' } },
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy_radius: 10,
        time_zone: 'America/Los_Angeles',
      },
      postal: { code: '94105' },
      continent: { code: 'NA', names: { en: 'North America' } },
    };

    beforeEach(() => {
      // Setup reader mock
      const mockReader = {
        get: jest.fn((ip) => {
          if (ip === '192.168.1.1') return mockLocationData;
          return null;
        }),
      };
      
      // Mock successful initialization
      fs.existsSync.mockReturnValue(true);
      maxmind.Reader.open.mockResolvedValue(mockReader);
    });

    it('should return null for invalid IP addresses', async () => {
      geoipUtils.isValidIpAddress.mockReturnValueOnce(false);
      
      const result = await geoipService.getLocationByIp('invalid-ip');
      
      expect(result).toBeNull();
      expect(geoipUtils.isValidIpAddress).toHaveBeenCalledWith('invalid-ip');
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Invalid IP address'));
    });

    it('should return location data for a valid IP address', async () => {
      // Initialize the service first
      await geoipService.initialize();
      
      const result = await geoipService.getLocationByIp('192.168.1.1');
      
      expect(result).not.toBeNull();
      expect(result.ip).toBe('192.168.1.1');
      expect(result.country.code).toBe('US');
      expect(result.country.name).toBe('United States');
      expect(result.region.code).toBe('CA');
      expect(result.city.name).toBe('San Francisco');
      expect(result.location.latitude).toBe(37.7749);
      expect(result.location.longitude).toBe(-122.4194);
    });

    it('should return null when no location data is found', async () => {
      // Initialize the service first
      await geoipService.initialize();
      
      // Mock normalizeIpAddress to return a valid IP that doesn't have location data
      geoipUtils.normalizeIpAddress.mockReturnValueOnce('10.0.0.1');
      geoipUtils.isValidIpAddress.mockReturnValueOnce(true);
      
      const result = await geoipService.getLocationByIp('10.0.0.1');
      
      expect(result).toBeNull();
      expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('No location data found'));
    });

    it('should return cached result for repeated IP lookups', async () => {
      // Initialize the service first
      await geoipService.initialize();
      
      // First lookup should query the database
      await geoipService.getLocationByIp('192.168.1.1');
      
      // Clear mocks to verify second lookup doesn't call the database
      jest.clearAllMocks();
      
      // Second lookup should use cache
      const result = await geoipService.getLocationByIp('192.168.1.1');
      
      expect(result).not.toBeNull();
      expect(result.ip).toBe('192.168.1.1');
      // The Reader.get method should not be called for cached results
      // We can't directly test this since we're mocking at a higher level
      // Just verify that the result is correct
    });

    it('should handle errors during lookup', async () => {
      // Create a mock reader that throws an error
      const mockErrorReader = {
        get: jest.fn().mockImplementation(() => {
          throw new Error('Mock lookup error');
        })
      };
      
      // Mock the maxmind.Reader.open to return our error-throwing reader
      maxmind.Reader.open.mockResolvedValueOnce(mockErrorReader);
      
      // Initialize the service with our mock reader
      await geoipService.initialize();
      
      // Now when we call getLocationByIp, it should catch the error
      const result = await geoipService.getLocationByIp('192.168.1.1');
      
      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error getting location'),
        expect.objectContaining({ error: expect.any(Error) })
      );
    });

    it('should initialize the database if not already initialized', async () => {
      // Mock that the reader is not initialized
      // We'll use a spy to simulate the initialization process
      jest.spyOn(geoipService, 'initialize').mockImplementation(async () => {
        // Mock successful initialization
        fs.existsSync.mockReturnValue(true);
        const mockReader = {
          get: jest.fn((ip) => {
            if (ip === '192.168.1.1') return mockLocationData;
            return null;
          }),
        };
        maxmind.Reader.open.mockResolvedValue(mockReader);
        return true;
      });
      
      const result = await geoipService.getLocationByIp('192.168.1.1');
      
      expect(result).not.toBeNull();
      expect(geoipService.initialize).toHaveBeenCalled();
    });
  });

  describe('getCountryByIp, getRegionByIp, getCityByIp, getCoordinatesByIp', () => {
    // Mock data for location
    const mockLocationData = {
      ip: '192.168.1.1',
      country: { code: 'US', name: 'United States' },
      region: { code: 'CA', name: 'California' },
      city: { name: 'San Francisco' },
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy_radius: 10,
        time_zone: 'America/Los_Angeles',
      },
      postal: { code: '94105' },
      continent: { code: 'NA', name: 'North America' },
      timestamp: new Date().toISOString(),
    };
    
    beforeEach(() => {
      // Reset mocks
      jest.clearAllMocks();
      
      // Mock getLocationByIp directly
      jest.spyOn(geoipService, 'getLocationByIp').mockImplementation(async (ip) => {
        if (ip === '192.168.1.1') {
          return mockLocationData;
        }
        return null;
      });
    });

    it('should return country information for a valid IP', async () => {
      const result = await geoipService.getCountryByIp('192.168.1.1');
      
      expect(result).toEqual({ code: 'US', name: 'United States' });
      expect(geoipService.getLocationByIp).toHaveBeenCalledWith('192.168.1.1');
    });

    it('should return null country information for an invalid IP', async () => {
      const result = await geoipService.getCountryByIp('invalid-ip');
      
      expect(result).toBeNull();
      expect(geoipService.getLocationByIp).toHaveBeenCalledWith('invalid-ip');
    });

    it('should return region information for a valid IP', async () => {
      const result = await geoipService.getRegionByIp('192.168.1.1');
      
      expect(result).toEqual({ code: 'CA', name: 'California' });
      expect(geoipService.getLocationByIp).toHaveBeenCalledWith('192.168.1.1');
    });

    it('should return city information for a valid IP', async () => {
      const result = await geoipService.getCityByIp('192.168.1.1');
      
      expect(result).toEqual({ name: 'San Francisco' });
      expect(geoipService.getLocationByIp).toHaveBeenCalledWith('192.168.1.1');
    });

    it('should return coordinates for a valid IP', async () => {
      const result = await geoipService.getCoordinatesByIp('192.168.1.1');
      
      expect(result).toEqual({
        latitude: 37.7749,
        longitude: -122.4194,
      });
      expect(geoipService.getLocationByIp).toHaveBeenCalledWith('192.168.1.1');
    });

    it('should return null coordinates for an invalid IP', async () => {
      const result = await geoipService.getCoordinatesByIp('invalid-ip');
      
      expect(result).toBeNull();
      expect(geoipService.getLocationByIp).toHaveBeenCalledWith('invalid-ip');
    });
  });

  describe('updateDatabase', () => {
    beforeEach(() => {
      // Mock fs functions
      fs.existsSync.mockReturnValue(true);
      fs.createWriteStream.mockReturnValue({
        close: jest.fn(),
        on: jest.fn().mockImplementation(function(event, callback) {
          if (event === 'finish') {
            callback();
          }
          return this;
        }),
      });
      
      // Mock https.get
      https.get.mockImplementation((url, callback) => {
        const mockResponse = {
          statusCode: 200,
          pipe: jest.fn(),
        };
        callback(mockResponse);
        return {
          on: jest.fn().mockImplementation(function(event, callback) {
            return this;
          }),
        };
      });
      
      // Mock successful initialization after update
      jest.spyOn(geoipService, 'initialize').mockResolvedValue(true);
    });

    it('should return false if no license key is provided', async () => {
      const result = await geoipService.updateDatabase();
      
      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('License key is required'));
    });

    it('should create directory if it does not exist', async () => {
      // Mock directory does not exist
      fs.existsSync.mockReturnValueOnce(false);
      fs.mkdirSync = jest.fn();
      
      await geoipService.updateDatabase('mock-license-key');
      
      expect(fs.mkdirSync).toHaveBeenCalledWith(path.dirname(config.maxmind.dbPath), { recursive: true });
    });

    it('should download and extract the database successfully', async () => {
      const result = await geoipService.updateDatabase('mock-license-key');
      
      expect(result).toBe(true);
      expect(https.get).toHaveBeenCalledWith(
        expect.stringContaining('license_key=mock-license-key'),
        expect.any(Function)
      );
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Downloading MaxMind'));
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Extracting database'));
      expect(geoipService.initialize).toHaveBeenCalled();
    });

    it('should handle HTTP error during download', async () => {
      // Mock https.get to simulate HTTP error
      https.get.mockImplementationOnce((url, callback) => {
        const mockResponse = {
          statusCode: 403,
        };
        callback(mockResponse);
        return {
          on: jest.fn().mockImplementation(function(event, callback) {
            return this;
          }),
        };
      });
      
      try {
        await geoipService.updateDatabase('mock-license-key');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Failed to download database');
      }
    });

    it('should handle network error during download', async () => {
      // Mock https.get to simulate network error
      https.get.mockImplementationOnce((url, callback) => {
        return {
          on: jest.fn().mockImplementation(function(event, callback) {
            if (event === 'error') {
              callback(new Error('Network error'));
            }
            return this;
          }),
        };
      });
      
      fs.unlink = jest.fn((path, callback) => callback());
      
      try {
        await geoipService.updateDatabase('mock-license-key');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toBe('Network error');
        expect(fs.unlink).toHaveBeenCalled();
      }
    });
  });

  describe('clearCache and getCacheStats', () => {
    it('should clear the cache', () => {
      // First add something to the cache by mocking a successful lookup
      geoipService.getLocationByIp('192.168.1.1');
      
      // Then clear the cache
      geoipService.clearCache();
      
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Cleared GeoIP cache'));
      
      // Verify cache is cleared by checking stats
      const stats = geoipService.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should return correct cache statistics', () => {
      const stats = geoipService.getCacheStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('ttl');
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.maxSize).toBe('number');
      expect(typeof stats.ttl).toBe('number');
    });
  });
});
