🎬 IMPLEMENTACIÓN COMPLETADA: VIDEO PREVIEW + AUTO-RECONEXIÓN RTSP
===================================================================

## 📋 Resumen Ejecutivo

Se ha completado la implementación de un sistema completo de video preview en tiempo real y auto-reconexión automática para cámaras RTSP en Galgo School.

### ✅ Características Implementadas

#### 🎥 Backend (Node.js/Express)

1. **RTSPStreamService** (`server/src/services/rtsp-stream.service.js`)
   - ✅ Conversión de streams RTSP a HLS usando FFmpeg
   - ✅ Auto-reconexión con backoff exponencial
   - ✅ Gestión de eventos (conectado, reconectando, fallido, error)
   - ✅ Límite de intentos configurable (default: 5)
   - ✅ Delay entre reintentos configurable (default: 3s)
   - ✅ Limpieza automática de archivos HLS
   - ✅ Monitoreo de estado en tiempo real

2. **StreamController** (`server/src/controllers/stream.controller.js`)
   - ✅ POST `/api/stream/preview/{id}` - Iniciar preview
   - ✅ DELETE `/api/stream/preview/{id}` - Detener preview
   - ✅ GET `/api/stream/status/{id}` - Estado de un stream
   - ✅ GET `/api/stream/status` - Estado de todos los streams
   - ✅ GET `/api/stream/hls/{id}` - Playlist M3U8
   - ✅ GET `/api/stream/segment/{id}/{segment}` - Segmentos TS

3. **Stream Routes** (`server/src/routes/stream.routes.js`)
   - ✅ Todas las rutas documentadas con Swagger/OpenAPI
   - ✅ Validación de entrada
   - ✅ Manejo de errores

#### 🎨 Frontend (React/TypeScript)

1. **VideoPreview Component** (`client2/src/components/VideoPreview.tsx`)
   - ✅ Reproducción de video HLS
   - ✅ Soporte nativo (Safari) + HLS.js (otros navegadores)
   - ✅ Controles: play/pause, volumen, fullscreen
   - ✅ Barra de progreso interactiva
   - ✅ Indicador de estado en tiempo real
   - ✅ Información de uptime
   - ✅ Manejo de errores con mensajes claros
   - ✅ TypeScript con tipos completos

2. **useRTSPAutoReconnect Hook** (`client2/src/hooks/useRTSPAutoReconnect.ts`)
   - ✅ Reconexión automática con reintentos
   - ✅ Backoff exponencial configurable
   - ✅ Contador de intentos
   - ✅ Tiempo hasta próximo reintento (actualización cada 100ms)
   - ✅ Métodos disconnect() y reconnect()
   - ✅ TypeScript con tipos completos
   - ✅ Limpieza de timeouts e intervals

#### 📚 Documentación

1. **RTSP_STREAMING_GUIDE.md** - Guía completa:
   - Requisitos e instalación de FFmpeg
   - Ejemplos de uso de cada endpoint
   - Componente VideoPreview con ejemplos
   - Hook useRTSPAutoReconnect con configuración
   - Troubleshooting

2. **test-rtsp-stream.js** - Script de prueba:
   - Test del servicio completo
   - Verificación de eventos
   - Obtención de estado

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                       │
├─────────────────────────────────────────────────────────────┤
│ VideoPreview Component                                      │
│ ├─ Reproduce video HLS                                      │
│ ├─ Controles (play, volumen, fullscreen)                   │
│ └─ Muestra estado en tiempo real                           │
│                                                             │
│ useRTSPAutoReconnect Hook                                  │
│ ├─ Reconexión automática                                   │
│ ├─ Backoff exponencial                                     │
│ └─ Retry automático                                        │
└──────────────────┬──────────────────────────────────────────┘
                   │
        HTTP/HLS Streaming (TCP)
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                    SERVER (Node.js)                         │
├─────────────────────────────────────────────────────────────┤
│ Stream Routes (/api/stream/...)                            │
│ └─ StreamController                                        │
│    └─ RTSPStreamService                                    │
│       ├─ FFmpeg Process (RTSP → HLS)                       │
│       ├─ Event Emitter (estado)                            │
│       ├─ Auto-reconexión                                   │
│       └─ Gestión de archivos HLS                           │
│                                                             │
│ Camera Routes (/api/cameras/...)                           │
│ └─ CameraController ↔ CameraService → SQLite DB           │
└──────────────────┬──────────────────────────────────────────┘
                   │
        RTSP Stream (TCP)
                   │
