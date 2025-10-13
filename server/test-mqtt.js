#!/usr/bin/env node

const mqtt = require('mqtt');
const appConfig = require('./src/config/app.config');

console.log('🔍 Testing MQTT connection with detailed diagnostics...');
console.log('Broker:', appConfig.mqtt.broker);
console.log('Client ID:', appConfig.mqtt.clientId);
console.log('Username:', appConfig.mqtt.username);
console.log('Password:', appConfig.mqtt.password ? '***configured***' : 'NOT SET');

const client = mqtt.connect(appConfig.mqtt.broker, {
  clientId: appConfig.mqtt.clientId,
  username: appConfig.mqtt.username,
  password: appConfig.mqtt.password,
  clean: true,
  connectTimeout: 5000,
  keepalive: 60,
  reschedulePings: true,
  protocolVersion: 4,
  protocolId: 'MQTT',
  resubscribe: true,
  will: {
    topic: 'galgo/school/status',
    payload: JSON.stringify({ status: 'offline', timestamp: new Date().toISOString() }),
    qos: 1,
    retain: true
  }
});

let connectionAttempts = 0;
const maxAttempts = 3;

client.on('connect', () => {
  console.log('✅ Successfully connected to MQTT broker!');
  console.log('Connection details:');
  console.log('  - Connected:', client.connected);
  console.log('  - Reconnecting:', client.reconnecting);

  // Test publishing a message
  client.publish('test/connection', 'Hello from Galgo School API!', { qos: 0, retain: false }, (err) => {
    if (err) {
      console.error('❌ Error publishing test message:', err);
    } else {
      console.log('✅ Test message published successfully');
    }

    // Subscribe to test topic
    client.subscribe('test/connection', { qos: 0 }, (err) => {
      if (err) {
        console.error('❌ Error subscribing to test topic:', err);
      } else {
        console.log('✅ Subscribed to test topic successfully');
      }

      setTimeout(() => {
        client.end();
        process.exit(0);
      }, 2000);
    });
  });
});

client.on('error', (error) => {
  console.error('❌ MQTT connection error:', error.message);
  console.error('Error code:', error.code);
  console.error('Error errno:', error.errno);
  process.exit(1);
});

client.on('offline', () => {
  console.log('❌ MQTT client offline');
  connectionAttempts++;
  
  if (connectionAttempts >= maxAttempts) {
    console.error(`❌ Maximum connection attempts (${maxAttempts}) reached. Giving up.`);
    client.end();
    process.exit(1);
  }
});

client.on('reconnect', () => {
  console.log('🔄 MQTT client reconnecting... (attempt', connectionAttempts + 1, 'of', maxAttempts, ')');
});

client.on('close', () => {
  console.log('🔌 MQTT connection closed');
});

client.on('disconnect', (packet) => {
  console.log('🔌 MQTT disconnect received:', packet);
});

client.on('message', (topic, message) => {
  console.log('📨 Received message on topic:', topic, 'Message:', message.toString());
});

// Timeout after 30 seconds
setTimeout(() => {
  console.error('❌ Connection timeout after 30 seconds');
  client.end();
  process.exit(1);
}, 30000);