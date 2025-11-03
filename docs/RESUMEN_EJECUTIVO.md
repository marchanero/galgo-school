# 📌 RESUMEN EJECUTIVO - GALGO-SCHOOL

## Quick Reference

### 🎯 ¿Qué es Galgo-School?

Una **plataforma full-stack de investigación** para capturar, monitorear y analizar datos de múltiples sensores heterogéneos en tiempo real mediante MQTT.

```
Investigador
    ↓
Dashboard React (client1 o client2)
    ↓
Express API REST
    ↓
MQTT Broker ← Sensores (RTSP, Environmental, EmotiBit)
    ↓
SQLite Database
```

---

## 🏗️ Arquitectura de Alto Nivel

| Capa | Tecnología | Responsabilidad |
|------|-----------|-----------------|
| **Frontend** | React + Tailwind | UI, interacción usuario |
| **Backend** | Express + Node.js | API REST, lógica negocio |
| **Tiempo Real** | MQTT | Comunicación sensores |
| **Datos** | SQLite | Persistencia configuración |
| **DevOps** | Docker Compose | Orquestación servicios |

---

## 🚀 Inicio Rápido

```bash
# Clonar proyecto
git clone https://github.com/marchanero/galgo-school.git
cd galgo-school

# Instalar y ejecutar
pnpm install
pnpm dev

# O con Docker
docker-compose up --build -d
```

**Acceso:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- API Docs: http://localhost:3001/api-docs

---

## 📁 Estructura Principal

```
galgo-school/
├── client/          → React Frontend (completo)
├── client2/         → React+TypeScript (simplificado + RFID)
├── server/          → Express Backend
├── docker-compose.yml
└── pnpm-workspace.yaml
```

---

## 💡 Conceptos Clave

### 1. **Service Pattern (Backend)**
```javascript
// Service = Lógica de negocio
class MqttService {
  connect() { /* conexión */ }
  publish() { /* publicar */ }
  subscribe() { /* suscribir */ }
}

// Controller = Request/Response
async connect(req, res) {
  const result = await mqttService.connect(...)
  res.json(result)
}
```

### 2. **Singleton Instance**
```javascript
// Una sola conexión MQTT en toda la app
const mqttService = new MqttService()
module.exports = mqttService
```

### 3. **React Hooks**
```javascript
// Estado local
const [sensors, setSensors] = useState([])

// Efectos
useEffect(() => { fetchSensors() }, [])

// Context global
const { theme, toggleTheme } = useTheme()
```

### 4. **Promesas y Async/Await**
```javascript
async function handleConnect() {
  try {
    const response = await mqttService.connect(broker)
    toast.success('Conectado')
  } catch (error) {
    toast.error(error.message)
  }
}
```

---

## 📊 Flujos Principales

### Flujo: Conectar a Broker MQTT

```
Usuario ► "Conectar" 
   ↓
POST /api/mqtt/connect
   ↓
mqttService.connect(brokerUrl)
   ↓
new mqtt.connect()
   ↓
MQTT Broker ✓
   ↓
Emit 'connected' event
   ↓
Frontend recibe respuesta
   ↓
setMqttStatus({ connected: true })
```

### Flujo: Agregar Sensor

```
Formulario completado
   ↓
Validación (useFormValidation)
   ↓
POST /api/sensors
   ↓
sensorService.createSensor()
   ↓
INSERT INTO sensors
   ↓
Frontend: toast.success() + refresh lista
```

### Flujo: Grabación Sincronizada

```
Click "Iniciar Grabación"
   ↓
startRecording()
   ↓
POST /api/recording/start + Timer
   ↓
Captura simultánea:
├─ Cámaras RTSP → Video
├─ Environmental → CSV
└─ EmotiBit → Data
   ↓
Timer visible en UI (hh:mm:ss)
   ↓
Click "Detener"
   ↓
POST /api/recording/stop
   ↓
Archivos en /galgo-recordings/
```

---

## 🔌 APIs Principales

### MQTT Endpoints
```
GET  /api/mqtt/status              → Estado actual
POST /api/mqtt/connect              → Conectar
POST /api/mqtt/disconnect           → Desconectar
GET  /api/mqtt/topics               → Listar topics
POST /api/mqtt/topics               → Agregar topic
GET  /api/mqtt/messages             → Historial (limit=20)
POST /api/mqtt/publish              → Publicar mensaje
```

### Sensor Endpoints
```
GET  /api/sensors                   → Listar
POST /api/sensors                   → Crear
PUT  /api/sensors/:id               → Actualizar
DELETE /api/sensors/:id             → Eliminar
```

### System Endpoints
```
GET  /api/health                    → Health check
GET  /                              → Info servidor
```

---

## 🗄️ Base de Datos

**Motor:** SQLite  
**Ubicación:** `server/sensors.db`

**Tablas:**
```
sensors          → Sensores registrados
mqtt_topics      → Topics MQTT suscritos
mqtt_messages    → Historial mensajes
configurations   → Configuraciones sistema
```

---

## 🎯 Patrones de Programación

| Patrón | Ubicación | Uso |
|--------|-----------|-----|
| **Singleton** | mqtt.service.js | Una instancia única |
| **Service-Controller** | Backend | Separación responsabilidades |
| **EventEmitter** | MqttService | Eventos tiempo real |
| **Hooks Pattern** | React | Estado y efectos |
| **Context API** | ThemeContext | Estado global |
| **Factory** | mqtt.presets.js | Crear configuraciones |
| **Middleware** | Express | CORS, logging, errores |

---

## 🔄 Ciclo de Vida

