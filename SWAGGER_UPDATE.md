# 📚 Swagger Documentation Update - Galgo School API

## ✅ Cambios Realizados

### 1. **Nuevos Tags Agregados**
```javascript
- Sensors (Gestión de sensores)
- Topics (Gestión de topics MQTT)
- MQTT (Operaciones MQTT)
- Recordings (Control y configuración de grabaciones)
- Configurations (Gestión de configuraciones del sistema)
- Cameras (Gestión de cámaras RTSP)
- Health (Estado de salud de la aplicación)
```

### 2. **Nuevos Esquemas (Schemas)**

#### Schema: Camera
```json
{
  "id": "integer",
  "name": "string (único)",
  "ip": "string (IPv4 o hostname)",
  "port": "integer (default: 554)",
  "username": "string (opcional)",
  "path": "string (default: /stream)",
  "active": "boolean",
  "connection_status": "enum: connected | disconnected | testing",
  "last_checked": "date-time",
  "created_at": "date-time"
}
```

#### Schema: Configuration
```json
{
  "general": {
    "theme": "enum: light | dark",
    "recordingAutoStart": "boolean",
    "language": "enum: es | en",
    "timezone": "string"
  },
  "recordings": {
    "directory": "string",
    "format": "enum: MP4 (H.264) | MP4 (H.265) | AVI | MKV",
    "maxDuration": "integer",
    "quality": "enum: Baja (480p) | Media (720p) | Alta (1080p) | 4K (2160p)"
  },
  "mqtt": {
    "defaultBroker": "string",
    "host": "string",
    "port": "integer",
    "username": "string",
    "ssl": "boolean"
  },
  "cameras": {
    "defaultRtspPort": "integer",
    "defaultRtspPath": "string",
    "autoReconnect": "boolean"
  }
}
```

#### Schema: Sensor (Mejorado)
```json
{
  "id": "integer",
  "type": "enum: environmental | emotibit | rtsp",
  "name": "string",
  "topic": "string",
  "description": "string",
  "unit": "string",
  "data": "object (flexible según tipo)",
  "active": "boolean",
  "created_at": "date-time"
}
```

#### Schema: ValidationError
```json
{
  "valid": "boolean",
  "errors": [
    {
      "field": "string",
      "message": "string"
    }
  ]
}
```

### 3. **Endpoints Documentados Completamente**

#### Configuraciones (7 endpoints)
```
GET    /api/configurations
POST   /api/configurations
PUT    /api/configurations/bulk
PUT    /api/configurations/sync-sensors
PUT    /api/configurations/sync-topics
POST   /api/configurations/reset
POST   /api/configurations/validate-recordings
```

#### Cámaras (6 endpoints)
```
GET    /api/cameras
POST   /api/cameras
GET    /api/cameras/{id}
PUT    /api/cameras/{id}
DELETE /api/cameras/{id}
POST   /api/cameras/{id}/test
```

### 4. **Mejoras de Documentación**

✅ **Para cada endpoint:**
- Descripción clara del propósito
- Parámetros con tipos y ejemplos
- Códigos HTTP de respuesta: 200, 201, 400, 404, 409, 500
- Esquemas de solicitud y respuesta
- Descripciones de errores específicos

✅ **Para parámetros:**
- Valores enumerados (enum)
- Límites mínimos y máximos
- Valores por defecto
- Ejemplos realistas
- Notas sobre campos opcionales vs requeridos

✅ **Para respuestas:**
- Referencias a esquemas ($ref) para reutilización
- Campos adicionales (success, message, count)
- Estructura de errores consistente

### 5. **Validaciones Documentadas**

#### Para Cámaras:
```javascript
- IP format: IPv4 (x.x.x.x) o hostname válido
- Puerto: 1-65535
- Nombre: Único en la base de datos
- Path RTSP: Ruta válida
```

#### Para Grabaciones:
```javascript
- Directorio: Ruta absoluta, debe existir o poderse crear
- Formato: MP4 (H.264), MP4 (H.265), AVI, MKV
- Duración: 1-3600 segundos
- Calidad: Baja (480p), Media (720p), Alta (1080p), 4K (2160p)
```

### 6. **Acceso a Swagger**

La documentación está disponible en:
```
http://localhost:3001/api-docs
```

O en producción:
```
{API_URL}/api-docs
```

---

## 📊 Resumen de Cambios

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Tags** | 4 | 7 |
| **Esquemas** | 3 | 7 |
| **Documentación por endpoint** | Básica | Completa |
| **Ejemplos** | Pocos | Detallados |
| **Validaciones documentadas** | No | Sí |

---

## 🔄 Campos de Referencia Cruzada

Los esquemas ahora usan referencias ($ref) para mantener consistencia:

```javascript
// En lugar de repetir el esquema:
$ref: '#/components/schemas/Camera'
$ref: '#/components/schemas/Configuration'
$ref: '#/components/schemas/Sensor'
$ref: '#/components/schemas/Error'
$ref: '#/components/schemas/ValidationError'
```

---

## 🚀 Cómo Usar la Documentación

### Para Desarrolladores Frontend:
1. Accede a `/api-docs`
2. Abre cada endpoint para ver:
   - Parámetros requeridos
   - Tipo de datos esperados
   - Ejemplo de solicitud
   - Respuesta exitosa
   - Posibles errores

### Para Testers:
1. Usa "Try it out" en cada endpoint
2. Llena los parámetros siguiendo el esquema
3. Verifica la respuesta

### Para Documentación:
1. Descarga el JSON de Swagger: `http://localhost:3001/api-docs.json`
2. Úsalo en herramientas como Postman o Insomnia
3. Importa para testing automático

---

## 📝 Próximas Mejoras Recomendadas

1. Agregar autenticación (Bearer token) en Swagger
2. Agregar rate limiting documentation
3. Crear ejemplos de errores comunes
4. Agregar webhooks/callbacks si aplica
5. Crear guías de migración de API

---

## 🔗 Referencias

- [Swagger/OpenAPI Spec](https://swagger.io/specification/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [OpenAPI 3.0 Examples](https://github.com/OAI/OpenAPI-Specification/tree/main/examples)
