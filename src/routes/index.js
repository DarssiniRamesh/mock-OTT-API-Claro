const express = require('express');

const router = express.Router();

// TODO: Add routes for geolocation API

// Default route
router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Geolocation API is running',
    version: '1.0.0',
  });
});

module.exports = router;