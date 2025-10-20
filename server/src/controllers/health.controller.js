const prisma = require('../lib/prisma');
const appConfig = require('../config/app.config');
const mqttService = require('../services/mqtt.service');

class HealthController {
  async getHealth(req, res) {
    try {
      // Test database connection
      let dbStatus = true;
      let dbError = null;

      try {
        await prisma.$queryRaw`SELECT 1`;
      } catch (error) {
        dbStatus = false;
        dbError = error.message;
      }

      const mqttStatus = mqttService.getStatus();

      const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          database: {
            status: dbStatus ? 'connected' : 'disconnected',
            error: dbError,
          },
          mqtt: {
            status: mqttStatus.connected ? 'connected' : 'disconnected',
            broker: mqttStatus.broker,
            clientId: mqttStatus.clientId,
          },
        },
        environment: {
          nodeEnv: appConfig.nodeEnv,
          port: appConfig.port,
        },
      };

      // For Docker healthcheck, only database connectivity matters
      // MQTT can be disconnected and that's OK
      if (!dbStatus) {
        health.status = 'error';
        res.status(503);
      } else {
        res.status(200);
      }

      res.json(health);
    } catch (error) {
      console.error('Health check error:', error);
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  }
}

module.exports = new HealthController();