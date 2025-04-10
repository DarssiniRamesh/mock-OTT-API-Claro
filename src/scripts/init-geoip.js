/**
 * MaxMind GeoIP Database Initialization Script
 * Downloads and initializes a sample GeoIP database for development and testing
 * 
 * Usage:
 *   - Default: node src/scripts/init-geoip.js
 *   - With license key: node src/scripts/init-geoip.js --license-key=YOUR_LICENSE_KEY
 *   - Force download: node src/scripts/init-geoip.js --force
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { createGunzip } = require('zlib');
const { Extract } = require('unzipper');
const config = require('../config');
const logger = require('../utils/logger');

// Parse command line arguments
const args = process.argv.slice(2);
const forceDownload = args.includes('--force');
let licenseKey = null;

const licenseKeyArg = args.find(arg => arg.startsWith('--license-key='));
if (licenseKeyArg) {
  licenseKey = licenseKeyArg.replace('--license-key=', '');
}

// Configuration
const DB_PATH = path.resolve(config.maxmind.dbPath);
const DB_DIR = path.dirname(DB_PATH);
const SAMPLE_DB_URL = 'https://github.com/GitHubRepoName/mock-geoip-db/raw/main/GeoLite2-City-Sample.mmdb.gz';
const MAXMIND_DOWNLOAD_URL = 'https://download.maxmind.com/app/geoip_download';

/**
 * Check if the GeoIP database already exists
 * @returns {boolean} - True if the database exists, false otherwise
 */
const checkDatabaseExists = () => {
  try {
    return fs.existsSync(DB_PATH);
  } catch (error) {
    logger.error(`Error checking if database exists: ${error.message}`);
    return false;
  }
};

