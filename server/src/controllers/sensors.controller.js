const prisma = require('../lib/prisma');

class SensorsController {
  /**
   * Get all sensors
   * GET /api/sensors
   */
  async getAllSensors(req, res) {
    try {
      const sensors = await prisma.sensors.findMany({
        orderBy: { id: 'desc' },
        include: {
          sensor_data: true
        }
      });

      // Add computed fields
      const processedSensors = sensors.map(sensor => ({
        ...sensor,
        data: sensor.data ? JSON.parse(sensor.data) : null,
        data_count: sensor.sensor_data.length,
        last_reading: sensor.sensor_data.length > 0 
          ? sensor.sensor_data[0].timestamp 
          : null
      }));

      res.json({
        success: true,
        sensors: processedSensors
      });

    } catch (error) {
      console.error('Error in getAllSensors:', error);
      res.status(500).json({
        error: 'Failed to fetch sensors',
        message: error.message
      });
    }
  }

  /**
   * Get sensor by ID
   * GET /api/sensors/:id
   */
  async getSensorById(req, res) {
    try {
      const { id } = req.params;

      const sensor = await prisma.sensors.findUnique({
        where: { id: parseInt(id) },
        include: {
          sensor_data: {
            orderBy: { timestamp: 'desc' }
          }
        }
      });

      if (!sensor) {
        return res.status(404).json({
          error: 'Sensor not found',
          message: `No sensor found with ID: ${id}`
        });
      }

      // Calculate aggregated metrics from sensor_data
      const numericValues = sensor.sensor_data
        .map(d => d.numeric_value)
        .filter(v => v !== null);
      
      const processedSensor = {
        ...sensor,
        data: sensor.data ? JSON.parse(sensor.data) : null,
        data_count: sensor.sensor_data.length,
        last_reading: sensor.sensor_data.length > 0 ? sensor.sensor_data[0].timestamp : null,
        avg_value: numericValues.length > 0 
          ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length 
          : null,
        min_reading: numericValues.length > 0 ? Math.min(...numericValues) : null,
        max_reading: numericValues.length > 0 ? Math.max(...numericValues) : null
      };

      res.json({
        success: true,
        sensor: processedSensor
      });

    } catch (error) {
      console.error('Error in getSensorById:', error);
      res.status(500).json({
        error: 'Failed to fetch sensor',
        message: error.message
      });
    }
  }

  /**
   * Create new sensor
   * POST /api/sensors
   */
  async createSensor(req, res) {
    try {
      const {
        name,
        type,
        topic,
        description,
        unit,
        min_value,
        max_value,
        data,
        active = true
      } = req.body;

      // Validation
      if (!name || !type || !topic) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Name, type, and topic are required'
        });
      }

      // Check if sensor with same name or topic already exists
      const existingSensor = await prisma.sensors.findFirst({
        where: {
          OR: [
            { name },
            { topic }
          ]
        }
      });

      if (existingSensor) {
        return res.status(409).json({
          error: 'Sensor already exists',
          message: 'A sensor with this name or topic already exists'
        });
      }

      // Create new sensor
      const sensor = await prisma.sensors.create({
        data: {
          name,
          type,
          topic,
          description: description || null,
          unit: unit || null,
          min_value: min_value || null,
          max_value: max_value || null,
          data: data ? JSON.stringify(data) : null,
          active: active ? true : false
        }
      });

      res.status(201).json({
        success: true,
        message: 'Sensor created successfully',
        sensor: {
          ...sensor,
          data: sensor.data ? JSON.parse(sensor.data) : null
        }
      });

    } catch (error) {
      console.error('Error in createSensor:', error);
      res.status(500).json({
        error: 'Failed to create sensor',
        message: error.message
      });
    }
  }

  /**
   * Update sensor
   * PUT /api/sensors/:id
   */
  async updateSensor(req, res) {
    try {
      const { id } = req.params;
      const {
        name,
        type,
        topic,
        description,
        unit,
        min_value,
        max_value,
        data,
        active
      } = req.body;

      try {
        // Update sensor
        const sensor = await prisma.sensors.update({
          where: { id: parseInt(id) },
          data: {
            name,
            type,
            topic,
            description: description || null,
            unit: unit || null,
            min_value: min_value || null,
            max_value: max_value || null,
            data: data ? JSON.stringify(data) : null,
            active: active !== undefined ? active : undefined,
            updated_at: new Date()
          }
        });

        res.json({
          success: true,
          message: 'Sensor updated successfully',
          sensor: {
            ...sensor,
            data: sensor.data ? JSON.parse(sensor.data) : null
          }
        });
      } catch (error) {
        if (error.code === 'P2025') {
          return res.status(404).json({
            error: 'Sensor not found',
            message: `No sensor found with ID: ${id}`
          });
        }
        throw error;
      }

    } catch (error) {
      console.error('Error in updateSensor:', error);
      res.status(500).json({
        error: 'Failed to update sensor',
        message: error.message
      });
    }
  }

  /**
   * Delete sensor
   * DELETE /api/sensors/:id
   */
  async deleteSensor(req, res) {
    try {
      const { id } = req.params;

      try {
        // Delete sensor (will cascade delete sensor_data due to Prisma relationship)
        const sensor = await prisma.sensors.delete({
          where: { id: parseInt(id) }
        });

        res.json({
          success: true,
          message: `Sensor "${sensor.name}" deleted successfully`
        });
      } catch (error) {
        if (error.code === 'P2025') {
          return res.status(404).json({
            error: 'Sensor not found',
            message: `No sensor found with ID: ${id}`
          });
        }
        throw error;
      }

    } catch (error) {
      console.error('Error in deleteSensor:', error);
      res.status(500).json({
        error: 'Failed to delete sensor',
        message: error.message
      });
    }
  }

  /**
   * Get sensor data (readings)
   * GET /api/sensors/:id/data
   */
  async getSensorData(req, res) {
    try {
      const { id } = req.params;
      const { limit = 100, offset = 0, from, to } = req.query;

      const where = {
        sensor_id: parseInt(id)
      };

      // Add date filters if provided
      if (from || to) {
        where.timestamp = {};
        if (from) where.timestamp.gte = new Date(from);
        if (to) where.timestamp.lte = new Date(to);
      }

      const data = await prisma.sensor_data.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      });

      res.json({
        success: true,
        data: data,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          count: data.length
        }
      });

    } catch (error) {
      console.error('Error in getSensorData:', error);
      res.status(500).json({
        error: 'Failed to fetch sensor data',
        message: error.message
      });
    }
  }

  /**
   * Add sensor data (reading)
   * POST /api/sensors/:id/data
   */
  async addSensorData(req, res) {
    try {
      const { id } = req.params;
      const { value, topic, timestamp, raw_message } = req.body;

      if (value === undefined || !topic) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Value and topic are required'
        });
      }

      // Parse numeric value if possible
      let numeric_value = null;
      const parsedValue = parseFloat(value);
      if (!isNaN(parsedValue)) {
        numeric_value = parsedValue;
      }

      const data = await prisma.sensor_data.create({
        data: {
          sensor_id: parseInt(id),
          topic,
          value: String(value),
          numeric_value,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
          raw_message: raw_message || null
        }
      });

      res.status(201).json({
        success: true,
        message: 'Sensor data added successfully',
        data
      });

    } catch (error) {
      console.error('Error in addSensorData:', error);
      res.status(500).json({
        error: 'Failed to add sensor data',
        message: error.message
      });
    }
  }

  /**
   * Get sensor types (available sensor categories)
   * GET /api/sensors/types
   */
  async getSensorTypes(req, res) {
    try {
      const sensorTypes = [
        { value: 'temperature', label: 'Temperatura', unit: '°C', icon: '🌡️' },
        { value: 'humidity', label: 'Humedad', unit: '%', icon: '💧' },
        { value: 'pressure', label: 'Presión', unit: 'hPa', icon: '🏔️' },
        { value: 'gas', label: 'Gas/Aire', unit: 'ppm', icon: '💨' },
        { value: 'light', label: 'Luz', unit: 'lux', icon: '💡' },
        { value: 'motion', label: 'Movimiento', unit: 'bool', icon: '🏃' },
        { value: 'sound', label: 'Sonido', unit: 'dB', icon: '🔊' },
        { value: 'proximity', label: 'Proximidad', unit: 'cm', icon: '📏' },
        { value: 'voltage', label: 'Voltaje', unit: 'V', icon: '⚡' },
        { value: 'current', label: 'Corriente', unit: 'A', icon: '🔌' },
        { value: 'power', label: 'Potencia', unit: 'W', icon: '⚡' },
        { value: 'energy', label: 'Energía', unit: 'kWh', icon: '🔋' },
        { value: 'flow', label: 'Flujo', unit: 'L/min', icon: '🌊' },
        { value: 'level', label: 'Nivel', unit: 'cm', icon: '📊' },
        { value: 'weight', label: 'Peso', unit: 'kg', icon: '⚖️' },
        { value: 'speed', label: 'Velocidad', unit: 'km/h', icon: '🏎️' },
        { value: 'acceleration', label: 'Aceleración', unit: 'm/s²', icon: '📈' },
        { value: 'rotation', label: 'Rotación', unit: 'rpm', icon: '🔄' },
        { value: 'ph', label: 'pH', unit: 'pH', icon: '🧪' },
        { value: 'custom', label: 'Personalizado', unit: '', icon: '⚙️' }
      ];

      res.json({
        success: true,
        types: sensorTypes
      });

    } catch (error) {
      console.error('Error in getSensorTypes:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
}

module.exports = new SensorsController();