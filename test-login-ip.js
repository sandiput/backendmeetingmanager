const { sequelize } = require('./src/config/database');

async function testLoginIP() {
  try {
    console.log('Testing login dengan IP address recording...\n');
    
    // Test login using fetch
    const loginResponse = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '192.168.1.100' // Simulate IP address
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    const responseData = await loginResponse.json();
    
    console.log('Login Response Status:', loginResponse.status);
    console.log('Login Response Data:', JSON.stringify(responseData, null, 2));
    
    // Check database after login
    console.log('\n--- Checking database after login ---');
    const [results] = await sequelize.query('SELECT id, username, last_login, ip_address FROM admins WHERE username = "admin"');
    
    if (results.length > 0) {
      const admin = results[0];
      console.log(`Admin ID: ${admin.id}`);
      console.log(`Username: ${admin.username}`);
      console.log(`Last Login: ${admin.last_login}`);
      console.log(`IP Address: ${admin.ip_address || 'NULL'}`);
      
      if (admin.ip_address) {
        console.log('\n✅ IP Address berhasil terekam!');
      } else {
        console.log('\n❌ IP Address masih NULL');
      }
    } else {
      console.log('Admin tidak ditemukan');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

testLoginIP();