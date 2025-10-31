const express = require('express');
const router = express.Router();

const sensorRoutes = require('./sensor.routes');
const healthRoutes = require('./health.routes');
const mqttRoutes = require('./mqtt.routes');
const configurationRoutes = require('./configuration.routes');
const topicsRoutes = require('./topics.routes');
const cameraRoutes = require('./cameras.routes');
const userRoutes = require('./user.routes');
const nfcEventRoutes = require('./nfc-event.routes');

// Mount routes
router.use('/sensors', sensorRoutes);
router.use('/topics', topicsRoutes);
router.use('/health', healthRoutes);
router.use('/mqtt', mqttRoutes);
router.use('/configurations', configurationRoutes);
router.use('/cameras', cameraRoutes);
router.use('/users', userRoutes);
router.use('/nfc-events', nfcEventRoutes);
router.use('/nfc-events', nfcEventRoutes);

module.exports = router;
