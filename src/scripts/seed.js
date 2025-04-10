/**
 * Database Seed Script
 * Populates the database with initial mock data for regions, countries, cities, and configurations
 * 
 * Usage:
 *   - Default (development): node src/scripts/seed.js
 *   - Specific environment: NODE_ENV=production node src/scripts/seed.js
 *   - Clear existing data: node src/scripts/seed.js --clear
 *   - Specific data type: node src/scripts/seed.js --only=regions,countries
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/database');
const config = require('../config');
const logger = require('../utils/logger');

// Import models
const Region = require('../models/Region');
const Country = require('../models/Country');
const City = require('../models/City');
const RegionConfig = require('../models/RegionConfig');

// Configuration
const DEFAULT_DATA_DIR = path.join(__dirname, '../data');

// Parse command line arguments
const args = process.argv.slice(2);
const shouldClearData = args.includes('--clear');
let onlyTypes = [];

const onlyArg = args.find(arg => arg.startsWith('--only='));
if (onlyArg) {
  onlyTypes = onlyArg.replace('--only=', '').split(',');
}

/**
 * Load JSON data from file
 * @param {string} filename - The name of the JSON file
 * @returns {Array|Object} - The parsed JSON data
 */
const loadData = (filename) => {
  try {
    const filePath = path.join(DEFAULT_DATA_DIR, filename);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    logger.error(`Error loading data from ${filename}: ${error.message}`);
    return [];
  }
};

/**
 * Clear all data from a collection
 * @param {Model} model - The Mongoose model
 * @param {string} name - The name of the collection (for logging)
 */
const clearCollection = async (model, name) => {
  try {
    await model.deleteMany({});
    logger.info(`Cleared ${name} collection`);
  } catch (error) {
    logger.error(`Error clearing ${name} collection: ${error.message}`);
  }
};

/**
 * Seed regions data
 */
const seedRegions = async () => {
  if (onlyTypes.length > 0 && !onlyTypes.includes('regions')) {
    logger.info('Skipping regions seeding');
    return [];
  }

  try {
    const regions = loadData('regions.json');
    if (!regions.length) {
      logger.warn('No regions data found');
      return [];
    }

    logger.info(`Seeding ${regions.length} regions...`);
    
    // Use insertMany with ordered: false to continue on error
    // and use upsert to prevent duplicates
    const createdRegions = [];
    
    for (const region of regions) {
      const { name, code } = region;
      const existingRegion = await Region.findOne({ $or: [{ name }, { code }] });
      
      if (existingRegion) {
        // Update existing region
        Object.assign(existingRegion, region);
        await existingRegion.save();
        createdRegions.push(existingRegion);
        logger.info(`Updated region: ${name} (${code})`);
      } else {
        // Create new region
        const newRegion = await Region.create(region);
        createdRegions.push(newRegion);
        logger.info(`Created region: ${name} (${code})`);
      }
    }
    
    logger.info(`Successfully seeded ${createdRegions.length} regions`);
    return createdRegions;
  } catch (error) {
    logger.error(`Error seeding regions: ${error.message}`);
    return [];
  }
};

/**
 * Seed countries data
 * @param {Array} regions - The seeded regions
 */
const seedCountries = async (regions) => {
  if (onlyTypes.length > 0 && !onlyTypes.includes('countries')) {
    logger.info('Skipping countries seeding');
    return [];
  }

  try {
    const countries = loadData('countries.json');
    if (!countries.length) {
      logger.warn('No countries data found');
      return [];
    }

    logger.info(`Seeding ${countries.length} countries...`);
    
    // Create a map of region codes to region IDs
    const regionMap = {};
    regions.forEach(region => {
      regionMap[region.code] = region._id;
    });
    
    const createdCountries = [];
    
    for (const country of countries) {
      const { name, code, regionCode } = country;
      
      // Skip if region doesn't exist
      if (!regionMap[regionCode]) {
        logger.warn(`Skipping country ${name} (${code}): Region ${regionCode} not found`);
        continue;
      }
      
      // Set region reference
      const countryData = { ...country, region: regionMap[regionCode] };
      delete countryData.regionCode; // Remove regionCode as it's not in the schema
      
      const existingCountry = await Country.findOne({ $or: [{ name }, { code }] });
      
      if (existingCountry) {
        // Update existing country
        Object.assign(existingCountry, countryData);
        await existingCountry.save();
        createdCountries.push(existingCountry);
        logger.info(`Updated country: ${name} (${code})`);
      } else {
        // Create new country
        const newCountry = await Country.create(countryData);
        createdCountries.push(newCountry);
        logger.info(`Created country: ${name} (${code})`);
      }
    }
    
    logger.info(`Successfully seeded ${createdCountries.length} countries`);
    return createdCountries;
  } catch (error) {
    logger.error(`Error seeding countries: ${error.message}`);
    return [];
  }
};

/**
 * Seed cities data
 * @param {Array} countries - The seeded countries
 */
