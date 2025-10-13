const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const appConfig = require('./config/app.config');
const { initializeDatabase } = require('./config/database');
const mqttService = require('./services/mqtt.service');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./middlewares/logger');

const app = express();

// Initialize database
initializeDatabase();

// Initialize MQTT
mqttService.initialize();

// Middlewares
app.use(cors(appConfig.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Galgo School API Documentation',
  customfavIcon: '/favicon.ico',
}));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Galgo School API',
    version: '1.0.0',
    docs: '/api-docs',
    health: '/api/health',
  });
});

// API routes
app.use('/api', routes);

// Error handler (must be last)
app.use(errorHandler);

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
