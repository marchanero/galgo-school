const mqtt = require('mqtt');
const EventEmitter = require('events');

class MqttService extends EventEmitter {
  constructor() {
    super();
    this.client = null;
    this.isConnected = false;
    this.broker = null;
    this.clientId = null;
    this.topics = new Map(); // topic -> { active, qos, retained }
    this.messages = []; // Array to store recent messages
    this.maxMessages = 100; // Maximum messages to store
  }

  /**
   * Connect to MQTT broker
   * @param {string} brokerUrl - MQTT broker URL (e.g., 'mqtt://localhost:1883')
   * @param {Object} options - Connection options
   */
  connect(brokerUrl, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        // Generate unique client ID
        this.clientId = `galgo-api-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const defaultOptions = {
          clientId: this.clientId,
          clean: true,
          connectTimeout: 4000,
          reconnectPeriod: 1000,
          keepalive: 60,
          ...options
        };

        console.log(`Connecting to MQTT broker: ${brokerUrl}`);
        this.client = mqtt.connect(brokerUrl, defaultOptions);
        this.broker = brokerUrl;

        // Connection successful
        this.client.on('connect', () => {
          console.log(`✅ Connected to MQTT broker: ${brokerUrl}`);
          this.isConnected = true;
          this.emit('connected', { broker: brokerUrl, clientId: this.clientId });

          // Re-subscribe to active topics
          this.resubscribeToActiveTopics();

          resolve({ success: true, broker: brokerUrl, clientId: this.clientId });
        });

        // Connection error
        this.client.on('error', (error) => {
          console.error('❌ MQTT connection error:', error.message);
          this.isConnected = false;
          this.emit('error', error);
          
          // Don't reject if promise already resolved
          if (reject) {
            reject(error);
            reject = null; // Prevent multiple calls
          }
        });

        // Connection close
        this.client.on('close', () => {
          console.log('🔌 MQTT connection closed');
          this.isConnected = false;
          this.emit('disconnected');
        });

        // Connection offline
        this.client.on('offline', () => {
          console.log('📡 MQTT client offline');
          this.isConnected = false;
          this.emit('offline');
        });

        // Connection timeout
        this.client.on('end', () => {
          console.log('🔌 MQTT connection ended');
          this.isConnected = false;
        });

        // Prevent uncaught exceptions
        this.client.on('disconnect', () => {
          console.log('🔌 MQTT disconnected');
          this.isConnected = false;
          this.emit('disconnected');
        });

        // Reconnect
        this.client.on('reconnect', () => {
          console.log('🔄 MQTT reconnecting...');
          this.emit('reconnecting');
        });

        // Message received
        this.client.on('message', (topic, message, packet) => {
          const messageData = {
            topic,
            message: message.toString(),
            qos: packet.qos,
            retain: packet.retain,
            timestamp: new Date().toISOString()
          };

          // Store message
          this.messages.unshift(messageData);
          if (this.messages.length > this.maxMessages) {
            this.messages = this.messages.slice(0, this.maxMessages);
          }

          console.log(`�� MQTT message received: ${topic} -> ${message.toString()}`);
          this.emit('message', messageData);
        });

      } catch (error) {
        console.error('❌ Error creating MQTT client:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from MQTT broker
   */
  disconnect() {
    return new Promise((resolve) => {
      if (this.client && this.isConnected) {
        console.log('Disconnecting from MQTT broker...');
        this.client.end(false, () => {
          this.isConnected = false;
          this.client = null;
          this.emit('disconnected');
          console.log('✅ Disconnected from MQTT broker');
          resolve({ success: true });
        });
      } else {
        resolve({ success: true, message: 'Already disconnected' });
      }
    });
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      broker: this.broker,
      clientId: this.clientId,
      topics: Array.from(this.topics.entries()).map(([topic, config]) => ({
        topic,
        ...config
      }))
    };
  }

  /**
   * Subscribe to a topic
   * @param {string} topic - MQTT topic
   * @param {Object} options - Subscription options
   */
  subscribe(topic, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.isConnected) {
        reject(new Error('MQTT client not connected'));
        return;
      }

      const { qos = 0, active = true } = options;

      this.client.subscribe(topic, { qos }, (error, granted) => {
        if (error) {
          console.error(`❌ Error subscribing to ${topic}:`, error);
          reject(error);
        } else {
          // Store topic configuration
          this.topics.set(topic, { active, qos, retained: false });
          console.log(`✅ Subscribed to topic: ${topic} (QoS: ${qos})`);
          this.emit('subscribed', { topic, qos, granted });
          resolve({ topic, qos, granted });
        }
      });
    });
  }

  /**
   * Unsubscribe from a topic
   * @param {string} topic - MQTT topic
   */
  unsubscribe(topic) {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.isConnected) {
        reject(new Error('MQTT client not connected'));
        return;
      }

      this.client.unsubscribe(topic, (error) => {
        if (error) {
          console.error(`❌ Error unsubscribing from ${topic}:`, error);
          reject(error);
        } else {
          // Remove topic from stored topics
          this.topics.delete(topic);
          console.log(`✅ Unsubscribed from topic: ${topic}`);
          this.emit('unsubscribed', { topic });
          resolve({ topic });
        }
      });
    });
  }

  /**
   * Publish a message to a topic
   * @param {string} topic - MQTT topic
   * @param {string} message - Message payload
   * @param {Object} options - Publish options
   */
  publish(topic, message, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.isConnected) {
        reject(new Error('MQTT client not connected'));
        return;
      }

      const { qos = 0, retain = false } = options;

      this.client.publish(topic, message, { qos, retain }, (error) => {
        if (error) {
          console.error(`❌ Error publishing to ${topic}:`, error);
          reject(error);
        } else {
          console.log(`📤 Published message to ${topic}: ${message}`);
          this.emit('published', { topic, message, qos, retain });
          resolve({ topic, message, qos, retain });
        }
      });
    });
  }

  /**
   * Get all topics
   */
  getTopics() {
    return Array.from(this.topics.entries()).map(([topic, config]) => ({
      id: topic.replace(/[^a-zA-Z0-9]/g, '_'), // Create ID from topic
      topic,
      ...config
    }));
  }

  /**
   * Get recent messages
   * @param {number} limit - Maximum number of messages to return
   */
  getMessages(limit = 20) {
    return this.messages.slice(0, limit);
  }

  /**
   * Update topic configuration
   * @param {string} topic - MQTT topic
   * @param {Object} updates - Updates to apply
   */
  updateTopic(topic, updates) {
    if (this.topics.has(topic)) {
      const currentConfig = this.topics.get(topic);
      const newConfig = { ...currentConfig, ...updates };
      this.topics.set(topic, newConfig);

      // If active status changed, subscribe/unsubscribe accordingly
      if (updates.active !== undefined) {
        if (updates.active && !currentConfig.active) {
          // Was inactive, now active - subscribe
          return this.subscribe(topic, newConfig);
        } else if (!updates.active && currentConfig.active) {
          // Was active, now inactive - unsubscribe
          return this.unsubscribe(topic);
        }
      }

      return Promise.resolve({ topic, ...newConfig });
    } else {
      throw new Error(`Topic ${topic} not found`);
    }
  }

  /**
   * Delete a topic
   * @param {string} topic - MQTT topic
   */
  deleteTopic(topic) {
    if (this.topics.has(topic)) {
      // Unsubscribe first if active
      const config = this.topics.get(topic);
      if (config.active) {
        return this.unsubscribe(topic).then(() => {
          this.topics.delete(topic);
          return { topic };
        });
      } else {
        this.topics.delete(topic);
        return Promise.resolve({ topic });
      }
    } else {
      throw new Error(`Topic ${topic} not found`);
    }
  }

  /**
   * Add a topic to the list (without subscribing)
   * @param {string} topic - MQTT topic
   * @param {Object} options - Topic options
   */
  addTopic(topic, options = {}) {
    const { qos = 0, retained = false, active = false } = options;
    this.topics.set(topic, { active, qos, retained });

    // Subscribe if active
    if (active) {
      return this.subscribe(topic, { qos });
    }

    return Promise.resolve({ topic, active, qos, retained });
  }

  /**
   * Re-subscribe to all active topics (called after reconnection)
   */
  resubscribeToActiveTopics() {
    const activeTopics = Array.from(this.topics.entries())
      .filter(([, config]) => config.active);

    if (activeTopics.length > 0) {
      console.log(`Re-subscribing to ${activeTopics.length} active topics...`);
      activeTopics.forEach(([topic, config]) => {
        this.subscribe(topic, config).catch(error => {
          console.error(`Failed to re-subscribe to ${topic}:`, error);
        });
      });
    }
  }
}

// Create singleton instance
const mqttService = new MqttService();

module.exports = mqttService;
