module.exports = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  mqtt: {
    broker: process.env.MQTT_BROKER || 'mqtt://100.107.238.60:1883',
    clientId: process.env.MQTT_CLIENT_ID || 'galgo-school-server',
    username: process.env.MQTT_USERNAME || 'admin',
    password: process.env.MQTT_PASSWORD || 'galgo2526',
    connectTimeout: 4000,
    reconnectPeriod: 1000,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
};
