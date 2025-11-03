# 💻 EJEMPLOS DE CÓDIGO - GALGO-SCHOOL

## Backend Examples

### Ejemplo 1: MQTT Service Connection

```javascript
// server/src/services/mqtt.service.js
class MqttService extends EventEmitter {
  connect(brokerUrl, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        // Si ya está conectado al mismo broker, devolver
        if (this.client && this.isConnected && this.broker === brokerUrl) {
          console.log(`✅ Already connected to: ${brokerUrl}`)
          resolve({ success: true, broker: brokerUrl })
          return
        }

        // Generar unique client ID
        this.clientId = `galgo-api-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        // Configurar opciones por defecto
        const defaultOptions = {
          clientId: this.clientId,
          clean: false,
          connectTimeout: 30000,
          reconnectPeriod: 5000,
          keepalive: 120,
          resubscribe: true,
          ...options
        }

        // Conectar
        console.log(`Connecting to: ${brokerUrl}`)
        this.client = mqtt.connect(brokerUrl, defaultOptions)
        this.broker = brokerUrl

        // Event handlers
        this.client.on('connect', () => {
          console.log(`✅ Connected to MQTT broker`)
          this.isConnected = true
          this.emit('connected', { broker: brokerUrl, clientId: this.clientId })
          this.resubscribeToActiveTopics()
          resolve({ success: true, broker: brokerUrl, clientId: this.clientId })
        })

        this.client.on('error', (error) => {
          console.error('❌ MQTT connection error:', error.message)
          this.isConnected = false
          this.emit('error', error)
          reject(error)
        })

        this.client.on('message', (topic, message, packet) => {
          const messageData = {
            topic,
            message: message.toString(),
            qos: packet.qos,
            retain: packet.retain,
            timestamp: new Date().toISOString()
          }
          this.messages.unshift(messageData)
          if (this.messages.length > this.maxMessages) {
            this.messages = this.messages.slice(0, this.maxMessages)
          }
          this.emit('message', messageData)
        })

      } catch (error) {
        console.error('❌ Error creating MQTT client:', error)
        reject(error)
      }
    })
  }

  subscribe(topic, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.isConnected) {
        reject(new Error('MQTT client not connected'))
        return
      }

      const { qos = 0, active = true } = options

      this.client.subscribe(topic, { qos }, (error, granted) => {
        if (error) {
          console.error(`❌ Error subscribing to ${topic}:`, error)
          reject(error)
        } else {
          this.topics.set(topic, { active, qos, retained: false })
          console.log(`✅ Subscribed to: ${topic}`)
          this.emit('subscribed', { topic, qos, granted })
          resolve({ topic, qos, granted })
        }
      })
    })
  }

  publish(topic, message, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.isConnected) {
        reject(new Error('MQTT client not connected'))
        return
      }

      const { qos = 0, retain = false } = options

      this.client.publish(topic, message, { qos, retain }, (error) => {
        if (error) {
          console.error(`❌ Error publishing to ${topic}:`, error)
          reject(error)
        } else {
          console.log(`📤 Published to ${topic}: ${message}`)
          this.emit('published', { topic, message, qos, retain })
          resolve({ topic, message, qos, retain })
        }
      })
    })
  }
}

// Exportar singleton
const mqttService = new MqttService()
module.exports = mqttService
```

---

### Ejemplo 2: MQTT Controller

```javascript
// server/src/controllers/mqtt.controller.js
class MqttController {
  /**
   * Conectar a MQTT broker
   * POST /api/mqtt/connect
   */
  async connect(req, res) {
    try {
      const { broker, username, password, ssl } = req.body

      // Validar entrada
      if (!broker) {
        return res.status(400).json({
          error: 'Broker URL is required'
        })
      }

      if (!broker.startsWith('mqtt://') && !broker.startsWith('mqtts://')) {
        return res.status(400).json({
          error: 'Invalid broker URL format'
        })
      }

      // Preparar opciones
      const options = {}
      if (username) options.username = username
      if (password) options.password = password
      if (ssl !== undefined) options.rejectUnauthorized = false

      console.log(`Connecting to: ${broker}`)

      // Conectar
      const result = await mqttService.connect(broker, options)

      res.json({
        success: true,
        message: 'Connected to MQTT broker successfully',
        data: result
      })

    } catch (error) {
      console.error('Error connecting to MQTT:', error)
      res.status(400).json({
        success: false,
        error: 'Failed to connect to MQTT broker',
        message: error.message
      })
    }
  }

