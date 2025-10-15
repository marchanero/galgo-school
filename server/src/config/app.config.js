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
    origin: function (origin, callback) {
      console.log('🔍 CORS - Request from origin:', origin);
      
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        console.log('✅ CORS - Allowing request without origin');
        return callback(null, true);
      }
      
      const allowedOrigins = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://192.168.1.107:5173'
      ];
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        console.log('✅ CORS - Origin allowed:', origin);
        callback(null, true);
      } else {
        console.log('❌ CORS - Origin NOT allowed:', origin);
        console.log('❌ CORS - Allowed origins:', allowedOrigins);
        // Temporalmente permitir todos los orígenes para debugging
        console.log('⚠️ CORS - Permitiendo temporalmente para debugging');
        callback(null, true);
        // callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  },
};
