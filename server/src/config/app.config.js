module.exports = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  mqtt: {
    broker: process.env.MQTT_BROKER || 'mqtt://100.107.238.60:1883',
    clientId: process.env.MQTT_CLIENT_ID || 'galgo-school-server', // Fixed client ID to prevent ghost sessions
    username: process.env.MQTT_USERNAME || 'admin',
    password: process.env.MQTT_PASSWORD || 'galgo2526',
    connectTimeout: 4000,
    reconnectPeriod: 5000, // Increase reconnect period to avoid connection floods
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
};
