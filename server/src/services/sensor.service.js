const { getDatabase } = require('../config/database');

class SensorService {
  getAllSensors() {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.all('SELECT * FROM sensors ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  getSensorById(id) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.get('SELECT * FROM sensors WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  createSensor(sensorData) {
    return new Promise((resolve, reject) => {
      const { type, name, data } = sensorData;
      const db = getDatabase();
      
      db.run(
        'INSERT INTO sensors (type, name, data) VALUES (?, ?, ?)',
        [type, name, JSON.stringify(data || {})],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, type, name, data });
          }
        }
      );
    });
  }

  updateSensor(id, sensorData) {
    return new Promise((resolve, reject) => {
      const { type, name, data } = sensorData;
      const db = getDatabase();
      
      db.run(
        'UPDATE sensors SET type = ?, name = ?, data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [type, name, JSON.stringify(data || {}), id],
        function(err) {
          if (err) {
            reject(err);
          } else if (this.changes === 0) {
            reject(new Error('Sensor not found'));
          } else {
            resolve({ id, type, name, data });
          }
        }
      );
    });
  }

  deleteSensor(id) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      
      db.run('DELETE FROM sensors WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Sensor not found'));
        } else {
          resolve({ deleted: true });
        }
      });
    });
  }
}

module.exports = new SensorService();
