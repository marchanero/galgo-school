const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Galgo School API',
      version: '2.0.0',
      description: 'API para el sistema de gestión de sensores Galgo School con soporte MQTT - Powered by Prisma ORM',
      contact: {
        name: 'Galgo School Team',
      },
      license: {
        name: 'MIT',
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
        description: 'Gestión de sensores (Environmental, EmotiBit, Custom)',
      },
      {
        name: 'Topics',
        description: 'Gestión de topics MQTT',
      },
      {
        name: 'MQTT',
        description: 'Operaciones MQTT (conexión, mensajes, broker switching)',
      },
      {
        name: 'Configurations',
        description: 'Gestión de configuraciones del sistema (auto-save con debounce)',
      },
      {
        name: 'Cameras',
        description: 'Gestión de cámaras RTSP',
      },
      {
        name: 'Health',
        description: 'Estado de salud de la aplicación',
      },
    ],
    components: {
      schemas: {
        Sensor: {
          type: 'object',
          required: ['type', 'name', 'topic'],
          properties: {
            id: {
              type: 'integer',
              description: 'ID único del sensor',
              example: 1,
            },
            type: {
              type: 'string',
              description: 'Tipo de sensor',
              example: 'temperature',
            },
            name: {
              type: 'string',
              description: 'Nombre del sensor',
              example: 'Sensor Temperatura Sala',
            },
            topic: {
              type: 'string',
              description: 'Topic MQTT asociado',
              example: 'sensors/temperature/room1',
            },
            description: {
              type: 'string',
              description: 'Descripción del sensor',
              example: 'Sensor de temperatura DHT22',
            },
            unit: {
              type: 'string',
              description: 'Unidad de medida',
              example: '°C',
            },
            min_value: {
              type: 'number',
              description: 'Valor mínimo esperado',
              example: -10,
            },
            max_value: {
              type: 'number',
              description: 'Valor máximo esperado',
              example: 50,
            },
            data: {
              type: 'object',
              description: 'Datos adicionales en JSON',
            },
            active: {
              type: 'boolean',
              default: true,
              description: 'Si el sensor está activo',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de última actualización',
            },
          },
        },
        SensorData: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único del registro',
            },
            sensor_id: {
              type: 'integer',
              description: 'ID del sensor',
            },
            topic: {
              type: 'string',
              description: 'Topic MQTT del que proviene',
            },
            value: {
              type: 'string',
              description: 'Valor como texto',
            },
            numeric_value: {
              type: 'number',
              nullable: true,
              description: 'Valor convertido a número (si es posible)',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha/hora del registro',
            },
            raw_message: {
              type: 'string',
              nullable: true,
              description: 'Mensaje MQTT original',
            },
          },
        },
        Camera: {
          type: 'object',
          required: ['name', 'ip'],
          properties: {
            id: {
              type: 'integer',
              description: 'ID único de la cámara',
              example: 1,
            },
            name: {
              type: 'string',
              description: 'Nombre único de la cámara',
              example: 'Cámara Principal Aula',
            },
            ip: {
              type: 'string',
              description: 'Dirección IP o hostname',
              example: '192.168.1.100',
            },
            port: {
              type: 'integer',
              default: 554,
              description: 'Puerto RTSP',
              example: 554,
            },
            username: {
              type: 'string',
              description: 'Usuario para autenticación (opcional)',
              example: 'admin',
            },
            password: {
              type: 'string',
              description: 'Contraseña para autenticación (opcional)',
              example: 'password123',
            },
            path: {
              type: 'string',
              default: '/stream',
              description: 'Path del stream RTSP',
              example: '/stream',
            },
            active: {
              type: 'boolean',
              default: true,
              description: 'Si la cámara está activa',
            },
            connection_status: {
              type: 'string',
              enum: ['connected', 'disconnected', 'testing'],
              description: 'Estado de conexión',
              example: 'connected',
            },
            last_checked: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Última vez que se verificó la conexión',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de última actualización',
            },
          },
        },
        MQTTTopic: {
          type: 'object',
          required: ['topic'],
          properties: {
            id: {
              type: 'integer',
              description: 'ID único del topic',
              example: 1,
            },
            topic: {
              type: 'string',
              description: 'Nombre del topic MQTT',
              example: 'sensors/temperature/room1',
            },
            description: {
              type: 'string',
              description: 'Descripción del topic',
              example: 'Sensor de temperatura de la habitación 1',
            },
            qos: {
              type: 'integer',
              minimum: 0,
              maximum: 2,
              default: 0,
              description: 'Quality of Service',
              example: 1,
            },
            retained: {
              type: 'boolean',
              default: false,
              description: 'Si el mensajes se retiene',
            },
            active: {
              type: 'boolean',
              default: true,
              description: 'Si la suscripción está activa',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de última actualización',
            },
          },
        },
        MQTTMessage: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único del mensaje',
            },
            topic: {
              type: 'string',
              description: 'Topic MQTT',
            },
            message: {
              type: 'string',
              description: 'Contenido del mensaje',
            },
            qos: {
              type: 'integer',
              description: 'Quality of Service',
            },
            retain: {
              type: 'boolean',
              description: 'Si el mensaje está retenido',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha/hora del mensaje',
            },
          },
        },
        Configuration: {
          type: 'object',
          properties: {
            general: {
              type: 'object',
              properties: {
                theme: {
                  type: 'string',
                  enum: ['light', 'dark'],
                  default: 'light',
                },
                recordingAutoStart: {
                  type: 'boolean',
                  default: false,
                },
                language: {
                  type: 'string',
                  enum: ['es', 'en'],
                  default: 'es',
                },
                timezone: {
                  type: 'string',
                  default: 'Europe/Madrid',
                },
              },
            },
            recordings: {
              type: 'object',
              properties: {
                directory: {
                  type: 'string',
                  example: '/home/roberto/galgo-recordings',
                },
                format: {
                  type: 'string',
                  enum: ['MP4 (H.264)', 'MP4 (H.265)', 'AVI', 'MKV'],
                  default: 'MP4 (H.264)',
                },
                maxDuration: {
                  type: 'integer',
                  description: 'Duración máxima en segundos',
                  example: 60,
                },
                quality: {
                  type: 'string',
                  enum: ['Baja (480p)', 'Media (720p)', 'Alta (1080p)', '4K (2160p)'],
                  default: 'Alta (1080p)',
                },
              },
            },
            mqtt: {
              type: 'object',
              properties: {
                defaultBroker: {
                  type: 'string',
                  default: 'EMQX Local (localhost:1883)',
                },
                host: {
                  type: 'string',
                  default: 'localhost',
                },
                port: {
                  type: 'integer',
                  default: 1883,
                },
                username: {
                  type: 'string',
                  default: '',
                },
                password: {
                  type: 'string',
                  default: '',
                },
                ssl: {
                  type: 'boolean',
                  default: false,
                },
              },
            },
            cameras: {
              type: 'object',
              properties: {
                defaultRtspPort: {
                  type: 'integer',
                  default: 554,
                },
                defaultRtspPath: {
                  type: 'string',
                  default: '/stream',
                },
                connectionTimeout: {
                  type: 'integer',
                  default: 10,
                },
                defaultQuality: {
                  type: 'string',
                  default: '1080p (Alta)',
                },
                defaultFrameRate: {
                  type: 'string',
                  default: '30 FPS',
                },
                autoReconnect: {
                  type: 'boolean',
                  default: true,
                },
              },
            },
            sensors: {
              type: 'object',
              properties: {
                autoLoad: {
                  type: 'boolean',
                  default: true,
                },
                defaultActive: {
                  type: 'boolean',
                  default: true,
                },
                refreshInterval: {
                  type: 'integer',
                  default: 30,
                },
                sensors: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Sensor',
                  },
                },
              },
            },
            topics: {
              type: 'object',
              properties: {
                autoSubscribe: {
                  type: 'boolean',
                  default: true,
                },
                defaultQos: {
                  type: 'integer',
                  default: 0,
                },
                defaultRetained: {
                  type: 'boolean',
                  default: false,
                },
                topics: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/MQTTTopic',
                  },
                },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Descripción del error',
            },
            message: {
              type: 'string',
              description: 'Detalles adicionales del error',
            },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            valid: {
              type: 'boolean',
              example: false,
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                  },
                  message: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        HealthStatus: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['ok', 'error'],
              example: 'ok',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha/hora del check',
            },
            uptime: {
              type: 'number',
              description: 'Tiempo en segundos que lleva corriendo',
            },
            services: {
              type: 'object',
              properties: {
                database: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['connected', 'disconnected'],
                    },
                    error: {
                      type: 'string',
                      nullable: true,
                    },
                  },
                },
                mqtt: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['connected', 'disconnected'],
                    },
                    broker: {
                      type: 'string',
                      nullable: true,
                    },
                    clientId: {
                      type: 'string',
                      nullable: true,
                    },
                  },
                },
              },
            },
            environment: {
              type: 'object',
              properties: {
                nodeEnv: {
                  type: 'string',
                  example: 'production',
                },
                port: {
                  type: 'integer',
                  example: 3001,
                },
              },
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
