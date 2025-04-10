/**
 * Database Initialization Script
 * Initializes the MongoDB database with collections and indexes for the geolocation component
 * 
 * Usage:
 *   - Default (development): node src/scripts/init-db.js
 *   - Specific environment: NODE_ENV=production node src/scripts/init-db.js
 *   - Reset database: node src/scripts/init-db.js --reset
 *   - Seed data after initialization: node src/scripts/init-db.js --seed
 */

const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/database');
const config = require('../config');
const logger = require('../utils/logger');
const { seed } = require('./seed');

// Parse command line arguments
const args = process.argv.slice(2);
const shouldReset = args.includes('--reset');
const shouldSeed = args.includes('--seed');

/**
 * Reset the database by dropping all collections
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
const resetDatabase = async () => {
  try {
    logger.info('Resetting database...');
    
    const collections = await mongoose.connection.db.collections();
    
    for (const collection of collections) {
      await collection.drop();
      logger.info(`Dropped collection: ${collection.collectionName}`);
    }
    
    logger.info('Database reset completed successfully');
    return true;
  } catch (error) {
    logger.error(`Error resetting database: ${error.message}`);
    return false;
  }
};

/**
 * Create collections and indexes for the geolocation component
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
const createCollections = async () => {
  try {
    logger.info('Creating collections and indexes...');
    
    // Define collection schemas
    const Region = require('../models/Region');
    const Country = require('../models/Country');
    const City = require('../models/City');
    const RegionConfig = require('../models/RegionConfig');
    
    // Create indexes (these are already defined in the schema files)
    // This will ensure the indexes are created in the database
    await Region.syncIndexes();
    await Country.syncIndexes();
    await City.syncIndexes();
    await RegionConfig.syncIndexes();
    
    logger.info('Collections and indexes created successfully');
    return true;
  } catch (error) {
    logger.error(`Error creating collections and indexes: ${error.message}`);
    return false;
  }
};

/**
 * Main initialization function
 */
const initializeDatabase = async () => {
  try {
    logger.info(`Starting database initialization (Environment: ${config.env})...`);
    
    // Connect to database
    await connectDB();
    
    // Reset database if requested
    if (shouldReset) {
      const resetSuccess = await resetDatabase();
      if (!resetSuccess) {
        logger.error('Database reset failed');
        await disconnectDB();
        process.exit(1);
      }
    }
    
    // Create collections and indexes
    const createSuccess = await createCollections();
    if (!createSuccess) {
      logger.error('Failed to create collections and indexes');
      await disconnectDB();
      process.exit(1);
    }
    
    // Seed data if requested
    if (shouldSeed) {
      logger.info('Seeding database with initial data...');
      await seed();
    }
    
    logger.info('Database initialization completed successfully!');
    
    // Disconnect from database
    await disconnectDB();
    
    return true;
  } catch (error) {
    logger.error(`Error initializing database: ${error.message}`);
    
    // Disconnect from database
    await disconnectDB();
    
    process.exit(1);
  }
};

// Run the initialization function if this script is executed directly
if (require.main === module) {
  initializeDatabase()
    .then((success) => {
      if (!success) {
        process.exit(1);
      }
    })
    .catch((error) => {
      logger.error(`Unhandled error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };
