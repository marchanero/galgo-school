const prisma = require('../lib/prisma');

class SensorService {
  /**
   * Get all sensors from database
   */
  async getAllSensors() {
    try {
      const sensors = await prisma.sensors.findMany({
        orderBy: { created_at: 'desc' },
        include: {
          sensor_data: {
            orderBy: { timestamp: 'desc' },
            take: 10
          }
        }
      });
      return sensors;
    } catch (error) {
      console.error('Error getting all sensors:', error);
      throw error;
    }
  }

  /**
   * Get sensor by ID with recent readings
   */
  async getSensorById(id) {
    try {
      const sensor = await prisma.sensors.findUnique({
        where: { id: parseInt(id) },
        include: {
          sensor_data: {
            orderBy: { timestamp: 'desc' },
            take: 100
          }
        }
      });
      return sensor;
    } catch (error) {
      console.error('Error getting sensor by ID:', error);
      throw error;
    }
  }

  /**
   * Create new sensor
   */
  async createSensor(sensorData) {
    try {
      const { type, name, topic, description, unit, min_value, max_value, active, data } = sensorData;
      
      const sensor = await prisma.sensors.create({
        data: {
          type,
          name,
          topic,
          description,
          unit,
          min_value: min_value ? parseFloat(min_value) : null,
          max_value: max_value ? parseFloat(max_value) : null,
          active: active !== false,
          data: data ? JSON.stringify(data) : null
        }
      });
      
      return sensor;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error(`Sensor with name "${sensorData.name}" already exists`);
      }
      console.error('Error creating sensor:', error);
      throw error;
    }
  }

  /**
   * Update sensor
   */
  async updateSensor(id, updates) {
    try {
      // Verify sensor exists
      const existing = await prisma.sensors.findUnique({
        where: { id: parseInt(id) }
      });
      
      if (!existing) {
        throw new Error('Sensor not found');
      }
      
      const { type, name, topic, description, unit, min_value, max_value, active, data } = updates;
      
      const sensor = await prisma.sensors.update({
        where: { id: parseInt(id) },
        data: {
          type,
          name,
          topic,
          description,
          unit,
          min_value: min_value ? parseFloat(min_value) : null,
          max_value: max_value ? parseFloat(max_value) : null,
          active,
          data: data ? JSON.stringify(data) : null
        }
      });
      
      return sensor;
    } catch (error) {
      if (error.message === 'Sensor not found') {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new Error(`Sensor with name "${updates.name}" already exists`);
      }
      console.error('Error updating sensor:', error);
      throw error;
    }
  }

  /**
   * Delete sensor (cascade deletes sensor_data)
   */
  async deleteSensor(id) {
    try {
      // Verify sensor exists
      const existing = await prisma.sensors.findUnique({
        where: { id: parseInt(id) }
      });
      
      if (!existing) {
        throw new Error('Sensor not found');
      }
      
      await prisma.sensors.delete({
        where: { id: parseInt(id) }
      });
      
      return { deleted: true };
    } catch (error) {
      if (error.message === 'Sensor not found') {
        throw error;
      }
      console.error('Error deleting sensor:', error);
      throw error;
    }
  }
}

module.exports = new SensorService();
