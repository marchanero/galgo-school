const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const appConfig = require('./config/app.config');
const { initializeDatabase } = require('./config/database');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./middlewares/logger');

// Initialize MQTT service (optional auto-connect)
const mqttService = require('./services/mqtt.service');

const app = express();

// Initialize database
initializeDatabase();

// Optional: Auto-connect to MQTT broker on startup
if (appConfig.mqtt.broker && appConfig.mqtt.broker !== 'mqtt://100.107.238.60:1883') {
  console.log('🔄 Attempting to auto-connect to MQTT broker...');
  mqttService.connect(appConfig.mqtt.broker, {
    username: appConfig.mqtt.username,
    password: appConfig.mqtt.password,
    clientId: appConfig.mqtt.clientId,
  }).catch(error => {
    console.log('⚠️ Auto-connection to MQTT broker failed:', error.message);
    console.log('Manual connection will be available via API');
  });
}

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
