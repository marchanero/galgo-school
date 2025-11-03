# 🚀 GUÍA DE DESARROLLO - GALGO-SCHOOL

## Tabla de Contenidos

1. [Configuración Inicial](#configuración-inicial)
2. [Convenciones de Código](#convenciones-de-código)
3. [Arquitectura por Módulo](#arquitectura-por-módulo)
4. [Flujos de Desarrollo Comunes](#flujos-de-desarrollo-comunes)
5. [Testing](#testing)
6. [Debugging](#debugging)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## Configuración Inicial

### Prerequisites

```bash
Node.js >= 20
npm >= 10
pnpm >= 9.0.0
Docker & Docker Compose
```

### Setup Local

```bash
# 1. Clonar y entrar
git clone https://github.com/marchanero/galgo-school.git
cd galgo-school

# 2. Instalar con pnpm workspaces
pnpm install

# 3. Verificar instalación
pnpm list

# 4. Iniciar en desarrollo
pnpm dev

# 5. Alternativas individuales
pnpm dev:client   # Solo frontend JS
pnpm dev:server   # Solo backend
pnpm dev:client2  # Solo frontend TS
```

### Variables de Entorno

**server/.env:**
```
MQTT_BROKER=mqtt://100.82.84.24:1883
MQTT_USERNAME=admin
MQTT_PASSWORD=galgo2526
NODE_ENV=development
PORT=3001
```

**client/.env.local:**
```
VITE_API_URL=http://localhost:3001
```

**client2/.env.local:**
```
VITE_API_URL=http://localhost:3001
```

---

## Convenciones de Código

### Nomenclatura de Archivos

```javascript
// Components (PascalCase, .jsx o .tsx)
- Navbar.jsx
- SensorManagement.jsx
- MqttConnectionStatus.tsx

// Hooks (camelCase, use prefix, .js o .ts)
- useFormValidation.js
- useTheme.ts
- useRFID.ts

// Services (camelCase, .service.js)
- mqtt.service.js
- sensor.service.js

// Controllers (camelCase, .controller.js)
- mqtt.controller.js
- sensor.controller.js

// Routes (camelCase, .routes.js)
- mqtt.routes.js
- sensor.routes.js

// Contexts (PascalCase, Context suffix, .jsx o .tsx)
- ThemeContext.jsx
- UserContext.tsx
```

### Estructura de Componentes React

```jsx
import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import toast from 'react-hot-toast'

// 1. Component definition
const MyComponent = ({ prop1, prop2, onAction }) => {
  // 2. State
  const [state, setState] = useState(null)
  const { theme } = useTheme()

  // 3. Effects
  useEffect(() => {
    // Lógica
  }, [])

  // 4. Handlers
  const handleClick = async () => {
    try {
      // Lógica
      toast.success('Éxito')
    } catch (error) {
      toast.error('Error')
    }
  }

  // 5. Render
  return (
    <div className="...">
      {/* JSX */}
    </div>
  )
}

export default MyComponent
```

### Estructura de Servicios Backend

```javascript
// mqtt.service.js
class MqttService extends EventEmitter {
  constructor() {
    super()
    // Inicializar propiedades
    this.client = null
    this.topics = new Map()
  }

  // Métodos públicos
  async connect(brokerUrl, options) {
    // Validar entrada
    if (!brokerUrl) throw new Error('Broker URL required')
    
    // Ejecutar lógica
    return new Promise((resolve, reject) => {
      // ...
    })
  }

  // Métodos privados
  #privateMethod() {
    // Lógica interna
  }
}

module.exports = new MqttService()
```

### Estructura de Controladores

```javascript
// mqtt.controller.js
const mqttService = require('../services/mqtt.service')

class MqttController {
  /**
   * Get MQTT connection status
   * GET /api/mqtt/status
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getStatus(req, res) {
    try {
      // Lógica
      const status = mqttService.getStatus()
      
      // Response
      res.json(status)
    } catch (error) {
      res.status(500).json({
        error: 'Error message',
        message: error.message
      })
    }
  }
}

module.exports = new MqttController()
```

---

## Arquitectura por Módulo

### MQTT Module

```
mqtt/
├── mqtt.service.js       (Singleton, EventEmitter)
├── mqtt.controller.js    (Request handlers)
└── mqtt.routes.js        (Route definitions)

Responsabilidades:
- Gestionar conexiones MQTT
- Publicar/Suscribirse
- Emitir eventos en tiempo real
- Almacenar historial de mensajes
```

**Patrón de uso:**

```javascript
// En controllers
const mqttService = require('../services/mqtt.service')

mqttService.on('message', (msg) => {
  console.log('Mensaje recibido:', msg)
})

await mqttService.connect(brokerUrl, options)
```

### Sensor Module

```
sensors/
├── sensor.service.js         (Operaciones BD)
├── sensor.controller.js      (API handlers)
└── sensor.routes.js          (Rutas)

Operaciones:
- CRUD de sensores
- Consultas a BD
- Manejo de tipos
```

**Patrón de uso:**

```javascript
// Crear sensor
const sensor = await sensorService.createSensor({
  name: 'Sensor 1',
  type: 'environmental',
  topic: 'env/temp'
})

// Actualizar
await sensorService.updateSensor(id, { name: 'New Name' })

// Listar
const sensors = await sensorService.getAllSensors()
```

### Database Module

```
config/
└── database.js

Responsabilidades:
- Inicializar SQLite
- Crear tablas
- Proporcionar instancia BD
```

**Patrón de uso:**

```javascript
const { getDatabase, initializeDatabase } = require('../config/database')

// Al startup
initializeDatabase()

// Al usar
const db = getDatabase()
db.run('INSERT ...', values, function(err) {
  if (err) throw err
  console.log('Insertado:', this.lastID)
})
```

---

## Flujos de Desarrollo Comunes

### Agregar Nuevo Endpoint API

**1. Crear controller method:**

```javascript
// server/src/controllers/mi.controller.js
async handleAction(req, res) {
  try {
    const { param1, param2 } = req.body
    
    // Validar
    if (!param1) {
      return res.status(400).json({ error: 'param1 required' })
    }
    
    // Lógica usando service
    const result = await miService.accion(param1, param2)
    
    // Response
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: error.message })
  }
}
```

**2. Crear service method:**

```javascript
// server/src/services/mi.service.js
async accion(param1, param2) {
  // Lógica de negocio
  return resultado
}
```

**3. Definir ruta:**

```javascript
// server/src/routes/mi.routes.js
router.post('/action', miController.handleAction)
router.get('/data/:id', miController.getData)
```

**4. Montar en router principal:**

```javascript
// server/src/routes/index.js
router.use('/mi', require('./mi.routes'))
```

**5. Usar en frontend:**

```javascript
// client/src/App.jsx
const handleAction = async () => {
  try {
    const response = await fetch(`${API_URL}/api/mi/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ param1: 'value' })
    })
    
    if (!response.ok) throw new Error('API error')
    
    const data = await response.json()
    toast.success('Éxito')
  } catch (error) {
    toast.error(`Error: ${error.message}`)
  }
}
```

### Agregar Nuevo Componente React

**1. Crear componente:**

```jsx
// client/src/components/MiComponente.jsx
import { useState } from 'react'
import toast from 'react-hot-toast'

