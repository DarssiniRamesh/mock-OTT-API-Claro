/**
 * Swagger Configuration
 * Configures Swagger UI for API documentation
 */

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

// Load Swagger document
const swaggerDocument = YAML.load(path.join(__dirname, './docs/swagger.yaml'));

/**
 * PUBLIC_INTERFACE
 * Configure Swagger UI middleware for Express
 * @param {Object} app - Express application
 * @returns {void}
 */
const setupSwagger = (app) => {
  // Serve Swagger UI
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
      },
    })
  );

  // Serve Swagger JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
  });
};

module.exports = { setupSwagger };
