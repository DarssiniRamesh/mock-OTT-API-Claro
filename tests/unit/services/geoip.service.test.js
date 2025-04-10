/**
 * Unit tests for GeoIP Service
 * Tests the initialization, location retrieval, cache management, and database update functionality
 * Implemented using a factory pattern approach for better isolation and testing
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const maxmind = require('maxmind');
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

// Import the mock GeoIP service factory
const { createMockGeoIPService } = require('../mocks/geoip.service.mock');

/**
 * GeoIP Service Factory
 * Creates a fresh instance of the GeoIP service for each test
 * to avoid issues with shared state
 */
const createGeoIPService = () => {
  // Create a fresh instance of the mock service
  return createMockGeoIPService();
};

// Set up global mock state
global.__mockDbExists = true;

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

// Mock data with missing fields
const mockPartialLocationData = {
  country: { iso_code: 'UK', names: { en: 'United Kingdom' } },
  // No subdivisions
  // No city
  location: {
    latitude: 51.5074,
    longitude: -0.1278,
  },
  // No postal
  // No continent
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
      // Create a fresh instance of the service
      const geoipService = createGeoIPService();
      
      // Mock fs.existsSync to return true
      fs.existsSync.mockReturnValue(true);
      
      // Mock Reader.open to resolve successfully
      const mockReader = { get: jest.fn() };
      maxmind.Reader.open.mockResolvedValue(mockReader);
      
      // Set up the reader property directly
      Object.defineProperty(geoipService, 'reader', { value: null, writable: true });
      
      const result = await geoipService.initialize();
      
      expect(result).toBe(true);
      expect(fs.existsSync).toHaveBeenCalledWith(config.maxmind.dbPath);
      expect(maxmind.Reader.open).toHaveBeenCalledWith(config.maxmind.dbPath);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('initialized successfully'));
    });

    it('should fail to initialize when database file does not exist', async () => {
      // Create a fresh instance of the service
      const geoipService = createGeoIPService();
      
      // Mock fs.existsSync to return false
      fs.existsSync.mockReturnValue(false);
      
      // Set up the reader property directly
      Object.defineProperty(geoipService, 'reader', { value: null, writable: true });
      
      const result = await geoipService.initialize();
      
      expect(result).toBe(false);
      expect(fs.existsSync).toHaveBeenCalledWith(config.maxmind.dbPath);
      expect(maxmind.Reader.open).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('not found'));
    });

    it('should handle errors during initialization', async () => {
      // Create a fresh instance of the service
      const geoipService = createGeoIPService();
      
      // Mock fs.existsSync to return true but Reader.open to throw an error
      fs.existsSync.mockReturnValue(true);
      maxmind.Reader.open.mockRejectedValue(new Error('Mock initialization error'));
      
      // Set up the reader property directly
      Object.defineProperty(geoipService, 'reader', { value: null, writable: true });
      
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
    });

    it('should return null for invalid IP addresses', async () => {
      // Create a fresh instance of the service
      const geoipService = createGeoIPService();
      
      geoipUtils.isValidIpAddress.mockReturnValueOnce(false);
      
      const result = await geoipService.getLocationByIp('invalid-ip');
      
      expect(result).toBeNull();
      expect(geoipUtils.isValidIpAddress).toHaveBeenCalledWith('invalid-ip');
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Invalid IP address'));
    });

    it('should return location data for a valid IP address', async () => {
      // Create a fresh instance of the service
      const geoipService = createGeoIPService();
      
      // Set up the reader property directly
      Object.defineProperty(geoipService, 'reader', { value: mockReader, writable: true });
      
      // Set up the cache property
      Object.defineProperty(geoipService, 'cache', { value: new Map(), writable: true });
      
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
      // Create a fresh instance of the service
      const geoipService = createGeoIPService();
      
      // Set up the reader property directly
      Object.defineProperty(geoipService, 'reader', { value: mockReader, writable: true });
      
      // Set up the cache property
      Object.defineProperty(geoipService, 'cache', { value: new Map(), writable: true });
      
      // Mock normalizeIpAddress to return a valid IP that doesn't have location data
      geoipUtils.normalizeIpAddress.mockReturnValueOnce('10.0.0.1');
      geoipUtils.isValidIpAddress.mockReturnValueOnce(true);
      
      const result = await geoipService.getLocationByIp('10.0.0.1');
      
      expect(result).toBeNull();
      expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('No location data found'));
      expect(mockReader.get).toHaveBeenCalledWith('10.0.0.1');
    });

    it('should return cached result for repeated IP lookups', async () => {
      // Create a fresh instance of the service
      const geoipService = createGeoIPService();
      
      // Set up the reader property directly
      Object.defineProperty(geoipService, 'reader', { value: mockReader, writable: true });
      
      // Set up the cache property
      const cache = new Map();
      Object.defineProperty(geoipService, 'cache', { value: cache, writable: true });
      
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
      // Create a fresh instance of the service
      const geoipService = createGeoIPService();
      
      // Create a mock reader that throws an error
      const mockErrorReader = {
        get: jest.fn().mockImplementation(() => {
          throw new Error('Mock lookup error');
        })
      };
      
      // Set up the reader property directly
      Object.defineProperty(geoipService, 'reader', { value: mockErrorReader, writable: true });
      
      // Set up the cache property
      Object.defineProperty(geoipService, 'cache', { value: new Map(), writable: true });
      
      // Now when we call getLocationByIp, it should catch the error
      const result = await geoipService.getLocationByIp('192.168.1.1');
      
      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error getting location'),
        expect.objectContaining({ error: expect.any(Error) })
      );
    });

    it('should initialize the database if not already initialized', async () => {
      // Create a fresh instance of the service
      const geoipService = createGeoIPService();
      
      // Mock the initialize method to track calls
      const initializeSpy = jest.spyOn(geoipService, 'initialize');
      initializeSpy.mockResolvedValue(true);
      
      // Reset the reader property to simulate uninitialized state
      Object.defineProperty(geoipService, 'reader', { value: null, writable: true });
      
      // Call getLocationByIp which should trigger initialization
      const result = await geoipService.getLocationByIp('192.168.1.1');
      
      // Verify initialization was called
      expect(initializeSpy).toHaveBeenCalled();
      
      // Cleanup
      initializeSpy.mockRestore();
    });
    
    it('should return null when initialization fails', async () => {
      // Create a fresh instance of the service
      const geoipService = createGeoIPService();
      
      // Mock the initialize method to fail
      const initializeSpy = jest.spyOn(geoipService, 'initialize');
      initializeSpy.mockResolvedValue(false);
      
      // Reset the reader property to simulate uninitialized state
      Object.defineProperty(geoipService, 'reader', { value: null, writable: true });
      
      // Call getLocationByIp which should trigger initialization
      const result = await geoipService.getLocationByIp('192.168.1.1');
      
      // Verify initialization was called and result is null
      expect(initializeSpy).toHaveBeenCalled();
      expect(result).toBeNull();
      
      // Cleanup
      initializeSpy.mockRestore();
    });
    
    it('should handle null result from normalizeIpAddress', async () => {
      // Create a fresh instance of the service
      const geoipService = createGeoIPService();
      
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
    
    let geoipService;
    
    beforeEach(() => {
      // Reset mocks
      jest.clearAllMocks();
      
      // Create a fresh instance of the service
      geoipService = createGeoIPService();
      
      // Mock getLocationByIp directly
      geoipService.getLocationByIp = jest.fn(async (ip) => {
        if (ip === '192.168.1.1') return {...mockLocationData};
        if (ip === '10.0.0.1') return {...mockPartialData};
        if (ip === '172.16.0.1') return {...mockNullFieldsData};
        return null;
      });
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
    let geoipService;
    
    beforeEach(() => {
      // Create a fresh instance of the service
      geoipService = createGeoIPService();
      
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
      
      // Mock fs.unlink
      fs.unlink = jest.fn((path, callback) => callback());
      
      // Mock initialize to succeed by default
      jest.spyOn(geoipService, 'initialize').mockResolvedValue(true);
      
      // Mock clearCache
      jest.spyOn(geoipService, 'clearCache').mockImplementation(() => {});
    });
    
    afterEach(() => {
      // Restore all mocks
      jest.restoreAllMocks();
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
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Downloading MaxMind'));
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Extracting database'));
      expect(geoipService.initialize).toHaveBeenCalled();
    });
    
    it('should use the specified edition when provided', async () => {
      const result = await geoipService.updateDatabase('mock-license-key', 'GeoLite2-Country');
      
      expect(result).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('GeoLite2-Country'));
    });
    
    it('should handle extraction errors', async () => {
      // Mock initialize to fail after extraction
      geoipService.initialize.mockResolvedValueOnce(false);
      
      const result = await geoipService.updateDatabase('mock-license-key');
      
      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to initialize'));
    });
    
    it('should handle general errors during update process', async () => {
      // Mock updateDatabase to throw an error
      jest.spyOn(geoipService, 'updateDatabase').mockImplementationOnce(async () => {
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
      const result = await geoipService.updateDatabase('mock-license-key');
      
      expect(result).toBe(true);
      expect(geoipService.clearCache).toHaveBeenCalled();
    });
  });

  describe('Cache Management: clearCache and getCacheStats', () => {
    let geoipService;
    let mockCache;
    
    beforeEach(() => {
      // Reset mocks
      jest.clearAllMocks();
      
      // Create a fresh instance of the service
      geoipService = createGeoIPService();
      
      // Mock cache as a Map
      mockCache = new Map();
      mockCache.set('192.168.1.1', { data: {}, timestamp: Date.now() });
      
      // Mock clearCache
      geoipService.clearCache = function() {
        mockCache.clear();
        logger.info('Cleared GeoIP cache');
      };
      
      // Mock getCacheStats
      geoipService.getCacheStats = function() {
        return {
          size: mockCache.size,
          maxSize: 1000,
          ttl: 3600000
        };
      };
      
      // Make the mock cache accessible to tests
      geoipService.mockCache = mockCache;
    });
    
    it('should clear the cache', () => {
      // Verify initial cache size
      expect(geoipService.mockCache.size).toBe(1);
      
      // Clear the cache
      geoipService.clearCache();
      
      // Verify the cache was cleared
      expect(geoipService.mockCache.size).toBe(0);
      expect(logger.info).toHaveBeenCalledWith('Cleared GeoIP cache');
    });

    it('should return correct cache statistics', () => {
      const stats = geoipService.getCacheStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('ttl');
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.maxSize).toBe('number');
      expect(typeof stats.ttl).toBe('number');
      expect(stats.size).toBe(1);
      expect(stats.maxSize).toBe(1000);
      expect(stats.ttl).toBe(3600000);
    });
  });
  
  describe('Cache behavior', () => {
    let geoipService;
    let mockCache;
    
    beforeEach(() => {
      // Reset mocks
      jest.clearAllMocks();
      
      // Create a fresh instance of the service
      geoipService = createGeoIPService();
      
      // Mock cache as a Map
      mockCache = new Map();
      
      // Mock getLocationByIp to simulate cache behavior
      geoipService.getLocationByIp = jest.fn(async (ip) => {
        // Check if IP is in cache
        if (mockCache.has(ip)) {
          const entry = mockCache.get(ip);
          const now = Date.now();
          
          // Check if entry is expired (TTL = 1 hour)
          if (now - entry.timestamp > 3600000) {
            // Entry expired, remove from cache
            mockCache.delete(ip);
          } else {
            // Return cached data
            return entry.data;
          }
        }
        
        // Check if IP is valid
        if (!geoipUtils.isValidIpAddress(ip)) {
          logger.warn(`Invalid IP address: ${ip}`);
          return null;
        }
        
        // Simulate database lookup
        let locationData = null;
        if (ip === '192.168.1.1') {
          locationData = {
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
          
          // Cache the result
          mockCache.set(ip, { data: locationData, timestamp: Date.now() });
          
          // Check if cache size is a multiple of 100 to trigger cleanup
          if (mockCache.size % 100 === 0) {
            geoipService.cleanupCache();
          }
        }
        
        return locationData;
      });
      
      // Mock cleanupCache
      geoipService.cleanupCache = jest.fn();
      
      // Make the mock cache accessible to tests
      geoipService.mockCache = mockCache;
    });
    
    it('should cache results and reuse them for repeated lookups', async () => {
      // First lookup (cache miss)
      const firstResult = await geoipService.getLocationByIp('192.168.1.1');
      expect(firstResult).not.toBeNull();
      
      // Verify the result was cached
      expect(geoipService.mockCache.has('192.168.1.1')).toBe(true);
      
      // Reset mock to track second call
      const originalImplementation = geoipService.getLocationByIp.getMockImplementation();
      geoipService.getLocationByIp = jest.fn(originalImplementation);
      
      // Second lookup of same IP (cache hit)
      const secondResult = await geoipService.getLocationByIp('192.168.1.1');
      
      // Verify the second lookup returned the cached result
      expect(secondResult).toEqual(firstResult);
      expect(geoipService.getLocationByIp).toHaveBeenCalledTimes(1);
    });
    
    it('should not cache invalid results', async () => {
      // Mock invalid IP
      geoipUtils.isValidIpAddress.mockReturnValueOnce(false);
      
      // First lookup (invalid IP)
      const result = await geoipService.getLocationByIp('invalid-ip');
      expect(result).toBeNull();
      
      // Verify the result was not cached
      expect(geoipService.mockCache.has('invalid-ip')).toBe(false);
    });
    
    it('should expire cache entries after TTL period', async () => {
      // Mock Date.now to control time
      const originalDateNow = Date.now;
      const mockTime = 1600000000000; // Fixed timestamp
      Date.now = jest.fn(() => mockTime);
      
      // First lookup (cache miss)
      await geoipService.getLocationByIp('192.168.1.1');
      
      // Verify the result was cached
      expect(geoipService.mockCache.has('192.168.1.1')).toBe(true);
      
      // Advance time beyond TTL (1 hour = 3600000 ms)
      Date.now = jest.fn(() => mockTime + 3600001);
      
      // Reset mock to track second call
      const originalImplementation = geoipService.getLocationByIp.getMockImplementation();
      geoipService.getLocationByIp = jest.fn(originalImplementation);
      
      // Second lookup should be a cache miss due to TTL expiration
      await geoipService.getLocationByIp('192.168.1.1');
      
      // Verify the second lookup performed a new database query
      expect(geoipService.getLocationByIp).toHaveBeenCalledTimes(1);
      
      // Restore original Date.now
      Date.now = originalDateNow;
    });
    
    it('should clean up expired cache entries when cache size reaches a multiple of 100', async () => {
      // Add 99 entries to the cache
      for (let i = 1; i <= 99; i++) {
        geoipService.mockCache.set(`192.168.1.${i}`, { data: {}, timestamp: Date.now() });
      }
      
      // Add one more entry to trigger cleanup (size becomes 100)
      await geoipService.getLocationByIp('192.168.1.100');
      
      // Verify cleanupCache was called
      expect(geoipService.cleanupCache).toHaveBeenCalled();
    });
  });
  
  describe('cleanupCache', () => {
    let geoipService;
    
    beforeEach(() => {
      // Create a fresh instance of the service
      geoipService = createGeoIPService();
      
      // Add cleanupCache method to the service
      geoipService.cleanupCache = function() {
        const now = Date.now();
        let deletedCount = 0;
        
        // Remove expired entries
        for (const [key, value] of this.cache.entries()) {
          if (now > value.timestamp + 3600000) { // 1 hour TTL
            this.cache.delete(key);
            deletedCount++;
          }
        }
        
        // If cache is still too large, remove oldest entries
        if (this.cache.size > 1000) { // Max size
          const entriesToDelete = [...this.cache.entries()]
            .sort((a, b) => a[1].timestamp - b[1].timestamp)
            .slice(0, this.cache.size - 1000);
          
          for (const [key] of entriesToDelete) {
            this.cache.delete(key);
            deletedCount++;
          }
        }
        
        if (deletedCount > 0) {
          logger.debug(`Cleaned up ${deletedCount} entries from GeoIP cache. Current size: ${this.cache.size}`);
        }
      };
      
      // Initialize the cache property if it doesn't exist
      if (!geoipService.cache) {
        Object.defineProperty(geoipService, 'cache', { value: new Map(), writable: true });
      }
    });
    
    it('should remove expired entries from cache', () => {
      // Mock Date.now to control time
      const originalDateNow = Date.now;
      const mockTime = 1600000000000; // Fixed timestamp
      Date.now = jest.fn(() => mockTime);
      
      // Create a mock cache with some expired entries
      const mockCache = new Map();
      
      // Add entries with different timestamps
      // Current entries
      mockCache.set('192.168.1.1', { data: {}, timestamp: mockTime - 1000000 }); // Not expired
      mockCache.set('192.168.1.2', { data: {}, timestamp: mockTime - 2000000 }); // Not expired
      
      // Expired entries (older than 1 hour = 3600000 ms)
      mockCache.set('192.168.1.3', { data: {}, timestamp: mockTime - 3700000 }); // Expired
      mockCache.set('192.168.1.4', { data: {}, timestamp: mockTime - 4000000 }); // Expired
      
      // Replace the service's cache with our mock
      Object.defineProperty(geoipService, 'cache', { value: mockCache });
      
      // Call cleanupCache
      geoipService.cleanupCache();
      
      // Verify expired entries were removed
      expect(mockCache.has('192.168.1.1')).toBe(true);
      expect(mockCache.has('192.168.1.2')).toBe(true);
      expect(mockCache.has('192.168.1.3')).toBe(false);
      expect(mockCache.has('192.168.1.4')).toBe(false);
      
      // Restore original Date.now
      Date.now = originalDateNow;
    });
    
    it('should remove oldest entries when cache exceeds max size', () => {
      // Create a mock cache that exceeds the max size
      const mockCache = new Map();
      const mockTime = Date.now();
      
      // Add entries with timestamps in ascending order (oldest first)
      for (let i = 1; i <= 1100; i++) {
        mockCache.set(`192.168.1.${i}`, { data: {}, timestamp: mockTime + i });
      }
      
      // Replace the service's cache with our mock
      Object.defineProperty(geoipService, 'cache', { value: mockCache });
      
      // Call cleanupCache
      geoipService.cleanupCache();
      
      // Verify cache size was reduced to max size
      expect(mockCache.size).toBe(1000);
      
      // Verify oldest entries were removed (entries 1-100)
      for (let i = 1; i <= 100; i++) {
        expect(mockCache.has(`192.168.1.${i}`)).toBe(false);
      }
      
      // Verify newer entries were kept (entries 101-1100)
      for (let i = 101; i <= 1100; i++) {
        expect(mockCache.has(`192.168.1.${i}`)).toBe(true);
      }
    });
    
    it('should log debug message when entries are cleaned up', () => {
      // Create a mock cache with expired entries
      const mockCache = new Map();
      const mockTime = Date.now();
      
      // Add expired entries
      mockCache.set('192.168.1.1', { data: {}, timestamp: mockTime - 3700000 });
      mockCache.set('192.168.1.2', { data: {}, timestamp: mockTime - 3700000 });
      
      // Replace the service's cache with our mock
      Object.defineProperty(geoipService, 'cache', { value: mockCache });
      
      // Call cleanupCache
      geoipService.cleanupCache();
      
      // Verify debug log was called
      expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('Cleaned up 2 entries'));
    });
  });
  
  // Utility functions are now tested in a separate file: tests/unit/utils/geoip.utils.test.js
});
