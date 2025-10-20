const bcrypt = require('bcrypt')
const prisma = require('../lib/prisma')
const { testRtspConnection, captureSnapshot, getStreamInfo } = require('../utils/rtsp')

const BCRYPT_ROUNDS = 10

class CameraController {
  /**
   * GET /api/cameras - Obtener todas las cámaras
   */
  async getAllCameras(req, res) {
    try {
      const cameras = await prisma.cameras.findMany({
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          name: true,
          ip: true,
          port: true,
          username: true,
          path: true,
          active: true,
          connection_status: true,
          last_checked: true,
          created_at: true,
          updated_at: true
        }
      });

      res.json({ cameras, count: cameras.length });
    } catch (error) {
      console.error('Error fetching cameras:', error);
      res.status(500).json({ error: 'Error al obtener cámaras' });
    }
  }

  /**
   * GET /api/cameras/:id - Obtener una cámara específica
   */
  async getCamera(req, res) {
    try {
      const { id } = req.params;
      const camera = await prisma.cameras.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          name: true,
          ip: true,
          port: true,
          username: true,
          path: true,
          active: true,
          connection_status: true,
          last_checked: true,
          created_at: true,
          updated_at: true
        }
      });

      if (!camera) {
        return res.status(404).json({ error: 'Cámara no encontrada' });
      }

      res.json({ camera });
    } catch (error) {
      console.error('Error fetching camera:', error);
      res.status(500).json({ error: 'Error al obtener cámara' });
    }
  }

  /**
   * POST /api/cameras - Crear una nueva cámara
   */
  async createCamera(req, res) {
    try {
      const { name, ip, port = 554, username = '', password = '', path = '/stream' } = req.body;

      // Validate required fields
      if (!name || !ip) {
        return res.status(400).json({ error: 'Nombre e IP son requeridos' });
      }

      // Validate IP format
      if (!this.isValidIP(ip)) {
        return res.status(400).json({ error: 'Formato de IP inválido' });
      }

      // Validate port
      const parsedPort = parseInt(port);
      if (isNaN(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
        return res.status(400).json({ error: 'Puerto debe estar entre 1 y 65535' });
      }

      try {
        // Encrypt password if provided
        let encryptedPassword = password;
        if (password && password.trim()) {
          encryptedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
        }

        const camera = await prisma.cameras.create({
          data: {
            name,
            ip,
            port: parsedPort,
            username,
            password: encryptedPassword,
            path,
            active: true,
            connection_status: 'disconnected'
          }
        });

        res.status(201).json({
          success: true,
          message: 'Cámara creada exitosamente',
          camera
        });
      } catch (error) {
        if (error.code === 'P2002') {
          return res.status(409).json({ error: 'Ya existe una cámara con ese nombre' });
        }
        throw error;
      }
    } catch (error) {
      console.error('Error creating camera:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * PUT /api/cameras/:id - Actualizar una cámara
   */
  async updateCamera(req, res) {
    try {
      const { id } = req.params;
      const { name, ip, port, username, password, path, active } = req.body;

      // Validate IP if provided
      if (ip && !this.isValidIP(ip)) {
        return res.status(400).json({ error: 'Formato de IP inválido' });
      }

      // Validate port if provided
      if (port) {
        const parsedPort = parseInt(port);
        if (isNaN(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
          return res.status(400).json({ error: 'Puerto debe estar entre 1 y 65535' });
        }
      }

      // Build update data
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (ip !== undefined) updateData.ip = ip;
      if (port !== undefined) updateData.port = parseInt(port);
      if (username !== undefined) updateData.username = username;
      
      // Handle password encryption if provided
      if (password !== undefined) {
        if (password && password.trim()) {
          updateData.password = await bcrypt.hash(password, BCRYPT_ROUNDS);
        } else {
          updateData.password = '';
        }
      }
      
      if (path !== undefined) updateData.path = path;
      if (active !== undefined) updateData.active = active;
      updateData.updated_at = new Date();

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No hay campos para actualizar' });
      }

      try {
        const camera = await prisma.cameras.update({
          where: { id: parseInt(id) },
          data: updateData
        });

        res.json({ success: true, message: 'Cámara actualizada exitosamente', camera });
      } catch (error) {
        if (error.code === 'P2025') {
          return res.status(404).json({ error: 'Cámara no encontrada' });
        }
        if (error.code === 'P2002') {
          return res.status(409).json({ error: 'Ya existe una cámara con ese nombre' });
        }
        throw error;
      }
    } catch (error) {
      console.error('Error updating camera:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * DELETE /api/cameras/:id - Eliminar una cámara
   */
  async deleteCamera(req, res) {
    try {
      const { id } = req.params;

      try {
        await prisma.cameras.delete({
          where: { id: parseInt(id) }
        });

        res.json({ success: true, message: 'Cámara eliminada exitosamente' });
      } catch (error) {
        if (error.code === 'P2025') {
          return res.status(404).json({ error: 'Cámara no encontrada' });
        }
        throw error;
      }
    } catch (error) {
      console.error('Error deleting camera:', error);
      res.status(500).json({ error: 'Error al eliminar cámara' });
    }
  }

  /**
   * POST /api/cameras/:id/test - Probar conexión a una cámara
   */
  async testCameraConnection(req, res) {
    try {
      const { id } = req.params;

      const camera = await prisma.cameras.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          ip: true,
          port: true,
          username: true,
          password: true,
          path: true
        }
      });

      if (!camera) {
        return res.status(404).json({ error: 'Cámara no encontrada' });
      }

      // Build full RTSP URL (password is hashed, so we use stored value as-is for now)
      // In a real scenario, you'd need to decrypt the password
      let rtspUrl = `rtsp://${camera.ip}:${camera.port}${camera.path}`;
      let displayUrl = rtspUrl;
      
      if (camera.username) {
        // Note: For bcrypt hashed passwords, we cannot use them directly in RTSP
        // In production, consider using a different encryption method (like AES) that supports decryption
        rtspUrl = `rtsp://${camera.username}:@${camera.ip}:${camera.port}${camera.path}`;
        displayUrl = `rtsp://${camera.username}:****@${camera.ip}:${camera.port}${camera.path}`;
      }

      // Update last_checked timestamp to "testing"
      await prisma.cameras.update({
        where: { id: parseInt(id) },
        data: {
          connection_status: 'testing',
          last_checked: new Date()
        }
      });

      // Test RTSP connection in the background
      setImmediate(async () => {
        try {
          const testResult = await testRtspConnection(rtspUrl, 10000);
          
          const connectionStatus = testResult.connected ? 'connected' : 'disconnected';
          
          await prisma.cameras.update({
            where: { id: parseInt(id) },
            data: { 
              connection_status: connectionStatus,
              last_checked: new Date()
            }
          });

          console.log(`Camera ${id} connection test result:`, testResult);
        } catch (err) {
          console.error(`Error testing camera ${id} connection:`, err);
          
          await prisma.cameras.update({
            where: { id: parseInt(id) },
            data: { 
              connection_status: 'disconnected',
              last_checked: new Date()
            }
          }).catch(e => console.error('Error updating camera status:', e));
        }
      });

      // Return immediate response
      res.json({
        success: true,
        connection_status: 'testing',
        rtsp_url: displayUrl,
        message: 'Prueba de conexión iniciada. El estado se actualizará en segundos.'
      });
    } catch (error) {
      console.error('Error testing camera connection:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * GET /api/cameras/:id/snapshot - Capturar snapshot de una cámara
   */
  async getSnapshot(req, res) {
    try {
      const { id } = req.params;

      const camera = await prisma.cameras.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          ip: true,
          port: true,
          username: true,
          password: true,
          path: true
        }
      });

      if (!camera) {
        return res.status(404).json({ error: 'Cámara no encontrada' });
      }

      // Build RTSP URL
      let rtspUrl = `rtsp://${camera.ip}:${camera.port}${camera.path}`;
      if (camera.username) {
        rtspUrl = `rtsp://${camera.username}:@${camera.ip}:${camera.port}${camera.path}`;
      }

      try {
        const snapshotBuffer = await captureSnapshot(rtspUrl, 10000);
        
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Content-Length', snapshotBuffer.length);
        res.send(snapshotBuffer);
      } catch (error) {
        console.error('Error capturing snapshot:', error);
        res.status(500).json({ 
          error: 'Error capturando snapshot',
          details: error.message
        });
      }
    } catch (error) {
      console.error('Error in getSnapshot:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * GET /api/cameras/:id/info - Obtener información del stream
   */
  async getStreamInfo(req, res) {
    try {
      const { id } = req.params;

      const camera = await prisma.cameras.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          ip: true,
          port: true,
          username: true,
          password: true,
          path: true
        }
      });

      if (!camera) {
        return res.status(404).json({ error: 'Cámara no encontrada' });
      }

      // Build RTSP URL
      let rtspUrl = `rtsp://${camera.ip}:${camera.port}${camera.path}`;
      if (camera.username) {
        rtspUrl = `rtsp://${camera.username}:@${camera.ip}:${camera.port}${camera.path}`;
      }

      try {
        const streamInfo = await getStreamInfo(rtspUrl, 10000);
        res.json(streamInfo);
      } catch (error) {
        console.error('Error getting stream info:', error);
        res.status(500).json({ 
          error: 'Error obteniendo información del stream',
          details: error.message
        });
      }
    } catch (error) {
      console.error('Error in getStreamInfo:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Validate IP address format
   */
  isValidIP(ip) {
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    const hostPattern = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
    
    if (ipv4Pattern.test(ip)) {
      const parts = ip.split('.');
      return parts.every(part => parseInt(part) >= 0 && parseInt(part) <= 255);
    }
    
    return hostPattern.test(ip);
  }
}

module.exports = new CameraController();
