const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path to the database
const dbPath = path.join(__dirname, '../../sensors.db');

// Initialize database with sensors and topics tables
function initSensorsDB() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      console.log('Connected to SQLite database for sensors');
    });

    // Create sensors table
    const createSensorsTable = `
      CREATE TABLE IF NOT EXISTS sensors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        topic TEXT NOT NULL,
        description TEXT,
        unit TEXT,
        min_value REAL,
        max_value REAL,
        data TEXT,
        active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create mqtt_topics table
    const createTopicsTable = `
      CREATE TABLE IF NOT EXISTS mqtt_topics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        topic TEXT NOT NULL UNIQUE,
        description TEXT,
        qos INTEGER DEFAULT 0,
        retain BOOLEAN DEFAULT 0,
        active BOOLEAN DEFAULT 1,
        sensor_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sensor_id) REFERENCES sensors (id) ON DELETE SET NULL
      )
    `;

    // Create sensor_data table for storing sensor readings
    const createSensorDataTable = `
      CREATE TABLE IF NOT EXISTS sensor_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sensor_id INTEGER NOT NULL,
        topic TEXT NOT NULL,
        value TEXT NOT NULL,
        numeric_value REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        raw_message TEXT,
        FOREIGN KEY (sensor_id) REFERENCES sensors (id) ON DELETE CASCADE
      )
    `;

    // Create configurations table for system settings
    const createConfigurationsTable = `
      CREATE TABLE IF NOT EXISTS configurations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(category, key)
      )
    `;

    // Create cameras table for storing camera IPs and configurations
    const createCamerasTable = `
      CREATE TABLE IF NOT EXISTS cameras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        ip TEXT NOT NULL,
        port INTEGER DEFAULT 554,
        username TEXT,
        password TEXT,
        path TEXT DEFAULT '/stream',
        active BOOLEAN DEFAULT 1,
        connection_status TEXT DEFAULT 'disconnected',
        last_checked DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create index for faster queries
    const createIndexes = [
      `CREATE INDEX IF NOT EXISTS idx_sensor_data_sensor_id ON sensor_data (sensor_id)`,
      `CREATE INDEX IF NOT EXISTS idx_sensor_data_timestamp ON sensor_data (timestamp)`,
      `CREATE INDEX IF NOT EXISTS idx_mqtt_topics_topic ON mqtt_topics (topic)`,
      `CREATE INDEX IF NOT EXISTS idx_sensors_active ON sensors (active)`,
      `CREATE INDEX IF NOT EXISTS idx_configurations_category ON configurations (category)`,
      `CREATE INDEX IF NOT EXISTS idx_cameras_active ON cameras (active)`
    ];

    // Execute table creation
    db.serialize(() => {
      // Create tables
      db.run(createSensorsTable, (err) => {
        if (err) {
          console.error('Error creating sensors table:', err);
          reject(err);
          return;
        }
        console.log('✅ Sensors table created/verified');
      });

      db.run(createTopicsTable, (err) => {
        if (err) {
          console.error('Error creating mqtt_topics table:', err);
          reject(err);
          return;
        }
        console.log('✅ MQTT Topics table created/verified');
      });

      db.run(createSensorDataTable, (err) => {
        if (err) {
          console.error('Error creating sensor_data table:', err);
          reject(err);
          return;
        }
        console.log('✅ Sensor Data table created/verified');
      });

      db.run(createConfigurationsTable, (err) => {
        if (err) {
          console.error('Error creating configurations table:', err);
          reject(err);
          return;
        }
        console.log('✅ Configurations table created/verified');
      });

      db.run(createCamerasTable, (err) => {
        if (err) {
          console.error('Error creating cameras table:', err);
          reject(err);
          return;
        }
        console.log('✅ Cameras table created/verified');
      });

    // Create indexes
    createIndexes.forEach((indexSQL, i) => {
      db.run(indexSQL, (err) => {
        if (err) {
          console.error(`Error creating index ${i + 1}:`, err);
          // Continue with other operations even if index creation fails
        } else {
          console.log(`✅ Index ${i + 1} created/verified`);
        }
      });
    });

    // Add data column to sensors table if it doesn't exist (migration)
    db.run(`ALTER TABLE sensors ADD COLUMN data TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding data column:', err);
      } else if (!err) {
        console.log('✅ Data column added to sensors table');
      } else {
        console.log('✅ Data column already exists');
      }
    });      // Insert some default sensor types if table is empty
      db.get("SELECT COUNT(*) as count FROM sensors", (err, row) => {
        if (err) {
          console.error('Error checking sensors count:', err);
          return;
        }

        if (row.count === 0) {
          console.log('📊 Inserting default sensors...');
          
          const defaultSensors = [
            {
              name: 'Temperatura Ambiente',
              type: 'temperature',
              topic: 'sensors/temperature/ambient',
              description: 'Sensor de temperatura del ambiente',
              unit: '°C',
              min_value: -40,
              max_value: 80
            },
            {
              name: 'Humedad Relativa',
              type: 'humidity',
              topic: 'sensors/humidity/ambient',
              description: 'Sensor de humedad relativa del ambiente',
              unit: '%',
              min_value: 0,
              max_value: 100
            },
            {
              name: 'Presión Atmosférica',
              type: 'pressure',
              topic: 'sensors/pressure/atmospheric',
              description: 'Sensor de presión atmosférica',
              unit: 'hPa',
              min_value: 800,
              max_value: 1200
            },
            {
              name: 'Nivel de CO2',
              type: 'gas',
              topic: 'sensors/gas/co2',
              description: 'Sensor de dióxido de carbono',
              unit: 'ppm',
              min_value: 0,
              max_value: 5000
            }
          ];

          const stmt = db.prepare(`
            INSERT INTO sensors (name, type, topic, description, unit, min_value, max_value)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);

          defaultSensors.forEach(sensor => {
            stmt.run([
              sensor.name,
              sensor.type,
              sensor.topic,
              sensor.description,
              sensor.unit,
              sensor.min_value,
              sensor.max_value
            ], (err) => {
              if (err) {
                console.error('Error inserting default sensor:', err);
              } else {
                console.log(`✅ Default sensor created: ${sensor.name}`);
              }
            });
          });

          stmt.finalize();
        }
      });

      // Insert default topics if table is empty
      db.get("SELECT COUNT(*) as count FROM mqtt_topics", (err, row) => {
        if (err) {
          console.error('Error checking topics count:', err);
          return;
        }

        if (row.count === 0) {
          console.log('📡 Inserting default topics...');
          
          const defaultTopics = [
            {
              topic: 'sensors/+/+',
              description: 'Wildcard para todos los sensores',
              qos: 0,
              retain: false
            },
            {
              topic: 'galgo/status',
              description: 'Estado del sistema Galgo',
              qos: 1,
              retain: true
            },
            {
              topic: 'galgo/commands',
              description: 'Comandos para el sistema Galgo',
              qos: 1,
              retain: false
            }
          ];

          const stmt = db.prepare(`
            INSERT INTO mqtt_topics (topic, description, qos, retain)
            VALUES (?, ?, ?, ?)
          `);

          defaultTopics.forEach(topic => {
            stmt.run([
              topic.topic,
              topic.description,
              topic.qos,
              topic.retain
            ], (err) => {
              if (err) {
                console.error('Error inserting default topic:', err);
              } else {
                console.log(`✅ Default topic created: ${topic.topic}`);
              }
            });
          });

          stmt.finalize();
        }
      });
    });

    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
        reject(err);
      } else {
        console.log('✅ Database initialization completed');
        resolve();
      }
    });
  });
}

// Export the function
module.exports = { initSensorsDB };

// Run initialization if called directly
if (require.main === module) {
  initSensorsDB()
    .then(() => {
      console.log('🎉 Sensors database initialized successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Failed to initialize sensors database:', err);
      process.exit(1);
    });
}