const prisma = require('../lib/prisma');

class ConfigurationController {
  // GET /api/configurations - Obtener todas las configuraciones
  async getConfigurations(req, res) {
    try {
      // Configuraciones por defecto
      const defaultConfigs = {
        general: {
          theme: 'light',
          recordingAutoStart: false,
          language: 'es',
          timezone: 'Europe/Madrid'  // Zona horaria por defecto: México
        },
        recordings: {
          directory: '/home/roberto/galgo-recordings',
          format: 'MP4 (H.264)',
          maxDuration: 60,
          quality: 'Alta (1080p)'
        },
        mqtt: {
          defaultBroker: 'EMQX Local (localhost:1883)',
          host: 'localhost',
          port: 1883,
          username: '',
          password: '',
          ssl: false
        },
        cameras: {
          defaultRtspPort: 554,
          defaultRtspPath: '/stream',
          connectionTimeout: 10,
          defaultQuality: '1080p (Alta)',
          defaultFrameRate: '30 FPS',
          autoReconnect: true,
          videoBuffer: true,
          bufferSize: 5,
          cameraIPs: []
        },
        sensors: {
          autoLoad: true,
          defaultActive: true,
          refreshInterval: 30,
          sensors: []
        },
        topics: {
          autoSubscribe: true,
          defaultQos: 0,
          defaultRetained: false,
          topics: []
        }
      };

      // Obtener todas las configuraciones de la base de datos usando Prisma
      const savedConfigRows = await prisma.configurations.findMany();
      
      let configurations = { ...defaultConfigs };

      if (savedConfigRows && savedConfigRows.length > 0) {
        // Group configurations by category
        const savedConfigs = {};
        savedConfigRows.forEach(row => {
          if (!savedConfigs[row.category]) {
            savedConfigs[row.category] = {};
          }

          // Parse value if it's JSON, otherwise keep as string
          let parsedValue = row.value;
          try {
            parsedValue = JSON.parse(row.value);
          } catch (e) {
            // Keep as string if not JSON
          }

          savedConfigs[row.category][row.key] = parsedValue;
        });

        // Merge saved configurations with defaults
        configurations = {
          general: { ...defaultConfigs.general, ...savedConfigs.general },
          recordings: { ...defaultConfigs.recordings, ...savedConfigs.recordings },
          mqtt: { ...defaultConfigs.mqtt, ...savedConfigs.mqtt },
          cameras: { ...defaultConfigs.cameras, ...savedConfigs.cameras },
          sensors: { ...defaultConfigs.sensors, ...savedConfigs.sensors },
          topics: { ...defaultConfigs.topics, ...savedConfigs.topics }
        };
      }

      // Load current sensors and topics from database using Prisma
      const sensors = await prisma.sensors.findMany({
        orderBy: { created_at: 'desc' },
        include: { sensor_data: { take: 0 } }
      });

      const topics = await prisma.mqtt_topics.findMany({
        orderBy: { created_at: 'desc' }
      });

      // Update configurations with current database state
      configurations.sensors.sensors = sensors.map(sensor => ({
        id: sensor.id,
        type: sensor.type,
        name: sensor.name,
        topic: sensor.topic,
        description: sensor.description,
        unit: sensor.unit,
        min_value: sensor.min_value,
        max_value: sensor.max_value,
        active: sensor.active,
        created_at: sensor.created_at
      }));

      configurations.topics.topics = topics.map(topic => ({
        id: topic.id,
        topic: topic.topic,
        description: topic.description,
        qos: topic.qos,
        retained: topic.retained,
        active: topic.active,
        created_at: topic.created_at
      }));

      res.json({ configurations });
    } catch (error) {
      console.error('Error getting configurations:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // POST /api/configurations - Guardar una configuración individual
  async saveConfiguration(req, res) {
    try {
      const { category, key, value } = req.body;

      if (!category || !key) {
        return res.status(400).json({ error: 'Categoría y clave son requeridas' });
      }

      // Convert value to string (JSON if object/array)
      const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);

      // First try to find existing configuration
      const existing = await prisma.configurations.findFirst({
        where: {
          category,
          key
        }
      });

      if (existing) {
        // Update existing
        await prisma.configurations.update({
          where: { id: existing.id },
          data: {
            value: valueStr,
            updated_at: new Date()
          }
        });
      } else {
        // Create new
        await prisma.configurations.create({
          data: {
            category,
            key,
            value: valueStr
          }
        });
      }

      res.json({ success: true, message: 'Configuración guardada exitosamente' });
    } catch (error) {
      console.error('Error saving configuration:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // PUT /api/configurations/bulk - Guardar todas las configuraciones
  async saveAllConfigurations(req, res) {
    try {
      const { configurations } = req.body;

      if (!configurations) {
        return res.status(400).json({ error: 'Configuraciones son requeridas' });
      }

      const upsertPromises = [];

      // Helper function to upsert a configuration
      const upsertConfig = async (category, key, value) => {
        const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
        
        const existing = await prisma.configurations.findFirst({
          where: { category, key }
        });

        if (existing) {
          return prisma.configurations.update({
            where: { id: existing.id },
            data: { value: valueStr, updated_at: new Date() }
          });
        } else {
          return prisma.configurations.create({
            data: { category, key, value: valueStr }
          });
        }
      };

      // Handle sensors synchronization
      if (configurations.sensors && configurations.sensors.sensors) {
        const sensorSettings = { ...configurations.sensors };
        delete sensorSettings.sensors;

        Object.entries(sensorSettings).forEach(([key, value]) => {
          upsertPromises.push(upsertConfig('sensors', key, value));
        });
      }

      // Handle topics synchronization
      if (configurations.topics && configurations.topics.topics) {
        const topicSettings = { ...configurations.topics };
        delete topicSettings.topics;

        Object.entries(topicSettings).forEach(([key, value]) => {
          upsertPromises.push(upsertConfig('topics', key, value));
        });
      }

      // Build upsert statements for other configurations
      Object.entries(configurations).forEach(([category, categoryConfigs]) => {
        if (category === 'sensors' || category === 'topics') {
          return;
        }

        Object.entries(categoryConfigs).forEach(([key, value]) => {
          upsertPromises.push(upsertConfig(category, key, value));
        });
      });

      if (upsertPromises.length === 0) {
        return res.status(400).json({ error: 'No configurations to update' });
      }

      // Execute all upserts in parallel
      await Promise.all(upsertPromises);

      res.json({ success: true, message: 'Todas las configuraciones guardadas exitosamente' });
    } catch (error) {
      console.error('Error saving all configurations:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // PUT /api/configurations/sync-sensors - Sincronizar sensores desde configuraciones
  async syncSensorsFromConfig(req, res) {
    try {
      const { sensors } = req.body;

      if (!Array.isArray(sensors)) {
        return res.status(400).json({ error: 'Sensores debe ser un array' });
      }

      // Use Prisma transaction to delete all and insert new sensors
      await prisma.$transaction(async (tx) => {
        // Delete all existing sensors
        await tx.sensors.deleteMany();

        // Insert new sensors if array is not empty
        if (sensors.length > 0) {
          await tx.sensors.createMany({
            data: sensors.map(sensor => ({
              type: sensor.type,
              name: sensor.name,
              topic: sensor.topic || '',
              description: sensor.description || '',
              unit: sensor.unit || '',
              min_value: sensor.min_value || null,
              max_value: sensor.max_value || null,
              active: sensor.active !== false
            }))
          });
        }
      });

      res.json({ success: true, message: 'Sensores sincronizados exitosamente' });
    } catch (error) {
      console.error('Error syncing sensors:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // PUT /api/configurations/sync-topics - Sincronizar topics desde configuraciones
  async syncTopicsFromConfig(req, res) {
    try {
      const { topics } = req.body;

      if (!Array.isArray(topics)) {
        return res.status(400).json({ error: 'Topics debe ser un array' });
      }

      // Use Prisma transaction to delete all and insert new topics
      await prisma.$transaction(async (tx) => {
        // Delete all existing topics
        await tx.mqtt_topics.deleteMany();

        // Insert new topics if array is not empty
        if (topics.length > 0) {
          await tx.mqtt_topics.createMany({
            data: topics.map(topic => ({
              topic: topic.topic,
              description: topic.description || '',
              qos: topic.qos || 0,
              retained: topic.retained || false,
              active: topic.active !== false
            }))
          });
        }
      });

      res.json({ success: true, message: 'Topics sincronizados exitosamente' });
    } catch (error) {
      console.error('Error syncing topics:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // POST /api/configurations/reset - Restaurar configuraciones por defecto
  async resetConfigurations(req, res) {
    try {
      await prisma.configurations.deleteMany();
      res.json({ success: true, message: 'Configuraciones restauradas a valores por defecto' });
    } catch (error) {
      console.error('Error resetting configurations:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Validate recording directory
  validateRecordingDirectory(directory) {
    const fs = require('fs');
    const path = require('path');

    // Check if path is absolute
    if (!path.isAbsolute(directory)) {
      return { valid: false, error: 'La ruta debe ser absoluta' };
    }

    // Check if parent directory exists (create if needed)
    const parentDir = path.dirname(directory);
    if (!fs.existsSync(parentDir)) {
      return { valid: false, error: 'El directorio padre no existe' };
    }

    // Try to create the directory if it doesn't exist
    try {
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
      return { valid: true, message: 'Directorio válido' };
    } catch (error) {
      return { valid: false, error: `No se puede crear el directorio: ${error.message}` };
    }
  }

  // POST /api/configurations/validate-recordings - Validar configuración de grabaciones
  async validateRecordingsConfig(req, res) {
    try {
      const { directory, format, maxDuration, quality } = req.body;

      const errors = [];

      // Validate directory
      if (directory) {
        const dirValidation = this.validateRecordingDirectory(directory);
        if (!dirValidation.valid) {
          errors.push({ field: 'directory', message: dirValidation.error });
        }
      }

      // Validate format
      const validFormats = ['MP4 (H.264)', 'MP4 (H.265)', 'AVI', 'MKV'];
      if (format && !validFormats.includes(format)) {
        errors.push({ field: 'format', message: 'Formato de video no soportado' });
      }

      // Validate maxDuration
      if (maxDuration) {
        const duration = parseInt(maxDuration);
        if (isNaN(duration) || duration < 1 || duration > 3600) {
          errors.push({ field: 'maxDuration', message: 'Duración debe estar entre 1 y 3600 segundos' });
        }
      }

      // Validate quality
      const validQualities = ['Baja (480p)', 'Media (720p)', 'Alta (1080p)', '4K (2160p)'];
      if (quality && !validQualities.includes(quality)) {
        errors.push({ field: 'quality', message: 'Calidad de video no válida' });
      }

      if (errors.length > 0) {
        return res.status(400).json({ valid: false, errors });
      }

      res.json({ valid: true, message: 'Configuración de grabaciones válida' });
    } catch (error) {
      console.error('Error validating recordings config:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

module.exports = new ConfigurationController();