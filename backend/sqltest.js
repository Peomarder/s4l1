const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'seclock',
  password: '1',
  port: 5432,
});

// Execute SQL files in sequence
async function runSqlFiles() {
  const client = await pool.connect();
  
  try {
    console.log('Starting SQL execution...');
    
    for (let i = 1; i <= 5; i++) {
      const filePath = path.join(__dirname, `${i}.sql`);
      
      if (!fs.existsSync(filePath)) {
        console.error(`❌ Error: File ${i}.sql not found`);
        continue;
      }
      
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log(`\nExecuting ${i}.sql...`);
      console.log('-----------------------------------');
      
      try {
        await client.query(sql);
        console.log(`✅ ${i}.sql executed successfully`);
      } catch (error) {
        console.error(`❌ Error in ${i}.sql:`, error.message);
      }
      
      console.log('-----------------------------------');
    }
    
    console.log('\nAll SQL files processed');
  } catch (error) {
    console.error('Connection error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
runSqlFiles();