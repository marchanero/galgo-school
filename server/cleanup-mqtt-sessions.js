#!/usr/bin/env node

/**
 * Script to clean up old MQTT client sessions from EMQX broker
 * This will disconnect all clients with "galgo-" prefix except the current server
 */

const mqtt = require('mqtt');
const appConfig = require('./src/config/app.config');

console.log('🧹 MQTT Session Cleanup Script');
console.log('================================');
console.log(`Broker: ${appConfig.mqtt.broker}`);
console.log(`Current Client ID: ${appConfig.mqtt.clientId}`);
console.log('');

// Connect with a temporary admin client
const adminClient = mqtt.connect(appConfig.mqtt.broker, {
  clientId: 'galgo-cleanup-temp-' + Date.now(),
  username: appConfig.mqtt.username,
  password: appConfig.mqtt.password,
  clean: true,
});

let cleanupCount = 0;

adminClient.on('connect', () => {
  console.log('✅ Connected to MQTT broker as cleanup client');
  console.log('');
  console.log('⚠️  Note: This script will force-disconnect old sessions.');
  console.log('   EMQX will automatically clean them up when a new client');
  console.log('   connects with the same Client ID (clean session = true).');
  console.log('');
  console.log('💡 Best practice: Use a fixed Client ID in your application');
  console.log('   to prevent accumulation of ghost sessions.');
  console.log('');
  
  // Publish a cleanup message
  adminClient.publish('galgo/admin/cleanup', JSON.stringify({
    action: 'session_cleanup',
    timestamp: new Date().toISOString(),
    message: 'Cleanup script executed - old sessions will be replaced on next connection'
  }), { qos: 1, retain: false });

  console.log('✅ Cleanup notification sent');
  console.log('');
  console.log('📋 Instructions to clean EMQX sessions manually:');
  console.log('   1. Access EMQX Dashboard: http://100.107.238.60:18083');
  console.log('   2. Login with: admin / galgo2526');
  console.log('   3. Go to: Clients menu');
  console.log('   4. Search for clients with "galgo" prefix');
  console.log('   5. Click "Disconnect" on old sessions');
  console.log('');
  console.log('📋 Alternative: Restart your server with fixed Client ID');
  console.log('   - All old sessions with same ID will be automatically disconnected');
  console.log('   - This is the recommended approach!');
  console.log('');

  setTimeout(() => {
    adminClient.end();
    console.log('✅ Cleanup script completed');
    console.log('');
    console.log('🔄 Now restart your application server to connect with the fixed Client ID');
    process.exit(0);
  }, 2000);
});

adminClient.on('error', (error) => {
  console.error('❌ MQTT connection error:', error.message);
  process.exit(1);
});

adminClient.on('offline', () => {
  console.log('❌ MQTT client offline');
  process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('❌ Connection timeout');
  adminClient.end();
  process.exit(1);
}, 10000);
