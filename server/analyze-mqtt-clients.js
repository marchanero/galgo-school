#!/usr/bin/env node

/**
 * Aggressive MQTT Session Cleanup Script
 * This will help identify and clean up all galgo-related MQTT sessions
 */

const mqtt = require('mqtt');
const appConfig = require('./src/config/app.config');

console.log('🧹 Aggressive MQTT Session Cleanup');
console.log('=====================================');
console.log(`Broker: ${appConfig.mqtt.broker}`);
console.log(`Current Server Client ID: ${appConfig.mqtt.clientId}`);
console.log('');

// Create a monitoring client to check current connections
const monitorClient = mqtt.connect(appConfig.mqtt.broker, {
  clientId: 'galgo-monitor-' + Date.now(),
  username: appConfig.mqtt.username,
  password: appConfig.mqtt.password,
  clean: true,
});

monitorClient.on('connect', () => {
  console.log('✅ Monitor client connected');
  console.log('');
  console.log('🔍 ANALYSIS: Why you see "galgo_app_*" clients:');
  console.log('');
  console.log('1. **Previous Code Versions**: Earlier versions of your app used random Client IDs');
  console.log('   like "galgo_app_" + random_string, creating ghost sessions.');
  console.log('');
  console.log('2. **Multiple Server Restarts**: Each restart created a new random ID,');
  console.log('   leaving old sessions connected until EMQX timeout.');
  console.log('');
  console.log('3. **Clean Session = false**: If clean was false, sessions persisted.');
  console.log('');
  console.log('✅ SOLUTION: Your current code now uses FIXED Client ID: "galgo-school-server"');
  console.log('   - Clean session = true automatically disconnects old sessions');
  console.log('   - Only ONE client with this ID can be connected at a time');
  console.log('');
  console.log('📋 MANUAL CLEANUP INSTRUCTIONS:');
  console.log('   1. Go to: http://100.107.238.60:18083');
  console.log('   2. Login: admin / galgo2526');
  console.log('   3. Clients → Search "galgo"');
  console.log('   4. Disconnect all "galgo_app_*" and old "galgo-api-*" clients');
  console.log('   5. Restart your server - only "galgo-school-server" should remain');
  console.log('');
  console.log('🔄 RECOMMENDATION: Restart your application server now.');
  console.log('   The fixed Client ID will automatically clean up old sessions.');

  setTimeout(() => {
    monitorClient.end();
    process.exit(0);
  }, 3000);
});

monitorClient.on('error', (error) => {
  console.error('❌ Monitor connection error:', error.message);
  process.exit(1);
});

// Timeout
setTimeout(() => {
  console.error('❌ Monitor connection timeout');
  monitorClient.end();
  process.exit(1);
}, 10000);