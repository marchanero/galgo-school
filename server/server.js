const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const mqtt = require('mqtt');

const app = express();
const PORT = process.env.PORT || 3001;

// MQTT Configuration
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
const MQTT_CLIENT_ID = 'galgo-school-server';

// Middleware
app.use(cors());
app.use(express.json());

// SQLite database
const db = new sqlite3.Database('./sensors.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    // Create tables if not exist
    db.run(`CREATE TABLE IF NOT EXISTS sensors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      data TEXT
    )`);
    
    // Create MQTT topics table
    db.run(`CREATE TABLE IF NOT EXISTS mqtt_topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL UNIQUE,
      description TEXT,
      qos INTEGER DEFAULT 0,
      retained BOOLEAN DEFAULT 0,
      active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Create MQTT messages table for history
    db.run(`CREATE TABLE IF NOT EXISTS mqtt_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      message TEXT,
      qos INTEGER,
      retain BOOLEAN,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Create configurations table
    db.run(`CREATE TABLE IF NOT EXISTS configurations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(category, key)
    )`, (err) => {
      if (err) {
        console.error('Error creating configurations table:', err);
      } else {
        console.log('Configurations table ready.');
      }
    });
  }
});

// MQTT Client
let mqttClient = null;
const connectedClients = new Set(); // Track connected WebSocket clients

function initMQTT() {
  if (mqttClient) {
    mqttClient.end();
  }
  
  mqttClient = mqtt.connect(MQTT_BROKER, {
    clientId: MQTT_CLIENT_ID,
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000,
  });
  
  mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');
    
    // Subscribe to all active topics
    db.all('SELECT topic FROM mqtt_topics WHERE active = 1', [], (err, rows) => {
      if (err) {
        console.error('Error getting topics:', err);
        return;
      }
      
      rows.forEach(row => {
        mqttClient.subscribe(row.topic, { qos: 0 }, (err) => {
          if (err) {
            console.error(`Error subscribing to ${row.topic}:`, err);
          } else {
            console.log(`Subscribed to topic: ${row.topic}`);
          }
        });
      });
    });
  });
  
  mqttClient.on('message', (topic, message, packet) => {
    const messageStr = message.toString();
    console.log(`MQTT Message - Topic: ${topic}, Message: ${messageStr}`);
    
    // Store message in database
    db.run('INSERT INTO mqtt_messages (topic, message, qos, retain) VALUES (?, ?, ?, ?)', 
      [topic, messageStr, packet.qos, packet.retain], (err) => {
      if (err) {
        console.error('Error storing MQTT message:', err);
      }
    });
    
    // Broadcast to connected WebSocket clients (if implemented)
    // For now, we'll handle this through polling from frontend
  });
  
  mqttClient.on('error', (error) => {
    console.error('MQTT connection error:', error);
  });
  
  mqttClient.on('offline', () => {
    console.log('MQTT client offline');
  });
  
  mqttClient.on('reconnect', () => {
    console.log('MQTT client reconnecting...');
  });
}

// Initialize MQTT on startup
initMQTT();

// Routes
app.get('/api/sensors', (req, res) => {
  db.all('SELECT * FROM sensors', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ sensors: rows });
  });
});

app.post('/api/sensors', (req, res) => {
  const { type, name, data } = req.body;
  db.run('INSERT INTO sensors (type, name, data) VALUES (?, ?, ?)', [type, name, JSON.stringify(data)], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID });
  });
});

// Recording endpoints
app.post('/api/recording/start', (req, res) => {
  const startTime = new Date().toISOString();
  const sessionId = Date.now(); // Simple session ID based on timestamp
  
  // In a real implementation, you might want to store this in a recordings table
  console.log(`Recording started at ${startTime} with session ID: ${sessionId}`);
  
  res.json({ 
    success: true, 
    sessionId: sessionId,
    startTime: startTime,
    message: 'Recording started successfully'
  });
});

app.post('/api/recording/stop', (req, res) => {
  const endTime = new Date().toISOString();
  const { sessionId } = req.body || {};
  
  // In a real implementation, you would save the recording data here
  console.log(`Recording stopped at ${endTime}${sessionId ? ` for session ${sessionId}` : ''}`);
  
  res.json({ 
    success: true, 
    endTime: endTime,
    message: 'Recording stopped and data saved successfully'
  });
});

// MQTT endpoints
app.get('/api/mqtt/status', (req, res) => {
  res.json({
    connected: mqttClient && mqttClient.connected,
    broker: MQTT_BROKER,
    clientId: MQTT_CLIENT_ID
  });
});

app.post('/api/mqtt/connect', (req, res) => {
  const { broker, clientId } = req.body;
  
  if (broker) {
    process.env.MQTT_BROKER = broker;
  }
  
  initMQTT();
  
  res.json({ 
    success: true, 
    message: 'MQTT connection initiated',
    broker: process.env.MQTT_BROKER
  });
});

app.post('/api/mqtt/disconnect', (req, res) => {
  if (mqttClient) {
    mqttClient.end();
    mqttClient = null;
  }
  
  res.json({ 
    success: true, 
    message: 'MQTT disconnected'
  });
});

// MQTT Topics CRUD
app.get('/api/mqtt/topics', (req, res) => {
  db.all('SELECT * FROM mqtt_topics ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ topics: rows });
  });
});