```
[STARTUP]
  ├─ Express inicia
  ├─ SQLite se inicializa
  ├─ MQTT auto-conecta
  └─ React carga frontend
     ├─ fetchInitialMqttStatus()
     ├─ loadConfigurations()
     └─ Inicia polling cada 30s

[USUARIO INTERACTÚA]
  ├─ Click → Handler → API Call
  ├─ Backend procesa
  ├─ BD actualiza
  ├─ MQTT publica si es necesario
  └─ Frontend recibe respuesta + Toast

[SHUTDOWN]
  └─ SIGTERM → close() → Exit
```

---

## 📈 Escalabilidad

### Actual (Desarrollo)
- ✅ SQLite: Simple, sin servidor
- ✅ Local MQTT: Broker único
- ✅ Single server Node.js

### Recomendado (Producción)
- 🚀 PostgreSQL: Base datos relacional
- 🚀 MQTT Cluster: Múltiples brokers
- 🚀 Load Balancer: Múltiples instancias
- 🚀 WebSockets: En vez de polling
- 🚀 Redis: Cache distribuido

---

## 🛡️ Seguridad Actual

```
✅ CORS validado (localhost)
✅ Manejo de errores global
✅ Validación de entrada (frontend + backend)
✅ MQTT con autenticación
❌ JWT/Autenticación (por implementar)
❌ HTTPS (usar en producción)
❌ Rate limiting (por implementar)
```

---

## 🐛 Debugging Común

### "MQTT no conecta"
```bash
# 1. Verificar broker existe
ping 100.82.84.24

# 2. Verificar credenciales
cat server/.env

# 3. Test manual
node server/test-mqtt.js
```

### "Puerto en uso"
```bash
# Cambiar PORT en .env
# O matar proceso: kill -9 $(lsof -t -i :3001)
```

### "BD corrupta"
```bash
# Eliminar DB (se recreará)
rm server/sensors.db
docker-compose restart galgo-server
```

---

## 📚 Archivos Importantes

```
🔧 Configuración
├── server/src/config/app.config.js        → Config general
├── server/src/config/mqtt.presets.js      → Brokers MQTT
└── .env                                    → Variables entorno

🚀 Inicio
├── server/index.js                        → Entry point backend
├── server/server.js                       → Producción
└── client/src/main.jsx                    → Entry point frontend

📡 MQTT
├── server/src/services/mqtt.service.js    → Lógica MQTT
├── server/src/controllers/mqtt.controller.js
└── server/src/routes/mqtt.routes.js

💾 BD
├── server/src/config/database.js          → SQLite setup
└── server/sensors.db                      → Base datos

🎨 Frontend
├── client/src/App.jsx                     → Componente raíz
├── client/src/contexts/ThemeContext.jsx   → State global
└── client/src/hooks/useFormValidation.js  → Custom hook
```

---

## 🚢 Deployment

### Docker
```bash
docker-compose up --build -d
docker-compose logs -f
docker-compose down
```

### Variables Producción
```
MQTT_BROKER=mqtt://broker-prod:1883
NODE_ENV=production
VITE_API_URL=https://api.galgo-school.com
```

---

## 🎓 Próximos Pasos Recomendados

1. **Autenticación JWT** - Asegurar API
2. **Tests unitarios** - Jest + React Testing Library
3. **WebSockets** - Real-time sin polling
4. **PostgreSQL** - Escalabilidad
5. **CI/CD** - GitHub Actions automático
6. **Monitoreo** - Prometheus/Grafana
7. **Documentación Swagger** - API completa
8. **Rate Limiting** - Express Rate Limit

---

## 🆘 Soporte Rápido

**Problema común → Solución**

| Problema | Solución |
|----------|----------|
| "Cannot find module" | `pnpm install -r` |
| Puerto 3001 en uso | `kill -9 $(lsof -t -i :3001)` |
| MQTT no conecta | `node server/test-mqtt.js` |
| BD corrupta | `rm server/sensors.db` |
| CORS error | Revisar app.config.js |
| Tema no cambia | `rm client/.vite` |

---

## 📞 Contacto & Recursos

- **Repo:** https://github.com/marchanero/galgo-school
- **Docs:** Archivos `.md` en raíz
- **API Swagger:** http://localhost:3001/api-docs
- **Health Check:** http://localhost:3001/api/health

---

## 📊 Estado del Proyecto

| Componente | Estado | Notas |
|-----------|--------|-------|
| Backend Express | ✅ Funcional | Production-ready |
| Frontend React | ✅ Funcional | Fully featured |
| Frontend React+TS | ✅ Funcional | Simplified version |
| MQTT Integration | ✅ Funcional | Auto-reconnect |
| SQLite DB | ✅ Funcional | Development |
| Docker | ✅ Funcional | Compose ready |
| Autenticación | ⏳ Planned | JWT pending |
| Tests | ⏳ Planned | Needed |
| Monitoring | ⏳ Planned | Not yet |

---

## 🎯 Conclusión

**Galgo-School** es una solución **modular, escalable y bien estructurada** para investigación con sensores. La arquitectura permite:

- ✅ Agregar nuevos sensores fácilmente
- ✅ Integrar nuevos brokers MQTT
- ✅ Expandir sin refactorizar código existente
- ✅ Deployar con Docker en producción
- ✅ Monitorear en tiempo real

**Está listo para producción con pequeñas mejoras de seguridad.**

---

**Documento**: Resumen Ejecutivo  
**Fecha**: 3 de noviembre de 2025  
**Versión**: 1.0  
**Autor**: Análisis Automatizado

