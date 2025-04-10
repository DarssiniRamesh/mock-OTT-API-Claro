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

// Mock data for location
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

// Processed location data as returned by the service
const processedLocationData = {
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
  timestamp: expect.any(String),
};

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
    let mockReader;

    beforeEach(() => {
      // Setup reader mock
      mockReader = {
        get: jest.fn((ip) => {
          if (ip === '192.168.1.1') return mockLocationData;
          return null;
        }),
      };
      
      // Mock successful initialization
      fs.existsSync.mockReturnValue(true);
      maxmind.Reader.open.mockResolvedValue(mockReader);
      
      // Reset the service's internal state
      geoipService.clearCache();
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
      
      expect(result).toEqual(expect.objectContaining({
        ip: '192.168.1.1',
        country: { code: 'US', name: 'United States' },
        region: { code: 'CA', name: 'California' },
        city: { name: 'San Francisco' },
        location: expect.objectContaining({
          latitude: 37.7749,
          longitude: -122.4194
        })
      }));
      
      // Verify the reader.get was called with the correct IP
      expect(mockReader.get).toHaveBeenCalledWith('192.168.1.1');
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
      expect(mockReader.get).toHaveBeenCalledWith('10.0.0.1');
    });

    it('should return cached result for repeated IP lookups', async () => {
      // Initialize the service first
      await geoipService.initialize();
      
      // First lookup should query the database
      const firstResult = await geoipService.getLocationByIp('192.168.1.1');
      expect(firstResult).not.toBeNull();
      expect(mockReader.get).toHaveBeenCalledTimes(1);
      
      // Clear mocks to verify second lookup doesn't call the database
      jest.clearAllMocks();
      
      // Second lookup should use cache
      const secondResult = await geoipService.getLocationByIp('192.168.1.1');
      
      expect(secondResult).toEqual(expect.objectContaining({
        ip: '192.168.1.1',
        country: { code: 'US', name: 'United States' }
      }));
      
      // Verify the reader.get was NOT called for the second lookup
      expect(mockReader.get).not.toHaveBeenCalled();
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
      // Store original initialize method
      const originalInitialize = geoipService.initialize;
      
      // Create a mock initialize function that returns true
      const mockInitialize = jest.fn().mockResolvedValue(true);
      
      // Replace the initialize method with our mock
      geoipService.initialize = mockInitialize;
      
      // Set up a mock reader
      const mockReader = {
        get: jest.fn().mockReturnValue(mockLocationData)
      };
      
      // Mock the maxmind.Reader.open to return our mock reader
      maxmind.Reader.open.mockResolvedValueOnce(mockReader);
      
      // Call getLocationByIp which should trigger initialization
      const result = await geoipService.getLocationByIp('192.168.1.1');
      
      // Verify initialization was called
      expect(mockInitialize).toHaveBeenCalled();
      
      // Restore original initialize method
      geoipService.initialize = originalInitialize;
    });
    
    it('should return null when initialization fails', async () => {
      // Store original initialize method
      const originalInitialize = geoipService.initialize;
      
      // Create a mock initialize function that returns false
      const mockInitialize = jest.fn().mockResolvedValue(false);
      
      // Replace the initialize method with our mock
      geoipService.initialize = mockInitialize;
      
      // Call getLocationByIp which should trigger initialization
      const result = await geoipService.getLocationByIp('192.168.1.1');
      
      // Verify initialization was called and result is null
      expect(mockInitialize).toHaveBeenCalled();
      expect(result).toBeNull();
      
      // Restore original initialize method
      geoipService.initialize = originalInitialize;
    });
    
    it('should handle null result from normalizeIpAddress', async () => {
      // Mock normalizeIpAddress to return null
      geoipUtils.isValidIpAddress.mockReturnValueOnce(true);
      geoipUtils.normalizeIpAddress.mockReturnValueOnce(null);
      
      const result = await geoipService.getLocationByIp('192.168.1.1');
      
      expect(result).toBeNull();
    });
  });

  describe('Helper methods: getCountryByIp, getRegionByIp, getCityByIp, getCoordinatesByIp', () => {
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
    
    // Mock data with missing fields to test edge cases
    const mockPartialData = {
      ip: '10.0.0.1',
      country: { code: 'UK', name: 'United Kingdom' },
      // No region
      // No city
      location: {
        latitude: 51.5074,
        longitude: -0.1278,
      },
      // No postal
      // No continent
      timestamp: new Date().toISOString(),
    };
    
    // Mock data with null fields
    const mockNullFieldsData = {
      ip: '172.16.0.1',
      country: null,
      region: null,
      city: null,
      location: null,
      postal: null,
      continent: null,
      timestamp: new Date().toISOString(),
    };
    
    beforeEach(() => {
      // Reset mocks
      jest.clearAllMocks();
      
      // Mock getLocationByIp directly
      const mockGetLocationByIp = jest.fn(async (ip) => {
        if (ip === '192.168.1.1') return {...mockLocationData};
        if (ip === '10.0.0.1') return {...mockPartialData};
        if (ip === '172.16.0.1') return {...mockNullFieldsData};
        return null;
      });
      
      // Replace the original method with our mock
      geoipService.getLocationByIp = mockGetLocationByIp;
    });
    
    afterEach(() => {
      // Restore the original method after each test
      jest.restoreAllMocks();
    });

    describe('getCountryByIp', () => {
      it('should return country information for a valid IP', async () => {
        const result = await geoipService.getCountryByIp('192.168.1.1');
        
        expect(result).toEqual({ code: 'US', name: 'United States' });
        expect(geoipService.getLocationByIp).toHaveBeenCalledWith('192.168.1.1');
        expect(geoipService.getLocationByIp).toHaveBeenCalledTimes(1);
      });

      it('should return null country information for an invalid IP', async () => {
        const result = await geoipService.getCountryByIp('invalid-ip');
        
        expect(result).toBeNull();
        expect(geoipService.getLocationByIp).toHaveBeenCalledWith('invalid-ip');
        expect(geoipService.getLocationByIp).toHaveBeenCalledTimes(1);
      });
      
      it('should handle null country field in location data', async () => {
        const result = await geoipService.getCountryByIp('172.16.0.1');
        
        expect(result).toBeNull();
        expect(geoipService.getLocationByIp).toHaveBeenCalledWith('172.16.0.1');
        expect(geoipService.getLocationByIp).toHaveBeenCalledTimes(1);
      });
    });

    describe('getRegionByIp', () => {
      it('should return region information for a valid IP', async () => {
        const result = await geoipService.getRegionByIp('192.168.1.1');
        
        expect(result).toEqual({ code: 'CA', name: 'California' });
        expect(geoipService.getLocationByIp).toHaveBeenCalledWith('192.168.1.1');
        expect(geoipService.getLocationByIp).toHaveBeenCalledTimes(1);
      });
      
      it('should return null when region information is not available', async () => {
        const result = await geoipService.getRegionByIp('10.0.0.1');
        
        expect(result).toBeNull();
        expect(geoipService.getLocationByIp).toHaveBeenCalledWith('10.0.0.1');
        expect(geoipService.getLocationByIp).toHaveBeenCalledTimes(1);
      });
      
      it('should handle null region field in location data', async () => {
        const result = await geoipService.getRegionByIp('172.16.0.1');
        
        expect(result).toBeNull();
        expect(geoipService.getLocationByIp).toHaveBeenCalledWith('172.16.0.1');
        expect(geoipService.getLocationByIp).toHaveBeenCalledTimes(1);
      });
    });

    describe('getCityByIp', () => {
      it('should return city information for a valid IP', async () => {
        const result = await geoipService.getCityByIp('192.168.1.1');
        
        expect(result).toEqual({ name: 'San Francisco' });
        expect(geoipService.getLocationByIp).toHaveBeenCalledWith('192.168.1.1');
        expect(geoipService.getLocationByIp).toHaveBeenCalledTimes(1);
      });
      
      it('should return null when city information is not available', async () => {
        const result = await geoipService.getCityByIp('10.0.0.1');
        
        expect(result).toBeNull();
        expect(geoipService.getLocationByIp).toHaveBeenCalledWith('10.0.0.1');
        expect(geoipService.getLocationByIp).toHaveBeenCalledTimes(1);
      });
      
      it('should handle null city field in location data', async () => {
        const result = await geoipService.getCityByIp('172.16.0.1');
        
        expect(result).toBeNull();
        expect(geoipService.getLocationByIp).toHaveBeenCalledWith('172.16.0.1');
        expect(geoipService.getLocationByIp).toHaveBeenCalledTimes(1);
      });
    });

    describe('getCoordinatesByIp', () => {
      it('should return coordinates for a valid IP', async () => {
        const result = await geoipService.getCoordinatesByIp('192.168.1.1');
        
        expect(result).toEqual({
          latitude: 37.7749,
          longitude: -122.4194,
        });
        expect(geoipService.getLocationByIp).toHaveBeenCalledWith('192.168.1.1');
        expect(geoipService.getLocationByIp).toHaveBeenCalledTimes(1);
      });
      
      it('should return coordinates even when other location data is missing', async () => {
        const result = await geoipService.getCoordinatesByIp('10.0.0.1');
        
        expect(result).toEqual({
          latitude: 51.5074,
          longitude: -0.1278,
        });
        expect(geoipService.getLocationByIp).toHaveBeenCalledWith('10.0.0.1');
        expect(geoipService.getLocationByIp).toHaveBeenCalledTimes(1);
      });
      
      it('should handle null location field in location data', async () => {
        const result = await geoipService.getCoordinatesByIp('172.16.0.1');
        
        expect(result).toBeNull();
        expect(geoipService.getLocationByIp).toHaveBeenCalledWith('172.16.0.1');
        expect(geoipService.getLocationByIp).toHaveBeenCalledTimes(1);
      });
      
      it('should return null coordinates for an invalid IP', async () => {
        const result = await geoipService.getCoordinatesByIp('invalid-ip');
        
        expect(result).toBeNull();
        expect(geoipService.getLocationByIp).toHaveBeenCalledWith('invalid-ip');
        expect(geoipService.getLocationByIp).toHaveBeenCalledTimes(1);
      });
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
      
      // Mock fs.unlink
      fs.unlink = jest.fn((path, callback) => callback());
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
    
    it('should use the specified edition when provided', async () => {
      const result = await geoipService.updateDatabase('mock-license-key', 'GeoLite2-Country');
      
      expect(result).toBe(true);
      expect(https.get).toHaveBeenCalledWith(
        expect.stringContaining('edition_id=GeoLite2-Country'),
        expect.any(Function)
      );
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
      
      try {
        await geoipService.updateDatabase('mock-license-key');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toBe('Network error');
        expect(fs.unlink).toHaveBeenCalled();
      }
    });
    
    it('should handle extraction errors', async () => {
      // Mock initialize to fail after extraction
      const originalInitialize = geoipService.initialize;
      geoipService.initialize = jest.fn().mockResolvedValueOnce(false);
      
      const result = await geoipService.updateDatabase('mock-license-key');
      
      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to initialize'));
      
      // Restore original initialize
      geoipService.initialize = originalInitialize;
    });
    
    it('should handle general errors during update process', async () => {
      // Mock fs.createWriteStream to throw an error
      fs.createWriteStream.mockImplementationOnce(() => {
        throw new Error('File system error');
      });
      
      const result = await geoipService.updateDatabase('mock-license-key');
      
      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error updating database'),
        expect.objectContaining({ error: expect.any(Error) })
      );
    });
    
    it('should clear the cache after successful update', async () => {
      // Create a real spy on clearCache method
      const originalClearCache = geoipService.clearCache;
      geoipService.clearCache = jest.fn();
      
      await geoipService.updateDatabase('mock-license-key');
      
      expect(geoipService.clearCache).toHaveBeenCalled();
      
      // Restore original clearCache
      geoipService.clearCache = originalClearCache;
    });
  });

  describe('Cache Management: clearCache and getCacheStats', () => {
    let mockReader;
    
    beforeEach(() => {
      // Setup reader mock
      mockReader = {
        get: jest.fn((ip) => {
          if (ip === '192.168.1.1' || ip.startsWith('10.0.0.')) return mockLocationData;
          return null;
        }),
      };
      
      // Mock successful initialization
      fs.existsSync.mockReturnValue(true);
      maxmind.Reader.open.mockResolvedValue(mockReader);
      
      // Reset the service's internal state
      geoipService.clearCache();
    });
    
    it('should clear the cache', async () => {
      // Create a mock cache with a known size
      const mockCache = new Map();
      mockCache.set('192.168.1.1', { data: {}, timestamp: Date.now() });
      
      // Replace the service's cache with our mock
      const originalCache = geoipService.getCacheStats();
      Object.defineProperty(geoipService, 'cache', { value: mockCache });
      
      // Then clear the cache
      geoipService.clearCache();
      
      // Verify the cache was cleared
      expect(mockCache.size).toBe(0);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Cleared GeoIP cache'));
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
  
  describe('Cache behavior', () => {
    let mockReader;
    
    beforeEach(() => {
      // Setup reader mock
      mockReader = {
        get: jest.fn((ip) => {
          if (ip === '192.168.1.1' || ip.startsWith('10.0.0.')) return mockLocationData;
          return null;
        }),
      };
      
      // Mock successful initialization
      fs.existsSync.mockReturnValue(true);
      maxmind.Reader.open.mockResolvedValue(mockReader);
      
      // Reset the service's internal state
      geoipService.clearCache();
    });
    
    it('should cache results and reuse them for repeated lookups', async () => {
      // Initialize the service
      await geoipService.initialize();
      
      // First lookup (cache miss)
      await geoipService.getLocationByIp('192.168.1.1');
      expect(mockReader.get).toHaveBeenCalledTimes(1);
      
      // Reset mock to track second call
      jest.clearAllMocks();
      
      // Second lookup of same IP (cache hit)
      await geoipService.getLocationByIp('192.168.1.1');
      expect(mockReader.get).not.toHaveBeenCalled();
    });
    
    it('should not cache invalid results', async () => {
      // Initialize the service
      await geoipService.initialize();
      
      // Mock invalid IP
      geoipUtils.isValidIpAddress.mockReturnValueOnce(false);
      
      // First lookup (invalid IP)
      await geoipService.getLocationByIp('invalid-ip');
      
      // Reset mocks
      jest.clearAllMocks();
      
      // Second lookup of same IP (should still check validity)
      await geoipService.getLocationByIp('invalid-ip');
      expect(geoipUtils.isValidIpAddress).toHaveBeenCalledTimes(1);
    });
  });
});
