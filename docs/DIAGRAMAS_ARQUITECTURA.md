# 📊 DIAGRAMAS Y ARQUITECTURA VISUAL

## 1. Flujo General del Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                         GALGO-SCHOOL SYSTEM FLOW                     │
└─────────────────────────────────────────────────────────────────────┘

USUARIOS/INVESTIGADORES
        │
        ├─────► Web Browser (Cliente React)
        │       ├─ Dashboard
        │       ├─ Sensor Management
        │       ├─ MQTT Control
        │       └─ Configuration
        │
        └─────► Web Browser (Cliente React+TypeScript)
                ├─ Simplified UI
                ├─ RFID Support
                └─ Recording Control

                    ▼ HTTP Requests (REST API)

        ┌──────────────────────────────────────────┐
        │     EXPRESS.JS BACKEND SERVER            │
        │     puerto: 3001                         │
        │                                          │
        │  ┌─────────────────────────────────────┐ │
        │  │      API CONTROLLERS                │ │
        │  │  - MQTT                             │ │
        │  │  - Sensors                          │ │
        │  │  - Configuration                    │ │
        │  │  - Health                           │ │
        │  └─────────────────────────────────────┘ │
        │           ▼        ▼         ▼           │
        │  ┌─────────────────────────────────────┐ │
        │  │      SERVICES / LOGIC               │ │
        │  │  - mqttService (Singleton)          │ │
        │  │  - sensorService                    │ │
        │  │  - otherServices                    │ │
        │  └─────────────────────────────────────┘ │
        │           ▼        ▼         ▼           │
        │  ┌──────┐ ┌──────────┐ ┌──────────┐     │
        │  │SQLite│ │MQTT Broker│ │FileSystem│     │
        │  │ DB  │ │ (EMQX)   │ │(Storage) │     │
        │  └──────┘ └──────────┘ └──────────┘     │
        └──────────────────────────────────────────┘

