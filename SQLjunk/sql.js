const { Client } = require('pg');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const DB_CONFIG = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'seclock',
  password: process.env.DB_PASSWORD || '1',
  port: process.env.DB_PORT || 5432,
};

async function createAdminUser(client) {
  try {
    // Hash password
    const saltRounds = 10; //wtf spamton salt route reference
    const password = 'p';
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Get Admin privilege ID
    const privResult = await client.query(
      "SELECT id_privilege FROM user_privileges WHERE name = 'Admin'"
    );

    if (privResult.rows.length === 0) {
      throw new Error('Admin privilege not found in database');
    }

    const adminPrivilegeId = privResult.rows[0].id_privilege;

    // Create admin user
    await client.query(
      `INSERT INTO users (login, password, email, name, id_privilege)
       VALUES ($1, $2, $3, $4, $5)`,
      ['admin', hashedPassword, 'admin@example.com', 'Admin User', adminPrivilegeId]
    );

    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

async function setupDatabase() {
  const client = new Client(DB_CONFIG);
  const adminClient = new Client({ ...DB_CONFIG, database: 'postgres' });
  
  try {
	  
	  await adminClient.connect();
    console.log('Connected to PostgreSQL admin database');
      // Terminate existing connections
    await adminClient.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = '${DB_CONFIG.database}'
        AND pid <> pg_backend_pid();
    `);
    // Drop and recreate database
    await adminClient.query(`DROP DATABASE IF EXISTS ${DB_CONFIG.database}`);
    await adminClient.query(`CREATE DATABASE ${DB_CONFIG.database}`);
    console.log(`Database ${DB_CONFIG.database} recreated`);
    
    await adminClient.end();
	  
    await client.connect();
    
    // Read and execute SQL file
    const sqlPath = path.join(__dirname, 'config.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await client.query(sql);
    
    console.log('Database schema created successfully');
    

    console.log('Initial data inserted');

    // Create admin user
    await createAdminUser(client);
  } catch (error) {
    console.error('Database setup failed:', error);
  } finally {
    await client.end();
  }
}

setupDatabase();