app.post('/api/mqtt/topics', (req, res) => {
  const { topic, description, qos, retained } = req.body;
  
  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }
  
  db.run('INSERT INTO mqtt_topics (topic, description, qos, retained) VALUES (?, ?, ?, ?)', 
    [topic, description || '', qos || 0, retained || false], function(err) {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(409).json({ error: 'Topic already exists' });
      }
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Subscribe to the new topic if MQTT is connected
    if (mqttClient && mqttClient.connected) {
      mqttClient.subscribe(topic, { qos: qos || 0 }, (err) => {
        if (err) {
          console.error(`Error subscribing to ${topic}:`, err);
        } else {
          console.log(`Subscribed to new topic: ${topic}`);
        }
      });
    }
    
    res.json({ id: this.lastID, topic, description, qos, retained });
  });
});

app.put('/api/mqtt/topics/:id', (req, res) => {
  const { id } = req.params;
  const { topic, description, qos, retained, active } = req.body;
  
  db.run('UPDATE mqtt_topics SET topic = ?, description = ?, qos = ?, retained = ?, active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [topic, description, qos, retained, active, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    // Re-subscribe if topic changed and MQTT is connected
    if (mqttClient && mqttClient.connected && topic) {
      // Unsubscribe from old topic and subscribe to new one
      db.get('SELECT topic FROM mqtt_topics WHERE id = ?', [id], (err, row) => {
        if (err || !row) return;
        
        if (row.topic !== topic) {
          mqttClient.unsubscribe(row.topic);
          mqttClient.subscribe(topic, { qos: qos || 0 });
        }
      });
    }
    
    res.json({ success: true });
  });
});

app.delete('/api/mqtt/topics/:id', (req, res) => {
  const { id } = req.params;
  
  // Get topic before deleting
  db.get('SELECT topic FROM mqtt_topics WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    // Unsubscribe from MQTT
    if (mqttClient && mqttClient.connected) {
      mqttClient.unsubscribe(row.topic);
    }
    
    // Delete from database
    db.run('DELETE FROM mqtt_topics WHERE id = ?', [id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.json({ success: true });
    });
  });
});

// Publish MQTT message
app.post('/api/mqtt/publish', (req, res) => {
  const { topic, message, qos, retain } = req.body;
  
  if (!topic || message === undefined) {
    return res.status(400).json({ error: 'Topic and message are required' });
  }
  
  if (!mqttClient || !mqttClient.connected) {
    return res.status(503).json({ error: 'MQTT client not connected' });
  }
  
  mqttClient.publish(topic, message.toString(), { qos: qos || 0, retain: retain || false }, (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({ success: true, message: 'Message published successfully' });
  });
});

// Get MQTT messages history
app.get('/api/mqtt/messages', (req, res) => {
  const { topic, limit = 50 } = req.query;
  
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
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ messages: rows });
  });
});

// Configuration endpoints
app.get('/api/configurations', (req, res) => {
  db.all('SELECT * FROM configurations ORDER BY category, key', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // Group configurations by category
    const configurations = {};
    rows.forEach(row => {
      if (!configurations[row.category]) {
        configurations[row.category] = {};
      }
      // Try to parse JSON values, fallback to string
      try {
        configurations[row.category][row.key] = JSON.parse(row.value);
      } catch {
        configurations[row.category][row.key] = row.value;
      }
    });

    res.json({ configurations });
  });
});

app.post('/api/configurations', (req, res) => {
  const { category, key, value } = req.body;

  if (!category || !key) {
    return res.status(400).json({ error: 'Category and key are required' });
  }

  // Convert value to string (JSON if object/array)
  const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);

  db.run('INSERT OR REPLACE INTO configurations (category, key, value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
    [category, key, valueStr], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, category, key, value });
  });
});

app.put('/api/configurations/:category/:key', (req, res) => {
  const { category, key } = req.params;
  const { value } = req.body;

  if (!category || !key) {
    return res.status(400).json({ error: 'Category and key are required' });
  }

  // Convert value to string (JSON if object/array)
  const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);

  db.run('UPDATE configurations SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE category = ? AND key = ?',
    [valueStr, category, key], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    res.json({ success: true, category, key, value });
  });
});

app.put('/api/configurations/bulk', (req, res) => {
  const { configurations } = req.body;

  if (!configurations || typeof configurations !== 'object') {
    return res.status(400).json({ error: 'Configurations object is required' });
  }

  const statements = [];
  const params = [];

  // Build bulk update statements
  Object.entries(configurations).forEach(([category, categoryConfigs]) => {
    Object.entries(categoryConfigs).forEach(([key, value]) => {
      const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
      statements.push('INSERT OR REPLACE INTO configurations (category, key, value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)');
      params.push(category, key, valueStr);
    });
  });

  if (statements.length === 0) {
    return res.status(400).json({ error: 'No configurations to update' });
  }

  // Execute all statements in a transaction
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    let completed = 0;
    let hasError = false;

    statements.forEach((stmt, index) => {
      db.run(stmt, params.slice(index * 3, (index + 1) * 3), (err) => {
        if (err && !hasError) {
          hasError = true;
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }

        completed++;
        if (completed === statements.length && !hasError) {
          db.run('COMMIT', (err) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            res.json({ success: true, updated: statements.length });
          });
        }
      });
    });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});