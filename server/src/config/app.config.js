module.exports = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  mqtt: {
    broker: process.env.MQTT_BROKER || 'mqtt://100.82.84.24:1883', // Cambiado a broker de pruebas
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
      
      // Extract host and port from origin
      const url = new URL(origin);
      const hostname = url.hostname;
      const port = url.port || (url.protocol === 'https:' ? 443 : 80);
      
      // Allow localhost and 127.0.0.1 with any dev port (5173, 5174, 5175, 3000, 3001)
      const devPorts = ['5173', '5174', '5175', '5176', '3000', '3001'];
      const isDevPort = devPorts.includes(port);
      
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
        if (isDevPort) {
          console.log('✅ CORS - Localhost/127.0.0.1 allowed on dev port:', origin);
          return callback(null, true);
        }
      }
      
      // Allow any local IP (192.168.x.x, 100.x.x.x, etc.) on dev ports
      if (isDevPort && !hostname.startsWith('external') && !origin.includes('http://')) {
        console.log('✅ CORS - Local IP allowed on dev port:', origin);
        return callback(null, true);
      }
      
      // More permissive: allow any origin on dev ports in development
      if (process.env.NODE_ENV !== 'production' && isDevPort) {
        console.log('✅ CORS - Dev environment: allowing all origins on dev ports:', origin);
        return callback(null, true);
      }
      
      console.log('❌ CORS - Origin NOT allowed:', origin);
      callback(null, true); // Still allow for debugging, remove in production
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  },
};
