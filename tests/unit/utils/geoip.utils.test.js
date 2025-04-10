/**
 * Unit tests for GeoIP Utility Functions
 */

const geoipUtils = require('../../../src/utils/geoip.utils');

describe('GeoIP Utility Functions', () => {
  describe('isValidIpv4Address', () => {
    it('should correctly validate IPv4 addresses', () => {
      // Valid IPv4 addresses
      expect(geoipUtils.isValidIpv4Address('192.168.1.1')).toBe(true);
      expect(geoipUtils.isValidIpv4Address('10.0.0.1')).toBe(true);
      expect(geoipUtils.isValidIpv4Address('172.16.0.1')).toBe(true);
      expect(geoipUtils.isValidIpv4Address('255.255.255.255')).toBe(true);
      expect(geoipUtils.isValidIpv4Address('0.0.0.0')).toBe(true);
      
      // Invalid IPv4 addresses
      expect(geoipUtils.isValidIpv4Address('256.0.0.1')).toBe(false);
      expect(geoipUtils.isValidIpv4Address('192.168.1')).toBe(false);
      expect(geoipUtils.isValidIpv4Address('192.168.1.1.5')).toBe(false);
      expect(geoipUtils.isValidIpv4Address('192.168.1.a')).toBe(false);
      expect(geoipUtils.isValidIpv4Address('')).toBe(false);
      expect(geoipUtils.isValidIpv4Address(null)).toBe(false);
      expect(geoipUtils.isValidIpv4Address(undefined)).toBe(false);
      expect(geoipUtils.isValidIpv4Address(123)).toBe(false);
    });
  });
  
  describe('isValidIpv6Address', () => {
    it('should correctly validate IPv6 addresses', () => {
      // Valid IPv6 addresses
      expect(geoipUtils.isValidIpv6Address('2001:db8::1')).toBe(true);
      expect(geoipUtils.isValidIpv6Address('::1')).toBe(true);
      expect(geoipUtils.isValidIpv6Address('fe80::1234:5678:abcd:ef12')).toBe(true);
      expect(geoipUtils.isValidIpv6Address('2001:db8:0:0:0:0:0:1')).toBe(true);
      
      // Invalid IPv6 addresses
      expect(geoipUtils.isValidIpv6Address('2001:db8::g')).toBe(false);
      expect(geoipUtils.isValidIpv6Address('2001::db8::1')).toBe(false); // Double ::
      expect(geoipUtils.isValidIpv6Address('192.168.1.1')).toBe(false); // IPv4
      expect(geoipUtils.isValidIpv6Address('')).toBe(false);
      expect(geoipUtils.isValidIpv6Address(null)).toBe(false);
      expect(geoipUtils.isValidIpv6Address(undefined)).toBe(false);
    });
  });
  
  describe('isValidIpAddress', () => {
    it('should validate both IPv4 and IPv6 addresses', () => {
      // Valid IP addresses (both IPv4 and IPv6)
      expect(geoipUtils.isValidIpAddress('192.168.1.1')).toBe(true);
      expect(geoipUtils.isValidIpAddress('2001:db8::1')).toBe(true);
      
      // Invalid IP addresses
      expect(geoipUtils.isValidIpAddress('not-an-ip')).toBe(false);
      expect(geoipUtils.isValidIpAddress('')).toBe(false);
      expect(geoipUtils.isValidIpAddress(null)).toBe(false);
    });
  });
  
  describe('normalizeIpAddress', () => {
    it('should normalize IPv4 addresses by removing leading zeros', () => {
      expect(geoipUtils.normalizeIpAddress('192.168.001.001')).toBe('192.168.1.1');
      expect(geoipUtils.normalizeIpAddress('010.001.001.010')).toBe('10.1.1.10');
      expect(geoipUtils.normalizeIpAddress('127.000.000.001')).toBe('127.0.0.1');
    });
    
    it('should return null for invalid IP addresses', () => {
      expect(geoipUtils.normalizeIpAddress('not-an-ip')).toBeNull();
      expect(geoipUtils.normalizeIpAddress('256.0.0.1')).toBeNull();
      expect(geoipUtils.normalizeIpAddress('')).toBeNull();
      expect(geoipUtils.normalizeIpAddress(null)).toBeNull();
      expect(geoipUtils.normalizeIpAddress(undefined)).toBeNull();
    });
    
    it('should handle IPv6 addresses', () => {
      // Since we don't have the net module in tests, it should return the original IPv6 address
      expect(geoipUtils.normalizeIpAddress('2001:db8::1')).toBe('2001:db8::1');
      expect(geoipUtils.normalizeIpAddress('::1')).toBe('::1');
    });
    
    it('should handle whitespace in IP addresses', () => {
      expect(geoipUtils.normalizeIpAddress(' 192.168.1.1 ')).toBe('192.168.1.1');
      expect(geoipUtils.normalizeIpAddress('\t10.0.0.1\n')).toBe('10.0.0.1');
    });
  });
  
  describe('getIpAddressType', () => {
    it('should correctly identify IPv4 addresses', () => {
      expect(geoipUtils.getIpAddressType('192.168.1.1')).toBe('IPv4');
      expect(geoipUtils.getIpAddressType('10.0.0.1')).toBe('IPv4');
      expect(geoipUtils.getIpAddressType('255.255.255.255')).toBe('IPv4');
    });
    
    it('should correctly identify IPv6 addresses', () => {
      expect(geoipUtils.getIpAddressType('2001:db8::1')).toBe('IPv6');
      expect(geoipUtils.getIpAddressType('::1')).toBe('IPv6');
      expect(geoipUtils.getIpAddressType('fe80::1234:5678:abcd:ef12')).toBe('IPv6');
    });
    
    it('should return null for invalid IP addresses', () => {
      expect(geoipUtils.getIpAddressType('not-an-ip')).toBeNull();
      expect(geoipUtils.getIpAddressType('256.0.0.1')).toBeNull();
      expect(geoipUtils.getIpAddressType('')).toBeNull();
      expect(geoipUtils.getIpAddressType(null)).toBeNull();
    });
  });
  
  describe('parseIpFromRequest', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const req = {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1'
        }
      };
      expect(geoipUtils.parseIpFromRequest(req)).toBe('192.168.1.1');
    });
    
    it('should extract IP from x-real-ip header when x-forwarded-for is not available', () => {
      const req = {
        headers: {
          'x-real-ip': '192.168.1.1'
        }
      };
      expect(geoipUtils.parseIpFromRequest(req)).toBe('192.168.1.1');
    });
    
    it('should extract IP from connection.remoteAddress when headers are not available', () => {
      const req = {
        headers: {},
        connection: {
          remoteAddress: '192.168.1.1'
        }
      };
      expect(geoipUtils.parseIpFromRequest(req)).toBe('192.168.1.1');
    });
    
    it('should extract IP from socket.remoteAddress when other sources are not available', () => {
      const req = {
        headers: {},
        socket: {
          remoteAddress: '192.168.1.1'
        }
      };
      expect(geoipUtils.parseIpFromRequest(req)).toBe('192.168.1.1');
    });
    
    it('should extract IP from req.ip when other sources are not available', () => {
      const req = {
        headers: {},
        ip: '192.168.1.1'
      };
      expect(geoipUtils.parseIpFromRequest(req)).toBe('192.168.1.1');
    });
    
    it('should return localhost IP when no IP source is available', () => {
      const req = {
        headers: {}
      };
      expect(geoipUtils.parseIpFromRequest(req)).toBe('127.0.0.1');
    });
    
    it('should handle IPv6 format with IPv4 mapped address', () => {
      const req = {
        headers: {
          'x-forwarded-for': '::ffff:192.168.1.1'
        }
      };
      expect(geoipUtils.parseIpFromRequest(req)).toBe('192.168.1.1');
    });
  });
});