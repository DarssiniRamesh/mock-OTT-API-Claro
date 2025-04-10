const mongoose = require('mongoose');
const config = require('./index');
const logger = require('../utils/logger');

// Connection options with connection pooling settings
const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // Connection pool settings
  poolSize: 10,
  // Connection timeout settings
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  // Keep alive settings
  keepAlive: true,
  keepAliveInitialDelay: 300000,
  // Retry settings
  serverSelectionTimeoutMS: 5000,
  heartbeatFrequencyMS: 10000,
};

// Track connection state
let isConnected = false;
let retryCount = 0;
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000; // 5 seconds

/**
 * Connect to MongoDB database with retry logic
 */
const connectDB = async () => {
  if (isConnected) {
    logger.info('MongoDB is already connected');
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(config.mongodbUri, connectionOptions);
    
    // Set up connection event listeners
    mongoose.connection.on('connected', () => {
      isConnected = true;
      retryCount = 0;
      logger.info(`MongoDB Connected: ${conn.connection.host}`);
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('MongoDB disconnected');
      
      // Attempt to reconnect if not shutting down
      if (!process.env.IS_SERVER_SHUTTING_DOWN) {
        retryConnection();
      }
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    isConnected = true;
    return conn;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    isConnected = false;
    
    // Retry connection if not at max retries
    if (retryCount < MAX_RETRIES) {
      return retryConnection();
    } else {
      logger.error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts`);
      process.exit(1);
    }
  }
};

/**
 * Retry connection to MongoDB database
 */
const retryConnection = async () => {
  retryCount++;
  logger.info(`Retrying MongoDB connection (${retryCount}/${MAX_RETRIES}) in ${RETRY_INTERVAL}ms...`);
  
  return new Promise((resolve) => {
    setTimeout(async () => {
      try {
        const conn = await mongoose.connect(config.mongodbUri, connectionOptions);
        isConnected = true;
        logger.info(`MongoDB reconnected: ${conn.connection.host}`);
        resolve(conn);
      } catch (error) {
        logger.error(`Error reconnecting to MongoDB: ${error.message}`);
        isConnected = false;
        
        if (retryCount < MAX_RETRIES) {
          resolve(retryConnection());
        } else {
          logger.error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts`);
          process.exit(1);
        }
      }
    }, RETRY_INTERVAL);
  });
};

/**
 * Disconnect from MongoDB database
 */
const disconnectDB = async () => {
  if (!isConnected) {
    logger.info('MongoDB is already disconnected');
    return;
  }

  try {
    process.env.IS_SERVER_SHUTTING_DOWN = true;
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB Disconnected');
  } catch (error) {
    logger.error(`Error disconnecting from MongoDB: ${error.message}`);
  }
};

/**
 * Get MongoDB connection status
 */
const getConnectionStatus = () => {
  return {
    isConnected,
    host: isConnected ? mongoose.connection.host : null,
    name: isConnected ? mongoose.connection.name : null,
    readyState: mongoose.connection.readyState,
  };
};

module.exports = {
  connectDB,
  disconnectDB,
  getConnectionStatus,
};