SENSORES/DISPOSITIVOS
        │
        ├─ Cámaras RTSP ─────┐
        ├─ Sensores Ambientales ─┤
        ├─ EmotiBit ─────────┤
        └─ RFID Readers ─────┴──► MQTT Broker ◄─── Express Server
                                 (EMQX)          (Subscribe/Publish)
                                   │
                                   └──► Topics:
                                       - sensor/*/data
                                       - rtsp/camera/*
                                       - environmental/*
                                       - emotibit/*
                                       - recording/*
                                       - system/status
```

---

## 2. Arquitectura de Componentes (Frontend)

```
┌─────────────────────────────────────────────────────────┐
│               APP.JSX - ROOT COMPONENT                  │
│                                                         │
│  State Management:                                      │
│  ├─ sensors[]                                          │
│  ├─ mqttStatus                                         │
│  ├─ recordingState                                     │
│  ├─ configurations{}                                   │
│  ├─ theme ('light'|'dark')                            │
│  └─ ...more states                                    │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │         NAVBAR COMPONENT                          │ │
│  │  ├─ Navigation buttons                            │ │
│  │  ├─ Theme toggle                                  │ │
│  │  └─ Title/Logo                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                          ▼                              │
│  ┌────────────────────────────────────────────────────┐│
│  │         MAIN CONTENT AREA                          ││
│  │  (Renders based on currentSection)                 ││
│  │                                                    ││
│  │  ├─ DASHBOARD Section                             ││
│  │  │  ├─ MqttConnectionStatus                       ││
│  │  │  ├─ Metrics Cards                              ││
│  │  │  ├─ RecordingControl                           ││
│  │  │  └─ RecentActivity                             ││
│  │  │                                                 ││
│  │  ├─ CONFIGURATION Section                         ││
│  │  │  ├─ General Tab                                ││
│  │  │  ├─ Sensors Tab                                ││
│  │  │  ├─ Cameras Tab                                ││
│  │  │  ├─ Recordings Tab                             ││
│  │  │  └─ MQTT Tab                                   ││
│  │  │                                                 ││
│  │  └─ SENSORS Section                               ││
│  │     ├─ SensorManagement Component                 ││
│  │     └─ Topic Management                           ││
│  └────────────────────────────────────────────────────┘│
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │         CONTEXT PROVIDERS                         │ │
│  │  ├─ ThemeProvider (Light/Dark Mode)              │ │
│  │  └─ Other Context Providers                      │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │         TOAST NOTIFICATIONS (Toaster)            │ │
│  │  ├─ Success messages                             │ │
│  │  ├─ Error messages                               │ │
│  │  └─ Loading states                               │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 3. MQTT Connection Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│           MQTT CONNECTION LIFECYCLE                     │
└─────────────────────────────────────────────────────────┘

INICIAL STATE (Desconectado)
    │
    └─► AUTO-CONNECT (en App startup)
        │
        ├─ POST /api/mqtt/connect
        │   {broker, username, password, ssl}
        │
        └─► Backend: mqttService.connect()
            │
            └─ EMQX Broker
               │
               ├─ ON CONNECT ✓
               │  ├─ emit('connected')
               │  ├─ resubscribeToActiveTopics()
               │  └─ Response: {success: true}
               │
               ├─ ON ERROR ✗
               │  ├─ emit('error')
               │  ├─ Retry (reconnectPeriod: 5s)
               │  └─ Response: {error: message}
               │
               └─ ON MESSAGE
                  ├─ Store in messages[]
                  ├─ emit('message')
                  └─ Frontend: update UI

CONNECTED STATE
    │
    ├─ SUBSCRIBE to topics
    │  └─ POST /api/mqtt/topics
    │     {topic, qos, retained}
    │
    ├─ PUBLISH messages
    │  └─ POST /api/mqtt/publish
    │     {topic, message, qos, retain}
    │
    ├─ RECEIVE messages
    │  └─ Stored in mqttMessages[]
    │
    └─ POLLING STATUS (every 30s)
       └─ GET /api/mqtt/status
          └─ Frontend: setMqttStatus()

DISCONNECT STATE
    │
    └─► POST /api/mqtt/disconnect
        │
        ├─ client.end()
        ├─ Clear topics[]
        └─ emit('disconnected')
```

---

## 4. Recording Flow

```
┌──────────────────────────────────────────────────────┐
│          RECORDING SYNCHRONIZATION FLOW              │
└──────────────────────────────────────────────────────┘

1. INITIALIZATION
   └─ User clicks "Start Recording"
      │
      ├─ setIsRecording(true)
      ├─ setRecordingStartTime(now)
      └─ Initialize timer (1s interval)

2. REQUEST TO SERVER
   └─ POST /api/recording/start
      {
        sensors: [id1, id2, id3],
        timestamp: ISO_STRING
      }

3. SERVER PROCESSING
   └─ Identify sensors:
      ├─ RTSP Cameras
      │  └─ Initialize video capture
      │     ├─ Start stream encoding
      │     ├─ Write to MP4 file
      │     └─ Buffer management
      │
      ├─ Environmental Sensors
      │  └─ Start data polling
      │     ├─ Subscribe MQTT
      │     ├─ Log to CSV
      │     └─ Timestamp each reading
      │
      └─ EmotiBit Devices
         └─ Continuous data capture
            ├─ Heart rate
            ├─ Temperature
            ├─ Movement data
            └─ Write to binary format

4. LIVE MONITORING (Frontend)
   └─ Timer visible: 00:00:15
      │
      ├─ Status indicator (pulsing)
      ├─ Pause/Resume buttons
      └─ Optional: Live MQTT message preview

5. PAUSE STATE (Optional)
   └─ User clicks "Pause"
      │
      ├─ Stop data collection temporarily
      ├─ Freeze timer at: 00:00:45
      ├─ Buffer current data
      └─ Resume button appears

6. STOP & FINALIZATION
   └─ User clicks "Stop"
      │
      └─ POST /api/recording/stop
         {duration: 300, timestamp: ISO}
         │
         ├─ Close all streams
         ├─ Finalize files
         ├─ Save metadata
         ├─ Calculate checksums
         └─ Return: {duration, filesPaths, metadata}

7. POST-RECORDING (Frontend)
   └─ Toast: "Recording stopped - Duration: 5:00"
      │
      ├─ Reset UI
      ├─ Clear timer
      └─ Show summary/download options

DIRECTORY STRUCTURE (Storage)
└─ /home/roberto/galgo-recordings/
   └─ 2025-11-03_14-30-45/
      ├─ cameras/
      │  ├─ camera1_stream.mp4
      │  └─ camera2_stream.mp4
      │
      ├─ environmental/
      │  ├─ sensor1_data.csv
      │  └─ sensor2_data.csv
      │
      ├─ emotibit/
      │  ├─ emotibit1_data.bin
      │  └─ emotibit2_data.bin
      │
      ├─ metadata.json
      └─ README.txt
```

---

## 5. Data Flow: Sensor to Storage

```
SENSOR (Physical Device)
    │ MQTT Publish
    ▼
MQTT BROKER (EMQX)
    │ Topic: sensor/*/data
    ▼
