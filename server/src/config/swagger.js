const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Galgo School API',
      version: '1.0.0',
      description: 'API para el sistema de gestión de sensores Galgo School con soporte MQTT',
      contact: {
        name: 'Galgo School Team',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3001',
        description: 'API Server',
      },
    ],
    tags: [
      {
        name: 'Sensors',
        description: 'Gestión de sensores',
      },
      {
        name: 'MQTT',
        description: 'Operaciones MQTT',
      },
      {
        name: 'Recording',
        description: 'Control de grabación',
      },
      {
        name: 'Configuration',
        description: 'Gestión de configuraciones',
      },
    ],
    components: {
      schemas: {
        Sensor: {
          type: 'object',
          required: ['type', 'name'],
          properties: {
            id: {
              type: 'integer',
              description: 'ID único del sensor',
            },
            type: {
              type: 'string',
              description: 'Tipo de sensor',
              example: 'environmental',
            },
            name: {
              type: 'string',
              description: 'Nombre del sensor',
              example: 'Sensor Temperatura',
            },
            data: {
              type: 'object',
              description: 'Datos adicionales del sensor',
            },
          },
        },
        MQTTTopic: {
          type: 'object',
          required: ['topic'],
          properties: {
            id: {
              type: 'integer',
            },
            topic: {
              type: 'string',
              example: 'sensors/temperature',
            },
            description: {
              type: 'string',
            },
            qos: {
              type: 'integer',
              minimum: 0,
              maximum: 2,
            },
            retained: {
              type: 'boolean',
            },
            active: {
              type: 'boolean',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
