const { execSync, spawn } = require('child_process');
const path = require('path');
const ffmpegStatic = require('ffmpeg-static');

/**
 * RTSP utility functions for camera connection testing
 */

/**
 * Test RTSP connection to a camera
 * @param {string} rtspUrl - Full RTSP URL with credentials
 * @param {number} timeout - Timeout in milliseconds (default 10000ms)
 * @returns {Promise<Object>} Connection test result
 */
async function testRtspConnection(rtspUrl, timeout = 10000) {
  return new Promise((resolve) => {
    try {
      // Use ffprobe to test connection
      const process = spawn(ffmpegStatic, [
        '-rtsp_transport', 'tcp',
        '-i', rtspUrl,
        '-t', '1',
        '-f', 'null',
        '-'
      ]);

      let timedOut = false;
      
      const timer = setTimeout(() => {
        timedOut = true;
        process.kill();
        resolve({
          success: false,
          connected: false,
          error: 'Connection timeout',
          message: 'La cámara no respondió en el tiempo esperado'
        });
      }, timeout);

      process.on('close', (code) => {
        clearTimeout(timer);
        
        if (timedOut) return;

        // FFmpeg exits with code 0 on success, 1 on error
        if (code === 0 || code === 1) {
          resolve({
            success: true,
            connected: true,
            error: null,
            message: 'Conexión exitosa a la cámara'
          });
        } else {
          resolve({
            success: false,
            connected: false,
            error: `Process exited with code ${code}`,
            message: 'Error de conexión a la cámara'
          });
        }
      });

      process.on('error', (err) => {
        clearTimeout(timer);
        
        if (timedOut) return;
        
        resolve({
          success: false,
          connected: false,
          error: err.message,
          message: 'Error al conectar con la cámara'
        });
      });

      // Close stdin
      process.stdin.end();
    } catch (error) {
      resolve({
        success: false,
        connected: false,
        error: error.message,
        message: 'Error interno al probar la conexión'
      });
    }
  });
}

/**
 * Capture a snapshot from an RTSP camera
 * @param {string} rtspUrl - Full RTSP URL with credentials
 * @param {number} timeout - Timeout in milliseconds (default 10000ms)
 * @returns {Promise<Buffer>} Image buffer (JPEG)
 */
async function captureSnapshot(rtspUrl, timeout = 10000) {
  return new Promise((resolve, reject) => {
    try {
      const ffmpegPath = ffmpegStatic;
      let snapshotBuffer = Buffer.alloc(0);

      const process = spawn(ffmpegPath, [
        '-rtsp_transport', 'tcp',
        '-i', rtspUrl,
        '-vframes', '1',
        '-q:v', '2',
        '-f', 'image2pipe',
        '-c:v', 'mjpeg',
        'pipe:1'
      ]);

      let timedOut = false;
      
      const timer = setTimeout(() => {
        timedOut = true;
        process.kill();
        reject(new Error('Snapshot capture timeout'));
      }, timeout);

      process.stdout.on('data', (chunk) => {
        snapshotBuffer = Buffer.concat([snapshotBuffer, chunk]);
      });

      process.on('close', (code) => {
        clearTimeout(timer);
        
        if (timedOut) return;

        if (code === 0 && snapshotBuffer.length > 0) {
          resolve(snapshotBuffer);
        } else {
          reject(new Error(`Failed to capture snapshot (exit code: ${code})`));
        }
      });

      process.on('error', (err) => {
        clearTimeout(timer);
        
        if (timedOut) return;
        
        reject(new Error(`FFmpeg error: ${err.message}`));
      });

      // Close stdin
      process.stdin.end();
    } catch (error) {
      reject(new Error(`Snapshot error: ${error.message}`));
    }
  });
}

/**
 * Get RTSP stream information (resolution, codec, etc)
 * @param {string} rtspUrl - Full RTSP URL with credentials
 * @param {number} timeout - Timeout in milliseconds (default 10000ms)
 * @returns {Promise<Object>} Stream information
 */
async function getStreamInfo(rtspUrl, timeout = 10000) {
  return new Promise((resolve) => {
    try {
      const process = spawn(ffmpegStatic, [
        '-rtsp_transport', 'tcp',
        '-i', rtspUrl
      ]);

      let output = '';
      let timedOut = false;
      
      const timer = setTimeout(() => {
        timedOut = true;
        process.kill();
        resolve({
          success: false,
          error: 'Timeout getting stream info'
        });
      }, timeout);

      // FFmpeg outputs to stderr
      process.stderr.on('data', (data) => {
        output += data.toString();
      });

      process.on('close', () => {
        clearTimeout(timer);
        
        if (timedOut) return;

        try {
          // Parse FFmpeg output for resolution
          const resolutionMatch = output.match(/(\d+)x(\d+)/);
          const codecMatch = output.match(/Video:.*?(h264|h265|mpeg4|vp8|vp9)/i);
          const fpsMatch = output.match(/(\d+(?:\.\d+)?)\s*fps/i);

          resolve({
            success: true,
            resolution: resolutionMatch ? `${resolutionMatch[1]}x${resolutionMatch[2]}` : 'Unknown',
            codec: codecMatch ? codecMatch[1] : 'Unknown',
            fps: fpsMatch ? parseFloat(fpsMatch[1]) : 'Unknown',
            raw: output
          });
        } catch (err) {
          resolve({
            success: false,
            error: err.message
          });
        }
      });

      process.on('error', (err) => {
        clearTimeout(timer);
        
        if (timedOut) return;
        
        resolve({
          success: false,
          error: err.message
        });
      });

      // Close stdin
      process.stdin.end();
    } catch (error) {
      resolve({
        success: false,
        error: error.message
      });
    }
  });
}

module.exports = {
  testRtspConnection,
  captureSnapshot,
  getStreamInfo
};
