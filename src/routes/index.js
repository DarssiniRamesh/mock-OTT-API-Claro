const express = require('express');
const authRoutes = require('./auth.routes');
const geolocationRoutes = require('./geolocation.routes');

const router = express.Router();

// Authentication routes
router.use('/auth', authRoutes);

// Geolocation routes
router.use('/geolocation', geolocationRoutes);

// Default route
router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Geolocation API is running',
    version: '1.0.0',
  });
});

module.exports = router;
