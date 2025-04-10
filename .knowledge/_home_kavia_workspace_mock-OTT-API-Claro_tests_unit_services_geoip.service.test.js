{"is_source_file": true, "format": "JavaScript", "description": "Unit tests for GeoIP Service, testing the initialization and location retrieval by IP address functionality.", "external_files": ["../../../src/services/geoip.service", "../../../src/utils/geoip.utils", "../../../src/utils/logger", "../../../src/config"], "external_methods": ["geoipService.initialize", "geoipService.getLocationByIp", "geoipUtils.isValidIpAddress", "geoipUtils.normalizeIpAddress", "logger.info", "logger.warn", "logger.error", "logger.debug"], "published": [], "classes": [], "methods": [{"name": "AnonymousFunctione07d79b70100(event, callback)", "scope": "", "scopeKind": "", "description": "unavailable"}, {"name": "AnonymousFunctione07d79b70200(event, callback)", "scope": "", "scopeKind": "", "description": "unavailable"}, {"name": "AnonymousFunctione07d79b70300(event, callback)", "scope": "", "scopeKind": "", "description": "unavailable"}, {"name": "AnonymousFunctione07d79b70400(event, callback)", "scope": "", "scopeKind": "", "description": "unavailable"}], "calls": ["fs.existsSync", "maxmind.Reader.open", "path.resolve", "geoipUtils.isValidIpAddress", "geoipUtils.normalizeIpAddress", "geoipService.getCountryByIp", "geoipService.getRegionByIp", "geoipService.getCityByIp", "geoipService.getCoordinatesByIp", "geoipService.updateDatabase"], "search-terms": ["geoipService", "initialize", "getLocationByIp", "mockLocationData", "updateDatabase"], "state": 2, "file_id": 38, "knowledge_revision": 118, "git_revision": "c03bbe887c17f3148f5f2942263e4e462d4bf34b", "revision_history": [{"85": ""}, {"86": ""}, {"87": ""}, {"88": ""}, {"89": ""}, {"90": ""}, {"91": ""}, {"92": ""}, {"93": ""}, {"94": ""}, {"95": ""}, {"96": ""}, {"97": ""}, {"109": "c03bbe887c17f3148f5f2942263e4e462d4bf34b"}, {"110": "c03bbe887c17f3148f5f2942263e4e462d4bf34b"}, {"111": "c03bbe887c17f3148f5f2942263e4e462d4bf34b"}, {"112": "c03bbe887c17f3148f5f2942263e4e462d4bf34b"}, {"113": "c03bbe887c17f3148f5f2942263e4e462d4bf34b"}, {"114": "c03bbe887c17f3148f5f2942263e4e462d4bf34b"}, {"115": "c03bbe887c17f3148f5f2942263e4e462d4bf34b"}, {"116": "c03bbe887c17f3148f5f2942263e4e462d4bf34b"}, {"117": "c03bbe887c17f3148f5f2942263e4e462d4bf34b"}, {"118": "c03bbe887c17f3148f5f2942263e4e462d4bf34b"}], "ctags": [{"_type": "tag", "name": "AnonymousFunctione07d79b70100", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^        on: jest.fn().mockImplementation(function(event, callback) {$/", "language": "JavaScript", "kind": "function", "signature": "(event, callback)"}, {"_type": "tag", "name": "AnonymousFunctione07d79b70200", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^          on: jest.fn().mockImplementation(function(event, callback) {$/", "language": "JavaScript", "kind": "function", "signature": "(event, callback)"}, {"_type": "tag", "name": "AnonymousFunctione07d79b70300", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^          on: jest.fn().mockImplementation(function(event, callback) {$/", "language": "JavaScript", "kind": "function", "signature": "(event, callback)"}, {"_type": "tag", "name": "AnonymousFunctione07d79b70400", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^          on: jest.fn().mockImplementation(function(event, callback) {$/", "language": "JavaScript", "kind": "function", "signature": "(event, callback)"}, {"_type": "tag", "name": "accuracy_radius", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^    accuracy_radius: 10,$/", "language": "JavaScript", "kind": "property", "scope": "mockLocationData.location", "scopeKind": "class"}, {"_type": "tag", "name": "accuracy_radius", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^    accuracy_radius: 10,$/", "language": "JavaScript", "kind": "property", "scope": "processedLocationData.location", "scopeKind": "class"}, {"_type": "tag", "name": "city", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^  city: { name: 'San Francisco' },$/", "language": "JavaScript", "kind": "class", "scope": "processedLocationData", "scopeKind": "class"}, {"_type": "tag", "name": "city", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^  city: { names: { en: 'San Francisco' } },$/", "language": "JavaScript", "kind": "class", "scope": "mockLocationData", "scopeKind": "class"}, {"_type": "tag", "name": "code", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^  continent: { code: 'NA', name: 'North America' },$/", "language": "JavaScript", "kind": "property", "scope": "processedLocationData.continent", "scopeKind": "class"}, {"_type": "tag", "name": "code", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^  continent: { code: 'NA', names: { en: 'North America' } },$/", "language": "JavaScript", "kind": "property", "scope": "mockLocationData.continent", "scopeKind": "class"}, {"_type": "tag", "name": "code", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^  country: { code: 'US', name: 'United States' },$/", "language": "JavaScript", "kind": "property", "scope": "processedLocationData.country", "scopeKind": "class"}, {"_type": "tag", "name": "code", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^  postal: { code: '94105' },$/", "language": "JavaScript", "kind": "property", "scope": "mockLocationData.postal", "scopeKind": "class"}, {"_type": "tag", "name": "code", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^  postal: { code: '94105' },$/", "language": "JavaScript", "kind": "property", "scope": "processedLocationData.postal", "scopeKind": "class"}, {"_type": "tag", "name": "code", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^  region: { code: 'CA', name: 'California' },$/", "language": "JavaScript", "kind": "property", "scope": "processedLocationData.region", "scopeKind": "class"}, {"_type": "tag", "name": "config", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^const config = require('..\\/..\\/..\\/src\\/config');$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "continent", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^  continent: { code: 'NA', name: 'North America' },$/", "language": "JavaScript", "kind": "class", "scope": "processedLocationData", "scopeKind": "class"}, {"_type": "tag", "name": "continent", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^  continent: { code: 'NA', names: { en: 'North America' } },$/", "language": "JavaScript", "kind": "class", "scope": "mockLocationData", "scopeKind": "class"}, {"_type": "tag", "name": "country", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^  country: { code: 'US', name: 'United States' },$/", "language": "JavaScript", "kind": "class", "scope": "processedLocationData", "scopeKind": "class"}, {"_type": "tag", "name": "country", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^  country: { iso_code: 'US', names: { en: 'United States' } },$/", "language": "JavaScript", "kind": "class", "scope": "mockLocationData", "scopeKind": "class"}, {"_type": "tag", "name": "en", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^  city: { names: { en: 'San Francisco' } },$/", "language": "JavaScript", "kind": "property", "scope": "mockLocationData.city.names", "scopeKind": "class"}, {"_type": "tag", "name": "en", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^  continent: { code: 'NA', names: { en: 'North America' } },$/", "language": "JavaScript", "kind": "property", "scope": "mockLocationData.continent.names", "scopeKind": "class"}, {"_type": "tag", "name": "en", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^  country: { iso_code: 'US', names: { en: 'United States' } },$/", "language": "JavaScript", "kind": "property", "scope": "mockLocationData.country.names", "scopeKind": "class"}, {"_type": "tag", "name": "fs", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^const fs = require('fs');$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "geoipService", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^const geoipService = require('..\\/..\\/..\\/src\\/services\\/geoip.service');$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "geoipUtils", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^const geoipUtils = require('..\\/..\\/..\\/src\\/utils\\/geoip.utils');$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "https", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^const https = require('https');$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "ip", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^  ip: '192.168.1.1',$/", "language": "JavaScript", "kind": "property", "scope": "processedLocationData", "scopeKind": "class"}, {"_type": "tag", "name": "iso_code", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^  country: { iso_code: 'US', names: { en: 'United States' } },$/", "language": "JavaScript", "kind": "property", "scope": "mockLocationData.country", "scopeKind": "class"}, {"_type": "tag", "name": "latitude", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^    latitude: 37.7749,$/", "language": "JavaScript", "kind": "property", "scope": "mockLocationData.location", "scopeKind": "class"}, {"_type": "tag", "name": "latitude", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^    latitude: 37.7749,$/", "language": "JavaScript", "kind": "property", "scope": "processedLocationData.location", "scopeKind": "class"}, {"_type": "tag", "name": "location", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^  location: {$/", "language": "JavaScript", "kind": "class", "scope": "mockLocationData", "scopeKind": "class"}, {"_type": "tag", "name": "location", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^  location: {$/", "language": "JavaScript", "kind": "class", "scope": "processedLocationData", "scopeKind": "class"}, {"_type": "tag", "name": "logger", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^const logger = require('..\\/..\\/..\\/src\\/utils\\/logger');$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "longitude", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^    longitude: -122.4194,$/", "language": "JavaScript", "kind": "property", "scope": "mockLocationData.location", "scopeKind": "class"}, {"_type": "tag", "name": "longitude", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^    longitude: -122.4194,$/", "language": "JavaScript", "kind": "property", "scope": "processedLocationData.location", "scopeKind": "class"}, {"_type": "tag", "name": "maxmind", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^const maxmind = require('maxmind');$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "mockLocationData", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^const mockLocationData = {$/", "language": "JavaScript", "kind": "class"}, {"_type": "tag", "name": "name", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^  city: { name: 'San Francisco' },$/", "language": "JavaScript", "kind": "property", "scope": "processedLocationData.city", "scopeKind": "class"}, {"_type": "tag", "name": "name", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^  continent: { code: 'NA', name: 'North America' },$/", "language": "JavaScript", "kind": "property", "scope": "processedLocationData.continent", "scopeKind": "class"}, {"_type": "tag", "name": "name", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^  country: { code: 'US', name: 'United States' },$/", "language": "JavaScript", "kind": "property", "scope": "processedLocationData.country", "scopeKind": "class"}, {"_type": "tag", "name": "name", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^  region: { code: 'CA', name: 'California' },$/", "language": "JavaScript", "kind": "property", "scope": "processedLocationData.region", "scopeKind": "class"}, {"_type": "tag", "name": "names", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^  city: { names: { en: 'San Francisco' } },$/", "language": "JavaScript", "kind": "class", "scope": "mockLocationData.city", "scopeKind": "class"}, {"_type": "tag", "name": "names", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^  continent: { code: 'NA', names: { en: 'North America' } },$/", "language": "JavaScript", "kind": "class", "scope": "mockLocationData.continent", "scopeKind": "class"}, {"_type": "tag", "name": "names", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^  country: { iso_code: 'US', names: { en: 'United States' } },$/", "language": "JavaScript", "kind": "class", "scope": "mockLocationData.country", "scopeKind": "class"}, {"_type": "tag", "name": "path", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^const path = require('path');$/", "language": "JavaScript", "kind": "constant"}, {"_type": "tag", "name": "postal", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^  postal: { code: '94105' },$/", "language": "JavaScript", "kind": "class", "scope": "mockLocationData", "scopeKind": "class"}, {"_type": "tag", "name": "postal", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^  postal: { code: '94105' },$/", "language": "JavaScript", "kind": "class", "scope": "processedLocationData", "scopeKind": "class"}, {"_type": "tag", "name": "processedLocationData", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^const processedLocationData = {$/", "language": "JavaScript", "kind": "class"}, {"_type": "tag", "name": "region", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^  region: { code: 'CA', name: 'California' },$/", "language": "JavaScript", "kind": "class", "scope": "processedLocationData", "scopeKind": "class"}, {"_type": "tag", "name": "subdivisions", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^  subdivisions: [{ iso_code: 'CA', names: { en: 'California' } }],$/", "language": "JavaScript", "kind": "property", "scope": "mockLocationData", "scopeKind": "class"}, {"_type": "tag", "name": "time_zone", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^    time_zone: 'America\\/Los_Angeles',$/", "language": "JavaScript", "kind": "property", "scope": "mockLocationData.location", "scopeKind": "class"}, {"_type": "tag", "name": "time_zone", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^    time_zone: 'America\\/Los_Angeles',$/", "language": "JavaScript", "kind": "property", "scope": "processedLocationData.location", "scopeKind": "class"}, {"_type": "tag", "name": "timestamp", "path": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "pattern": "/^  timestamp: expect.any(String),$/", "language": "JavaScript", "kind": "property", "scope": "processedLocationData", "scopeKind": "class"}], "filename": "/home/kavia/workspace/mock-OTT-API-Claro/tests/unit/services/geoip.service.test.js", "hash": "a70fad82d7ec2d55a3143a4acc4fbc8d", "format-version": 4, "code-base-name": "default", "fields": [{"name": "accuracy_radius: 10,", "scope": "mockLocationData.location", "scopeKind": "class", "description": "unavailable"}, {"name": "continent: { code: 'NA', name: 'North America' },", "scope": "processedLocationData.continent", "scopeKind": "class", "description": "unavailable"}, {"name": "continent: { code: 'NA', names: { en: 'North America' } },", "scope": "mockLocationData.continent", "scopeKind": "class", "description": "unavailable"}, {"name": "country: { code: 'US', name: 'United States' },", "scope": "processedLocationData.country", "scopeKind": "class", "description": "unavailable"}, {"name": "postal: { code: '94105' },", "scope": "mockLocationData.postal", "scopeKind": "class", "description": "unavailable"}, {"name": "region: { code: 'CA', name: 'California' },", "scope": "processedLocationData.region", "scopeKind": "class", "description": "unavailable"}, {"name": "city: { names: { en: 'San Francisco' } },", "scope": "mockLocationData.city.names", "scopeKind": "class", "description": "unavailable"}, {"name": "country: { iso_code: 'US', names: { en: 'United States' } },", "scope": "mockLocationData.country.names", "scopeKind": "class", "description": "unavailable"}, {"name": "ip: '192.168.1.1',", "scope": "processedLocationData", "scopeKind": "class", "description": "unavailable"}, {"name": "latitude: 37.7749,", "scope": "mockLocationData.location", "scopeKind": "class", "description": "unavailable"}, {"name": "longitude: -122.4194,", "scope": "mockLocationData.location", "scopeKind": "class", "description": "unavailable"}, {"name": "city: { name: 'San Francisco' },", "scope": "processedLocationData.city", "scopeKind": "class", "description": "unavailable"}, {"name": "subdivisions: [{ iso_code: 'CA', names: { en: 'California' } }],", "scope": "mockLocationData", "scopeKind": "class", "description": "unavailable"}, {"name": "time_zone: 'America\\/Los_Angeles',", "scope": "mockLocationData.location", "scopeKind": "class", "description": "unavailable"}, {"name": "timestamp: expect.any(String),", "scope": "processedLocationData", "scopeKind": "class", "description": "unavailable"}]}