const seedCities = async (countries) => {
  if (onlyTypes.length > 0 && !onlyTypes.includes('cities')) {
    logger.info('Skipping cities seeding');
    return [];
  }

  try {
    const cities = loadData('cities.json');
    if (!cities.length) {
      logger.warn('No cities data found');
      return [];
    }

    logger.info(`Seeding ${cities.length} cities...`);
    
    // Create a map of country codes to country IDs
    const countryMap = {};
    countries.forEach(country => {
      countryMap[country.code] = country._id;
    });
    
    const createdCities = [];
    
    for (const city of cities) {
      const { name, countryCode } = city;
      
      // Skip if country doesn't exist
      if (!countryMap[countryCode]) {
        logger.warn(`Skipping city ${name}: Country ${countryCode} not found`);
        continue;
      }
      
      // Set country reference
      const cityData = { ...city, country: countryMap[countryCode] };
      delete cityData.countryCode; // Remove countryCode as it's not in the schema
      
      const existingCity = await City.findOne({ 
        name, 
        country: countryMap[countryCode] 
      });
      
      if (existingCity) {
        // Update existing city
        Object.assign(existingCity, cityData);
        await existingCity.save();
        createdCities.push(existingCity);
        logger.info(`Updated city: ${name} (${countryCode})`);
      } else {
        // Create new city
        const newCity = await City.create(cityData);
        createdCities.push(newCity);
        logger.info(`Created city: ${name} (${countryCode})`);
      }
    }
    
    logger.info(`Successfully seeded ${createdCities.length} cities`);
    return createdCities;
  } catch (error) {
    logger.error(`Error seeding cities: ${error.message}`);
    return [];
  }
};

/**
 * Seed region configurations data
 * @param {Array} regions - The seeded regions
 */
const seedRegionConfigs = async (regions) => {
  if (onlyTypes.length > 0 && !onlyTypes.includes('configs')) {
    logger.info('Skipping region configs seeding');
    return [];
  }

  try {
    const configs = loadData('region-configs.json');
    if (!configs.length) {
      logger.warn('No region configs data found');
      return [];
    }

    logger.info(`Seeding ${configs.length} region configs...`);
    
    // Create a map of region codes to region IDs
    const regionMap = {};
    regions.forEach(region => {
      regionMap[region.code] = region._id;
    });
    
    const createdConfigs = [];
    
    for (const config of configs) {
      const { regionCode, configType, configData } = config;
      
      // Skip if region doesn't exist
      if (!regionMap[regionCode]) {
        logger.warn(`Skipping config for region ${regionCode}: Region not found`);
        continue;
      }
      
      // Set region reference
      const configData2 = { 
        ...config, 
        region: regionMap[regionCode],
        configData: config.configData
      };
      delete configData2.regionCode; // Remove regionCode as it's not in the schema
      
      const existingConfig = await RegionConfig.findOne({ 
        region: regionMap[regionCode],
        configType
      });
      
      if (existingConfig) {
        // Update existing config
        Object.assign(existingConfig, configData2);
        await existingConfig.save();
        createdConfigs.push(existingConfig);
        logger.info(`Updated region config: ${regionCode} - ${configType}`);
      } else {
        // Create new config
        const newConfig = await RegionConfig.create(configData2);
        createdConfigs.push(newConfig);
        logger.info(`Created region config: ${regionCode} - ${configType}`);
      }
    }
    
    logger.info(`Successfully seeded ${createdConfigs.length} region configs`);
    return createdConfigs;
  } catch (error) {
    logger.error(`Error seeding region configs: ${error.message}`);
    return [];
  }
};

/**
 * Main seed function
 */
const seed = async () => {
  try {
    logger.info(`Starting database seeding (Environment: ${config.env})...`);
    
    // Connect to database
    await connectDB();
    
    // Clear existing data if requested
    if (shouldClearData) {
      logger.info('Clearing existing data...');
      
      if (onlyTypes.length === 0 || onlyTypes.includes('configs')) {
        await clearCollection(RegionConfig, 'region configs');
      }
      
      if (onlyTypes.length === 0 || onlyTypes.includes('cities')) {
        await clearCollection(City, 'cities');
      }
      
      if (onlyTypes.length === 0 || onlyTypes.includes('countries')) {
        await clearCollection(Country, 'countries');
      }
      
      if (onlyTypes.length === 0 || onlyTypes.includes('regions')) {
        await clearCollection(Region, 'regions');
      }
    }
    
    // Seed data in order of dependencies
    const regions = await seedRegions();
    const countries = await seedCountries(regions);
    const cities = await seedCities(countries);
    const configs = await seedRegionConfigs(regions);
    
    // Log summary
    logger.info('Database seeding completed successfully!');
    logger.info(`Seeded ${regions.length} regions, ${countries.length} countries, ${cities.length} cities, and ${configs.length} region configs`);
    
    // Disconnect from database
    await disconnectDB();
    
    return { regions, countries, cities, configs };
  } catch (error) {
    logger.error(`Error seeding database: ${error.message}`);
    
    // Disconnect from database
    await disconnectDB();
    
    process.exit(1);
  }
};

// Run the seed function if this script is executed directly
if (require.main === module) {
  seed();
}

module.exports = { seed };
