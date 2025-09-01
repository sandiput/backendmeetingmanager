const mysql = require('mysql2/promise');
require('dotenv').config();

async function addMissingColumn() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'meeting_manager'
    });
    
    console.log('✅ Connected to database');
    
    // Check if column exists
    console.log('🔍 Checking if last_group_notification column exists...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'settings' AND COLUMN_NAME = 'last_group_notification'
    `, [process.env.DB_NAME || 'meeting_manager']);
    
    if (columns.length > 0) {
      console.log('✅ Column last_group_notification already exists');
    } else {
      console.log('➕ Adding last_group_notification column...');
      
      await connection.execute(`
        ALTER TABLE settings 
        ADD COLUMN last_group_notification DATETIME NULL
      `);
      
      console.log('✅ Column last_group_notification added successfully');
    }
    
    // Test settings access
    console.log('🧪 Testing settings table access...');
    const [rows] = await connection.execute('SELECT * FROM settings LIMIT 1');
    console.log('✅ Settings table accessible, rows found:', rows.length);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
  
  process.exit(0);
}

addMissingColumn();