const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Token Schema
 * Represents a token for refresh tokens and blacklisted tokens
 */
const TokenSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  token: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['refresh', 'blacklisted'],
    required: true,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
  createdByIp: {
    type: String,
  },
  revokedAt: {
    type: Date,
  },
  revokedByIp: {
    type: String,
  },
  replacedByToken: {
    type: String,
  },
}, {
  timestamps: true,
});

// Index for token cleanup
TokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Check if token is expired
 * @returns {boolean} - Returns true if token is expired
 */
TokenSchema.methods.isExpired = function() {
  return Date.now() >= this.expiresAt.getTime();
};

/**
 * Check if token is revoked
 * @returns {boolean} - Returns true if token is revoked
 */
TokenSchema.methods.isRevoked = function() {
  return !!this.revokedAt;
};

/**
 * Check if token is active
 * @returns {boolean} - Returns true if token is active
 */
TokenSchema.methods.isActive = function() {
  return !this.isRevoked() && !this.isExpired();
};

/**
 * Revoke token
 * @param {string} ip - IP address of the user revoking the token
 * @param {string} replacementToken - Token that replaces this one
 * @returns {Promise<void>}
 */
TokenSchema.methods.revoke = function(ip, replacementToken = null) {
  this.revokedAt = Date.now();
  this.revokedByIp = ip;
  if (replacementToken) {
    this.replacedByToken = replacementToken;
  }
  return this.save();
};

/**
 * Static method to find active refresh token for a user
 * @param {string} userId - User ID
 * @returns {Promise<Token>} - Returns token if found
 */
TokenSchema.statics.findActiveRefreshToken = function(userId) {
  return this.findOne({
    user: userId,
    type: 'refresh',
    revokedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  });
};

/**
 * Static method to cleanup expired tokens
 * @returns {Promise<void>}
 */
TokenSchema.statics.cleanupExpiredTokens = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() },
  });
};

const Token = mongoose.model('Token', TokenSchema);

module.exports = Token;