#!/usr/bin/env node

const mqtt = require('mqtt');
const appConfig = require('./src/config/app.config');

console.log('Testing MQTT connection...');
console.log('Broker:', appConfig.mqtt.broker);
console.log('Client ID:', appConfig.mqtt.clientId);
console.log('Username:', appConfig.mqtt.username);

const client = mqtt.connect(appConfig.mqtt.broker, {
  clientId: appConfig.mqtt.clientId,
  username: appConfig.mqtt.username,
  password: appConfig.mqtt.password,
  clean: true,
  connectTimeout: 5000,
});

client.on('connect', () => {
  console.log('✅ Successfully connected to MQTT broker!');

  // Test publishing a message
  client.publish('test/connection', 'Hello from Galgo School API!', { qos: 0, retain: false }, (err) => {
    if (err) {
      console.error('❌ Error publishing test message:', err);
    } else {
      console.log('✅ Test message published successfully');
    }

    client.end();
    process.exit(0);
  });
});

client.on('error', (error) => {
  console.error('❌ MQTT connection error:', error.message);
  process.exit(1);
});

client.on('offline', () => {
  console.log('❌ MQTT client offline');
  process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('❌ Connection timeout');
  client.end();
  process.exit(1);
}, 10000);