  /**
   * Publicar mensaje MQTT
   * POST /api/mqtt/publish
   */
  async publishMessage(req, res) {
    try {
      const { topic, message, qos = 0, retain = false } = req.body

      // Validar entrada
      if (!topic) {
        return res.status(400).json({
          error: 'Topic is required'
        })
      }

      if (message === undefined || message === null) {
        return res.status(400).json({
          error: 'Message is required'
        })
      }

      // Publicar
      const result = await mqttService.publish(topic, String(message), {
        qos: parseInt(qos) || 0,
        retain: Boolean(retain)
      })

      res.json({
        success: true,
        message: 'MQTT message published successfully',
        data: result
      })

    } catch (error) {
      console.error('Error publishing MQTT message:', error)
      res.status(500).json({
        error: 'Failed to publish MQTT message',
        message: error.message
      })
    }
  }

  /**
   * Obtener historial de mensajes
   * GET /api/mqtt/messages?limit=20
   */
  async getMessages(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 20
      const messages = mqttService.getMessages(limit)

      res.json({ 
        messages,
        total: messages.length,
        limit 
      })

    } catch (error) {
      console.error('Error getting MQTT messages:', error)
      res.status(500).json({
        error: 'Failed to get MQTT messages',
        message: error.message
      })
    }
  }
}

module.exports = new MqttController()
```

---

### Ejemplo 3: Sensor Service (Database Operations)

```javascript
// server/src/services/sensor.service.js
const { getDatabase } = require('../config/database')

class SensorService {
  getAllSensors() {
    return new Promise((resolve, reject) => {
      const db = getDatabase()
      
      db.all(
        'SELECT * FROM sensors ORDER BY created_at DESC',
        [],
        (err, rows) => {
          if (err) {
            reject(err)
          } else {
            resolve(rows)
          }
        }
      )
    })
  }

  getSensorById(id) {
    return new Promise((resolve, reject) => {
      const db = getDatabase()
      
      db.get(
        'SELECT * FROM sensors WHERE id = ?',
        [id],
        (err, row) => {
          if (err) {
            reject(err)
          } else {
            resolve(row)
          }
        }
      )
    })
  }

  createSensor(sensorData) {
    return new Promise((resolve, reject) => {
      const {
        type,
        name,
        topic,
        description,
        unit,
        min_value,
        max_value,
        active
      } = sensorData

      const db = getDatabase()

      db.run(
        `INSERT INTO sensors 
         (type, name, topic, description, unit, min_value, max_value, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          type,
          name,
          topic,
          description,
          unit,
          min_value,
          max_value,
          active !== undefined ? active : true
        ],
        function(err) {
          if (err) {
            reject(err)
          } else {
            resolve({
              id: this.lastID,
              type,
              name,
              topic,
              description,
              unit,
              min_value,
              max_value,
              active: active !== undefined ? active : true
            })
          }
        }
      )
    })
  }

  updateSensor(id, sensorData) {
    return new Promise((resolve, reject) => {
      const { type, name, topic, description, unit, min_value, max_value, active } = sensorData
      const db = getDatabase()

      db.run(
        `UPDATE sensors 
         SET type = ?, name = ?, topic = ?, description = ?, 
             unit = ?, min_value = ?, max_value = ?, active = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [type, name, topic, description, unit, min_value, max_value, active, id],
        function(err) {
          if (err) {
            reject(err)
          } else if (this.changes === 0) {
            reject(new Error('Sensor not found'))
          } else {
            resolve({ id, type, name, topic, description, unit, min_value, max_value, active })
          }
        }
      )
    })
  }

  deleteSensor(id) {
    return new Promise((resolve, reject) => {
      const db = getDatabase()

      db.run('DELETE FROM sensors WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err)
        } else if (this.changes === 0) {
          reject(new Error('Sensor not found'))
        } else {
          resolve({ deleted: true, id })
        }
      })
    })
  }
}

module.exports = new SensorService()
```

---

## Frontend Examples

### Ejemplo 4: Custom Hook - useFormValidation

```javascript
// client/src/hooks/useFormValidation.js
import { useState, useCallback } from 'react'

export const validationRules = {
  required: (message) => (value) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return message
    }
    return undefined
  },

  minLength: (min, message) => (value) => {
    if (value && value.length < min) {
      return message
    }
    return undefined
  },

  maxLength: (max, message) => (value) => {
    if (value && value.length > max) {
      return message
    }
    return undefined
  },

  email: (message = 'Invalid email') => (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (value && !emailRegex.test(value)) {
      return message
    }
    return undefined
  },

  mqttTopic: (message = 'Invalid MQTT topic format') => (value) => {
    if (!value) return undefined
    
    // Validar formato MQTT
    if (value.includes('#') && value !== '#' && !value.endsWith('/#')) {
      return message
    }
    
    // Validar que no sea vacío
    if (value.trim() === '') {
      return 'Topic cannot be empty'
    }
    
    return undefined
  }
}

