const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/geolocation',
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret',
    expiresIn: process.env.JWT_EXPIRATION || '1h',
  },
  maxmind: {
    dbPath: process.env.MAXMIND_DB_PATH || './data/GeoLite2-City.mmdb',
  },
  logLevel: process.env.LOG_LEVEL || 'info',
};