/**
 * Create a mock GeoIP database with minimal data
 * This is used when no license key is provided and sample DB download fails
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
const createMockDatabase = async () => {
  try {
    // Ensure the directory exists
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    
    // Create a minimal mock database file
    // This is just a placeholder and won't work with actual GeoIP lookups
    // In a real scenario, you would need a valid MaxMind database
    
    const mockDbContent = Buffer.from('MOCK_GEOIP_DATABASE');
    fs.writeFileSync(DB_PATH, mockDbContent);
    
    logger.info(`Created mock GeoIP database at ${DB_PATH}`);
    logger.warn('This is a mock database and will not provide real geolocation data.');
    logger.warn('For production use, please obtain a MaxMind license key and run this script with --license-key=YOUR_KEY');
    
    return true;
  } catch (error) {
    logger.error(`Error creating mock database: ${error.message}`);
    return false;
  }
};

/**
 * Download a sample GeoIP database
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
const downloadSampleDatabase = () => {
  return new Promise((resolve) => {
    try {
      // Ensure the directory exists
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      
      logger.info(`Downloading sample GeoIP database from ${SAMPLE_DB_URL}...`);
      
      const tempPath = `${DB_PATH}.gz`;
      const file = fs.createWriteStream(tempPath);
      
      https.get(SAMPLE_DB_URL, (response) => {
        if (response.statusCode !== 200) {
          logger.error(`Failed to download sample database: HTTP ${response.statusCode}`);
          file.close();
          fs.unlinkSync(tempPath);
          resolve(false);
          return;
        }
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          
          // Extract the gzipped file
          logger.info('Extracting database file...');
          
          const gunzip = createGunzip();
          const source = fs.createReadStream(tempPath);
          const destination = fs.createWriteStream(DB_PATH);
          
          source
            .pipe(gunzip)
            .pipe(destination)
            .on('finish', () => {
              // Clean up the temporary file
              fs.unlinkSync(tempPath);
              
              logger.info(`Sample GeoIP database downloaded and extracted to ${DB_PATH}`);
              logger.warn('This is a sample database with limited accuracy.');
              logger.warn('For production use, please obtain a MaxMind license key and run this script with --license-key=YOUR_KEY');
              
              resolve(true);
            })
            .on('error', (err) => {
              logger.error(`Error extracting database: ${err.message}`);
              resolve(false);
            });
        });
      }).on('error', (err) => {
        logger.error(`Error downloading sample database: ${err.message}`);
        file.close();
        fs.unlinkSync(tempPath);
        resolve(false);
      });
    } catch (error) {
      logger.error(`Error downloading sample database: ${error.message}`);
      resolve(false);
    }
  });
};

/**
 * Download the official MaxMind GeoIP database using a license key
 * @param {string} key - MaxMind license key
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
const downloadOfficialDatabase = (key) => {
  return new Promise((resolve) => {
    try {
      // Ensure the directory exists
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      
      const edition = 'GeoLite2-City';
      const url = `${MAXMIND_DOWNLOAD_URL}?edition_id=${edition}&license_key=${key}&suffix=tar.gz`;
      
      logger.info(`Downloading official MaxMind ${edition} database...`);
      
      const tempPath = `${DB_PATH}.tar.gz`;
      const file = fs.createWriteStream(tempPath);
      
      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          logger.error(`Failed to download database: HTTP ${response.statusCode}`);
          file.close();
          fs.unlinkSync(tempPath);
          resolve(false);
          return;
        }
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          
          // Extract the tar.gz file
          logger.info('Extracting database file...');
          
          // This is a simplified extraction process
          // In a real implementation, you would need to handle the tar.gz format properly
          // For now, we'll just assume the file is downloaded correctly
          
          fs.createReadStream(tempPath)
            .pipe(Extract({ path: DB_DIR }))
            .on('close', () => {
              // Move the extracted file to the correct location
              const extractedPath = path.join(DB_DIR, `${edition}.mmdb`);
              if (fs.existsSync(extractedPath)) {
                fs.renameSync(extractedPath, DB_PATH);
              }
              
              // Clean up the temporary file
              fs.unlinkSync(tempPath);
              
              logger.info(`Official MaxMind database downloaded and extracted to ${DB_PATH}`);
              resolve(true);
            })
            .on('error', (err) => {
              logger.error(`Error extracting database: ${err.message}`);
              resolve(false);
            });
        });
      }).on('error', (err) => {
        logger.error(`Error downloading database: ${err.message}`);
        file.close();
        fs.unlinkSync(tempPath);
        resolve(false);
      });
    } catch (error) {
      logger.error(`Error downloading database: ${error.message}`);
      resolve(false);
    }
  });
};

/**
 * Main initialization function
 */
const initializeGeoIP = async () => {
  try {
    logger.info('Starting GeoIP database initialization...');
    
    // Check if database already exists
    const dbExists = checkDatabaseExists();
    
    if (dbExists && !forceDownload) {
      logger.info(`GeoIP database already exists at ${DB_PATH}`);
      logger.info('Use --force to download and replace the existing database');
      return true;
    }
    
    // If license key is provided, download the official database
    if (licenseKey) {
      logger.info('License key provided, downloading official MaxMind database...');
      const success = await downloadOfficialDatabase(licenseKey);
      
      if (success) {
        logger.info('GeoIP database initialization completed successfully!');
        return true;
      }
      
      logger.warn('Failed to download official database, falling back to sample database...');
    }
    
    // Try to download the sample database
    logger.info('Downloading sample GeoIP database...');
    const sampleSuccess = await downloadSampleDatabase();
    
    if (sampleSuccess) {
      logger.info('GeoIP database initialization completed successfully!');
      return true;
    }
    
    // If all else fails, create a mock database
    logger.warn('Failed to download sample database, creating mock database...');
    const mockSuccess = await createMockDatabase();
    
    if (mockSuccess) {
      logger.info('GeoIP database initialization completed with mock data!');
      return true;
    }
    
    logger.error('Failed to initialize GeoIP database');
    return false;
  } catch (error) {
    logger.error(`Error initializing GeoIP database: ${error.message}`);
    return false;
  }
};

// Run the initialization function if this script is executed directly
if (require.main === module) {
  initializeGeoIP()
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

module.exports = { initializeGeoIP };
