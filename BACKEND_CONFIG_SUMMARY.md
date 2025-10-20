# 🎯 Backend de Configuraciones - Resumen Implementado

## ✅ Cambios Realizados

### 1. **Base de Datos - Nuevas Tablas**

#### Tabla `configurations`
```sql
CREATE TABLE configurations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,           -- general, recordings, mqtt, cameras, sensors, topics
  key TEXT NOT NULL,                -- theme, recordingAutoStart, directory, etc.
  value TEXT NOT NULL,              -- Almacenado como JSON si es necesario
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, key)
)
```

#### Tabla `cameras`
```sql
CREATE TABLE cameras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,        -- Nombre único de la cámara
  ip TEXT NOT NULL,                 -- Dirección IP o hostname
  port INTEGER DEFAULT 554,         -- Puerto RTSP
  username TEXT,                    -- Usuario para autenticación
  password TEXT,                    -- Contraseña (encriptada en futuro)
  path TEXT DEFAULT '/stream',      -- Path del stream RTSP
  active BOOLEAN DEFAULT 1,         -- Estado de la cámara
  connection_status TEXT DEFAULT 'disconnected', -- disconnected, connected, testing
  last_checked DATETIME,            -- Última vez que se verificó la conexión
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### 2. **Índices Agregados**
- `idx_configurations_category` - Para búsquedas rápidas por categoría
- `idx_cameras_active` - Para filtrar cámaras activas

### 3. **Nuevo Controlador: Camera (`camera.controller.js`)**

#### Métodos implementados:
- `getAllCameras()` - Obtener todas las cámaras
- `getCamera(id)` - Obtener una cámara específica
- `createCamera()` - Crear nueva cámara
- `updateCamera(id)` - Actualizar datos de cámara
- `deleteCamera(id)` - Eliminar cámara
- `testCameraConnection(id)` - Probar conexión a cámara
- `isValidIP()` - Validar formato de IP (IPv4 y hostname)

#### Validaciones incluidas:
- IP o hostname válido
- Puerto entre 1-65535
- Nombre único de cámara
- Ruta RTSP válida

### 4. **Nuevas Rutas: Camera (`cameras.routes.js`)**

```
GET    /api/cameras              - Listar todas las cámaras
GET    /api/cameras/:id          - Obtener cámara específica
POST   /api/cameras              - Crear nueva cámara
PUT    /api/cameras/:id          - Actualizar cámara
DELETE /api/cameras/:id          - Eliminar cámara
POST   /api/cameras/:id/test     - Probar conexión
```

### 5. **Mejoras en Configuration Controller**

Nuevos métodos agregados:

#### `resetConfigurations()`
```javascript
POST /api/configurations/reset
// Restaura todas las configuraciones a valores por defecto
// Elimina todos los registros de la tabla configurations
```

#### `validateRecordingsConfig()`
```javascript
POST /api/configurations/validate-recordings
// Valida:
// - Directorio: ruta absoluta, existe o puede crearse
// - Formato: MP4 (H.264), MP4 (H.265), AVI, MKV
// - Duración: entre 1 y 3600 segundos
// - Calidad: Baja (480p), Media (720p), Alta (1080p), 4K (2160p)
```

#### `validateRecordingDirectory()`
- Verifica que la ruta sea absoluta
- Valida que el directorio padre exista
- Intenta crear el directorio si no existe
- Retorna error detallado si falla

### 6. **Integración en Rutas Principales**

Archivo `/server/src/routes/index.js` actualizado:
```javascript
router.use('/cameras', cameraRoutes);
```

---

## 📊 Estructura de Endpoints Completa

### Configuraciones
```
GET    /api/configurations                      - Obtener todas
POST   /api/configurations                      - Guardar una
PUT    /api/configurations/bulk                 - Guardar todas
PUT    /api/configurations/sync-sensors         - Sincronizar sensores
PUT    /api/configurations/sync-topics          - Sincronizar topics
POST   /api/configurations/reset                - Restaurar por defecto
POST   /api/configurations/validate-recordings  - Validar grabaciones
```

### Cámaras
```
GET    /api/cameras                - Listar todas
POST   /api/cameras                - Crear nueva
GET    /api/cameras/:id            - Obtener una
PUT    /api/cameras/:id            - Actualizar
DELETE /api/cameras/:id            - Eliminar
POST   /api/cameras/:id/test       - Probar conexión
```

---

## 🔐 Seguridad

✅ **Validaciones implementadas:**
- Formato de IP (IPv4 y hostname)
- Rango de puertos (1-65535)
- Rutas absolutas para grabaciones
- Constraintts UNIQUE para evitar duplicados
- Manejo seguro de errores sin exponer passwords

⚠️ **Mejoras futuras recomendadas:**
- Encriptar passwords en la base de datos
- Implementar autenticación para endpoints
- Agregar rate limiting
- Validar con librería dedicada para RTSP

---

## 🚀 Próximos Pasos

1. **Frontend:** Crear UI para gestionar configuraciones
2. **Frontend:** Crear UI para gestionar cámaras
3. **Backend:** Integrar librería real para probar RTSP
4. **Backend:** Agregar encriptación de passwords
5. **Backend:** Implementar logs de auditoría para cambios de configuración

---

## 💾 Base de Datos

### Creación automática
Las tablas se crean automáticamente al iniciar el servidor gracias a `initSensorsDB()`.

### Verificación
```bash
# Para verificar las tablas creadas:
sqlite3 /home/roberto/galgo-config/server/sensors.db ".schema"
```

---

## 📝 Notas Importantes

1. **Migraciones:** Si cambias el esquema, agrega scripts de migración
2. **Backups:** Considera hacer backup de `sensors.db` regularmente
3. **Persistencia:** Todas las configuraciones ahora se guardan en BD
4. **localStorage:** Ya no es necesario para cámaras, usa la BD
