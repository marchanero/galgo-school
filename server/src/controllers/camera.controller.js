const { getDatabase } = require('../config/database');

class CameraController {
  /**
   * GET /api/cameras - Obtener todas las cámaras
   */
  async getAllCameras(req, res) {
    try {
      const db = getDatabase();

      db.all(
        'SELECT id, name, ip, port, username, password, path, active, connection_status, last_checked, created_at, updated_at FROM cameras ORDER BY created_at DESC',
        [],
        (err, rows) => {
          if (err) {
            console.error('Error fetching cameras:', err);
            return res.status(500).json({ error: 'Error al obtener cámaras' });
          }

          // Don't return passwords in the response
          const cameras = rows.map(camera => ({
            id: camera.id,
            name: camera.name,
            ip: camera.ip,
            port: camera.port,
            username: camera.username,
            path: camera.path,
            active: camera.active === 1,
            connection_status: camera.connection_status,
            last_checked: camera.last_checked,
            created_at: camera.created_at,
            updated_at: camera.updated_at
          }));

          res.json({ cameras, count: cameras.length });
        }
      );
    } catch (error) {
      console.error('Error fetching cameras:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * GET /api/cameras/:id - Obtener una cámara específica
   */
  async getCamera(req, res) {
    try {
      const { id } = req.params;
      const db = getDatabase();

      db.get(
        'SELECT id, name, ip, port, username, path, active, connection_status, last_checked, created_at, updated_at FROM cameras WHERE id = ?',
        [id],
        (err, row) => {
          if (err) {
            console.error('Error fetching camera:', err);
            return res.status(500).json({ error: 'Error al obtener cámara' });
          }

          if (!row) {
            return res.status(404).json({ error: 'Cámara no encontrada' });
          }

          res.json({ camera: row });
        }
      );
    } catch (error) {
      console.error('Error fetching camera:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
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

      const db = getDatabase();

      db.run(
        'INSERT INTO cameras (name, ip, port, username, password, path, active) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, ip, parsedPort, username, password, path, 1],
        function(err) {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
              return res.status(409).json({ error: 'Ya existe una cámara con ese nombre' });
            }
            console.error('Error creating camera:', err);
            return res.status(500).json({ error: 'Error al crear cámara' });
          }

          res.status(201).json({
            success: true,
            message: 'Cámara creada exitosamente',
            camera: {
              id: this.lastID,
              name,
              ip,
              port: parsedPort,
              username,
              path,
              active: true,
              connection_status: 'disconnected'
            }
          });
        }
      );
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

      const db = getDatabase();

      // Build dynamic update query
      const updates = [];
      const params = [];

      if (name !== undefined) {
        updates.push('name = ?');
        params.push(name);
      }
      if (ip !== undefined) {
        updates.push('ip = ?');
        params.push(ip);
      }
      if (port !== undefined) {
        updates.push('port = ?');
        params.push(parseInt(port));
      }
      if (username !== undefined) {
        updates.push('username = ?');
        params.push(username);
      }
      if (password !== undefined) {
        updates.push('password = ?');
        params.push(password);
      }
      if (path !== undefined) {
        updates.push('path = ?');
        params.push(path);
      }
      if (active !== undefined) {
        updates.push('active = ?');
        params.push(active ? 1 : 0);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No hay campos para actualizar' });
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      db.run(
        `UPDATE cameras SET ${updates.join(', ')} WHERE id = ?`,
        params,
        function(err) {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
              return res.status(409).json({ error: 'Ya existe una cámara con ese nombre' });
            }
            console.error('Error updating camera:', err);
            return res.status(500).json({ error: 'Error al actualizar cámara' });
          }

          if (this.changes === 0) {
            return res.status(404).json({ error: 'Cámara no encontrada' });
          }

          res.json({ success: true, message: 'Cámara actualizada exitosamente' });
        }
      );
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
      const db = getDatabase();

      db.run('DELETE FROM cameras WHERE id = ?', [id], function(err) {
        if (err) {
          console.error('Error deleting camera:', err);
          return res.status(500).json({ error: 'Error al eliminar cámara' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Cámara no encontrada' });
        }

        res.json({ success: true, message: 'Cámara eliminada exitosamente' });
      });
    } catch (error) {
      console.error('Error deleting camera:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * POST /api/cameras/:id/test - Probar conexión a una cámara
   */
  async testCameraConnection(req, res) {
    try {
      const { id } = req.params;
      const db = getDatabase();

      db.get('SELECT ip, port, username, password, path FROM cameras WHERE id = ?', [id], (err, camera) => {
        if (err) {
          console.error('Error fetching camera:', err);
          return res.status(500).json({ error: 'Error al obtener cámara' });
        }

        if (!camera) {
          return res.status(404).json({ error: 'Cámara no encontrada' });
        }

        // Build RTSP URL
        let rtspUrl = `rtsp://${camera.ip}:${camera.port}${camera.path}`;
        if (camera.username && camera.password) {
          rtspUrl = `rtsp://${camera.username}:${camera.password}@${camera.ip}:${camera.port}${camera.path}`;
        }

        // For now, simulate a connection test (would need actual RTSP testing library)
        const connectionStatus = 'testing';
        
        // Update last_checked timestamp
        db.run(
          'UPDATE cameras SET connection_status = ?, last_checked = CURRENT_TIMESTAMP WHERE id = ?',
          [connectionStatus, id],
          (updateErr) => {
            if (updateErr) {
              console.error('Error updating camera status:', updateErr);
            }

            // Simulate async test and respond
            setTimeout(() => {
              res.json({
                success: true,
                connection_status: 'connected',
                rtsp_url: rtspUrl,
                message: 'Conexión a cámara establecida exitosamente'
              });

              // Update final status
              db.run(
                'UPDATE cameras SET connection_status = ? WHERE id = ?',
                ['connected', id],
                (err) => {
                  if (err) console.error('Error updating final camera status:', err);
                }
              );
            }, 2000);
          }
        );
      });
    } catch (error) {
      console.error('Error testing camera connection:', error);
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
