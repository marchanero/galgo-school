# Galgo-School MQTT Integration

## EMQX Broker Setup

Este proyecto utiliza EMQX como broker MQTT. Sigue estos pasos para configurar EMQX:

### Instalación con Docker (Recomendado)

```bash
# Ejecutar EMQX con Docker
docker run -d --name emqx \
  -p 1883:1883 \
  -p 8083:8083 \
  -p 8084:8084 \
  -p 8883:8883 \
  -p 18083:18083 \
  emqx/emqx:latest
```

### Instalación Nativa

```bash
# Ubuntu/Debian
wget https://www.emqx.io/downloads/emqx/latest/emqx-ubuntu20.04-amd64.deb
sudo dpkg -i emqx-ubuntu20.04-amd64.deb
sudo systemctl start emqx

# macOS con Homebrew
brew install emqx
brew services start emqx

# Windows
# Descargar desde: https://www.emqx.io/downloads/emqx/latest/windows
```

### Verificar que EMQX esté ejecutándose

```bash
# Verificar estado
curl http://localhost:18083/api/v5/status

# O usando Docker
docker ps | grep emqx
```

### Configuración del Broker

En la aplicación, ve a la sección **MQTT** y configura la URL del broker:

- **Desarrollo local**: `mqtt://localhost:1883`
- **EMQX en Docker**: `mqtt://localhost:1883`
- **EMQX remoto**: `mqtt://tu-servidor:1883`

### Características MQTT implementadas

- ✅ **Conexión persistente** al broker EMQX
- ✅ **Gestión de topics** (CRUD completo)
- ✅ **Publicación de mensajes** con QoS configurable
- ✅ **Suscripción automática** a topics activos
- ✅ **Historial de mensajes** almacenado en base de datos
- ✅ **Mensajes retained** soportados
- ✅ **QoS 0, 1, 2** soportados
- ✅ **Interfaz web** completa para gestión

### Topics de ejemplo

```javascript
// Sensores ambientales
sensors/temperature/room1
sensors/humidity/room1
sensors/pressure/room1

// Cámaras RTSP
cameras/motion/detection
cameras/recording/status

// EmotiBit
emotibit/participant001/eda
emotibit/participant001/hr
emotibit/participant001/accelerometer
```

### API Endpoints MQTT

- `GET /api/mqtt/status` - Estado de conexión
- `POST /api/mqtt/connect` - Conectar al broker
- `POST /api/mqtt/disconnect` - Desconectar del broker
- `GET /api/mqtt/topics` - Lista de topics
- `POST /api/mqtt/topics` - Crear topic
- `PUT /api/mqtt/topics/:id` - Actualizar topic
- `DELETE /api/mqtt/topics/:id` - Eliminar topic
- `POST /api/mqtt/publish` - Publicar mensaje
- `GET /api/mqtt/messages` - Historial de mensajes

### Base de datos

Los topics y mensajes MQTT se almacenan en SQLite:

- **`mqtt_topics`**: Topics configurados con QoS, retained, estado activo
- **`mqtt_messages`**: Historial de mensajes recibidos con timestamp

### Seguridad

Para producción, considera:

1. **Autenticación MQTT**: Configurar username/password en EMQX
2. **TLS/SSL**: Usar `mqtts://` en lugar de `mqtt://`
3. **ACLs**: Control de acceso basado en topics
4. **Rate limiting**: Limitar mensajes por segundo

### Monitoreo

EMQX Dashboard: http://localhost:18083
- Métricas de conexión
- Topics activos
- Rendimiento del broker</content>
<parameter name="filePath">/home/roberto/galgo-config/MQTT_README.md