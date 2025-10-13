const mqttService = require('../services/mqtt.service');
const { getDatabase } = require('../config/database');

class MQTTController {
  getStatus(req, res) {
    try {
      const status = mqttService.getStatus();
      res.json(status);
    } catch (error) {
      console.error('Error getting MQTT status:', error);
      res.status(500).json({ error: error.message });
    }
  }

  connect(req, res) {
    try {
      const { broker, clientId } = req.body;
      
      if (broker) {
        process.env.MQTT_BROKER = broker;
      }
      
      mqttService.initialize();
      
      res.json({
        success: true,
        message: 'MQTT connection initiated',
        broker: process.env.MQTT_BROKER,
      });
    } catch (error) {
      console.error('Error connecting to MQTT:', error);
      res.status(500).json({ error: error.message });
    }
  }

  disconnect(req, res) {
    try {
      mqttService.disconnect();
      res.json({
        success: true,
        message: 'MQTT disconnected',
      });
    } catch (error) {
      console.error('Error disconnecting MQTT:', error);
      res.status(500).json({ error: error.message });
    }
  }

  getAllTopics(req, res) {
    const db = getDatabase();
    
    db.all('SELECT * FROM mqtt_topics ORDER BY created_at DESC', [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ topics: rows });
    });
  }

  async createTopic(req, res) {
    try {
      const { topic, description, qos, retained } = req.body;
      
      if (!topic) {
        return res.status(400).json({ error: 'Topic is required' });
      }
      
      const db = getDatabase();
      
      db.run(
        'INSERT INTO mqtt_topics (topic, description, qos, retained) VALUES (?, ?, ?, ?)',
        [topic, description || '', qos || 0, retained || false],
        async function(err) {
          if (err) {
            if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
              return res.status(409).json({ error: 'Topic already exists' });
            }
            return res.status(500).json({ error: err.message });
          }
          
          // Subscribe to the new topic
          try {
            await mqttService.subscribe(topic, qos || 0);
            console.log(`Subscribed to new topic: ${topic}`);
          } catch (error) {
            console.error(`Error subscribing to ${topic}:`, error);
          }
          
          res.status(201).json({
            id: this.lastID,
            topic,
            description,
            qos,
            retained,
          });
        }
      );
    } catch (error) {
      console.error('Error creating topic:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async updateTopic(req, res) {
    try {
      const { id } = req.params;
      const { topic, description, qos, retained, active } = req.body;
      
      const db = getDatabase();
      
      // Get old topic first
      db.get('SELECT topic FROM mqtt_topics WHERE id = ?', [id], async (err, oldRow) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (!oldRow) {
          return res.status(404).json({ error: 'Topic not found' });
        }
        
        // Update topic
        db.run(
          'UPDATE mqtt_topics SET topic = ?, description = ?, qos = ?, retained = ?, active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [topic, description, qos, retained, active, id],
          async function(err) {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            
            if (this.changes === 0) {
              return res.status(404).json({ error: 'Topic not found' });
            }
            
            // Resubscribe if topic changed
            if (oldRow.topic !== topic) {
              try {
                await mqttService.unsubscribe(oldRow.topic);
                await mqttService.subscribe(topic, qos || 0);
                console.log(`Resubscribed from ${oldRow.topic} to ${topic}`);
              } catch (error) {
                console.error('Error resubscribing:', error);
              }
            }
            
            res.json({ success: true });
          }
        );
      });
    } catch (error) {
      console.error('Error updating topic:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async deleteTopic(req, res) {
    try {
      const { id } = req.params;
      const db = getDatabase();
      
      // Get topic before deleting
      db.get('SELECT topic FROM mqtt_topics WHERE id = ?', [id], async (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (!row) {
          return res.status(404).json({ error: 'Topic not found' });
        }
        
        // Unsubscribe from MQTT
        try {
          await mqttService.unsubscribe(row.topic);
        } catch (error) {
          console.error('Error unsubscribing:', error);
        }
        
        // Delete from database
        db.run('DELETE FROM mqtt_topics WHERE id = ?', [id], function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          res.json({ success: true });
        });
      });
    } catch (error) {
      console.error('Error deleting topic:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async publish(req, res) {
    try {
      const { topic, message, qos, retain } = req.body;
      
      if (!topic || message === undefined) {
        return res.status(400).json({ error: 'Topic and message are required' });
      }
      
      await mqttService.publish(topic, message, { qos, retain });
      res.json({ success: true, message: 'Message published successfully' });
    } catch (error) {
      console.error('Error publishing message:', error);
      
      if (error.message === 'MQTT client not connected') {
        return res.status(503).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message });
    }
  }

  getMessages(req, res) {
    const { topic, limit = 50 } = req.query;
    const db = getDatabase();
    
    let query = 'SELECT * FROM mqtt_messages';
    let params = [];
    
    if (topic) {
      query += ' WHERE topic = ?';
      params.push(topic);
    }
    
    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(parseInt(limit));
    
    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ messages: rows });
    });
  }
}

module.exports = new MQTTController();
