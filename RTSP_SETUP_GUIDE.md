# 🎥 Guía de Configuración y Uso de Cámaras RTSP - Galgo-School

## Flujo Completo: Cámara → Stream → Preview

```
┌─────────────────────────────────────────────────────────────┐
│                   CLIENTE (client-configurator)             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. RTSPManager (Configuración)                             │
│     └─ Agregar cámara RTSP                                  │
│        ├─ Nombre, IP, Puerto, Usuario, Contraseña, Ruta   │
│        └─ Validar conexión (POST /api/rtsp/cameras/test)   │
│                                                               │
│  2. localStorage (Persistencia)                             │
│     └─ Guardar en "galgo-camera-ips"                        │
│                                                               │
│  3. RTSPCameraGallery (Preview)                             │
│     └─ Mostrar lista de cámaras guardadas                   │
│        ├─ Iniciar stream HLS (POST /api/stream/preview/:id) │
│        ├─ Mostrar video en tiempo real (HLS + hls.js)       │
│        └─ Detener stream (DELETE /api/stream/preview/:id)   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                           ↕ API
┌─────────────────────────────────────────────────────────────┐
│                      SERVIDOR (server)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Gestión de Cámaras                                       │
│     └─ GET/POST/DELETE /api/rtsp/cameras                    │
│                                                               │
│  2. Conversión de Stream                                     │
│     └─ POST /api/stream/preview/:id                         │
│        ├─ Verificar conexión RTSP                           │
│        ├─ Iniciar FFmpeg: RTSP → HLS                        │
│        └─ Generar archivos M3U8 + segmentos TS              │
│                                                               │
│  3. Servicio de Video                                        │
│     └─ GET /api/stream/hls/:id                              │
│        └─ Servir archivo M3U8 (playlist HLS)                │
│                                                               │
│  4. FFmpeg Process                                           │
│     └─ Monitorear process, reintentos, cleanup              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Requisitos Previos

### Servidor
- ✅ FFmpeg instalado (`ffmpeg -version`)
- ✅ Node.js v18+
- ✅ Puerto 3001 disponible

### Cliente
- ✅ Navegador moderno (Chrome, Firefox, Safari, Edge)
- ✅ HLS.js (se carga vía CDN en index.html)

### Red
- ✅ Cámara RTSP accesible desde la red (IP, puerto, credenciales)
- ✅ Firewall permite conexión a puerto RTSP (típicamente 554)

---

## 🚀 Pasos para Probar

### Paso 1: Inicia el Servidor

```bash
cd /Users/roberto/Repositorio6/galgo-school/server
npm install
npm start
```

**Verifica en la consola:**
```
Server running on port 3001
EMQX connected
```

### Paso 2: Inicia el Cliente Configurador

En otra terminal:

```bash
cd /Users/roberto/Repositorio6/galgo-school/client-configurator
npm install
npm run dev
```

**Abre:** `http://localhost:5173`

### Paso 3: Agrega una Cámara RTSP

#### Opción A: Cámara Real
1. Ve a **Configuración** → **Cámaras RTSP**
2. Haz clic en **"Agregar Cámara"**
3. Rellena los datos:
   - **Nombre**: "Cámara Entrada"
   - **IP**: `192.168.X.X` (IP de tu cámara)
   - **Puerto**: `554` (predeterminado RTSP)
   - **Usuario**: `admin` (o el usuario de tu cámara)
   - **Contraseña**: `12345` (o la contraseña de tu cámara)
   - **Ruta**: `/stream` (o la ruta específica de tu cámara)
4. Haz clic en **"Probar Conexión"**
5. Si es exitoso, haz clic en **"Agregar Cámara"**

#### Opción B: Cámara Simulada (FFmpeg)

En otra terminal, simula una cámara RTSP:

```bash
# Generar video de prueba
ffmpeg -f lavfi -i testsrc=size=640x480:duration=0:rate=30 \
  -f lavfi -i sine=frequency=1000:duration=0 \
  -pix_fmt yuv420p -c:v libx264 -preset veryfast \
  -rtsp_transport tcp -f rtsp rtsp://localhost:8554/stream &
```

Luego agrega en el cliente:
- **Nombre**: "Cámara Test"
- **IP**: `127.0.0.1`
- **Puerto**: `8554`
- **Usuario**: (dejar vacío)
- **Contraseña**: (dejar vacío)
- **Ruta**: `/stream`