EXPRESS SERVER (Subscribed)
    │
    ├─ Receive MQTT message
    ├─ Parse payload
    ├─ Extract: {topic, message, timestamp, qos}
    │
    ├─► Store in Memory
    │   └─ mqttService.messages[] (last 100 messages)
    │
    ├─► Store in Database
    │   └─ INSERT INTO mqtt_messages
    │       (topic, message, qos, retain, timestamp)
    │
    ├─► Emit Event
    │   └─ mqttService.emit('message', {topic, message, ...})
    │
    └─► API Response (Polling)
        └─ GET /api/mqtt/messages?limit=20
            │
            ▼
        FRONTEND (React)
            │
            ├─ setMqttMessages(newMessages)
            ├─ Render MqttMessageCard components
            └─ Display: topic, message, timestamp
```

---

## 6. Component Hierarchy

```
APP
├── ThemeProvider
│   └── Toaster (Notifications)
│
├── Navbar
│   ├── Title/Logo
│   ├── Navigation Links
│   └── Theme Toggle
│
└── Content (Based on currentSection)
    │
    ├─ DASHBOARD
    │  ├── MqttConnectionStatus
    │  ├── MetricsCards (4x)
    │  ├── RecordingControl
    │  │   ├── StartButton
    │  │   ├── PauseButton
    │  │   └── StopButton
    │  └── RecentActivityList
    │      ├── MqttMessageCard
    │      ├── SensorEventCard
    │      └── SystemEventCard
    │
    ├─ SENSORES
    │  └── SensorManagement
    │      ├── SensorsList
    │      │   └── SensorCard (x multiple)
    │      ├── AddSensorForm
    │      ├── TopicsList
    │      │   └── TopicCard (x multiple)
    │      └── AddTopicForm
    │
    └─ CONFIGURATION
       ├── GeneralTab
       │   ├── ThemeToggle
       │   ├── LanguageSelect
       │   └── TimezoneSelect
       │
       ├── SensorsTab
       │   └── SensorManagement
       │
       ├── CamerasTab
       │   ├── CamerasList
       │   └── AddCameraForm
       │
       ├── RecordingsTab
       │   ├── StoragePathInput
       │   ├── FormatSelect
       │   └── QualitySelect
       │
       └── MqttTab
           ├── BrokerSelector
           ├── CredentialsForm
           ├── ConnectionStatus
           └── TopicsManager
```

---

## 7. Request/Response Cycle Example

```
┌────────────────────────────────────────────────────┐
│     AGREGAR SENSOR - REQUEST/RESPONSE CYCLE        │
└────────────────────────────────────────────────────┘

FRONTEND:
  1. User completa formulario
     - Type: "rtsp"
     - Name: "Camera Main"
     - Host: "192.168.1.100"
     - Port: 554
     - Path: "/stream"

  2. Validación local (useFormValidation hook)
     ✓ Type required
     ✓ Name 2-50 chars
     ✓ IP format válido
     ✓ Port range válido

  3. Enviar request:
     POST /api/sensors
     Headers: {
       'Content-Type': 'application/json',
       'Accept': 'application/json'
     }
     Body: {
       "type": "rtsp",
       "name": "Camera Main",
       "topic": "rtsp/camera_main",
       "description": "RTSP Stream: rtsp://192.168.1.100:554/stream",
       "unit": "stream",
       "active": true,
       "data": {
         "host": "192.168.1.100",
         "port": 554,
         "path": "/stream"
       }
     }

  4. Show loading state
     toast.loading('Agregando sensor...')

