#!/usr/bin/env node

const mqtt = require('mqtt');
const appConfig = require('./src/config/app.config');

console.log('╔════════════════════════════════════════════╗');
console.log('║   MQTT Broker Connection Diagnostics      ║');
console.log('╚════════════════════════════════════════════╝\n');

console.log('📋 Configuration:');
console.log('   Broker:', appConfig.mqtt.broker);
console.log('   Client ID:', appConfig.mqtt.clientId);
console.log('   Username:', appConfig.mqtt.username);
console.log('   Password:', appConfig.mqtt.password ? '***SET***' : 'NOT SET');
console.log('   Connect Timeout:', appConfig.mqtt.connectTimeout, 'ms');
console.log('   Reconnect Period:', appConfig.mqtt.reconnectPeriod, 'ms\n');

let connectTime = null;
let messageCount = 0;
let disconnectCount = 0;

const client = mqtt.connect(appConfig.mqtt.broker, {
  clientId: appConfig.mqtt.clientId + '-diagnose-' + Date.now(),
  username: appConfig.mqtt.username,
  password: appConfig.mqtt.password,
  clean: true,
  connectTimeout: 10000,
  keepalive: 30,
  reschedulePings: true,
  protocolVersion: 4,
  protocolId: 'MQTT',
  reconnectPeriod: 5000,
});

client.on('connect', (connack) => {
  connectTime = Date.now();
  console.log('✅ Connected to MQTT broker');
  console.log('   Session Present:', connack.sessionPresent);
  console.log('   Return Code:', connack.returnCode);
  
  // Subscribe to a test topic
  client.subscribe('galgo/test/#', { qos: 0 }, (err, granted) => {
    if (err) {
      console.error('❌ Subscription error:', err.message);
    } else {
      console.log('✅ Subscribed to galgo/test/#');
      console.log('   Granted QoS:', granted[0].qos);
    }
    
    // Publish a test message
    client.publish('galgo/test/diagnostics', JSON.stringify({ 
      test: 'Connection diagnostics',
      timestamp: new Date().toISOString(),
      clientId: client.options.clientId
    }), { qos: 0 }, (err) => {
      if (err) {
        console.error('❌ Publish error:', err.message);
      } else {
        console.log('✅ Test message published');
      }
    });
  });
  
  // Monitor connection every 5 seconds
  const monitor = setInterval(() => {
    if (!client.connected) {
      console.log('⚠️  Connection lost after', Math.floor((Date.now() - connectTime) / 1000), 'seconds');
      clearInterval(monitor);
    } else {
      const uptime = Math.floor((Date.now() - connectTime) / 1000);
      console.log(`📊 Connection stable (${uptime}s) - Messages: ${messageCount}, Disconnects: ${disconnectCount}`);
    }
  }, 5000);
});

client.on('message', (topic, message) => {
  messageCount++;
  console.log('📨 Message received:');
  console.log('   Topic:', topic);
  console.log('   Payload:', message.toString());
});

client.on('error', (error) => {
  console.error('❌ Error:', error.message);
  if (error.code) console.error('   Code:', error.code);
  if (error.errno) console.error('   Errno:', error.errno);
});

client.on('offline', () => {
  console.log('⚠️  Client offline');
});

client.on('reconnect', () => {
  console.log('🔄 Attempting to reconnect...');
});

client.on('close', () => {
  disconnectCount++;
  if (connectTime) {
    const duration = Math.floor((Date.now() - connectTime) / 1000);
    console.log(`🔌 Connection closed after ${duration} seconds`);
  } else {
    console.log('🔌 Connection closed before successful connection');
  }
});

client.on('disconnect', (packet) => {
  console.log('🔌 Disconnect packet received');
  if (packet) console.log('   Reason:', packet);
});

client.on('packetsend', (packet) => {
  // Log important packets only
  if (packet.cmd === 'pingreq') {
    console.log('📡 PING sent to broker');
  }
});

client.on('packetreceive', (packet) => {
  // Log important packets only
  if (packet.cmd === 'pingresp') {
    console.log('📡 PONG received from broker');
  }
});

// Run for 60 seconds
console.log('\n⏱️  Running diagnostics for 60 seconds...\n');
setTimeout(() => {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   Diagnostics Summary                      ║');
  console.log('╚════════════════════════════════════════════╝\n');
  console.log('📊 Statistics:');
  console.log('   Messages received:', messageCount);
  console.log('   Disconnect events:', disconnectCount);
  console.log('   Final state:', client.connected ? '✅ CONNECTED' : '❌ DISCONNECTED');
  if (connectTime) {
    console.log('   Total uptime:', Math.floor((Date.now() - connectTime) / 1000), 'seconds');
  }
  
  console.log('\n💡 Recommendations:');
  if (disconnectCount > 3) {
    console.log('   ⚠️  High disconnect rate detected!');
    console.log('   • Check broker configuration and firewall rules');
    console.log('   • Verify network stability');
    console.log('   • Consider increasing keepalive interval');
  } else if (disconnectCount === 0 && client.connected) {
    console.log('   ✅ Connection is stable!');
  } else {
    console.log('   ⚠️  Some disconnections occurred but may be normal');
  }
  
  client.end();
  process.exit(0);
}, 60000);

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Diagnostics interrupted by user');
  client.end();
  process.exit(0);
});
