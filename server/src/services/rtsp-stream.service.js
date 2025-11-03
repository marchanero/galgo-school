const { spawn } = require('child_process');
const { EventEmitter } = require('events');
const path = require('path');
const fs = require('fs');

/**
 * Servicio para manejar streams RTSP con auto-reconexión
 * Convierte streams RTSP a HLS usando ffmpeg
 */
class RTSPStreamService extends EventEmitter {
  constructor() {
    super();
    this.streams = new Map(); // Map<cameraId, { process, url, status, attempts, maxAttempts }>
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000; // 3 segundos
    this.outputDir = path.join(__dirname, '../../public/hls');
  }

  /**
   * Inicializar directorio de salida
   */
  async initializeOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Construir URL RTSP completa
   */
  buildRTSPUrl(camera) {
    const { ip, port = 554, username = '', password = '', path: cameraPath = '/stream' } = camera;
    
    if (username && password) {
      return `rtsp://${username}:${password}@${ip}:${port}${cameraPath}`;
    }
    
    return `rtsp://${ip}:${port}${cameraPath}`;
  }

  /**
   * Iniciar stream de una cámara
   */
  async startStream(cameraId, camera) {
    try {
      await this.initializeOutputDir();

      const rtspUrl = this.buildRTSPUrl(camera);
      const hlsPath = path.join(this.outputDir, `camera_${cameraId}.m3u8`);
      const hlsUrl = `/api/stream/hls/${cameraId}`;

      // Si ya existe un stream, detenerlo
      if (this.streams.has(cameraId)) {
        await this.stopStream(cameraId);
      }

      // Crear entrada para el stream
      const streamData = {
        cameraId,
        rtspUrl,
        hlsPath,
        hlsUrl,
        status: 'connecting',
        attempts: 0,
        maxAttempts: this.maxReconnectAttempts,
        process: null,
        lastError: null,
        createdAt: new Date()
      };

      this.streams.set(cameraId, streamData);

      // Iniciar proceso ffmpeg
      this._startFFmpegProcess(cameraId, streamData);

      console.log(`📹 Stream iniciado para cámara ${cameraId}: ${rtspUrl}`);
      this.emit('stream:started', { cameraId, hlsUrl });

      return { 
        success: true, 
        hlsUrl, 
        cameraId,
        message: 'Stream iniciado correctamente'
      };
    } catch (error) {
      console.error(`❌ Error al iniciar stream para cámara ${cameraId}:`, error);
      this.emit('stream:error', { cameraId, error: error.message });
      throw error;
    }
  }

  /**
   * Iniciar proceso ffmpeg para RTSP a HLS
   */
  _startFFmpegProcess(cameraId, streamData) {
    try {
      const { rtspUrl, hlsPath } = streamData;

      // Argumentos de ffmpeg optimizados para RTSP a HLS
      const ffmpegArgs = [
        '-rtsp_transport', 'tcp',           // Usar TCP en lugar de UDP para mejor confiabilidad
        '-i', rtspUrl,                      // Input RTSP
        '-c:v', 'libx264',                  // Video codec
        '-preset', 'ultrafast',             // Velocidad de encoding
        '-b:v', '2500k',                    // Bitrate de video
        '-c:a', 'aac',                      // Audio codec
        '-b:a', '128k',                     // Bitrate de audio
        '-hls_time', '2',                   // Duración de cada segmento
        '-hls_list_size', '5',              // Número de segmentos en la playlist
        '-hls_flags', 'delete_segments',    // Eliminar segmentos antiguos
        '-f', 'hls',                        // Formato HLS
        '-y',                               // Sobrescribir archivos
        hlsPath                             // Output
      ];

      const ffmpegProcess = spawn('ffmpeg', ffmpegArgs, {
        stdio: ['ignore', 'pipe', 'pipe']  // No stdin, capturar stdout y stderr
      });

      streamData.process = ffmpegProcess;
      streamData.status = 'connecting';

      // Manejar salida
      ffmpegProcess.stderr.on('data', (data) => {
        const output = data.toString();
        console.log(`[FFmpeg ${cameraId}]:`, output.substring(0, 100));
      });

      // Manejar cierre del proceso
      ffmpegProcess.on('close', (code) => {
        console.log(`⚠️  Proceso ffmpeg para cámara ${cameraId} cerrado con código: ${code}`);
        streamData.status = 'disconnected';

        // Intentar reconectar
        this._attemptReconnect(cameraId, streamData);
      });

      // Manejar errores del proceso
      ffmpegProcess.on('error', (err) => {
        console.error(`❌ Error en proceso ffmpeg para cámara ${cameraId}:`, err);
        streamData.status = 'error';
        streamData.lastError = err.message;
        this._attemptReconnect(cameraId, streamData);
      });

      // Considerar stream conectado después de 2 segundos (tiempo para inicializar)
      setTimeout(() => {
        if (streamData.process && !streamData.process.killed && streamData.status !== 'error') {
          streamData.status = 'connected';
          streamData.attempts = 0; // Reset intentos
          this.emit('stream:connected', { cameraId, hlsUrl: streamData.hlsUrl });
          console.log(`✅ Stream conectado para cámara ${cameraId}`);
        }
      }, 2000);

    } catch (error) {
      console.error(`❌ Error al crear proceso ffmpeg para cámara ${cameraId}:`, error);
      streamData.status = 'error';
      streamData.lastError = error.message;
      this._attemptReconnect(cameraId, streamData);
    }
  }

