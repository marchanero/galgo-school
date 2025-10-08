const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// SQLite database
const db = new sqlite3.Database('./sensors.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    // Create tables if not exist
    db.run(`CREATE TABLE IF NOT EXISTS sensors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      data TEXT
    )`);
  }
});

// Routes
app.get('/api/sensors', (req, res) => {
  db.all('SELECT * FROM sensors', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ sensors: rows });
  });
});

app.post('/api/sensors', (req, res) => {
  const { type, name, data } = req.body;
  db.run('INSERT INTO sensors (type, name, data) VALUES (?, ?, ?)', [type, name, JSON.stringify(data)], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});