┌──────────────────▼──────────────────────────────────────────┐
│              CÁMARA RTSP (192.168.x.x:554)                 │
│  rtsp://user:pass@ip:554/stream                            │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Pasos para Usar

### 1. Instalar FFmpeg

**macOS:**
```bash
brew install ffmpeg
```

**Linux (Ubuntu):**
```bash
sudo apt-get install ffmpeg
```

**Windows:**
Descargar de https://ffmpeg.org/download.html

### 2. Agregar una Cámara

```bash
curl -X POST http://localhost:3001/api/cameras \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cámara Sala",
    "ip": "192.168.1.100",
    "port": 554,
    "username": "admin",
    "password": "password",
    "path": "/stream"
  }'
```

### 3. Iniciar Preview

En el cliente React:

```tsx
import VideoPreview from './components/VideoPreview';

function CameraPage() {
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);

  const startPreview = async () => {
    const res = await fetch('/api/stream/preview/1', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      setHlsUrl(data.hlsUrl);
    }
  };

  return (
    <div>
      <button onClick={startPreview}>Ver Cámara</button>
      {hlsUrl && (
        <VideoPreview
          cameraId={1}
          cameraName="Sala Principal"
          hlsUrl={hlsUrl}
        />
      )}
    </div>
  );
}
```

### 4. Auto-reconexión (Automática)

El componente VideoPreview maneja auto-reconexión automáticamente cuando el stream se cae.

Si necesitas control granular, usa el hook:

```tsx
const reconnectState = useRTSPAutoReconnect(
  'rtsp://192.168.1.100:554/stream',
  onConnect,
  onDisconnect,
  { maxAttempts: 5, delayMs: 3000 }
);
```

## 📊 Estados del Stream

| Estado | Descripción |
|--------|------------|
| `connecting` | FFmpeg iniciando, esperando conexión |
| `connected` | ✅ Stream activo y funcionando |
| `disconnected` | ⚠️ Perdió conexión, intentando reconectar |
| `error` | ❌ Error en FFmpeg o RTSP |
| `failed` | ❌ Se alcanzó máximo de intentos |

## 🔧 Configuración

### RTSPStreamService (Backend)

En `server/src/services/rtsp-stream.service.js`:

```javascript
// Parámetros configurables
this.maxReconnectAttempts = 5;      // Número de reintentos
this.reconnectDelay = 3000;         // Delay en ms
this.outputDir = path.join(...);    // Directorio para HLS
```

### FFmpeg Encoding

```javascript
const ffmpegArgs = [
  '-rtsp_transport', 'tcp',         // TCP o UDP
  '-i', rtspUrl,                    // Input
  '-c:v', 'libx264',                // Video codec
  '-preset', 'ultrafast',           // Velocidad encoding
  '-b:v', '2500k',                  // Bitrate video
  '-c:a', 'aac',                    // Audio codec
  '-b:a', '128k',                   // Bitrate audio
  '-hls_time', '2',                 // Duración segmento
  '-hls_list_size', '5',            // Segmentos en playlist
  '-f', 'hls',                      // Output format
  hlsPath                           // Output file
];
```

### VideoPreview (Frontend)

```tsx
<VideoPreview
  cameraId={1}
  cameraName="Cámara 1"
  hlsUrl="/api/stream/hls/1"
  showControls={true}           // Mostrar controles
  autoPlay={true}               // Reproducir automáticamente
  muted={false}                 // Sin silenciar
  onStatusChange={(status) => {
    console.log('Estado:', status);
  }}
/>
```

### useRTSPAutoReconnect (Frontend)

