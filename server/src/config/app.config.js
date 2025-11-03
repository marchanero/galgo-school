/**
 * Application Configuration

Este documento explica cómo configurar diferentes ambientes (desarrollo, test, producción) para el servidor. * Uses environment-specific configs from environment.config.js

 */

## 📋 Descripción General

const environmentConfig = require('./environment.config');

El sistema soporta múltiples ambientes con configuraciones específicas para MQTT y otros servicios:

module.exports = {

- **development**: Ambiente de desarrollo (por defecto)  port: environmentConfig.port,

- **test**: Ambiente de testing con broker MQTT de prueba  nodeEnv: environmentConfig.nodeEnv,

- **production**: Ambiente de producción  mqtt: {

    broker: environmentConfig.mqtt.broker,

## 🚀 Cómo Usar    clientId: environmentConfig.mqtt.clientId,

    username: environmentConfig.mqtt.username,

### 1. Archivos de Configuración    password: environmentConfig.mqtt.password,

    connectTimeout: environmentConfig.mqtt.connectTimeout,

Existen tres archivos de configuración:    reconnectPeriod: environmentConfig.mqtt.reconnectPeriod,

  },

```  cors: {

server/    origin: function (origin, callback) {

├── .env.example      # Plantilla de configuración      console.log('🔍 CORS - Request from origin:', origin);

├── .env              # Configuración para desarrollo (copia de .env.example)      

├── .env.test         # Configuración para testing      // Allow requests with no origin (like mobile apps or curl requests)

└── .env.production   # Configuración para producción (opcional)      if (!origin) {

```        console.log('✅ CORS - Allowing request without origin');

        return callback(null, true);

### 2. Configurar para Development (Defecto)      }

      

```bash      // Extract host and port from origin

cd server      const url = new URL(origin);

cp .env.example .env      const hostname = url.hostname;

```      const port = url.port || (url.protocol === 'https:' ? 443 : 80);

      

Luego edita `.env` con tu configuración de desarrollo:      // Allow localhost and 127.0.0.1 with any dev port (5173, 5174, 5175, 3000, 3001)

      const devPorts = ['5173', '5174', '5175', '5176', '3000', '3001'];

```env      const isDevPort = devPorts.includes(port);

NODE_ENV=development      

PORT=3001      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {

        if (isDevPort) {

# Tu broker MQTT actual          console.log('✅ CORS - Localhost/127.0.0.1 allowed on dev port:', origin);

MQTT_BROKER=mqtt://100.82.84.24:1883          return callback(null, true);

MQTT_USERNAME=admin        }

MQTT_PASSWORD=galgo2526      }

```      

      // Allow any local IP (192.168.x.x, 100.x.x.x, etc.) on dev ports

### 3. Configurar para Testing      if (isDevPort && !hostname.startsWith('external') && !origin.includes('http://')) {

        console.log('✅ CORS - Local IP allowed on dev port:', origin);

El archivo `.env.test` ya está creado. Solo necesitas actualizar la dirección del broker MQTT de prueba:        return callback(null, true);

      }

```bash      

# Edita server/.env.test      // More permissive: allow any origin on dev ports in development

NODE_ENV=test      if (environmentConfig.nodeEnv !== 'production' && isDevPort) {

PORT=3001        console.log('✅ CORS - Dev environment: allowing all origins on dev ports:', origin);

        return callback(null, true);

# Cambia esto a tu broker de prueba      }

MQTT_BROKER=mqtt://tu-broker-test:1883      

MQTT_USERNAME=test_user      console.log('❌ CORS - Origin NOT allowed:', origin);

MQTT_PASSWORD=test_password      callback(null, true); // Still allow for debugging, remove in production

```    },

    credentials: true,

### 4. Lanzar el Servidor en Different Ambientes    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],

#### Desarrollo (por defecto):  },

```bash};

cd server
npm run dev
```

#### Testing:
```bash
cd server
NODE_ENV=test npm run dev
```

#### Production:
```bash
cd server
NODE_ENV=production npm run dev
```

### 5. Variables de Entorno Globales

También puedes usar variables de entorno globales que sobrescriben los archivos `.env`:

```bash
# Ejecutar en testing sin modificar .env.test
NODE_ENV=test MQTT_BROKER=mqtt://otro-broker:1883 npm run dev
```

## 🔧 Configuración Automática de Broker MQTT

El sistema carga automáticamente:

1. ✅ `.env.{NODE_ENV}` (ej: `.env.test` cuando `NODE_ENV=test`)
2. ✅ Fallback a `.env` si el archivo específico no existe
3. ✅ Variables de entorno del sistema (sobrescriben los archivos)

## 📊 Jerarquía de Configuración

**Mayor prioridad (sobrescribe a los demás):**

```
Variables de Entorno del Sistema
      ↓
Archivo .env.{NODE_ENV}
      ↓
Archivo .env
      ↓
Valores por Defecto en environment.config.js
```

## 🎯 Ejemplo Práctico

### Scenario 1: Testing con broker local

```bash
cd server
NODE_ENV=test npm run dev
```

El servidor usará la configuración de `.env.test` con `MQTT_BROKER=mqtt://localhost:1883`

### Scenario 2: Testing con broker remoto sin modificar archivos

```bash
cd server
NODE_ENV=test MQTT_BROKER=mqtt://192.168.1.100:1883 npm run dev
```

### Scenario 3: Development con broker de prueba

```bash
cd server
MQTT_BROKER=mqtt://test-broker:1883 npm run dev
```

## 📝 Contenido de los Archivos

### .env.example (Plantilla)
```env
NODE_ENV=development
PORT=3001
MQTT_BROKER=mqtt://100.82.84.24:1883
MQTT_USERNAME=admin
MQTT_PASSWORD=galgo2526
MQTT_CLIENT_ID=galgo-school-server
API_URL=http://localhost:3001
DATABASE_PATH=./sensors.db
```

### .env.test (Testing)
```env
NODE_ENV=test
PORT=3001
MQTT_BROKER=mqtt://localhost:1883
MQTT_USERNAME=test_user
MQTT_PASSWORD=test_password
MQTT_CLIENT_ID=galgo-school-server-test
API_URL=http://localhost:3001
DATABASE_PATH=./sensors-test.db
```

## 🔍 Verificar Configuración Activa

Para ver qué configuración se está usando, observa los logs del servidor:

```
[dotenv@17.2.3] injecting env (X) from .env.test -- tip: ⚙️  suppress all logs with { quiet: true }
```

Esto indica que se cargó `.env.test` correctamente.

## ⚠️ Notas Importantes

1. **Seguridad**: Nunca commit `.env` o `.env.test` con credenciales reales a git
2. **Base de Datos**: Cada ambiente usa su propia base de datos (`sensors.db` vs `sensors-test.db`)
3. **Puerto**: Aunque el puerto es igual, puedes cambiarlo por ambiente si lo necesitas
4. **Client ID MQTT**: Automáticamente añade `-test` al final para testing para evitar conflictos

## 🛠️ Archivos de Configuración Involved

- `src/config/app.config.js` - Configuración principal de la app
- `src/config/environment.config.js` - Gestor de ambientes
- `.env.example` - Plantilla
- `.env.test` - Configuración de testing
- `.env` - Configuración de desarrollo (local)

---

**¿Preguntas o necesitas más ambientes?** Edita `environment.config.js` y añade un nuevo ambiente.
