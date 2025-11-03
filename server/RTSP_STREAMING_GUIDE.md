# 📹 Guía de Configuración RTSP Streaming

Esta guía explica cómo configurar y usar el sistema de video preview y auto-reconexión para cámaras RTSP.

## 🎥 Requisitos

### Backend (Server)
- **FFmpeg**: Necesario para convertir streams RTSP a HLS
- **Node.js**: v18 o superior

### Frontend
- Navegador moderno con soporte HLS o HLS.js

## 📦 Instalación de FFmpeg

### macOS (con Homebrew)
```bash
brew install ffmpeg
```

### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

### Linux (CentOS/RHEL)
```bash
sudo yum install ffmpeg
```

### Windows
Descargar de: https://ffmpeg.org/download.html

**Verificar instalación:**
```bash
ffmpeg -version
```

## 🚀 Uso

### 1. Agregar una Cámara RTSP

**Endpoint:** `POST /api/cameras`

```bash
curl -X POST http://localhost:3001/api/cameras \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cámara Sala Principal",
    "ip": "192.168.1.100",
    "port": 554,
    "username": "admin",
    "password": "password123",
    "path": "/stream"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Cámara creada correctamente",
  "camera": {
    "id": 1,
    "name": "Cámara Sala Principal",
    "ip": "192.168.1.100",
    "port": 554,
    "username": "admin",
    "path": "/stream",
    "active": true,
    "connection_status": "connected",
    "created_at": "2025-11-03T10:30:00.000Z",
    "updated_at": "2025-11-03T10:30:00.000Z"
  }
}
```

### 2. Iniciar Preview HLS

**Endpoint:** `POST /api/stream/preview/{id}`

```bash
curl -X POST http://localhost:3001/api/stream/preview/1
```

**Respuesta:**
```json
{
  "success": true,
  "hlsUrl": "/api/stream/hls/1",
  "cameraId": 1,
  "message": "Stream iniciado correctamente"
}
```

### 3. Ver Estado del Stream

**Endpoint:** `GET /api/stream/status/{id}`

```bash
curl http://localhost:3001/api/stream/status/1
```

**Respuesta:**
```json
{
  "success": true,
  "status": {
    "cameraId": 1,
    "status": "connected",
    "hlsUrl": "/api/stream/hls/1",
    "attempts": 0,
    "maxAttempts": 5,
    "lastError": null,
    "createdAt": "2025-11-03T10:30:00.000Z",
    "uptime": 45000
  }
}
```

### 4. Detener Preview

**Endpoint:** `DELETE /api/stream/preview/{id}`

```bash
curl -X DELETE http://localhost:3001/api/stream/preview/1
```

## 🎬 Frontend - Usar VideoPreview

### Instalación de HLS.js (opcional pero recomendado)

En el `index.html` del cliente:

```html
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
```

### Usar el Componente

```tsx
import VideoPreview from './components/VideoPreview';

function CameraViewer() {
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);

  const handleStartPreview = async (cameraId: number) => {
    try {
      const response = await fetch(`/api/stream/preview/${cameraId}`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        setHlsUrl(data.hlsUrl);
      }
    } catch (error) {
      console.error('Error al iniciar preview:', error);
    }
  };

  return (
    <div>
      <button onClick={() => handleStartPreview(1)}>
        Ver Cámara
      </button>
      
      {hlsUrl && (
        <VideoPreview
          cameraId={1}
          cameraName="Cámara Principal"
          hlsUrl={hlsUrl}
          showControls={true}
          autoPlay={true}
        />
      )}
    </div>
  );
}
```

## 🔄 Auto-Reconexión

El componente `VideoPreview` maneja la reconexión automáticamente:

- **Max intentos**: 5
- **Delay inicial**: 3 segundos
- **Backoff exponencial**: x1.5 cada intento
- **Delay máximo**: 30 segundos

### Usar Hook useRTSPAutoReconnect

