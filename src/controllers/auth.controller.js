const User = require('../models/User');
const authService = require('../services/auth.service');
const logger = require('../utils/logger');

/**
 * PUBLIC_INTERFACE
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with user data and tokens
 */
const register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findByLogin(username || email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          message: 'Username or email already exists',
        },
      });
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      roles: ['user'], // Default role
    });

    // Generate tokens
    const ipAddress = req.ip;
    const { accessToken, refreshToken } = await authService.authenticate(
      username,
      password,
      ipAddress
    );

    logger.info(`User registered: ${username}`);

    return res.status(201).json({
      success: true,
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Error registering user',
        details: error.message,
      },
    });
  }
};

/**
 * PUBLIC_INTERFACE
 * Login user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with user data and tokens
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Username and password are required',
        },
      });
    }

    // Authenticate user
    const ipAddress = req.ip;
    const authResult = await authService.authenticate(username, password, ipAddress);

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', authResult.refreshToken.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      data: {
        user: authResult.user,
        accessToken: authResult.accessToken,
        // Don't include refresh token in response body for security
      },
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    return res.status(401).json({
      success: false,
      error: {
        message: error.message || 'Invalid credentials',
      },
    });
  }
};

/**
 * PUBLIC_INTERFACE
 * Refresh access token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with new tokens
 */
const refreshAccessToken = async (req, res) => {
  try {
    // Get refresh token from cookie or request body
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Refresh token is required',
        },
      });
    }

    // Refresh token
    const ipAddress = req.ip;
    const refreshResult = await authService.refreshToken(token, ipAddress);

    // Set new refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshResult.refreshToken.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      data: {
        user: refreshResult.user,
        accessToken: refreshResult.accessToken,
        // Don't include refresh token in response body for security
      },
    });
  } catch (error) {
    logger.error(`Token refresh error: ${error.message}`);
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid refresh token',
        details: error.message,
      },
    });
  }
};

/**
 * PUBLIC_INTERFACE
 * Logout user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with success message
 */
const logout = async (req, res) => {
  try {
    // Get refresh token from cookie or request body
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Refresh token is required',
        },
      });
    }

    // Revoke token
    const ipAddress = req.ip;
    await authService.revokeToken(token, ipAddress);

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Error logging out',
        details: error.message,
      },
    });
  }
};

/**
 * PUBLIC_INTERFACE
 * Get current user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with user data
 */
const getProfile = async (req, res) => {
  try {
    // Get user from database
    const user = await User.findById(req.user.sub);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Error getting user profile',
        details: error.message,
      },
    });
  }
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  getProfile,
};