const MiComponente = ({ prop1, onUpdate }) => {
  const [state, setState] = useState(null)
  
  const handleClick = async () => {
    try {
      // Lógica
      onUpdate?.()
      toast.success('Done')
    } catch (error) {
      toast.error(error.message)
    }
  }
  
  return (
    <div>
      {/* JSX */}
    </div>
  )
}

export default MiComponente
```

**2. Importar en App:**

```jsx
// client/src/App.jsx
import MiComponente from './components/MiComponente'

function App() {
  return (
    <MiComponente prop1="value" onUpdate={handleUpdate} />
  )
}
```

### Agregar Nueva Validación

**1. Definir regla:**

```javascript
// client/src/hooks/useFormValidation.js
const validationRules = {
  // ...
  custom: (message) => (value) => {
    if (condition) return undefined
    return message
  },
  // ...
}
```

**2. Usar en formulario:**

```jsx
const form = useFormValidation(
  { field1: '' },
  {
    field1: [
      validationRules.required('Required'),
      validationRules.minLength(3, 'Min 3 chars'),
      validationRules.custom('Custom error')
    ]
  }
)
```

---

## Testing

### Prueba MQTT Connection

```bash
cd server
node test-mqtt.js
```

Salida esperada:
```
Testing MQTT connection...
✅ Successfully connected!
✅ Test message published successfully
```

### Prueba API Endpoint

```bash
# Health check
curl http://localhost:3001/api/health

# Listar sensores
curl http://localhost:3001/api/sensors

# Conectar MQTT
curl -X POST http://localhost:3001/api/mqtt/connect \
  -H "Content-Type: application/json" \
  -d '{
    "broker": "mqtt://localhost:1883",
    "username": "admin",
    "password": "password"
  }'
```

### Prueba Frontend

```bash
# Iniciar cliente
cd client
pnpm dev

# Abrir http://localhost:5173
```

---

## Debugging

### Backend Debugging

**1. Logging verbose:**

```javascript
console.log('🔍 Debug:', variable)
console.error('❌ Error:', error)
console.warn('⚠️ Warning:', msg)
```

**2. Nodemon watch:**

```bash
cd server
npm run dev  # Reinicia automáticamente
```

**3. Debugger Node:**

```bash
node --inspect server.js
```

### Frontend Debugging

**1. React DevTools:**
- Instalar extensión de Chrome
- Inspeccionar componentes
- Ver estado en tiempo real

**2. Console logs:**

```jsx
console.log('🔍 State:', state)
console.log('📡 API Response:', response.data)
```

**3. Network tab:**
- Ver requests/responses HTTP
- Verificar status codes
- Inspeccionar payloads

### Database Debugging

**1. Inspeccionar BD:**

```bash
sqlite3 server/sensors.db

