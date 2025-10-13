const mqtt = require('mqtt');
const appConfig = require('../config/app.config');
const { getDatabase } = require('../config/database');

class MQTTService {
  constructor() {
    this.client = null;
    this.connectedClients = new Set();
  }

  initialize() {
    if (this.client) {
      this.client.end();
    }

    this.client = mqtt.connect(appConfig.mqtt.broker, {
      clientId: appConfig.mqtt.clientId,
      username: appConfig.mqtt.username,
      password: appConfig.mqtt.password,
      clean: true,
      connectTimeout: appConfig.mqtt.connectTimeout,
      reconnectPeriod: appConfig.mqtt.reconnectPeriod,
    });

    this.setupEventHandlers();
    return this.client;
  }

  setupEventHandlers() {
    this.client.on('connect', () => {
      console.log('Connected to MQTT broker');
      this.subscribeToActiveTopics();
    });

    this.client.on('message', (topic, message, packet) => {
      this.handleMessage(topic, message, packet);
    });

    this.client.on('error', (error) => {
      console.error('MQTT connection error:', error);
    });

    this.client.on('offline', () => {
      console.log('MQTT client offline');
    });

    this.client.on('reconnect', () => {
      console.log('MQTT client reconnecting...');
    });
  }

  subscribeToActiveTopics() {
    const db = getDatabase();
    
    db.all('SELECT topic FROM mqtt_topics WHERE active = 1', [], (err, rows) => {
      if (err) {
        console.error('Error getting topics:', err);
        return;
      }

      rows.forEach(row => {
        this.client.subscribe(row.topic, { qos: 0 }, (err) => {
          if (err) {
            console.error(`Error subscribing to ${row.topic}:`, err);
          } else {
            console.log(`Subscribed to topic: ${row.topic}`);
          }
        });
      });
    });
  }

  handleMessage(topic, message, packet) {
    const messageStr = message.toString();
    console.log(`MQTT Message - Topic: ${topic}, Message: ${messageStr}`);

    const db = getDatabase();
    db.run(
      'INSERT INTO mqtt_messages (topic, message, qos, retain) VALUES (?, ?, ?, ?)',
      [topic, messageStr, packet.qos, packet.retain],
      (err) => {
        if (err) {
          console.error('Error storing MQTT message:', err);
        }
      }
    );
  }

  getStatus() {
    return {
      connected: this.client && this.client.connected,
      broker: appConfig.mqtt.broker,
      clientId: appConfig.mqtt.clientId,
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
      this.client.end();
      this.client = null;
    }
  }
}

module.exports = new MQTTService();
