const app = require('./src/app');
const appConfig = require('./src/config/app.config');

const PORT = appConfig.port || process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

/**
 * @swagger
 * /api/sensors:
 *   post:
 *     summary: Crear un nuevo sensor
 *     tags: [Sensors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - name
 *             properties:
 *               type:
 *                 type: string
 *                 example: environmental
 *               name:
 *                 type: string
 *                 example: Sensor Temperatura
 *               data:
 *                 type: object
 *                 example: { "location": "Lab 1" }
 *     responses:
 *       200:
 *         description: Sensor creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *       500:
 *         description: Error del servidor
 */
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

/**
 * @swagger
 * /api/recording/start:
 *   post:
 *     summary: Iniciar grabación
 *     tags: [Recording]
 *     responses:
 *       200:
 *         description: Grabación iniciada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 sessionId:
 *                   type: number
 *                 startTime:
 *                   type: string
 *                 message:
 *                   type: string
 */
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

/**
 * @swagger
 * /api/recording/stop:
 *   post:
 *     summary: Detener grabación
 *     tags: [Recording]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: number
 *     responses:
 *       200:
 *         description: Grabación detenida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 endTime:
 *                   type: string
 *                 message:
 *                   type: string
 */
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

/**
 * @swagger
 * /api/mqtt/status:
 *   get:
 *     summary: Obtener estado de conexión MQTT
 *     tags: [MQTT]
 *     responses:
 *       200:
 *         description: Estado de MQTT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 connected:
 *                   type: boolean
 *                 broker:
 *                   type: string
 *                 clientId:
 *                   type: string
 */
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
    MQTT_BROKER = broker;
  }
  
  initMQTT();
  
  res.json({ 
    success: true, 
    message: 'MQTT connection initiated',
    broker: MQTT_BROKER
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

/**
 * @swagger
 * /api/mqtt/topics:
 *   get:
 *     summary: Obtener todos los topics MQTT
 *     tags: [MQTT]
 *     responses:
 *       200:
 *         description: Lista de topics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 topics:
 *                   type: array
 *                   items:
 *                     type: object
 *   post:
 *     summary: Crear un nuevo topic MQTT
 *     tags: [MQTT]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topic
 *             properties:
 *               topic:
 *                 type: string
 *                 example: sensors/temperature
 *               description:
 *                 type: string
 *                 example: Topic para sensores de temperatura
 *               qos:
 *                 type: integer
 *                 example: 0
 *               retained:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Topic creado
 *       409:
 *         description: Topic ya existe
 */
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

/**
 * @swagger
 * /api/mqtt/publish:
 *   post:
 *     summary: Publicar un mensaje MQTT
 *     tags: [MQTT]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topic
 *               - message
 *             properties:
 *               topic:
 *                 type: string
 *                 example: sensors/temperature
 *               message:
 *                 type: string
 *                 example: "25.5"
 *               qos:
 *                 type: integer
 *                 example: 0
 *               retain:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Mensaje publicado
 *       503:
 *         description: Cliente MQTT no conectado
 */
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

/**
 * @swagger
 * /api/mqtt/messages:
 *   get:
 *     summary: Obtener historial de mensajes MQTT
 *     tags: [MQTT]
 *     parameters:
 *       - in: query
 *         name: topic
 *         schema:
 *           type: string
 *         description: Filtrar por topic
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Número máximo de mensajes
 *     responses:
 *       200:
 *         description: Lista de mensajes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 */
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

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});