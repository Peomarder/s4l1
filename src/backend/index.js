// /var/www/lock-api/index.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const app = express();
const port = 5000;

// PostgreSQL connection
const pool = new Pool({
  user: 'lockuser',
  password: 'your_secure_password',
  host: 'localhost',
  database: 'lockdb',
  port: 5432,
});

app.use(cors());
app.use(express.json());

// Database initialization function
const initializeDatabase = async () => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create locks table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS locks (
        id VARCHAR(255) PRIMARY KEY,
        is_open BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Database tables initialized');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
};

// Initialize DB on startup
initializeDatabase();

// User Endpoints
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, created_at FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, password]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lock Endpoints
app.get('/api/locks', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, is_open, created_at FROM locks');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/locks/:lockId', async (req, res) => {
  const { lockId } = req.params;
  
  try {
    const result = await pool.query('SELECT id, is_open, created_at FROM locks WHERE id = $1', [lockId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Lock not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/locks', async (req, res) => {
  const { id } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: 'Lock ID is required' });
  }
  
  try {
    const result = await pool.query(
      'INSERT INTO locks (id, is_open) VALUES ($1, $2) RETURNING id, is_open',
      [id, false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Lock ID already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/locks/:lockId', async (req, res) => {
  const { lockId } = req.params;
  const { isOpen } = req.body;
  
  if (typeof isOpen !== 'boolean') {
    return res.status(400).json({ error: 'isOpen must be a boolean value' });
  }
  
  try {
    const result = await pool.query(
      'UPDATE locks SET is_open = $1 WHERE id = $2 RETURNING id, is_open',
      [isOpen, lockId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Lock not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/locks/:lockId', async (req, res) => {
  const { lockId } = req.params;
  
  try {
    const result = await pool.query('DELETE FROM locks WHERE id = $1 RETURNING id', [lockId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Lock not found' });
    }
    
    res.json({ message: 'Lock deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});