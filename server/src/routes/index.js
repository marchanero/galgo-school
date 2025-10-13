const express = require('express');
const router = express.Router();

const sensorRoutes = require('./sensor.routes');
const mqttRoutes = require('./mqtt.routes');
const healthRoutes = require('./health.routes');

// Mount routes
router.use('/sensors', sensorRoutes);
router.use('/mqtt', mqttRoutes);
router.use('/health', healthRoutes);

module.exports = router;
