# 📊 ANÁLISIS PROFUNDO DEL PROYECTO GALGO-SCHOOL

## 📋 Índice
1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Patrones de Programación](#patrones-de-programación)
6. [Flujos de Datos](#flujos-de-datos)
7. [Componentes Clave](#componentes-clave)
8. [Base de Datos](#base-de-datos)
9. [API REST](#api-rest)
10. [Frontend](#frontend)
11. [MQTT Integration](#mqtt-integration)
12. [Deployment](#deployment)

---

## 🎯 Visión General

**Galgo-School** es una plataforma **full-stack** diseñada para:

- **Gestión de Sensores**: Administración centralizada de sensores ambientales, EmotiBit y cámaras RTSP
- **Monitoreo en Tiempo Real**: Comunicación bidireccional mediante MQTT
- **Grabación Sincronizada**: Captura simultánea de datos de múltiples sensores
- **Research Platform**: Sistema modular para investigación educativa

### Características Principales:
✅ Gestión de sensores heterogéneos  
✅ Comunicación MQTT en tiempo real  
✅ Control de grabación sincronizado  
✅ Interfaz dual (React + React+TypeScript)  
✅ Containerización Docker  
✅ Documentación Swagger  
✅ Soporte dark mode y multiidioma  

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    GALGO-SCHOOL ARCHITECTURE                     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐      ┌──────────────────────┐
│   CLIENT (React)     │      │  CLIENT2 (React+TS)  │
│  - Dashboard         │      │  - Simplified UI     │
│  - Full Control      │      │  - RFID Support      │
│  - Configuration     │      │  - User Context      │
└─────────┬────────────┘      └──────────┬───────────┘
          │                              │
          │ HTTP/CORS                    │
          └──────────┬───────────────────┘
                     │
          ┌──────────▼────────────┐
          │   EXPRESS API         │
          │   (Node.js Backend)   │
          │                       │
          │  ┌────────────────┐   │
          │  │  Controllers   │   │
          │  ├────────────────┤   │
          │  │  - MQTT        │   │
          │  │  - Sensors     │   │
          │  │  - Cameras     │   │
          │  │  - Config      │   │
          │  └────────────────┘   │
          └──────────┬────────────┘
                     │
      ┌──────────────┼──────────────┐
      │              │              │
   MQTT         SQLite          FileSystem
   Broker      Database         Storage
   (EMQX)      sensors.db       (recordings)
```

### Componentes Principales:

| Componente | Rol | Tecnología |
|-----------|-----|------------|
| **Frontend (Client)** | UI completa con dashboard avanzado | React 19.1.1 + Tailwind + Vite |
| **Frontend (Client2)** | UI simplificada con RFID | React 19.1.1 + TypeScript + Tailwind |
| **Backend** | API REST y lógica de negocio | Express 5.1.0 + Node.js |
| **Base de Datos** | Persistencia de configuraciones | SQLite 5.1.7 |
| **MQTT Broker** | Comunicación tiempo real | EMQX (externos) |
| **Docker** | Orquestación de servicios | Docker Compose |

---

## 🛠️ Stack Tecnológico

### Frontend
```javascript
{
  "core": ["React 19.1.1", "React DOM 19.1.1"],
  "styling": ["Tailwind CSS 3.3.5", "PostCSS"],
  "state": ["React Hooks (useState, useEffect, useContext)"],
  "networking": ["Axios 1.12.2", "Fetch API"],
  "notifications": ["React Hot Toast 2.6.0"],
  "bundler": ["Vite 5.4.0"],
  "linting": ["ESLint 9.36.0"]
}
```

### Backend
```javascript
{
  "runtime": ["Node.js"],
  "framework": ["Express 5.1.0"],
  "database": ["SQLite 5.1.7"],
  "mqtt": ["mqtt 5.14.1"],
  "middleware": ["CORS", "Express JSON Parser"],
  "documentation": ["Swagger/OpenAPI"],
  "utilities": ["dotenv 17.2.3"]
}
```

### DevOps
```yaml
containerization:
  - Docker
  - Docker Compose
ci_cd:
  - GitHub Actions (self-hosted)
monitoring:
  - Health Check endpoints
```

---

## 📁 Estructura del Proyecto

```
galgo-school/
├── client-configurator/             # React Frontend (JavaScript)
│   ├── src/
│   │   ├── App.jsx                 # Componente principal
│   │   ├── main.jsx                # Entry point
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Navegación
│   │   │   ├── SensorManagement.jsx # Gestión de sensores
│   │   │   ├── MqttConnectionStatus.jsx
│   │   │   ├── MqttMessageCard.jsx
│   │   │   ├── MqttStatusCard.jsx
│   │   │   ├── MqttTopicCard.jsx
│   │   │   ├── SensorCard.jsx
│   │   │   └── RecordingControl.jsx
│   │   ├── contexts/
│   │   │   └── ThemeContext.jsx    # Context global para tema
│   │   ├── hooks/
│   │   │   └── useFormValidation.js # Validación de formularios
│   │   ├── assets/
│   │   └── index.css
│   ├── public/
│   ├── Dockerfile
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── eslint.config.js
│   └── package.json
│
├── client2/                         # React+TypeScript Frontend
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── RFIDIdentification.tsx
│   │   │   ├── RecordingControl.tsx
│   │   │   ├── SensorCard.tsx
│   │   │   └── MqttConnectionStatus.tsx
│   │   ├── contexts/
│   │   │   ├── UserContext.tsx
│   │   │   └── themeContext.ts
│   │   ├── hooks/
│   │   │   ├── useTheme.ts
│   │   │   └── useRFID.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── index.css
│   ├── public/
│   ├── Dockerfile
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── eslint.config.js
│   └── package.json
│
├── server/                          # Express Backend
│   ├── src/
│   │   ├── app.js                  # Configuración Express
│   │   ├── index.js                # Entry point (dev)
│   │   ├── config/
│   │   │   ├── app.config.js       # Configuración general
│   │   │   ├── database.js         # Inicialización SQLite
│   │   │   ├── mqtt.presets.js     # Presets de brokers MQTT
│   │   │   └── swagger.js          # Config Swagger
│   │   ├── controllers/
│   │   │   ├── mqtt.controller.js  # Lógica MQTT
│   │   │   ├── sensor.controller.js
│   │   │   ├── sensors.controller.js
│   │   │   ├── health.controller.js
│   │   │   ├── camera.controller.js
│   │   │   ├── user.controller.js
│   │   │   ├── nfc-event.controller.js
│   │   │   ├── topics.controller.js
│   │   │   └── configuration.controller.js
│   │   ├── services/
│   │   │   ├── mqtt.service.js     # Singleton MQTT
│   │   │   └── sensor.service.js   # Lógica de BD
│   │   ├── routes/
│   │   │   ├── index.js            # Router principal
│   │   │   ├── mqtt.routes.js
│   │   │   ├── sensor.routes.js
│   │   │   ├── health.routes.js
│   │   │   ├── camera.routes.js
│   │   │   ├── user.routes.js
│   │   │   ├── nfc-event.routes.js
│   │   │   ├── topics.routes.js
│   │   │   ├── configuration.routes.js
│   │   │   ├── cameras.routes.js
│   │   │   └── sensors.routes.js
│   │   ├── middlewares/
│   │   │   ├── errorHandler.js    # Manejo global de errores
│   │   │   └── logger.js          # Logging de requests
│   │   └── database/
│   │       └── init-sensors.js    # Script de inicialización
│   ├── Dockerfile
│   ├── server.js                   # Entry point (prod)
│   ├── test-mqtt.js               # Script de prueba
│   ├── restart-emqx.sh            # Script reinicio
│   └── package.json
│
├── mern-lector-rfid-main/          # Módulo RFID heredado
│   ├── backend/
│   ├── frontend/
│   └── package.json
│
├── docker-compose.yml              # Orquestación
├── pnpm-workspace.yaml             # Workspaces monorepo
├── pnpm-lock.yaml                  # Lock de dependencias
├── package.json                    # Scripts raíz
└── README.md
```

---

## 💻 Patrones de Programación

### 1. **Patrón Singleton (MQTT Service)**
```javascript
// mqtt.service.js - Única instancia en toda la aplicación
class MqttService extends EventEmitter {
  constructor() {
    super();
    this.client = null;
    this.topics = new Map();
    this.messages = [];
  }
}

const mqttService = new MqttService();
module.exports = mqttService; // Siempre la misma instancia
```

**Uso**: Garantiza una única conexión MQTT activa

---

### 2. **Patrón Service-Controller (Backend)**
```javascript
// Estructura en 3 capas:
// Controller (Request/Response) → Service (Lógica) → DB

// mqtt.controller.js
async connect(req, res) {
  const result = await mqttService.connect(broker, options);
  res.json(result);
}

// mqtt.service.js - maneja toda la lógica
connect(brokerUrl, options) {
  return new Promise((resolve, reject) => {
    // Lógica conexión
  });
}
```

---

### 3. **React Hooks Pattern**
```javascript
// Custom Hook para validación
const { values, errors, touched, handleChange, validateForm } = 
  useFormValidation(initialValues, validationRules);

// Context API para estado global
const { theme, toggleTheme } = useTheme();

// Effect hooks para polling
useEffect(() => {
  const interval = setInterval(fetchMqttStatus, 30000);
  return () => clearInterval(interval);
}, []);
```

---

### 4. **Promesas y Async/Await (Async Operations)**
```javascript
// Backend
async getStatus(req, res) {
  try {
    const status = mqttService.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Frontend
const fetchSensors = async () => {
  setLoading(true);
  try {
    const response = await fetch(`${API_URL}/api/sensors`);
    const data = await response.json();
    setSensors(data);
  } catch (error) {
    toast.error('Error cargando sensores');
  } finally {
    setLoading(false);
  }
}
```

---

### 5. **EventEmitter Pattern (Real-time Updates)**
```javascript
// mqtt.service.js
class MqttService extends EventEmitter {
  connect(brokerUrl, options) {
    this.client.on('connect', () => {
      this.emit('connected', { broker: brokerUrl });
    });
    
    this.client.on('message', (topic, message) => {
      this.emit('message', { topic, message });
    });
  }
}

// Escuchar eventos
mqttService.on('connected', (data) => {
  console.log('Conectado:', data);
});
```

---

### 6. **Middleware Pattern (Express)**
```javascript
// app.js
app.use(cors(appConfig.cors));
app.use(express.json());
app.use(logger);
app.use('/api', routes);
app.use(errorHandler);
```

---

### 7. **Factory Pattern (MQTT Presets)**
```javascript
// mqtt.presets.js
const getMqttPreset = (presetName) => {
  return MQTT_PRESETS[presetName];
};

const buildBrokerUrl = (config) => {
  return `${config.ssl ? 'mqtts' : 'mqtt'}://${config.host}:${config.port}`;
};
```

---

## 📊 Flujos de Datos

### 1. **Flujo de Conexión MQTT**

```
Frontend (Client)
    │
    ├─► handleConnect()
    │   └─► POST /api/mqtt/connect {broker, credentials}
    │
    └─► Backend (Express)
        └─► mqtt.controller.connect()
            └─► mqttService.connect(brokerUrl, options)
                ├─► new mqtt.connect()
                │   └─► MQTT Broker
                │
                ├─► Emit 'connected' event
                │
                └─► resubscribeToActiveTopics()
                    └─► Recupera suscripciones previas
                
Backend responde:
    └─► { success: true, broker: url, clientId: id }
    
Frontend actualiza:
    └─► setMqttStatus({ connected: true, ... })
```

---

### 2. **Flujo de Agregar Sensor**

```
Frontend
    │
    ├─► Validación del formulario (useFormValidation)
    │
    ├─► POST /api/sensors
    │   {
    │     name: "Cámara A",
    │     type: "rtsp",
    │     topic: "rtsp/camara_a",
    │     data: { host, port, path, url }
    │   }
    │
    └─► Backend
        └─► sensor.controller.create()
            │
            └─► sensor.service.createSensor()
                │
                └─► db.run("INSERT INTO sensors...")
                    │
                    └─► return { id, name, type, ... }

Frontend recibe:
    └─► fetchSensors() // Refresca lista
    └─► toast.success() // Notificación
    └─► sensorForm.resetForm() // Limpia formulario
```

---

### 3. **Flujo de Grabación Sincronizada**

```
Usuario presiona "Iniciar Grabación"
    │
    ├─► startRecording()
    │   │
    │   ├─► setIsRecording(true)
    │   ├─► setRecordingStartTime(new Date())
    │   │
    │   └─► POST /api/recording/start
    │       {
    │         sensors: [id1, id2, id3, ...],
    │         timestamp: ISO_STRING
    │       }
    │
    └─► Backend
        └─► Inicia grabación sincronizada
            ├─► RTSP cameras → Video files
            ├─► Environmental sensors → CSV
            └─► EmotiBit → Data files
            
Durante grabación:
    │
    ├─► Timer cada 1s: setElapsedTime()
    ├─► Polling MQTT cada 10s
    │
    └─► Usuario puede:
        ├─► Pausar grabación
        ├─► Reanudar grabación
        └─► Detener grabación
        
Usuario presiona "Detener"
    │
    └─► stopRecording()
        │
        ├─► POST /api/recording/stop
        │   { duration, timestamp }
        │
        └─► Finaliza captura
            └─► Guarda archivos en `/home/roberto/galgo-recordings/`
```

---

### 4. **Flujo de Auto-polling MQTT**

```
App inicia
    │
    └─► useEffect(() => {
        fetchInitialMqttStatus()
        connectToDefaultBroker()
    })

Polling de Status (cada 30s):
    │
    ├─► GET /api/mqtt/status
    │
    └─► mqttService.getStatus()
        {
          connected: true,
          broker: "mqtt://...",
          clientId: "galgo-api-...",
          topics: [...]
        }
        
Frontend actualiza:
    └─► setMqttStatus(newStatus)

Polling Fallback (cada 10s):
    │
    └─► Respaldo en caso de que falle el polling principal
        ├─► Conecta indicador visual
        └─► Actualiza última verificación (lastChecked)
```

---

## 🔌 Componentes Clave

### **1. MqttService (Backend)**
**Ubicación**: `server/src/services/mqtt.service.js`

**Responsabilidades**:
- Gestionar conexión singleton MQTT
- Subscribirse/Desinscribirse de topics
- Publicar mensajes
- Almacenar historial de mensajes
- Emitir eventos en tiempo real

**Métodos principales**:
```javascript
connect(brokerUrl, options)         // Conectar a broker
disconnect()                        // Desconectar
subscribe(topic, options)           // Suscribirse
unsubscribe(topic)                  // Desuscribirse
publish(topic, message, options)    // Publicar
getStatus()                         // Estado actual
getTopics()                         // Topics activos
getMessages(limit)                  // Historial
```

---

### **2. MqttController (Backend)**
**Ubicación**: `server/src/controllers/mqtt.controller.js`

**Endpoints**:
```javascript
GET  /api/mqtt/status              // Estado conexión
POST /api/mqtt/connect              // Conectar
POST /api/mqtt/disconnect           // Desconectar
GET  /api/mqtt/topics               // Listar topics
POST /api/mqtt/topics               // Agregar topic
PUT  /api/mqtt/topics/:id           // Actualizar topic
DELETE /api/mqtt/topics/:id         // Eliminar topic
GET  /api/mqtt/messages             // Historial mensajes
POST /api/mqtt/publish              // Publicar mensaje
```

---

### **3. SensorService (Backend)**
**Ubicación**: `server/src/services/sensor.service.js`

**Operaciones CRUD**:
```javascript
getAllSensors()                     // Todas los sensores
getSensorById(id)                   // Por ID
createSensor(data)                  // Crear
updateSensor(id, data)              // Actualizar
deleteSensor(id)                    // Eliminar
```

---

### **4. ThemeContext (Frontend)**
**Ubicación**: `client-configurator/src/contexts/ThemeContext.jsx`

**Características**:
- Alternancia light/dark mode
- Persistencia en localStorage
- Modificación de clases en DOM
- Hook custom `useTheme()`

---

### **5. useFormValidation Hook (Frontend)**
**Ubicación**: `client-configurator/src/hooks/useFormValidation.js`

**Características**:
```javascript
useFormValidation(initialValues, rules)

// Retorna:
{
  values,              // Estado actual del formulario
  errors,              // Errores validación
  touched,             // Campos tocados
  handleChange,        // Cambio de valor
  handleBlur,          // Blur del campo
  validateForm,        // Validar todo
  resetForm,           // Resetear
  isValid              // ¿Es válido?
}

// Validaciones soportadas:
- required()
- minLength()
- maxLength()
- email()
- mqttTopic()
```

---

### **6. SensorManagement Component (Frontend)**
**Ubicación**: `client-configurator/src/components/SensorManagement.jsx`

**Responsabilidades**:
- Listado de sensores
- Agregar sensores
- Editar sensores
- Eliminar sensores
- Gestionar topics MQTT

---

## 💾 Base de Datos

**Tipo**: SQLite 3  
**Ubicación**: `server/sensors.db`  
**Conexión**: `server/src/config/database.js`

### **Tablas**:

#### **1. sensors**
```sql
CREATE TABLE sensors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,              -- 'rtsp', 'emotibit', 'environmental'
  name TEXT NOT NULL,              -- Nombre descriptivo
  topic TEXT NOT NULL,             -- Topic MQTT
  description TEXT,                -- Descripción
  unit TEXT,                       -- Unidad (stream, data, etc)
  min_value REAL,                  -- Rango mínimo
  max_value REAL,                  -- Rango máximo
  active BOOLEAN DEFAULT 1,        -- Activo/Inactivo
  created_at DATETIME,             -- Timestamp creación
  updated_at DATETIME              -- Timestamp actualización
);
```

#### **2. mqtt_topics**
```sql
CREATE TABLE mqtt_topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic TEXT NOT NULL UNIQUE,      -- Topic MQTT
  description TEXT,                -- Descripción
  qos INTEGER DEFAULT 0,           -- Quality of Service
  retained BOOLEAN DEFAULT 0,      -- Mensaje retenido
  active BOOLEAN DEFAULT 1,        -- Suscripción activa
  created_at DATETIME,
  updated_at DATETIME
);
```

#### **3. mqtt_messages**
```sql
CREATE TABLE mqtt_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic TEXT NOT NULL,             -- Topic origen
  message TEXT,                    -- Contenido mensaje
  qos INTEGER,                     -- QoS utilizado
  retain BOOLEAN,                  -- Fue retenido
  timestamp DATETIME               -- Cuando llegó
);
```

#### **4. configurations**
```sql
CREATE TABLE configurations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,          -- 'general', 'mqtt', 'recordings', etc
  key TEXT NOT NULL,               -- Nombre config
  value TEXT,                      -- Valor JSON
  updated_at DATETIME,
  UNIQUE(category, key)            -- Una config por categoría+clave
);
```

---

## 🔌 API REST

### **Base URL**: `http://localhost:3001/api`

### **Gestión de Sensores**

| Método | Endpoint | Descripción | Body |
|--------|----------|-------------|------|
| GET | `/sensors` | Listar sensores | - |
| GET | `/sensors/:id` | Obtener sensor | - |
| POST | `/sensors` | Crear sensor | `{name, type, topic, data}` |
| PUT | `/sensors/:id` | Actualizar sensor | `{name, type, ...}` |
| DELETE | `/sensors/:id` | Eliminar sensor | - |

### **MQTT Management**

| Método | Endpoint | Descripción | Body |
|--------|----------|-------------|------|
| GET | `/mqtt/status` | Estado conexión | - |
| POST | `/mqtt/connect` | Conectar broker | `{broker, username, password}` |
| POST | `/mqtt/disconnect` | Desconectar | - |
| GET | `/mqtt/topics` | Listar topics | - |
| POST | `/mqtt/topics` | Agregar topic | `{topic, qos, retained}` |
| PUT | `/mqtt/topics/:id` | Actualizar topic | `{active, qos}` |
| DELETE | `/mqtt/topics/:id` | Eliminar topic | - |
| GET | `/mqtt/messages` | Historial | `?limit=20` |
| POST | `/mqtt/publish` | Publicar | `{topic, message, qos, retain}` |

### **Sistema**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/` | Root info |

---

## 🖥️ Frontend

### **Cliente 1: Full Dashboard (JavaScript)**
**Ubicación**: `client-configurator/`

**Características**:
- ✅ Dashboard completo con estadísticas
- ✅ Gestión avanzada de sensores
- ✅ Control granular de temas MQTT
- ✅ Configuración detallada
- ✅ Soporte completo de grabación
- ✅ Historial de mensajes MQTT

**Componentes principales**:
```
App
├── Navbar
├── Dashboard
│   ├── MqttConnectionStatus
│   ├── RecordingControl
│   ├── SensorCards
│   └── RecentActivity
└── SensorManagement
    ├── SensorList
    ├── AddSensorForm
    ├── TopicsList
    └── AddTopicForm
```

---

### **Cliente 2: Simplified UI (TypeScript)**
**Ubicación**: `client2/`

**Características**:
- ✅ Interfaz simplificada para usuarios finales
- ✅ Soporte RFID/NFC
- ✅ TypeScript para type-safety
- ✅ Control de grabación básico
- ✅ Visualización de sensores

**Componentes principales**:
```
App
├── Navbar
├── RFIDIdentification
├── RecordingControl
├── SensorCards
└── MqttConnectionStatus
```

---

### **Estado Global (React Context)**

```javascript
// ThemeContext
{
  theme: 'light' | 'dark',
  toggleTheme: () => void
}

// UserContext (client2)
{
  user: User | null,
  login: (credentials) => void,
  logout: () => void
}
```

---

## 📡 MQTT Integration

### **Configuración de Brokers**

```javascript
// mqtt.presets.js
MQTT_PRESETS = {
  'EMQX Local': {
    host: 'localhost',
    port: 1883,
    ssl: false
  },
  'EMQX Remoto': {
    host: '100.107.238.60',
    port: 1883,
    ssl: false,
    username: 'admin',
    password: 'galgo2526'
  },
  'EMQX Test': {
    host: '100.82.84.24',
    port: 1883,
    ssl: false,
    username: 'admin',
    password: 'galgo2526'
  },
  'HiveMQ Cloud': {
    host: 'broker.hivemq.com',
    port: 8883,
    ssl: true
  }
}
```

### **Flujo de Conexión MQTT**

1. **Inicialización Automática**
   ```javascript
   // app.js - Auto-conexión en startup
   if (appConfig.mqtt.broker) {
     mqttService.connect(broker, credentials);
   }
   ```

2. **Reconexión Automática**
   - `reconnectPeriod: 5000` (5 segundos)
   - `keepalive: 120` (2 minutos)
   - Reintenta indefinidamente

3. **Re-suscripción Automática**
   - Al reconectar, se reactivan topics previos
   - `resubscribeToActiveTopics()` tras conexión

4. **Manejo de Errores**
   ```javascript
   client.on('error', (err) => {
     console.error('MQTT error:', err);
     // Continúa intentando reconectar
   });
   ```

### **Topics MQTT Estándar**

```
rtsp/                    → Cámaras RTSP
environmental/           → Sensores ambientales
emotibit/                → Sensores EmotiBit
sensor/*/data            → Datos de sensores
system/status            → Estado del sistema
recording/start          → Inicio grabación
recording/stop           → Fin grabación
```

---

## 🐳 Deployment

### **Docker Compose Architecture**

```yaml
services:
  galgo-server:
    ├─ Build: ./server/Dockerfile
    ├─ Port: 3001
    ├─ ENV: MQTT_BROKER, MQTT_USERNAME, MQTT_PASSWORD
    ├─ HealthCheck: GET /api/health
    └─ Restart: unless-stopped

  galgo-client:
    ├─ Build: ./client-configurator/Dockerfile
    ├─ Port: 5173
    ├─ ENV: VITE_API_URL
    ├─ Depends_on: galgo-server (healthy)
    ├─ HealthCheck: curl http://localhost:5173
    └─ Restart: unless-stopped

networks:
  galgo-network:
    driver: bridge
```

### **Endpoints en Producción**

```
Frontend:  http://localhost:5173
Backend:   http://localhost:3001
API Docs:  http://localhost:3001/api-docs
Health:    http://localhost:3001/api/health
```

### **Variables de Entorno**

```bash
# .env (Backend)
MQTT_BROKER=mqtt://100.82.84.24:1883
MQTT_USERNAME=admin
MQTT_PASSWORD=galgo2526
NODE_ENV=production
PORT=3001

# Client Dockerfile BUILD ARGS
VITE_API_URL=http://localhost:3001
```

---

## 🔄 Ciclo de Vida de la Aplicación

### **1. Inicio de la Aplicación**

```
1. Servidor Express inicia
   ├─ Inicializa base de datos SQLite
   ├─ Lee configuración de app.config.js
   ├─ Prepara middlewares (CORS, JSON, Logger)
   └─ Auto-conecta a MQTT broker

2. Cliente carga
   ├─ Monta ThemeProvider
   ├─ App.jsx se renderiza
   ├─ Ejecuta fetchInitialMqttStatus()
   ├─ Ejecuta loadConfigurations()
   └─ Inicia auto-polling (status cada 30s, mensajes cada 10s)
```

### **2. Interacciones del Usuario**

```
Usuario → Evento → Handler → API Call → Backend → BD/MQTT → Response → UI Update
   ↑                                                                        ↓
   └────────────────────────────── Toast Notification ──────────────────┘
```

### **3. Graceful Shutdown**

```
SIGTERM → Server.close() → Close Database → Exit
```

---

## 📈 Flujo de Desarrollo

### **Desarrollo Local**

```bash
# 1. Instalar dependencias
pnpm install-all

# 2. Iniciar servicios
pnpm dev

# Esto ejecuta en paralelo:
# - cd server && npm run dev (nodemon)
# - cd client-configurator && npm run dev (Vite)
# - cd client2 && npm run dev (Vite)
```

### **Build para Producción**

```bash
# Build todos los packages
pnpm build

# Build individual
pnpm build:client
pnpm build:server
pnpm build:client2
```

### **Docker Deployment**

```bash
# Up con build
docker-compose up --build -d

# Ver logs
docker-compose logs -f

# Down
docker-compose down
```

---

## 🎓 Patrones de Buenas Prácticas

### ✅ **Separación de Responsabilidades**
- Controllers manejan HTTP
- Services contienen lógica
- Models/Database abstraen BD

### ✅ **Reusabilidad de Código**
- Custom hooks (useFormValidation, useTheme)
- Servicios singleton (mqttService)
- Componentes reutilizables

### ✅ **Manejo de Errores**
- Try/catch en async functions
- Global error handler middleware
- Toast notifications al usuario

### ✅ **Seguridad CORS**
- Whitelist de orígenes
- Permite requests sin origen
- Restringe en producción

### ✅ **Logging y Debugging**
- console.log con emojis
- Logger middleware
- Debug mode en desarrollo

### ✅ **Testing MQTT**
- `test-mqtt.js` para validar conexión
- Health endpoint para monitoreo
- Status polling continuo

---

## 🚀 Casos de Uso Principales

### **1. Investigador Configura Experimento**
```
1. Accede a Dashboard
2. Agrega 3 cámaras RTSP
3. Agrega 5 sensores ambientales
4. Agrega 1 EmotiBit
5. Configura MQTT topics
6. Inicia grabación sincronizada
7. Monitorea MQTT en tiempo real
8. Detiene grabación
9. Descarga datos guardados
```

### **2. Sistema Monitorea Sensores**
```
1. Auto-polling cada 30 segundos
2. Actualiza estado MQTT
3. Recibe mensajes de topics
4. Almacena en historial
5. Notifica cambios de estado
6. Guarda logs en base de datos
```

### **3. Usuario RFID Inicia Grabación (Client2)**
```
1. Lee tarjeta RFID
2. Sistema identifica usuario
3. Inicia grabación automática
4. Captura datos del usuario
5. Registra sesión
6. Genera reporte
```

---

## 📚 Resumen Técnico

| Aspecto | Detalles |
|--------|----------|
| **Lenguajes** | JavaScript, TypeScript |
| **Frontend** | React, Vite, Tailwind |
| **Backend** | Express, Node.js |
| **BD** | SQLite |
| **Tiempo Real** | MQTT, EventEmitter |
| **Containerización** | Docker, Docker Compose |
| **API** | REST + Swagger |
| **Validación** | Custom hooks + reglas |
| **Autenticación** | (Por implementar - preparado) |
| **Logging** | Console + middleware |
| **Monitoreo** | Health check endpoints |

---

## 🎯 Próximos Pasos (Recomendaciones)

1. **Autenticación JWT** - Asegurar endpoints
2. **Base de datos relacional** - Postgres para escala
3. **WebSockets** - Real-time updates sin polling
4. **Pruebas unitarias** - Jest + React Testing Library
5. **CI/CD mejorado** - GitHub Actions avanzado
6. **Documentación OpenAPI** - Swagger completo
7. **Monitoreo** - Prometheus/Grafana
8. **Caché distribuido** - Redis para sesiones

---

## 📖 Referencias de Archivos Clave

```
Backend
├── server/src/app.js                    → Configuración Express
├── server/src/config/app.config.js      → Config centralizada
├── server/src/services/mqtt.service.js  → Lógica MQTT
├── server/src/config/database.js        → Inicialización BD
└── server/index.js                      → Entry point

Frontend (JS)
├── client-configurator/src/App.jsx                   → Componente raíz
├── client-configurator/src/contexts/ThemeContext.jsx → Estado global
├── client-configurator/src/hooks/useFormValidation.js → Lógica validación
└── client-configurator/src/components/*              → Componentes UI

Frontend (TS)
├── client2/src/App.tsx                  → Versión TypeScript
├── client2/src/types/index.ts           → Tipos compartidos
└── client2/src/components/*             → Componentes UI

Docker
├── docker-compose.yml                   → Orquestación
├── server/Dockerfile                    → Build backend
├── client-configurator/Dockerfile       → Build frontend
└── client2/Dockerfile                   → Build frontend2
```

---

**Documento generado**: 3 de noviembre de 2025  
**Versión**: 1.0  
**Estado**: Análisis Completo ✅