# Dentro de sqlite3:
.tables                        # Ver tablas
SELECT * FROM sensors;         # Ver datos
.schema sensors                # Ver estructura
```

---

## Deployment

### Docker Build

```bash
# Build todos
docker-compose build

# Build específico
docker-compose build galgo-server
docker-compose build galgo-client
```

### Docker Run

```bash
# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f galgo-server
docker-compose logs -f galgo-client

# Detener
docker-compose down
```

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v3
      - name: Build and deploy
        run: |
          docker-compose build
          docker-compose up -d
```

---

## Troubleshooting

### Problema: "Cannot find module"

**Solución:**

```bash
# Reinstalar dependencias
pnpm install -r

# Limpiar node_modules
rm -rf node_modules
pnpm install
```

### Problema: Puerto ya en uso

**Solución:**

```bash
# Buscar proceso en puerto 3001
lsof -i :3001

# Matar proceso
kill -9 <PID>

# O cambiar puerto en .env
PORT=3002
```

### Problema: MQTT no conecta

**Solución:**

```bash
# 1. Verificar broker disponible
ping 100.82.84.24

# 2. Verificar credenciales en app.config.js
# 3. Ejecutar test-mqtt.js
node server/test-mqtt.js

# 4. Ver logs del servidor
docker-compose logs galgo-server | grep MQTT
```

### Problema: Base de datos corrupta

**Solución:**

```bash
# Eliminar BD (se recreará)
rm server/sensors.db

# Reiniciar servidor
docker-compose restart galgo-server
```

### Problema: Frontend no se conecta al backend

**Solución:**

```bash
# 1. Verificar VITE_API_URL
echo $VITE_API_URL

# 2. Verificar CORS en app.config.js
# 3. Verificar que backend está corriendo
curl http://localhost:3001/api/health

# 4. Ver Network tab en DevTools
```

### Problema: Grabación no se inicia

**Solución:**

```bash
# 1. Verificar sensors registrados
curl http://localhost:3001/api/sensors

# 2. Verificar permisos de escritura
ls -la /home/roberto/galgo-recordings/

# 3. Crear directorio si no existe
mkdir -p /home/roberto/galgo-recordings
chmod 755 /home/roberto/galgo-recordings
```

### Problema: Temas CSS no cargan

**Solución:**

```bash
# 1. Verificar Tailwind config
# 2. Limpiar caché Vite
rm -rf client/.vite

# 3. Reinstalar dependencias
cd client
pnpm install
pnpm dev
```

---

## Performance Tips

1. **Lazy load componentes grandes**
   ```jsx
   const HeavyComponent = lazy(() => import('./Heavy'))
   ```

2. **Memoizar callbacks**
   ```jsx
   const handleClick = useCallback(() => {}, [])
   ```

3. **Optimizar re-renders**
   ```jsx
   const Component = memo(MyComponent, (prev, next) => {
     return prev.prop === next.prop
   })
   ```

4. **Debounce en búsquedas**
   ```javascript
   const debouncedSearch = debounce(search, 300)
   ```

5. **Connection pooling MQTT**
   ```javascript
   // Ya implementado con clean: false
   // Mantiene sesión entre reconexiones
   ```

---

## Security Best Practices

1. **Validar siempre entrada del usuario**
   ```javascript
   if (!value || value.trim() === '') {
     throw new Error('Invalid input')
   }
   ```

2. **No guardar passwords en localStorage**
   ```javascript
   // ❌ No
   localStorage.setItem('password', pwd)
   
   // ✅ Sí (si es necesario)
   // Usar sessionStorage (se borra al cerrar)
   // O mejor: guardar solo en memoria
   ```

3. **CORS restrictivo en producción**
   ```javascript
   // En app.config.js, cambiar:
   callback(null, true) // Permisivo
   // A:
   callback(new Error('CORS not allowed'))
   ```

4. **Rate limiting**
   ```javascript
   // Por implementar con express-rate-limit
   ```

5. **Sanitizar salida MQTT**
   ```javascript
   const sanitized = message.toString().trim()
   ```

---

## Recursos Útiles

- [Express.js Docs](https://expressjs.com/)
- [React Hooks](https://react.dev/reference/react)
- [Tailwind CSS](https://tailwindcss.com/)
- [MQTT.js Docs](https://github.com/mqttjs/MQTT.js)
- [SQLite3 Node](https://github.com/mapbox/node-sqlite3)
- [Docker Compose](https://docs.docker.com/compose/)

---

**Documento actualizado**: 3 de noviembre de 2025