export const useFormValidation = (initialValues, rules = {}) => {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  // Validar campo individual
  const validateField = useCallback((fieldName, fieldValue) => {
    const fieldRules = rules[fieldName]
    
    if (!fieldRules) {
      return undefined
    }

    // Si es un array de reglas
    if (Array.isArray(fieldRules)) {
      for (const rule of fieldRules) {
        const error = rule(fieldValue)
        if (error) return error
      }
    }

    // Si es una función personalizada
    if (typeof fieldRules === 'function') {
      return fieldRules(fieldValue, values)
    }

    return undefined
  }, [rules, values])

  // Validar todo el formulario
  const validateForm = useCallback(() => {
    const newErrors = {}
    let isValid = true

    Object.keys(rules).forEach((fieldName) => {
      const error = validateField(fieldName, values[fieldName])
      if (error) {
        newErrors[fieldName] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }, [rules, values, validateField])

  // Manejar cambio
  const handleChange = useCallback((fieldName, fieldValue) => {
    setValues((prev) => ({
      ...prev,
      [fieldName]: fieldValue
    }))

    // Validar mientras tipea (si ya fue tocado)
    if (touched[fieldName]) {
      const error = validateField(fieldName, fieldValue)
      setErrors((prev) => ({
        ...prev,
        [fieldName]: error
      }))
    }
  }, [touched, validateField])

  // Manejar blur
  const handleBlur = useCallback((fieldName) => {
    setTouched((prev) => ({
      ...prev,
      [fieldName]: true
    }))

    const error = validateField(fieldName, values[fieldName])
    setErrors((prev) => ({
      ...prev,
      [fieldName]: error
    }))
  }, [values, validateField])

  // Resetear formulario
  const resetForm = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  // Determinar si es válido
  const isValid = Object.keys(errors).length === 0 &&
                  Object.keys(touched).length > 0

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    resetForm,
    isValid,
    setValues
  }
}
```

---

### Ejemplo 5: React Component - SensorManagement

```jsx
// client/src/components/SensorManagement.jsx
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useFormValidation, validationRules } from '../hooks/useFormValidation'

const SensorManagement = ({ sensors = [], onSensorUpdate }) => {
  const [isAdding, setIsAdding] = useState(false)

  // Form validation
  const sensorForm = useFormValidation(
    { type: '', name: '', data: {} },
    {
      type: [validationRules.required('Sensor type is required')],
      name: [
        validationRules.required('Name is required'),
        validationRules.minLength(2, 'Min 2 characters'),
        validationRules.maxLength(50, 'Max 50 characters')
      ]
    }
  )

  // Agregar sensor
  const addSensor = async () => {
    // Validar
    if (!sensorForm.validateForm()) {
      toast.error('Please fix form errors')
      return
    }

    setIsAdding(true)

    try {
      const response = await fetch(`${API_URL}/api/sensors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: sensorForm.values.type,
          name: sensorForm.values.name,
          topic: `${sensorForm.values.type}/${sensorForm.values.name.replace(/\s+/g, '_').toLowerCase()}`
        })
      })

      if (!response.ok) throw new Error('Failed to add sensor')

      const result = await response.json()
      
      // Refresh lista
      onSensorUpdate?.()
      
      // Reset formulario
      sensorForm.resetForm()
      
      toast.success(`Sensor "${sensorForm.values.name}" added successfully`)
    } catch (error) {
      toast.error(`Error: ${error.message}`)
      console.error('Error adding sensor:', error)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Listado */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Sensors ({sensors.length})</h3>
        </div>

        <div className="divide-y">
          {sensors.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No sensors registered
            </div>
          ) : (
            sensors.map((sensor) => (
              <div key={sensor.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{sensor.name}</p>
                  <p className="text-sm text-gray-500">{sensor.type}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => editSensor(sensor)}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteSensor(sensor.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Agregar formulario */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Add New Sensor</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Sensor Type</label>
            <select
              value={sensorForm.values.type}
              onChange={(e) => sensorForm.handleChange('type', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="">Select Type</option>
              <option value="environmental">Environmental</option>
              <option value="emotibit">EmotiBit</option>
              <option value="rtsp">RTSP Camera</option>
            </select>
            {sensorForm.errors.type && (
              <p className="text-red-500 text-sm mt-1">{sensorForm.errors.type}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Sensor Name</label>
            <input
              type="text"
              placeholder="e.g., Temperature Sensor 1"
              value={sensorForm.values.name}
              onChange={(e) => sensorForm.handleChange('name', e.target.value)}
              onBlur={() => sensorForm.handleBlur('name')}
              className="w-full px-3 py-2 border rounded-lg"
            />
            {sensorForm.errors.name && (
              <p className="text-red-500 text-sm mt-1">{sensorForm.errors.name}</p>
            )}
          </div>

          <button
            onClick={addSensor}
            disabled={isAdding || !sensorForm.isValid}
            className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            {isAdding ? 'Adding...' : 'Add Sensor'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SensorManagement
```

---

### Ejemplo 6: React Context - ThemeContext

```jsx
// client/src/contexts/ThemeContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Recuperar tema guardado
    const saved = localStorage.getItem('galgo-theme')
    return saved || 'light'
  })

  // Aplicar cambios al DOM
  useEffect(() => {
    const root = window.document.documentElement
    
    // Remover clases anteriores
    root.classList.remove('light', 'dark')
    
    // Agregar nueva clase
    root.classList.add(theme)
    
    // Guardar preferencia
    localStorage.setItem('galgo-theme', theme)
  }, [theme])

  // Toggle tema
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
```

---

### Ejemplo 7: Frontend API Call con Polling

```jsx
// client/src/App.jsx (fragmento)
useEffect(() => {
  // Polling automático cada 30 segundos
  if (!configurations.mqtt.autoPolling?.enabled) return

  const interval = setInterval(async () => {
    try {
      // Obtener estado MQTT
      const response = await fetch(`${API_URL}/api/mqtt/status`)
      
      if (response.ok) {
        const data = await response.json()
        
        // Actualizar estado local
        setMqttStatus((prev) => ({
          ...prev,
          connected: data.connected,
          broker: data.broker,
          clientId: data.clientId,
          lastChecked: new Date().toISOString()
        }))
      } else {
        console.error('Failed to fetch MQTT status:', response.status)
      }
    } catch (error) {
      console.error('Polling error:', error)
    }
  }, configurations.mqtt.autoPolling.statusInterval || 30000)

  // Limpiar interval al desmontar
  return () => clearInterval(interval)
}, [configurations.mqtt.autoPolling?.enabled])
```

---

## Database Examples

### Ejemplo 8: Database Initialization

```javascript
// server/src/config/database.js
const sqlite3 = require('sqlite3').verbose()
const path = require('path')

let db = null

const initializeDatabase = () => {
  if (db) return db

  const dbPath = path.join(__dirname, '../../sensors.db')

  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message)
      throw err
    } else {
      console.log('✅ Connected to SQLite database')
      createTables()
    }
  })

  return db
}

const createTables = () => {
  // Tabla: sensors
  db.run(`
    CREATE TABLE IF NOT EXISTS sensors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      topic TEXT NOT NULL,
      description TEXT,
      unit TEXT,
      min_value REAL,
      max_value REAL,
      active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Tabla: mqtt_topics
  db.run(`
    CREATE TABLE IF NOT EXISTS mqtt_topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL UNIQUE,
      description TEXT,
      qos INTEGER DEFAULT 0,
      retained BOOLEAN DEFAULT 0,
      active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Tabla: mqtt_messages
  db.run(`
    CREATE TABLE IF NOT EXISTS mqtt_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      message TEXT,
      qos INTEGER,
      retain BOOLEAN,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Tabla: configurations
  db.run(`
    CREATE TABLE IF NOT EXISTS configurations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(category, key)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating tables:', err)
    } else {
      console.log('✅ Database tables initialized')
    }
  })
}

const getDatabase = () => {
  if (!db) {
    return initializeDatabase()
  }
  return db
}

module.exports = {
  initializeDatabase,
  getDatabase
}
```

---

## Configuration Examples

### Ejemplo 9: MQTT Presets

```javascript
// server/src/config/mqtt.presets.js
const MQTT_PRESETS = {
  'EMQX Local': {
    host: 'localhost',
    port: 1883,
    ssl: false,
    username: '',
    password: '',
    description: 'Local EMQX broker for development'
  },
  'EMQX Remoto': {
    host: '100.107.238.60',
    port: 1883,
    ssl: false,
    username: 'admin',
    password: 'galgo2526',
    description: 'Remote laboratory EMQX broker'
  },
  'EMQX Test': {
    host: '100.82.84.24',
    port: 1883,
    ssl: false,
    username: 'admin',
    password: 'galgo2526',
    description: 'Test EMQX broker'
  },
  'HiveMQ Cloud': {
    host: 'broker.hivemq.com',
    port: 8883,
    ssl: true,
    username: '',
    password: '',
    description: 'HiveMQ Cloud broker'
  }
}

const getMqttPreset = (presetName) => {
  return MQTT_PRESETS[presetName] || MQTT_PRESETS['Custom']
}

const buildBrokerUrl = (config) => {
  const protocol = config.ssl ? 'mqtts' : 'mqtt'
  return `${protocol}://${config.host}:${config.port}`
}

module.exports = {
  MQTT_PRESETS,
  getMqttPreset,
  buildBrokerUrl
}
```

---

**Estos ejemplos cubren los patrones principales del proyecto y pueden ser usados como referencia para agregar nuevas funcionalidades.**

