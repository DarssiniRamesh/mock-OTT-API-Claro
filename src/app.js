const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { requestIdMiddleware, notFoundMiddleware, errorHandlerMiddleware } = require('./middleware/error.middleware');
const routes = require('./routes');
const { setupSwagger } = require('./swagger');

// Initialize express app
const app = express();

// Apply middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies
app.use(requestIdMiddleware); // Add request ID to each request
app.use(morgan('dev')); // HTTP request logger

// Set up Swagger documentation
setupSwagger(app);

// API routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// 404 handler for undefined routes
app.use(notFoundMiddleware);

// Error handling middleware
app.use(errorHandlerMiddleware);

module.exports = app;
