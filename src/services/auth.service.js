const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const Token = require('../models/Token');
const logger = require('../utils/logger');

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @param {string} secret - Secret key
 * @param {string|number} expiresIn - Token expiration time
 * @returns {string} - JWT token
 * @private
 */
const _generateToken = (payload, secret, expiresIn) => {
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Generate access token
 * @param {Object} user - User object
 * @returns {Object} - Token object with token and expiration
 * @private
 */
const _generateAccessToken = (user) => {
  const payload = {
    sub: user.id,
    username: user.username,
    email: user.email,
    roles: user.roles,
  };

  const token = _generateToken(
    payload,
    config.jwt.secret,
    config.jwt.expiresIn
  );

  // Calculate expiration date
  const expiresIn = config.jwt.expiresIn;
  const expiresInMs = parseInt(expiresIn) * 1000 || 3600000; // Default to 1 hour if parsing fails
  const expiresAt = new Date(Date.now() + expiresInMs);

  return {
    token,
    expiresAt,
  };
};

/**
 * Generate refresh token
 * @param {Object} user - User object
 * @param {string} ipAddress - IP address
 * @returns {Promise<Object>} - Token object with token and expiration
 * @private
 */
const _generateRefreshToken = async (user, ipAddress) => {
  // Create refresh token that expires in 7 days
  const expiresIn = '7d';
  const expiresInMs = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  const expiresAt = new Date(Date.now() + expiresInMs);

  const payload = {
    sub: user.id,
    type: 'refresh',
  };

  const token = _generateToken(
    payload,
    config.jwt.secret,
    expiresIn
  );

  // Save refresh token to database
  await Token.create({
    user: user.id,
    token,
    type: 'refresh',
    expiresAt,
    createdByIp: ipAddress,
  });

  return {
    token,
    expiresAt,
  };
};

/**
 * PUBLIC_INTERFACE
 * Authenticate user and generate tokens
 * @param {string} username - Username or email
 * @param {string} password - Password
 * @param {string} ipAddress - IP address
 * @returns {Promise<Object>} - Authentication result with tokens
 */
const authenticate = async (username, password, ipAddress) => {
  try {
    // Find user by username or email
    const user = await User.findByLogin(username).select('+password');

    if (!user) {
      logger.warn(`Authentication failed: User ${username} not found`);
      throw new Error('Invalid username or password');
    }

    // Check if account is locked
    if (user.isLocked()) {
      logger.warn(`Authentication failed: Account ${username} is locked`);
      throw new Error('Account is locked due to too many failed login attempts');
    }

    // Check if account is active
    if (!user.active) {
      logger.warn(`Authentication failed: Account ${username} is inactive`);
      throw new Error('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Increment login attempts
      await user.incrementLoginAttempts();
      logger.warn(`Authentication failed: Invalid password for ${username}`);
      throw new Error('Invalid username or password');
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Update last login timestamp
    user.lastLogin = Date.now();
    await user.save();

    // Generate tokens
    const accessToken = _generateAccessToken(user);
    const refreshToken = await _generateRefreshToken(user, ipAddress);

    logger.info(`User ${username} authenticated successfully`);

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    };
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    throw error;
  }
};

/**
 * PUBLIC_INTERFACE
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @param {string} ipAddress - IP address
 * @returns {Promise<Object>} - New tokens
 */
const refreshToken = async (token, ipAddress) => {
  try {
    // Verify refresh token
    const payload = jwt.verify(token, config.jwt.secret);

    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Find token in database
    const storedToken = await Token.findOne({
      token,
      type: 'refresh',
    });

    if (!storedToken || !storedToken.isActive()) {
      throw new Error('Invalid or expired refresh token');
    }

    // Get user from token
    const user = await User.findById(payload.sub);

    if (!user || !user.active) {
      throw new Error('User not found or inactive');
    }

    // Generate new tokens
    const accessToken = _generateAccessToken(user);
    const newRefreshToken = await _generateRefreshToken(user, ipAddress);

    // Revoke old refresh token
    await storedToken.revoke(ipAddress, newRefreshToken.token);

    logger.info(`Refresh token used by user ${user.username}`);

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    logger.error(`Refresh token error: ${error.message}`);
    throw error;
  }
};

/**
 * PUBLIC_INTERFACE
 * Revoke refresh token
 * @param {string} token - Refresh token
 * @param {string} ipAddress - IP address
 * @returns {Promise<void>}
 */
const revokeToken = async (token, ipAddress) => {
  try {
    // Find token in database
    const storedToken = await Token.findOne({
      token,
      type: 'refresh',
    });

    if (!storedToken) {
      throw new Error('Token not found');
    }

    // Revoke token
    await storedToken.revoke(ipAddress);

    // Add token to blacklist
    await Token.create({
      user: storedToken.user,
      token,
      type: 'blacklisted',
      expiresAt: storedToken.expiresAt,
      createdByIp: ipAddress,
      revokedAt: new Date(),
      revokedByIp: ipAddress,
    });

    logger.info(`Token revoked for user ${storedToken.user}`);
  } catch (error) {
    logger.error(`Revoke token error: ${error.message}`);
    throw error;
  }
};

/**
 * PUBLIC_INTERFACE
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} - Decoded token payload
 */
const verifyToken = (token) => {
  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);
    return decoded;
  } catch (error) {
    logger.error(`Token verification error: ${error.message}`);
    throw error;
  }
};

/**
 * PUBLIC_INTERFACE
 * Check if token is blacklisted
 * @param {string} token - JWT token
 * @returns {Promise<boolean>} - Returns true if token is blacklisted
 */
const isTokenBlacklisted = async (token) => {
  try {
    const blacklistedToken = await Token.findOne({
      token,
      type: 'blacklisted',
    });

    return !!blacklistedToken;
  } catch (error) {
    logger.error(`Blacklist check error: ${error.message}`);
    throw error;
  }
};

/**
 * PUBLIC_INTERFACE
 * Cleanup expired tokens
 * @returns {Promise<void>}
 */
const cleanupExpiredTokens = async () => {
  try {
    await Token.cleanupExpiredTokens();
    logger.info('Expired tokens cleaned up');
  } catch (error) {
    logger.error(`Token cleanup error: ${error.message}`);
    throw error;
  }
};

module.exports = {
  authenticate,
  refreshToken,
  revokeToken,
  verifyToken,
  isTokenBlacklisted,
  cleanupExpiredTokens,
};