### Paso 4: Inicia el Stream

1. Ve a **Cámaras RTSP** → **Preview**
2. Deberías ver tu cámara en la lista
3. Haz clic en **"Iniciar"** (botón verde)
4. **Espera 3-5 segundos** (FFmpeg está iniciando)
5. Deberías ver el video en vivo

### Paso 5: Monitorea los Logs

**Terminal del servidor:**
```
📹 Stream iniciado para cámara <id>: rtsp://...
✅ Manifest HLS parseado correctamente
```

**Consola del navegador (F12):**
```
✅ Stream iniciado: { hlsUrl: "/api/stream/hls/1", ... }
✅ Conectado al stream RTSP
```

---

## 🔧 Troubleshooting

### "No se pudo conectar a la cámara"
- [ ] Verifica que la IP y puerto son correctos
- [ ] Ping a la cámara: `ping 192.168.X.X`
- [ ] Prueba conexión manual: `ffplay -rtsp_transport tcp rtsp://user:pass@IP:554/stream`
- [ ] Revisa logs del servidor para detalles del error

### "Stream iniciado pero sin video"
- [ ] FFmpeg está corriendo pero puede estar tardío
- [ ] Espera 5-10 segundos más (FFmpeg está convirtiendo)
- [ ] Revisa logs: `ps aux | grep ffmpeg`
- [ ] Aumenta bitrate en servidor: `server/src/services/rtsp-stream.service.js`

### "Error: 502 Bad Gateway"
- [ ] Servidor no está corriendo: verifica `npm start`
- [ ] Puerto 3001 está en uso: `lsof -i :3001`
- [ ] Mata el proceso: `kill -9 <PID>`

### "HLS.js error" en consola
- [ ] CDN de HLS.js no se cargó: abre index.html y verifica `<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>`
- [ ] Navegador no soporta HLS: usa Chrome o Firefox

### "Stream detenido inesperadamente"
- [ ] Cámara se desconectó: revisa conexión de red
- [ ] FFmpeg se mató: límite de memoria o timeout
- [ ] Puerto RTSP se cerró: reinicia cámara

---

## 📊 Casos de Uso

### Monitoreo en Vivo
1. Agrega múltiples cámaras
2. Ve a **Preview** y selecciona cámara
3. Haz clic en "Iniciar"
4. Mira el stream en tiempo real

### Grabación Sincronizada
1. Configura cámaras RTSP
2. Ve a **Dashboard** → **Control de Grabación**
3. Haz clic en "Iniciar Grabación"
4. Todos los sensores (cámaras, ambientales, EmotiBit) se graban

### Exportación de Datos
1. Los videos HLS se guardan en: `/tmp/hls_streams/`
2. Puedes convertirlos a MP4: 
   ```bash
   ffmpeg -i /tmp/hls_streams/camera_1.m3u8 -c copy output.mp4
   ```

---

## 📝 Logs y Debugging

### Habilitar logs detallados

**En `client-configurator/src/components/RTSPCameraGallery.jsx`:**
```javascript
// Ya tiene console.log 🔄 y console.error ❌
// Revisa F12 → Console para detalles
```

**En `server/src/services/rtsp-stream.service.js`:**
```javascript
// Ya tiene console.log para eventos
// Revisa terminal del servidor
```

### Variables de Entorno

**`client-configurator/.env.production`:**
```env
VITE_API_URL=http://tu-servidor:3001
```

**`server/.env`:**
```env
PORT=3001
FFMPEG_PATH=/usr/bin/ffmpeg
HLS_OUTPUT_DIR=/tmp/hls_streams
```

---

## 🎯 Siguientes Pasos

- [ ] Probar con múltiples cámaras simultáneamente
- [ ] Configurar grabación en bucle 24/7
- [ ] Integrar con sistema de alertas (MovementDetection)
- [ ] Exportar videos grabados
- [ ] Análisis de frames con IA

---

## 📞 Soporte

Si algo no funciona:

1. Revisa los logs en servidor y navegador
2. Verifica requisitos (FFmpeg, Red, Permisos)
3. Consulta la sección Troubleshooting
4. Revisa el README.md del server: `server/RTSP_STREAMING_GUIDE.md`

¡Buena suerte! 🚀