BACKEND:
  1. Express recibe request
     → sensorController.addSensor(req, res)

  2. Validar entrada
     ✓ Campos requeridos presentes
     ✓ Tipos de dato correctos

  3. Preparar datos para BD
     INSERT INTO sensors (...)
       VALUES ('rtsp', 'Camera Main', 'rtsp/camera_main', ...)

  4. Ejecutar query (async)
     db.run(...) → callback con ID

  5. Response enviada:
     {
       "success": true,
       "data": {
         "id": 42,
         "type": "rtsp",
         "name": "Camera Main",
         "topic": "rtsp/camera_main",
         ...
       }
     }
     Status: 201 (Created)

FRONTEND (Recibe respuesta):
  1. response.ok = true

  2. Toast notification
     toast.success('Sensor agregado exitosamente')

  3. Actualizar state
     fetchSensors() → GET /api/sensors
     → setSensors(updatedList)

  4. Reset formulario
     sensorForm.resetForm()

  5. Re-render UI
     → Nuevo sensor aparece en lista
```

---

## 📋 Checklist de Desarrollo

### Setup Inicial
- [ ] Clonar repositorio
- [ ] Instalar Node.js >= 20
- [ ] Instalar pnpm >= 9
- [ ] `pnpm install-all`
- [ ] Crear archivos `.env`
- [ ] Verificar MQTT broker disponible

### Backend Development
- [ ] Crear carpeta en `src/controllers/`
- [ ] Crear correspondientemente service en `src/services/`
- [ ] Crear route file en `src/routes/`
- [ ] Montar routes en `src/routes/index.js`
- [ ] Testear endpoint con curl/Postman
- [ ] Documentar en Swagger (si necesario)
- [ ] Validar entrada (validación de datos)
- [ ] Manejo de errores global

### Frontend Development
- [ ] Crear component en `src/components/`
- [ ] Importar en `App.jsx`
- [ ] Implementar state con hooks
- [ ] Agregar validación (useFormValidation)
- [ ] Conectar API calls
- [ ] Agregar toast notifications
- [ ] Testing en browser
- [ ] Verificar theme (light/dark)
- [ ] Responsive design (Tailwind)

### Database
- [ ] Crear tabla en `database.js`
- [ ] Crear service methods para CRUD
- [ ] Testear queries manualmente
- [ ] Backup automático (si prod)

### MQTT Integration
- [ ] Definir topics
- [ ] Configurar subscription/publication
- [ ] Testear con `test-mqtt.js`
- [ ] Manejar reconexión
- [ ] Emitir eventos apropriados

### Testing
- [ ] Test endpoints con curl
- [ ] Test validación frontend
- [ ] Test MQTT connectivity
- [ ] Test DB operations
- [ ] Performance check

### Documentation
- [ ] Actualizar README
- [ ] Documentar nuevos endpoints
- [ ] Actualizar Swagger docs
- [ ] Documentar nuevos componentes

### Deployment
- [ ] Build local (npm run build)
- [ ] Docker build
- [ ] Test en Docker
- [ ] Verificar env vars
- [ ] Health check
- [ ] CORS configuration
- [ ] Security review

---

## 🚀 Performance Optimization Checklist

- [ ] Lazy load componentes grandes
- [ ] Memoize expensive computations
- [ ] Debounce búsquedas/typing
- [ ] Optimizar re-renders React
- [ ] Connection pooling MQTT
- [ ] DB indexes donde necesario
- [ ] Cache responses API
- [ ] Compress assets
- [ ] Monitor bundle size
- [ ] Analyze console warnings

---

**Diagrama generado**: 3 de noviembre de 2025