```tsx
import { useRTSPAutoReconnect } from './hooks/useRTSPAutoReconnect';

function MyCameraComponent() {
  const reconnectState = useRTSPAutoReconnect(
    'rtsp://192.168.1.100:554/stream',
    async () => {
      // onConnect - lógica de conexión
      const response = await fetch('/api/stream/preview/1', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to start stream');
    },
    async () => {
      // onDisconnect - lógica de desconexión
      await fetch('/api/stream/preview/1', { method: 'DELETE' });
    },
    {
      maxAttempts: 5,
      delayMs: 3000,
      backoffMultiplier: 1.5,
      maxDelayMs: 30000,
    }
  );

  return (
    <div>
      <div>
        Estado: {reconnectState.isConnected ? '✅ Conectado' : '❌ Desconectado'}
      </div>
      {reconnectState.isReconnecting && (
        <div>
          🔄 Reconectando... (intento {reconnectState.currentAttempt}/{reconnectState.maxAttempts})
          <progress value={reconnectState.currentAttempt} max={reconnectState.maxAttempts} />
        </div>
      )}
      {reconnectState.lastError && (
        <div style={{ color: 'red' }}>
          Error: {reconnectState.lastError}
        </div>
      )}
      {reconnectState.nextRetryIn > 0 && (
        <div>
          Próximo intento en {Math.round(reconnectState.nextRetryIn / 1000)}s
        </div>
      )}
    </div>
  );
}
```

## 📊 Características

### VideoPreview Component
- ✅ Reproducción HLS en navegadores modernos
- ✅ Soporte fallback para navegadores sin HLS nativo (con HLS.js)
- ✅ Controles de play/pause, volumen, pantalla completa
- ✅ Indicador de estado en tiempo real
- ✅ Barra de progreso
- ✅ Información de uptime

### RTSPStreamService (Backend)
- ✅ Conversión RTSP → HLS usando FFmpeg
- ✅ Auto-reconexión automática
- ✅ Backoff exponencial
- ✅ Límite de intentos configurable
- ✅ Gestión de eventos (conectado, reconectando, fallido)
- ✅ Limpieza automática de archivos HLS

### useRTSPAutoReconnect Hook
- ✅ Reconexión automática con retry
- ✅ Backoff exponencial configurable
- ✅ Contador de intentos
- ✅ Información de tiempo hasta próximo intento
- ✅ Métodos: disconnect(), reconnect()

## 🔧 Configuración Avanzada

### Modificar Parámetros de FFmpeg

Editar en `server/src/services/rtsp-stream.service.js`:

```javascript
const ffmpegArgs = [
  '-rtsp_transport', 'tcp',       // UDP para menor latencia (si es estable)
  '-i', rtspUrl,
  '-c:v', 'libx264',              // Cambiar codec de video
  '-preset', 'ultrafast',         // ultrafast, superfast, veryfast, faster, fast
  '-b:v', '2500k',                // Bitrate de video (aumentar para mejor calidad)
  '-c:a', 'aac',                  // Codec de audio
  '-b:a', '128k',                 // Bitrate de audio
  '-hls_time', '2',               // Duración de segmento (ms)
  '-hls_list_size', '5',          // Número de segmentos en playlist
  // ...más opciones
];
```

### Aumentar Límite de Streams Simultáneos

FFmpeg consume recursos. Para múltiples streams:

```javascript
// En RTSPStreamService
const ffmpegArgs = [
  '-rtsp_transport', 'tcp',
  '-allowed_media_types', 'video',  // Solo video, sin audio (menor consumo)
  '-i', rtspUrl,
  '-c:v', 'libx264',
  '-preset', 'veryfast',             // Más rápido pero baja calidad
  '-b:v', '1000k',                   // Menor bitrate
  // ...
];
```

## 🐛 Troubleshooting

### "FFmpeg not found"
```bash
# Verificar FFmpeg está instalado
which ffmpeg

# Agregar a PATH si es necesario
export PATH="/usr/local/bin:$PATH"
```

### "Connection refused"
- Verificar que la cámara RTSP está encendida y en la red
- Verificar IP, puerto, usuario y contraseña
- Probar conexión manual: `ffplay rtsp://user:pass@ip:554/stream`

### "Stream playing but no video"
- Verificar bitrate de video (aumentar en FFmpeg args)
- Comprobar que el navegador soporta el codec H.264
- Ver logs del servidor para errores de FFmpeg

### "High latency"
- Cambiar `-preset` de `ultrafast` a `veryfast`
- Reducir `-hls_time` de 2 a 1
- Usar `-rtsp_transport` UDP en lugar de TCP (si es estable)

### "Memory leak"
- Verificar que los streams se detienen correctamente
- Ver número de procesos FFmpeg: `ps aux | grep ffmpeg`
- Matar procesos huérfanos: `pkill -f ffmpeg`

## 📚 Referencias

- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [HLS.js GitHub](https://github.com/video-dev/hls.js)
- [RTSP Protocol](https://en.wikipedia.org/wiki/Real_Time_Streaming_Protocol)
- [HTTP Live Streaming](https://en.wikipedia.org/wiki/HTTP_Live_Streaming)

---

**Última actualización**: 3 de noviembre de 2025
