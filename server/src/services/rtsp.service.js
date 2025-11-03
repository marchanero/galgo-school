const { getDatabase } = require('../config/database');

class RTSPService {
  constructor() {
    this.activeStreams = new Map(); // Para mantener streams activos
  }

  /**
   * Construir URL RTSP completa
   */
  buildRTSPUrl(camera) {
    let rtspUrl = `rtsp://${camera.ip}:${camera.port}${camera.path}`;
    if (camera.username && camera.password) {
      rtspUrl = `rtsp://${camera.username}:${camera.password}@${camera.ip}:${camera.port}${camera.path}`;
    }
    return rtspUrl;
  }

  /**
   * Probar conexión RTSP real usando TCP socket
   */
  async testRTSPConnection(camera) {
    return new Promise((resolve) => {
      const net = require('net');
      const url = require('url');

      try {
        const rtspUrl = this.buildRTSPUrl(camera);
        const parsedUrl = url.parse(rtspUrl);

        console.log(`🔍 Probando conexión RTSP: ${rtspUrl}`);

        const socket = net.createConnection({
          host: parsedUrl.hostname,
          port: parseInt(parsedUrl.port) || 554,
          timeout: 5000 // 5 segundos timeout
        });

        socket.on('connect', () => {
          console.log(`✅ Conexión TCP exitosa a ${camera.ip}:${camera.port}`);

          // Enviar comando OPTIONS RTSP básico
          const optionsCommand = `OPTIONS ${rtspUrl} RTSP/1.0\r\nCSeq: 1\r\n\r\n`;
          socket.write(optionsCommand);

          // Esperar respuesta
          socket.on('data', (data) => {
            const response = data.toString();
            console.log(`📡 Respuesta RTSP: ${response.substring(0, 100)}...`);

            if (response.includes('RTSP/1.0 200 OK')) {
              socket.end();
              resolve({
                success: true,
                status: 'connected',
                message: 'Conexión RTSP exitosa',
                rtsp_url: rtspUrl
              });
            } else {
              socket.end();
              resolve({
                success: false,
                status: 'error',
                message: 'Respuesta RTSP inválida',
                rtsp_url: rtspUrl
              });
            }
          });
        });

        socket.on('timeout', () => {
          socket.end();
          resolve({
            success: false,
            status: 'timeout',
            message: 'Timeout en conexión RTSP',
            rtsp_url: rtspUrl
          });
        });

        socket.on('error', (error) => {
          console.error(`❌ Error de conexión RTSP: ${error.message}`);
          resolve({
            success: false,
            status: 'disconnected',
            message: `Error de conexión: ${error.message}`,
            rtsp_url: rtspUrl
          });
        });

      } catch (error) {
        console.error(`❌ Error al construir URL RTSP: ${error.message}`);
        resolve({
          success: false,
          status: 'error',
          message: `Error al construir URL: ${error.message}`,
          rtsp_url: null
        });
      }
    });
  }

  /**
   * Obtener información del stream RTSP (DESCRIBE)
   */
  async getStreamInfo(camera) {
    return new Promise((resolve) => {
      const net = require('net');
      const url = require('url');

      try {
        const rtspUrl = this.buildRTSPUrl(camera);
        const parsedUrl = url.parse(rtspUrl);

        console.log(`📋 Obteniendo información del stream: ${rtspUrl}`);

        const socket = net.createConnection({
          host: parsedUrl.hostname,
          port: parseInt(parsedUrl.port) || 554,
          timeout: 5000
        });

        let sessionId = null;
        let streamInfo = {
          videoCodec: null,
          audioCodec: null,
          resolution: null,
          frameRate: null
        };

        socket.on('connect', () => {
          // Enviar comando DESCRIBE
          const cseq = Math.floor(Math.random() * 10000);
          const describeCommand = `DESCRIBE ${rtspUrl} RTSP/1.0\r\nCSeq: ${cseq}\r\nAccept: application/sdp\r\n\r\n`;
          socket.write(describeCommand);
        });

        socket.on('data', (data) => {
          const response = data.toString();
          console.log(`📄 Respuesta DESCRIBE: ${response.substring(0, 200)}...`);

          if (response.includes('RTSP/1.0 200 OK')) {
            // Extraer información del SDP
            const sdpLines = response.split('\r\n');
            let inMediaSection = false;

            for (const line of sdpLines) {
              if (line.startsWith('m=video')) {
                inMediaSection = true;
                streamInfo.hasVideo = true;
              } else if (line.startsWith('m=audio')) {
                inMediaSection = true;
                streamInfo.hasAudio = true;
              } else if (line.startsWith('a=rtpmap:') && inMediaSection) {
                const codecMatch = line.match(/a=rtpmap:\d+ (\w+)/);
                if (codecMatch) {
                  if (streamInfo.hasVideo && !streamInfo.videoCodec) {
                    streamInfo.videoCodec = codecMatch[1];
                  } else if (streamInfo.hasAudio && !streamInfo.audioCodec) {
                    streamInfo.audioCodec = codecMatch[1];
                  }
                }
              }
            }

            socket.end();
            resolve({
              success: true,
              stream_info: streamInfo,
              message: 'Información del stream obtenida exitosamente'
            });
          } else {
            socket.end();
            resolve({
              success: false,
              stream_info: null,
              message: 'No se pudo obtener información del stream'
            });
          }
        });

        socket.on('timeout', () => {
          socket.end();
          resolve({
            success: false,
            stream_info: null,
            message: 'Timeout al obtener información del stream'
          });
        });

        socket.on('error', (error) => {
          console.error(`❌ Error al obtener información del stream: ${error.message}`);
          resolve({
            success: false,
            stream_info: null,
            message: `Error: ${error.message}`
          });
        });

      } catch (error) {
        console.error(`❌ Error al obtener información del stream: ${error.message}`);
        resolve({
          success: false,
          stream_info: null,
          message: `Error: ${error.message}`
        });
      }
    });
  }