```tsx
const state = useRTSPAutoReconnect(
  streamUrl,
  onConnect,
  onDisconnect,
  {
    maxAttempts: 5,              // Máximo de intentos
    delayMs: 3000,               // Delay inicial (ms)
    backoffMultiplier: 1.5,      // Multiplicador de backoff
    maxDelayMs: 30000,           // Delay máximo (ms)
  }
);

// Métodos disponibles
await state.disconnect();
await state.reconnect();
```

## 📈 Performance

### Requisitos

- **CPU**: 1-2 cores por stream simultáneo (dependiendo de resolución)
- **Memoria**: ~100-200MB por stream
- **Red**: Ancho de banda del stream RTSP (típicamente 1-10 Mbps)

### Optimizaciones

Para múltiples streams:

```javascript
// Usar encoding más rápido
'-preset', 'veryfast',          // En lugar de 'ultrafast'

// Reducir bitrate
'-b:v', '1000k',                // En lugar de '2500k'

// Solo video (sin audio)
'-allowed_media_types', 'video',

// Reducir resolución
'-vf', 'scale=1280:720',        // Escalar a 720p
```

## 🧪 Testing

Ejecutar script de prueba:

```bash
cd server
node test-rtsp-stream.js
```

Esperado:
```
✅ Cámara creada
✅ Stream iniciado
✅ Estado obtenido
✅ Todos los streams obtenidos
✅ Stream detenido
✅ Pruebas completadas exitosamente
```

## 📋 Dependencias Nuevas

### Backend

FFmpeg (no es paquete npm, debe instalarse en sistema)

### Frontend

- **hls.js** (opcional, para navegadores que no soportan HLS nativo)

  ```bash
  npm install hls.js
  ```

  O incluir CDN en HTML:
  ```html
  <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
  ```

## 🐛 Troubleshooting

### FFmpeg no encontrado

```bash
# Verificar instalación
which ffmpeg
ffmpeg -version

# Agregar a PATH si es necesario (macOS)
export PATH="/usr/local/bin:$PATH"
```

### Stream conecta pero sin video

1. Verificar bitrate: Aumentar `-b:v` a `3500k` o `5000k`
2. Verificar codec: Usar `libx265` en lugar de `libx264`
3. Ver logs: Aumentar `-v debug` en FFmpeg

### Alto consumo de CPU

1. Cambiar preset: De `ultrafast` a `veryfast`
2. Reducir resolución: Agregar `-vf scale=1280:720`
3. Reducir bitrate: Cambiar `-b:v` a valores menores

### High latency

1. Reducir `-hls_time` de 2 a 1
2. Cambiar de `-rtsp_transport tcp` a `udp`
3. Aumentar preset (de `ultrafast` a `superfast`)

## 📚 Archivos Modificados/Creados

### Nuevos Archivos

- ✅ `server/src/services/rtsp-stream.service.js` - Servicio de streaming
- ✅ `server/src/controllers/stream.controller.js` - Controlador
- ✅ `server/src/routes/stream.routes.js` - Rutas
- ✅ `client2/src/components/VideoPreview.tsx` - Componente React
- ✅ `client2/src/hooks/useRTSPAutoReconnect.ts` - Hook React
- ✅ `server/RTSP_STREAMING_GUIDE.md` - Guía de uso
- ✅ `server/test-rtsp-stream.js` - Script de prueba

### Archivos Modificados

- ✅ `server/src/routes/index.js` - Agregadas rutas de stream
- ✅ `server/src/config/app.config.js` - Actualizado ✨ (en sesiones anteriores)

## 🎯 Próximos Pasos (Opcionales)

1. **Grabación de Streams**
   - Guardar HLS a MP4
   - Programar grabación automática

2. **Múltiples Bitrates**
   - Adaptative bitrate streaming
   - Streaming automático según ancho de banda

3. **WebSocket Real-time Updates**
   - Notificaciones de estado en tiempo real
   - Push de eventos

4. **RTMP/RTSP Relay**
   - Retransmitir a otros servidores
   - Integración con plataformas streaming

5. **Analytics**
   - Estadísticas de streams
   - Uptime monitoring
   - Performance metrics

---

**Implementado**: 3 de noviembre de 2025
**Estado**: ✅ Completado y Funcional
**Rama**: feature/rtsp-camera-integration
