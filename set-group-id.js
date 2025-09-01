const mysql = require('mysql2/promise');
require('dotenv').config();

async function setGroupId() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'meeting_manager'
    });
    
    console.log('Database connection established successfully.');
    
    const groupId = '120363401744541159@g.us';
    
    // Check if settings table exists and has the right structure
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'settings'"
    );
    
    if (tables.length === 0) {
      console.log('❌ Settings table tidak ditemukan. Jalankan migration terlebih dahulu.');
      return;
    }
    
    // Check if settings record exists
    const [existingSettings] = await connection.execute(
      'SELECT * FROM settings LIMIT 1'
    );
    
    if (existingSettings.length === 0) {
      // Insert new settings record with group ID
      await connection.execute(
        `INSERT INTO settings (
          group_notification_time, 
          group_notification_enabled, 
          individual_reminder_minutes, 
          individual_reminder_enabled, 
          whatsapp_connected, 
          whatsapp_group_id,
          notification_templates,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          '07:00',
          true,
          30,
          true,
          false,
          groupId,
          JSON.stringify({
            group_daily: '🗓️ _Jadwal Meeting Hari Ini_\n📅 {date}\n\n{meetings}\n\n📱 Pesan otomatis dari Meeting Manager\n🤖 Subdirektorat Intelijen',
            individual_reminder: '⏰ _Meeting Reminder_\n\n📋 _{title}_\n📅 {date}\n⏰ {start_time} - {end_time}\n📍 {location}\n{meeting_link}\n{dress_code}\n{attendance_link}\n\nHarap bersiap dan datang tepat waktu.\n\n📱 Pesan otomatis dari Meeting Manager\n🤖 Subdirektorat Intelijen'
          })
        ]
      );
      console.log('✅ Settings record dan Group ID berhasil dibuat:', groupId);
    } else {
      // Update existing settings with group ID
      await connection.execute(
        'UPDATE settings SET whatsapp_group_id = ?, updated_at = NOW() WHERE id = ?',
        [groupId, existingSettings[0].id]
      );
      console.log('✅ Group ID berhasil diupdate:', groupId);
    }
    
    // Verify the setting
    const [savedSettings] = await connection.execute(
      'SELECT whatsapp_group_id, updated_at FROM settings LIMIT 1'
    );
    
    console.log('📋 Verifikasi setting:');
    console.log('   WhatsApp Group ID:', savedSettings[0].whatsapp_group_id);
    console.log('   Updated:', savedSettings[0].updated_at);
    
    console.log('\n🎉 WhatsApp Group ID berhasil dikonfigurasi!');
    console.log('   Bot sekarang akan mengirim notifikasi ke grup WhatsApp.');
    
  } catch (error) {
    console.error('❌ Error setting group ID:', error.message);
    console.error('   Stack:', error.stack);
  } finally {
    // Close database connection
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

// Run the function
setGroupId();