  /**
   * Iniciar retransmisión RTSP (relay)
   */
  async startStreamRelay(cameraId, outputPort = 8554) {
    try {
      const db = getDatabase();
      const camera = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM cameras WHERE id = ?', [cameraId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!camera) {
        throw new Error('Cámara no encontrada');
      }

      const rtspUrl = this.buildRTSPUrl(camera);

      // Aquí implementaríamos la lógica de retransmisión usando ffmpeg o similar
      // Por ahora, solo simulamos
      console.log(`🎬 Iniciando retransmisión RTSP para cámara ${camera.name}`);
      console.log(`📡 URL fuente: ${rtspUrl}`);
      console.log(`📡 Puerto salida: ${outputPort}`);

      // Marcar como activo en memoria
      this.activeStreams.set(cameraId, {
        cameraId,
        rtspUrl,
        outputPort,
        startTime: new Date(),
        status: 'streaming'
      });

      return {
        success: true,
        relay_url: `rtsp://localhost:${outputPort}/relay`,
        message: 'Retransmisión RTSP iniciada'
      };

    } catch (error) {
      console.error(`❌ Error al iniciar retransmisión: ${error.message}`);
      return {
        success: false,
        relay_url: null,
        message: `Error: ${error.message}`
      };
    }
  }

  /**
   * Detener retransmisión RTSP
   */
  async stopStreamRelay(cameraId) {
    try {
      const stream = this.activeStreams.get(cameraId);
      if (!stream) {
        return {
          success: false,
          message: 'No hay retransmisión activa para esta cámara'
        };
      }

      console.log(`🛑 Deteniendo retransmisión RTSP para cámara ${cameraId}`);

      // Aquí implementaríamos la lógica para detener el proceso ffmpeg
      this.activeStreams.delete(cameraId);

      return {
        success: true,
        message: 'Retransmisión RTSP detenida'
      };

    } catch (error) {
      console.error(`❌ Error al detener retransmisión: ${error.message}`);
      return {
        success: false,
        message: `Error: ${error.message}`
      };
    }
  }

  /**
   * Obtener estado de streams activos
   */
  getActiveStreams() {
    return Array.from(this.activeStreams.values()).map(stream => ({
      cameraId: stream.cameraId,
      rtspUrl: stream.rtspUrl,
      outputPort: stream.outputPort,
      startTime: stream.startTime,
      status: stream.status,
      uptime: Date.now() - stream.startTime.getTime()
    }));
  }

  /**
   * Actualizar estado de conexión de cámara en BD
   */
  async updateCameraStatus(cameraId, status, additionalData = {}) {
    try {
      const db = getDatabase();
      const updateData = {
        connection_status: status,
        last_checked: new Date().toISOString()
      };

      // Agregar datos adicionales si existen
      Object.assign(updateData, additionalData);

      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE cameras SET connection_status = ?, last_checked = ? WHERE id = ?',
          [updateData.connection_status, updateData.last_checked, cameraId],
          function(err) {
            if (err) reject(err);
            else resolve(this.changes);
          }
        );
      });

      console.log(`📊 Estado de cámara ${cameraId} actualizado: ${status}`);
      return { success: true };

    } catch (error) {
      console.error(`❌ Error al actualizar estado de cámara: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new RTSPService();