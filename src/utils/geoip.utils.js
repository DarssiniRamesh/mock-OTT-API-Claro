/**
 * GeoIP Utility Functions
 * Provides utility functions for IP address validation, normalization, and type detection
 */

/**
 * PUBLIC_INTERFACE
 * Validates if a string is a valid IPv4 address
 * @param {string} ip - The IP address to validate
 * @returns {boolean} - True if valid IPv4 address, false otherwise
 */
const isValidIpv4Address = (ip) => {
  if (!ip || typeof ip !== 'string') return false;
  
  // Regular expression for IPv4 validation
  const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  return ipv4Regex.test(ip);
};

/**
 * PUBLIC_INTERFACE
 * Validates if a string is a valid IPv6 address
 * @param {string} ip - The IP address to validate
 * @returns {boolean} - True if valid IPv6 address, false otherwise
 */
const isValidIpv6Address = (ip) => {
  if (!ip || typeof ip !== 'string') return false;
  
  // Regular expression for IPv6 validation
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
  
  return ipv6Regex.test(ip);
};

/**
 * PUBLIC_INTERFACE
 * Validates if a string is a valid IP address (IPv4 or IPv6)
 * @param {string} ip - The IP address to validate
 * @returns {boolean} - True if valid IP address, false otherwise
 */
const isValidIpAddress = (ip) => {
  return isValidIpv4Address(ip) || isValidIpv6Address(ip);
};

/**
 * PUBLIC_INTERFACE
 * Normalizes an IP address format
 * @param {string} ip - The IP address to normalize
 * @returns {string|null} - Normalized IP address or null if invalid
 */
const normalizeIpAddress = (ip) => {
  if (!ip || typeof ip !== 'string') return null;
  
  // Remove any whitespace
  ip = ip.trim();
  
  // Check if it's a valid IP address
  if (!isValidIpAddress(ip)) return null;
  
  // For IPv4, ensure each octet doesn't have leading zeros
  if (isValidIpv4Address(ip)) {
    return ip.split('.').map(octet => parseInt(octet, 10).toString()).join('.');
  }
  
  // For IPv6, use the built-in normalizer if available
  if (typeof net !== 'undefined' && net.isIPv6) {
    try {
      // This is a Node.js specific approach
      const address = new (require('net').Address6)(ip);
      return address.correctForm();
    } catch (e) {
      // If the IPv6 address library fails, return the original (already validated) address
      return ip;
    }
  }
  
  return ip;
};

/**
 * PUBLIC_INTERFACE
 * Determines if an IP address is IPv4 or IPv6
 * @param {string} ip - The IP address to check
 * @returns {string|null} - 'IPv4', 'IPv6', or null if invalid
 */
const getIpAddressType = (ip) => {
  if (isValidIpv4Address(ip)) return 'IPv4';
  if (isValidIpv6Address(ip)) return 'IPv6';
  return null;
};

/**
 * PUBLIC_INTERFACE
 * Extracts the client IP address from an Express request object
 * @param {Object} req - Express request object
 * @returns {string} - The client IP address
 */
const parseIpFromRequest = (req) => {
  // Get IP from various headers that might contain the real IP
  const ip = 
    req.headers['x-forwarded-for']?.split(',').shift() || 
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.connection?.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1';
  
  // Clean up IPv6 format if needed (e.g., ::ffff:127.0.0.1 -> 127.0.0.1)
  return ip.includes('::ffff:') ? ip.split('::ffff:')[1] : ip;
};

module.exports = {
  isValidIpv4Address,
  isValidIpv6Address,
  isValidIpAddress,
  normalizeIpAddress,
  getIpAddressType,
  parseIpFromRequest,
};