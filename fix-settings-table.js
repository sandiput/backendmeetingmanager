const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixSettingsTable() {
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
    
    // Add notification_templates column
    console.log('➕ Adding notification_templates column...');
    try {
      await connection.execute(`
        ALTER TABLE settings 
        ADD COLUMN notification_templates JSON NOT NULL DEFAULT (JSON_OBJECT(
          'group_daily', '🗓️ _Jadwal Meeting Hari Ini_\n📅 {date}\n\n{meetings}\n\n📱 Pesan otomatis dari Meeting Manager\n🤖 Subdirektorat Intelijen',
          'individual_reminder', '⏰ _Meeting Reminder_\n\n📋 _{title}_\n📅 {date}\n⏰ {start_time} - {end_time}\n📍 {location}\n{meeting_link}\n{dress_code}\n{attendance_link}\n\nHarap bersiap dan datang tepat waktu.\n\n📱 Pesan otomatis dari Meeting Manager\n🤖 Subdirektorat Intelijen'
        ))
      `);
      console.log('✅ notification_templates column added');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('✅ notification_templates column already exists');
      } else {
        throw error;
      }
    }
    
    // Add created_at column
    console.log('➕ Adding created_at column...');
    try {
      await connection.execute(`
        ALTER TABLE settings 
        ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('✅ created_at column added');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('✅ created_at column already exists');
      } else {
        throw error;
      }
    }
    
    // Update existing record if notification_templates is empty
    console.log('🔄 Updating existing settings record...');
    await connection.execute(`
      UPDATE settings 
      SET notification_templates = JSON_OBJECT(
        'group_daily', '🗓️ _Jadwal Meeting Hari Ini_\n📅 {date}\n\n{meetings}\n\n📱 Pesan otomatis dari Meeting Manager\n🤖 Subdirektorat Intelijen',
        'individual_reminder', '⏰ _Meeting Reminder_\n\n📋 _{title}_\n📅 {date}\n⏰ {start_time} - {end_time}\n📍 {location}\n{meeting_link}\n{dress_code}\n{attendance_link}\n\nHarap bersiap dan datang tepat waktu.\n\n📱 Pesan otomatis dari Meeting Manager\n🤖 Subdirektorat Intelijen'
      )
      WHERE notification_templates IS NULL OR JSON_LENGTH(notification_templates) = 0
    `);
    
    // Test settings access
    console.log('🧪 Testing settings table access...');
    const [rows] = await connection.execute('SELECT * FROM settings LIMIT 1');
    console.log('✅ Settings table accessible, rows found:', rows.length);
    
    if (rows.length > 0) {
      console.log('📋 Sample data:');
      console.log('  - ID:', rows[0].id);
      console.log('  - WhatsApp Group ID:', rows[0].whatsapp_group_id);
      console.log('  - Notification Templates:', rows[0].notification_templates ? 'Present' : 'Missing');
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

fixSettingsTable();