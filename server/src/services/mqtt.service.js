const mqtt = require('mqtt');
const appConfig = require('../config/app.config');
const { getDatabase } = require('../config/database');

class MQTTService {
  constructor() {
    this.client = null;
    this.isInitializing = false;
  }

  initialize() {
    // Prevent multiple simultaneous initializations
    if (this.isInitializing) {
      console.log('⚠️ MQTT initialization already in progress...');
      return this.client;
    }

    this.isInitializing = true;

    // Close existing connection if any
    if (this.client) {
      try {
        this.client.removeAllListeners(); // Remove old listeners
        this.client.end(true); // Force close
      } catch (err) {
        console.log('Error closing previous connection:', err.message);
      }
      this.client = null;
    }

    console.log(`🔄 Initializing MQTT connection to ${appConfig.mqtt.broker}...`);
    console.log(`   Client ID: ${appConfig.mqtt.clientId}`);

    this.client = mqtt.connect(appConfig.mqtt.broker, {
      clientId: appConfig.mqtt.clientId, // Use fixed client ID - no timestamp suffix
      username: appConfig.mqtt.username,
      password: appConfig.mqtt.password,
      clean: true, // Clean session will disconnect any existing session with same client ID
      connectTimeout: 5000,
      reconnectPeriod: 5000, // Retry every 5 seconds
      keepalive: 60, // Keep connection alive with pings every 60 seconds
      protocolVersion: 4, // MQTT 3.1.1
      protocolId: 'MQTT',
      resubscribe: false, // Manual resubscription for better control
    });

    this.setupEventHandlers();
    this.isInitializing = false;
    
    return this.client;
  }

  setupEventHandlers() {
    this.client.on('connect', (connack) => {
      console.log(`✅ Connected to MQTT broker: ${appConfig.mqtt.broker}`);
      console.log(`   Session present: ${connack.sessionPresent}`);
      
      // Wait for connection to stabilize before subscribing
      setTimeout(() => {
        if (this.client && this.client.connected) {
          this.subscribeToActiveTopics();
          
          // Publish online status
          this.client.publish('galgo/school/status', JSON.stringify({ 
            status: 'online', 
            timestamp: new Date().toISOString(),
            clientId: appConfig.mqtt.clientId
          }), { qos: 0, retain: true }, (err) => {
            if (err) {
              console.error('Error publishing status:', err.message);
            }
          });
        }
      }, 1000);
    });

    this.client.on('message', (topic, message, packet) => {
      this.handleMessage(topic, message, packet);
    });

    this.client.on('error', (error) => {
      console.error(`❌ MQTT error: ${error.message}`);
    });

    this.client.on('offline', () => {
      console.log('⚠️ MQTT client offline');
    });

    this.client.on('reconnect', () => {
      console.log('🔄 MQTT reconnecting...');
    });

    this.client.on('close', () => {
      console.log('🔌 MQTT connection closed');
    });

    this.client.on('disconnect', (packet) => {
      console.log('🔌 MQTT disconnected');
    });

    this.client.on('end', () => {
      console.log('🏁 MQTT client ended');
    });
  }

  subscribeToActiveTopics() {
    const db = getDatabase();
    
    db.all('SELECT topic FROM mqtt_topics WHERE active = 1', [], (err, rows) => {
      if (err) {
        console.error('❌ Error getting topics:', err);
        return;
      }

      if (rows.length === 0) {
        console.log('ℹ️  No active topics to subscribe to');
        return;
      }

      rows.forEach(row => {
        this.client.subscribe(row.topic, { qos: 0 }, (err) => {
          if (err) {
            console.error(`❌ Error subscribing to ${row.topic}:`, err);
          } else {
            console.log(`✅ Subscribed to topic: ${row.topic}`);
          }
        });
      });
    });
  }

  handleMessage(topic, message, packet) {
    const messageStr = message.toString();
    console.log(`📨 MQTT Message - Topic: ${topic}, Message: ${messageStr}`);

    const db = getDatabase();
    db.run(
      'INSERT INTO mqtt_messages (topic, message, qos, retain) VALUES (?, ?, ?, ?)',
      [topic, messageStr, packet.qos, packet.retain],
      (err) => {
        if (err) {
          console.error('❌ Error storing MQTT message:', err);
        }
      }
    );
  }

  getStatus() {
    return {
      connected: this.client && this.client.connected,
      reconnecting: this.client && this.client.reconnecting,
      broker: appConfig.mqtt.broker,
      clientId: appConfig.mqtt.clientId,
      timestamp: new Date().toISOString(),
    };
  }

  subscribe(topic, qos = 0) {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.client.connected) {
        return reject(new Error('MQTT client not connected'));
      }

      this.client.subscribe(topic, { qos }, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  unsubscribe(topic) {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.client.connected) {
        return reject(new Error('MQTT client not connected'));
      }

      this.client.unsubscribe(topic, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  publish(topic, message, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.client.connected) {
        return reject(new Error('MQTT client not connected'));
      }

      const publishOptions = {
        qos: options.qos || 0,
        retain: options.retain || false,
      };

      this.client.publish(topic, message.toString(), publishOptions, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  disconnect() {
    if (this.client) {
      // Publish offline status before disconnecting
      try {
        this.client.publish('galgo/school/status', JSON.stringify({ 
          status: 'offline', 
          timestamp: new Date().toISOString(),
          clientId: appConfig.mqtt.clientId
        }), { qos: 0, retain: true });
      } catch (err) {
        console.error('Error publishing offline status:', err.message);
      }

      this.client.end(false, {}, () => {
        console.log('✅ MQTT client disconnected cleanly');
      });
      this.client = null;
    }
  }
}

module.exports = new MQTTService();
