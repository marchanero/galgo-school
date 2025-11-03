# 🚀 Quick Start - Cámaras RTSP en Galgo-School

## ⚡ En 5 Minutos

### 1. Inicia el Servidor

```bash
cd server && npm install && npm start
```

Verifica: `Server running on port 3001 ✅`

### 2. Inicia el Cliente

```bash
cd client-configurator && npm install && npm run dev
```

Abre: `http://localhost:5173`

### 3. Agrega una Cámara

- Ve a: **Configuración → Cámaras RTSP**
- Haz clic en **"+ Agregar Cámara"**
- Rellena:
  - **Nombre**: "Mi Cámara"
  - **IP**: `192.168.X.X` (IP de tu cámara)
  - **Puerto**: `554`
  - **Usuario**: `admin` (o déjalo vacío)
  - **Contraseña**: `12345` (o déjalo vacío)
  - **Ruta**: `/stream`
- Haz clic en **"Probar"** para verificar conexión
- Haz clic en **"Agregar Cámara"**

### 4. Visualiza el Stream

- Ve a: **Cámaras RTSP → Preview**
- Verás tu cámara en la lista
- Haz clic en **"Iniciar"** ▶️
- **Espera 3-5 segundos** (FFmpeg está iniciando)
- ¡Deberías ver el video! 🎥

---

## 🔍 Debugging

### Abre la Consola del Navegador (F12)

Deberías ver logs como:

```
📹 Cargando 1 cámaras configuradas...
✅ Cámaras cargadas desde props:
🔄 Intento 1/3 - Iniciando stream para cámara "Mi Cámara" (192.168.X.X:554)
✅ Stream iniciado exitosamente para Mi Cámara:
```

### Revisa la Terminal del Servidor

```
📹 Stream iniciado para cámara <id>: rtsp://192.168.X.X:554/stream
✅ Manifest HLS parseado correctamente
```

---

## 🐛 Problemas Comunes

| Problema | Solución |
|----------|----------|
| "Sin cámaras configuradas" | Agrega una en Configuración → Cámaras RTSP |
| "No se pudo conectar" | Verifica IP, puerto y credenciales |
| "Stream iniciado pero sin video" | Espera 5-10 segundos (FFmpeg está convirtiendo) |
| "HTTP 502 Bad Gateway" | Reinicia servidor: `npm start` |
| Error HLS en navegador | Actualiza la página (F5) |

---

## 📊 Arquitectura

```
Cliente (RTSPCameraGallery)
    ↓ POST /api/stream/preview/:id
Servidor (RTSPStreamService)
    ↓ Inicia FFmpeg
FFmpeg: RTSP → HLS
    ↓ Genera M3U8 + segmentos TS
Cliente (VideoPreview + HLS.js)
    ↓ GET /api/stream/hls/:id
Navegador: Reproduce video 🎬
```

---

## 🎯 Siguiente Paso

Lee el guía completa: `RTSP_SETUP_GUIDE.md`

¡Disfruta! 🎉

