const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTableStructure() {
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
    
    // Get current table structure
    console.log('\n📋 Current settings table structure:');
    const [rows] = await connection.execute('DESCRIBE settings');
    
    rows.forEach(row => {
      console.log(`  ${row.Field}: ${row.Type} ${row.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${row.Default ? `DEFAULT ${row.Default}` : ''}`);
    });
    
    // Check what columns are missing from model
    const modelColumns = [
      'id',
      'group_notification_time', 
      'group_notification_enabled',
      'individual_reminder_minutes',
      'individual_reminder_enabled', 
      'whatsapp_connected',
      'whatsapp_group_id',
      'last_group_notification',
      'notification_templates',
      'created_at',
      'updated_at'
    ];
    
    const existingColumns = rows.map(row => row.Field);
    const missingColumns = modelColumns.filter(col => !existingColumns.includes(col));
    
    console.log('\n❌ Missing columns from table:');
    if (missingColumns.length > 0) {
      missingColumns.forEach(col => console.log(`  - ${col}`));
    } else {
      console.log('  None - all columns exist');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
  
  process.exit(0);
}

checkTableStructure();