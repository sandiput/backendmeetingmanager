const mysql = require('mysql2/promise');
require('dotenv').config();

async function setGroupIdSimple() {
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
    
    // Check current table structure
    const [columns] = await connection.execute('DESCRIBE settings');
    console.log('📋 Struktur tabel settings:');
    columns.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type})`);
    });
    
    // Check if settings record exists
    const [existingSettings] = await connection.execute(
      'SELECT * FROM settings LIMIT 1'
    );
    
    if (existingSettings.length === 0) {
      // Get only the required columns for insert
      const requiredColumns = columns.filter(col => 
        col.Null === 'NO' && col.Default === null && col.Extra !== 'auto_increment'
      );
      
      console.log('📝 Required columns:', requiredColumns.map(c => c.Field));
      
      // Insert minimal settings record
      await connection.execute(
        'INSERT INTO settings (whatsapp_group_id) VALUES (?)',
        [groupId]
      );
      console.log('✅ Settings record dan Group ID berhasil dibuat:', groupId);
    } else {
      // Update existing settings with group ID
      await connection.execute(
        'UPDATE settings SET whatsapp_group_id = ? WHERE id = ?',
        [groupId, existingSettings[0].id]
      );
      console.log('✅ Group ID berhasil diupdate:', groupId);
    }
    
    // Verify the setting
    const [savedSettings] = await connection.execute(
      'SELECT id, whatsapp_group_id FROM settings LIMIT 1'
    );
    
    console.log('📋 Verifikasi setting:');
    console.log('   ID:', savedSettings[0].id);
    console.log('   WhatsApp Group ID:', savedSettings[0].whatsapp_group_id);
    
    console.log('\n🎉 WhatsApp Group ID berhasil dikonfigurasi!');
    console.log('   Bot sekarang akan mengirim notifikasi ke grup WhatsApp.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
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
setGroupIdSimple();