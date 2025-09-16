const Admin = require('./src/models/admin');
const { sequelize } = require('./src/config/database');

async function debugIPRecording() {
  try {
    console.log('Debug IP Address Recording...\n');
    
    // Test authenticate method directly
    console.log('Testing Admin.authenticate method directly...');
    
    const testIP = '192.168.1.100';
    console.log(`Testing with IP: ${testIP}`);
    
    const admin = await Admin.authenticate('admin', 'admin123', testIP);
    
    if (admin) {
      console.log('Authentication successful!');
      console.log('Admin data after authenticate:');
      console.log(`- ID: ${admin.id}`);
      console.log(`- Username: ${admin.username}`);
      console.log(`- Last Login: ${admin.last_login}`);
      console.log(`- IP Address: ${admin.ip_address}`);
      
      // Check database directly
      console.log('\n--- Checking database directly ---');
      const [results] = await sequelize.query('SELECT id, username, last_login, ip_address FROM admins WHERE id = ?', {
        replacements: [admin.id]
      });
      
      if (results.length > 0) {
        const dbAdmin = results[0];
        console.log('Database record:');
        console.log(`- ID: ${dbAdmin.id}`);
        console.log(`- Username: ${dbAdmin.username}`);
        console.log(`- Last Login: ${dbAdmin.last_login}`);
        console.log(`- IP Address: ${dbAdmin.ip_address || 'NULL'}`);
      }
      
    } else {
      console.log('Authentication failed!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

debugIPRecording();