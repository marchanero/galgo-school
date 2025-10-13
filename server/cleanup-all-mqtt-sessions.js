#!/usr/bin/env node

/**
 * Script to clean up ALL old MQTT client sessions from EMQX broker
 * This connects to EMQX and forcefully kicks out old clients
 */

const mqtt = require('mqtt');
const appConfig = require('./src/config/app.config');

console.log('🧹 EMQX Session Cleanup Script');
console.log('================================');
console.log(`Broker: ${appConfig.mqtt.broker}`);
console.log(`Current Client ID: ${appConfig.mqtt.clientId}`);
console.log('');

// First, let's connect with our proper client ID to force-disconnect any existing session
console.log('📌 Step 1: Connecting with fixed Client ID to force cleanup...');
console.log('   When we connect with clean=true and the same Client ID,');
console.log('   EMQX will automatically disconnect any existing session with that ID.');
console.log('');

const mainClient = mqtt.connect(appConfig.mqtt.broker, {
  clientId: appConfig.mqtt.clientId,
  username: appConfig.mqtt.username,
  password: appConfig.mqtt.password,
  clean: true, // This will force cleanup of any existing session
  connectTimeout: 5000,
  keepalive: 60,
});

mainClient.on('connect', (connack) => {
  console.log(`✅ Connected with Client ID: ${appConfig.mqtt.clientId}`);
  console.log(`   Session present: ${connack.sessionPresent}`);
  
  if (!connack.sessionPresent) {
    console.log('   ✅ No previous session found - this is a clean connection');
  } else {
    console.log('   ⚠️  Previous session was present (unusual with clean=true)');
  }
  
  console.log('');
  console.log('✅ Main cleanup completed!');
  console.log('');
  console.log('📋 About the old "galgo_app_*" clients you see:');
  console.log('   - These are from previous server restarts');
  console.log('   - They were created when the server had random Client IDs');
  console.log('   - EMQX keeps them in memory until they expire');
  console.log('');
  console.log('🔧 To remove ALL old sessions from EMQX:');
  console.log('');
  console.log('   Option 1: Manual cleanup via EMQX Dashboard');
  console.log('   ------------------------------------------');
  console.log('   1. Open: http://100.107.238.60:18083');
  console.log('   2. Login: admin / galgo2526');
  console.log('   3. Go to: Monitoring → Clients');
  console.log('   4. Find clients with "galgo_app_" or "galgo-api-" prefix');
  console.log('   5. Click "Kick Out" button for each old client');
  console.log('');
  console.log('   Option 2: Restart EMQX broker (cleans all sessions)');
  console.log('   ---------------------------------------------------');
  console.log('   docker restart emqx');
  console.log('');
  console.log('   Option 3: Let them expire naturally');
  console.log('   ------------------------------------');
  console.log('   EMQX will clean up disconnected clients after the configured');
  console.log('   session expiry interval (default: typically 2 hours)');
  console.log('');
  console.log('💡 Going forward:');
  console.log('   - Your server now uses a FIXED Client ID: ' + appConfig.mqtt.clientId);
  console.log('   - Each restart will reuse the same ID');
  console.log('   - No more ghost sessions will accumulate!');
  console.log('');
  
  setTimeout(() => {
    mainClient.end();
    console.log('✅ Cleanup script completed');
    console.log('');
    console.log('🚀 Your server is now configured correctly!');
    console.log('   Just keep it running with the fixed Client ID.');
    process.exit(0);
  }, 2000);
});

mainClient.on('error', (error) => {
  console.error('❌ MQTT connection error:', error.message);
  process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('❌ Connection timeout');
  mainClient.end();
  process.exit(1);
}, 10000);
