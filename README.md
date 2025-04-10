# Geolocation Component for OTT API

This component provides geolocation services for the OTT API, including IP-based location detection, region-specific configurations, and location overrides.

## Features

- IP-based geolocation using MaxMind GeoIP2 database
- Region and country-specific configurations
- Location override functionality
- Caching for improved performance
- MongoDB integration for storing geographical data

## Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB
- MaxMind GeoIP2 database (optional for production)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables (create a `.env` file):

```
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/geolocation
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=1h
MAXMIND_DB_PATH=./data/GeoLite2-City.mmdb
LOG_LEVEL=info
```

### Database Initialization

Initialize the database with required collections and indexes:

```bash
npm run init-db
```

To reset the database and start fresh:

```bash
npm run init-db:reset
```

To initialize the database and seed it with sample data:

```bash
npm run init-db:seed
```

### GeoIP Database Setup

Initialize the GeoIP database for development:

```bash
npm run init-geoip
```

For production, you should obtain a MaxMind license key and use:

```bash
npm run init-geoip -- --license-key=YOUR_LICENSE_KEY
```

To force a re-download of the database:

```bash
npm run init-geoip:force
```

### Complete Setup

To perform a complete setup (initialize database with seed data and set up GeoIP database):

```bash
npm run setup
```

## Seed Data

The component comes with seed data for testing and development:

- Regions (continents)
- Countries
- Cities
- Region-specific configurations
- IP ranges for testing

To seed the database with sample data:

```bash
npm run seed:dev
```

To seed only specific data types:

```bash
npm run seed -- --only=regions,countries
```

Available data types: `regions`, `countries`, `cities`, `configs`, `ipranges`

To clear existing data before seeding:

```bash
npm run seed:clear
```

## Running the Application

Start the server in development mode:

```bash
npm run dev
```

Start the server in production mode:

```bash
npm start
```

## API Documentation

API documentation is available via Swagger UI at `/api-docs` when the server is running.

## Testing

Run tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## License

ISC
