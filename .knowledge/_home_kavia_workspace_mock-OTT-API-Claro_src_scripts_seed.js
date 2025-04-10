{"is_source_file": true, "format": "JavaScript", "description": "A database seeding script for populating mock data related to regions, countries, cities, configurations, and IP ranges into a MongoDB database.", "external_files": ["../config/database", "../config", "../utils/logger", "../models/Region", "../models/Country", "../models/City", "../models/RegionConfig"], "external_methods": ["connectDB", "disconnectDB", "Region.findOne", "Region.create", "Country.findOne", "Country.create", "City.findOne", "City.create", "RegionConfig.findOne", "RegionConfig.create", "fs.readFileSync", "fs.writeFile"], "published": ["seed"], "classes": [], "methods": [{"name": "seed", "description": "Main function to orchestrate database seeding process by clearing existing data, seeding regions, countries, cities, region configs, and IP ranges."}, {"name": "createGeoIPDir", "description": "Creates a directory for the GeoIP database if it does not already exist."}, {"name": "loadData", "description": "Loads and parses JSON data from a specified file."}, {"name": "clearCollection", "description": "Clears all data from a given Mongoose model collection."}, {"name": "seedRegions", "description": "Seeds the regions data into the database."}, {"name": "seedCountries", "description": "Seeds the countries data into the database based on provided regions."}, {"name": "seedCities", "description": "Seeds the cities data into the database based on provided countries."}, {"name": "seedIPRanges", "description": "Seeds IP ranges data for geolocation testing."}, {"name": "seedRegionConfigs", "description": "Seeds region configuration data into the database."}], "calls": ["path.join", "fs.mkdir", "fs.readFileSync", "fs.writeFile", "logger.info", "logger.error", "logger.warn"], "search-terms": ["database", "seeding", "mock data", "regions", "countries", "cities", "configs", "ipranges"], "state": 2, "file_id": 37, "knowledge_revision": 104, "git_revision": "ac58a19ac97b17e17f7ec7f36cc5d754176ac616", "revision_history": [{"83": "ac58a19ac97b17e17f7ec7f36cc5d754176ac616"}, {"104": "ac58a19ac97b17e17f7ec7f36cc5d754176ac616"}], "ctags": [{"_type": "tag", "name": "City", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^const City = require('..\\/models\\/City');$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "Country", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^const Country = require('..\\/models\\/Country');$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "DEFAULT_DATA_DIR", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^const DEFAULT_DATA_DIR = path.join(__dirname, '..\\/data');$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "Region", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^const Region = require('..\\/models\\/Region');$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "RegionConfig", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^const RegionConfig = require('..\\/models\\/RegionConfig');$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "args", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^const args = process.argv.slice(2);$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "cities", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^    const cities = await seedCities(countries);$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "cities", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^    const cities = loadData('cities.json');$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "cityData", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^      const cityData = { ...city, country: countryMap[countryCode] };$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "clearCollection", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^const clearCollection = async (model, name) => {$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "code", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^            code: country.region ? country.region.code : null,$/", "language": "JavaScript", "kind": "property", "scope": "mockDbData.continent", "scopeKind": "class"}, {"_type": "tag", "name": "config", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^const config = require('..\\/config');$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "configData2", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^      const configData2 = { $/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "configs", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^    const configs = await seedRegionConfigs(regions);$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "configs", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^    const configs = loadData('region-configs.json');$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "continent", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^          continent: {$/", "language": "JavaScript", "kind": "class", "scope": "mockDbData", "scopeKind": "class"}, {"_type": "tag", "name": "countries", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^    const countries = await seedCountries(regions);$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "countries", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^    const countries = loadData('countries.json');$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "country", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^          country: {$/", "language": "JavaScript", "kind": "class", "scope": "mockDbData", "scopeKind": "class"}, {"_type": "tag", "name": "country", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^      const country = await Country.findOne({ code: countryCode });$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "countryCode", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^      const countryCode = countryRange.countryCode;$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "countryData", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^      const countryData = { ...country, region: regionMap[regionCode] };$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "countryMap", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^    const countryMap = {};$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "createGeoIPDir", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^const createGeoIPDir = async () => {$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "createdCities", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^    const createdCities = [];$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "createdConfigs", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^    const createdConfigs = [];$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "createdCountries", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^    const createdCountries = [];$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "createdRegions", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^    const createdRegions = [];$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "data", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^    const data = fs.readFileSync(filePath, 'utf8');$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "dbPath", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^    const dbPath = path.join(__dirname, '..\\/..\\/data');$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "en", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^            names: { en: country.name }$/", "language": "JavaScript", "kind": "property", "scope": "mockDbData.country.names", "scopeKind": "class"}, {"_type": "tag", "name": "en", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^            names: { en: country.region ? country.region.name : null }$/", "language": "JavaScript", "kind": "property", "scope": "mockDbData.continent.names", "scopeKind": "class"}, {"_type": "tag", "name": "existingCity", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^      const existingCity = await City.findOne({ $/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "existingConfig", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^      const existingConfig = await RegionConfig.findOne({ $/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "existingCountry", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^      const existingCountry = await Country.findOne({ $or: [{ name }, { code }] });$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "existingRegion", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^      const existingRegion = await Region.findOne({ $or: [{ name }, { code }] });$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "filePath", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^    const filePath = path.join(DEFAULT_DATA_DIR, filename);$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "fs", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^const fs = require('fs').promises;$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "fs", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^const fs = require('fs');$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "ipRanges", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^    const ipRanges = await seedIPRanges();$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "ipRanges", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^    const ipRanges = loadData('ip-ranges.json');$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "iso_code", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^            iso_code: country.code,$/", "language": "JavaScript", "kind": "property", "scope": "mockDbData.country", "scopeKind": "class"}, {"_type": "tag", "name": "latitude", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^            latitude: 0,$/", "language": "JavaScript", "kind": "property", "scope": "mockDbData.location", "scopeKind": "class"}, {"_type": "tag", "name": "loadData", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^const loadData = (filename) => {$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "location", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^          location: {$/", "language": "JavaScript", "kind": "class", "scope": "mockDbData", "scopeKind": "class"}, {"_type": "tag", "name": "logger", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^const logger = require('..\\/utils\\/logger');$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "longitude", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^            longitude: 0,$/", "language": "JavaScript", "kind": "property", "scope": "mockDbData.location", "scopeKind": "class"}, {"_type": "tag", "name": "mockDbData", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^        mockDbData[sampleIP] = {$/", "language": "JavaScript", "kind": "class"}, {"_type": "tag", "name": "mockDbData", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^    const mockDbData = {};$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "mockDbPath", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^        const mockDbPath = path.join(__dirname, '..\\/..\\/data\\/GeoLite2-City.mmdb');$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "mockDbPath", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^    const mockDbPath = path.join(__dirname, '..\\/..\\/data\\/GeoLite2-City.mmdb');$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "mongoose", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^const mongoose = require('mongoose');$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "names", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^            names: { en: country.name }$/", "language": "JavaScript", "kind": "class", "scope": "mockDbData.country", "scopeKind": "class"}, {"_type": "tag", "name": "names", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^            names: { en: country.region ? country.region.name : null }$/", "language": "JavaScript", "kind": "class", "scope": "mockDbData.continent", "scopeKind": "class"}, {"_type": "tag", "name": "newCity", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^        const newCity = await City.create(cityData);$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "newConfig", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^        const newConfig = await RegionConfig.create(configData2);$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "newCountry", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^        const newCountry = await Country.create(countryData);$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "newRegion", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^        const newRegion = await Region.create(region);$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "onlyArg", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^const onlyArg = args.find(arg => arg.startsWith('--only='));$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "onlyTypes", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^let onlyTypes = [];$/", "language": "JavaScript", "kind": "variable"}, {"_type": "tag", "name": "path", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^const path = require('path');$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "regionMap", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^    const regionMap = {};$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "regions", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^    const regions = await seedRegions();$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "regions", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^    const regions = loadData('regions.json');$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "seed", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^const seed = async () => {$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "seed", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^module.exports = { seed };$/", "language": "JavaScript", "kind": "field", "scope": "module.exports", "scopeKind": "class"}, {"_type": "tag", "name": "seedCities", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^const seedCities = async (countries) => {$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "seedCountries", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^const seedCountries = async (regions) => {$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "seedIPRanges", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^const seedIPRanges = async () => {$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "seedRegionConfigs", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^const seedRegionConfigs = async (regions) => {$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "seedRegions", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^const seedRegions = async () => {$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "shouldClearData", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^const shouldClearData = args.includes('--clear');$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "time_zone", "path": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "pattern": "/^            time_zone: country.timezone$/", "language": "JavaScript", "kind": "property", "scope": "mockDbData.location", "scopeKind": "class"}], "filename": "/home/kavia/workspace/mock-OTT-API-Claro/src/scripts/seed.js", "hash": "c6dd9e4ce15004091029176123750b97", "format-version": 4, "code-base-name": "default", "fields": [{"name": "code: country.region ? country.region.code : null,", "scope": "mockDbData.continent", "scopeKind": "class", "description": "unavailable"}, {"name": "names: { en: country.name }", "scope": "mockDbData.country.names", "scopeKind": "class", "description": "unavailable"}, {"name": "names: { en: country.region ? country.region.name : null }", "scope": "mockDbData.continent.names", "scopeKind": "class", "description": "unavailable"}, {"name": "iso_code: country.code,", "scope": "mockDbData.country", "scopeKind": "class", "description": "unavailable"}, {"name": "latitude: 0,", "scope": "mockDbData.location", "scopeKind": "class", "description": "unavailable"}, {"name": "longitude: 0,", "scope": "mockDbData.location", "scopeKind": "class", "description": "unavailable"}, {"name": "let onlyTypes = [];", "scope": "", "scopeKind": "", "description": "unavailable"}, {"name": "module.exports = { seed };", "scope": "module.exports", "scopeKind": "class", "description": "unavailable"}, {"name": "time_zone: country.timezone", "scope": "mockDbData.location", "scopeKind": "class", "description": "unavailable"}]}