  /**
   * Intentar reconectar
   */
  _attemptReconnect(cameraId, streamData) {
    streamData.attempts += 1;

    if (streamData.attempts <= streamData.maxAttempts) {
      console.log(`🔄 Intentando reconectar cámara ${cameraId} (intento ${streamData.attempts}/${streamData.maxAttempts})...`);
      
      this.emit('stream:reconnecting', { 
        cameraId, 
        attempt: streamData.attempts,
        maxAttempts: streamData.maxAttempts
      });

      // Esperar antes de reconectar
      setTimeout(() => {
        if (this.streams.has(cameraId)) {
          const data = this.streams.get(cameraId);
          if (data.status !== 'connected' && !data.process?.killed) {
            this._startFFmpegProcess(cameraId, data);
          }
        }
      }, this.reconnectDelay);
    } else {
      console.error(`❌ Se alcanzó el máximo de intentos de reconexión para cámara ${cameraId}`);
      streamData.status = 'failed';
      this.emit('stream:failed', { 
        cameraId, 
        attempts: streamData.attempts,
        error: streamData.lastError 
      });
    }
  }

  /**
   * Detener stream de una cámara
   */
  async stopStream(cameraId) {
    try {
      const streamData = this.streams.get(cameraId);

      if (!streamData) {
        console.warn(`Stream no encontrado para cámara ${cameraId}`);
        return { success: false, message: 'Stream no encontrado' };
      }

      // Matar proceso ffmpeg
      if (streamData.process && !streamData.process.killed) {
        streamData.process.kill();
        console.log(`⛔ Stream detenido para cámara ${cameraId}`);
      }

      // Eliminar archivos HLS
      try {
        if (fs.existsSync(streamData.hlsPath)) {
          fs.unlinkSync(streamData.hlsPath);
        }
        // Eliminar segmentos
        const dir = path.dirname(streamData.hlsPath);
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          if (file.startsWith(`camera_${cameraId}`) && file.endsWith('.ts')) {
            fs.unlinkSync(path.join(dir, file));
          }
        });
      } catch (e) {
        console.warn(`Advertencia al eliminar archivos HLS:`, e.message);
      }

      // Remover del mapa
      this.streams.delete(cameraId);
      this.emit('stream:stopped', { cameraId });

      return { success: true, message: 'Stream detenido correctamente' };
    } catch (error) {
      console.error(`Error al detener stream para cámara ${cameraId}:`, error);
      throw error;
    }
  }

  /**
   * Obtener estado de todos los streams
   */
  getStreamStatus(cameraId = null) {
    if (cameraId) {
      const streamData = this.streams.get(cameraId);
      if (!streamData) return null;

      return {
        cameraId: streamData.cameraId,
        status: streamData.status,
        hlsUrl: streamData.hlsUrl,
        attempts: streamData.attempts,
        maxAttempts: streamData.maxAttempts,
        lastError: streamData.lastError,
        createdAt: streamData.createdAt,
        uptime: new Date() - streamData.createdAt
      };
    }

    // Retornar estado de todos los streams
    const allStatus = [];
    this.streams.forEach((streamData, cameraId) => {
      allStatus.push({
        cameraId: streamData.cameraId,
        status: streamData.status,
        hlsUrl: streamData.hlsUrl,
        attempts: streamData.attempts,
        maxAttempts: streamData.maxAttempts,
        lastError: streamData.lastError,
        createdAt: streamData.createdAt,
        uptime: new Date() - streamData.createdAt
      });
    });

    return allStatus;
  }

  /**
   * Detener todos los streams
   */
  async stopAllStreams() {
    const promises = [];
    this.streams.forEach((_, cameraId) => {
      promises.push(this.stopStream(cameraId));
    });

    return Promise.all(promises);
  }

  /**
   * Obtener ruta del archivo HLS para una cámara
   */
  getHLSPath(cameraId) {
    const streamData = this.streams.get(cameraId);
    return streamData ? streamData.hlsPath : null;
  }

  /**
   * Verificar si hay un stream activo para una cámara
   */
  isStreamActive(cameraId) {
    const streamData = this.streams.get(cameraId);
    return streamData && streamData.status === 'connected';
  }
}

module.exports = new RTSPStreamService();
