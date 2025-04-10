{"is_source_file": true, "format": "JavaScript", "description": "Defines the Token schema for managing refresh tokens and blacklisted tokens in a MongoDB database using Mongoose.", "external_files": ["mongoose"], "external_methods": [], "published": ["Token"], "classes": [], "methods": [{"name": "isExpired()", "description": "Checks if the token is expired.", "scope": "TokenSchema.methods", "scopeKind": "function"}, {"name": "isRevoked()", "description": "Checks if the token is revoked.", "scope": "TokenSchema.methods", "scopeKind": "function"}, {"name": "isActive()", "description": "Checks if the token is active.", "scope": "TokenSchema.methods", "scopeKind": "function"}, {"name": "revoke", "description": "Revokes the token and records the revocation details."}, {"name": "findActiveRefreshToken(userId)", "description": "Finds an active refresh token for a given user.", "scope": "TokenSchema.statics", "scopeKind": "function"}, {"name": "cleanupExpiredTokens()", "description": "Cleans up expired tokens from the database.", "scope": "TokenSchema.statics", "scopeKind": "function"}], "calls": ["this.save", "this.findOne", "this.deleteMany"], "search-terms": ["Token", "TokenSchema", "refresh token", "blacklisted token"], "state": 2, "file_id": 18, "knowledge_revision": 40, "git_revision": "", "ctags": [{"_type": "tag", "name": "Schema", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/models/Token.js", "pattern": "/^const Schema = mongoose.Schema;$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "Token", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/models/Token.js", "pattern": "/^const Token = mongoose.model('Token', TokenSchema);$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "TokenSchema", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/models/Token.js", "pattern": "/^const TokenSchema = new Schema({$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "cleanupExpiredTokens", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/models/Token.js", "pattern": "/^TokenSchema.statics.cleanupExpiredTokens = function() {$/", "language": "JavaScript", "kind": "function", "signature": "()", "scope": "TokenSchema.statics", "scopeKind": "function"}, {"_type": "tag", "name": "findActiveRefreshToken", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/models/Token.js", "pattern": "/^TokenSchema.statics.findActiveRefreshToken = function(userId) {$/", "language": "JavaScript", "kind": "function", "signature": "(userId)", "scope": "TokenSchema.statics", "scopeKind": "function"}, {"_type": "tag", "name": "isActive", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/models/Token.js", "pattern": "/^TokenSchema.methods.isActive = function() {$/", "language": "JavaScript", "kind": "function", "signature": "()", "scope": "TokenSchema.methods", "scopeKind": "function"}, {"_type": "tag", "name": "isExpired", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/models/Token.js", "pattern": "/^TokenSchema.methods.isExpired = function() {$/", "language": "JavaScript", "kind": "function", "signature": "()", "scope": "TokenSchema.methods", "scopeKind": "function"}, {"_type": "tag", "name": "isRevoked", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/models/Token.js", "pattern": "/^TokenSchema.methods.isRevoked = function() {$/", "language": "JavaScript", "kind": "function", "signature": "()", "scope": "TokenSchema.methods", "scopeKind": "function"}, {"_type": "tag", "name": "mongoose", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/models/Token.js", "pattern": "/^const mongoose = require('mongoose');$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "revoke", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/models/Token.js", "pattern": "/^TokenSchema.methods.revoke = function(ip, replacementToken = null) {$/", "language": "JavaScript", "kind": "class", "signature": "(ip, replacementToken = null)", "scope": "TokenSchema.methods", "scopeKind": "class"}], "filename": "/home/kavia/workspace/mock-OTT-API-Claro/src/models/Token.js", "hash": "676e67899e6e05dd8f1377fd323bbc7d", "format-version": 4, "code-base-name": "default", "revision_history": [{"40": ""}]}