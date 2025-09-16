const fetch = require('node-fetch');

async function testAdminsAPI() {
  try {
    console.log('🔍 Testing /api/admins endpoint...\n');
    
    // Test login first to get token
    const loginResponse = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login Response Status:', loginResponse.status);
    
    if (!loginData.success) {
      console.error('❌ Login failed:', loginData.message);
      return;
    }

    // Extract token from cookie header
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Cookies received:', cookies);

    // Test /api/admins endpoint
    const adminsResponse = await fetch('http://localhost:8000/api/admins', {
      method: 'GET',
      headers: {
        'Cookie': cookies || ''
      }
    });

    const adminsData = await adminsResponse.json();
    console.log('\n📊 Admins API Response Status:', adminsResponse.status);
    console.log('📊 Admins API Response:', JSON.stringify(adminsData, null, 2));

    if (adminsData.success && adminsData.data.admins.length > 0) {
      const firstAdmin = adminsData.data.admins[0];
      console.log('\n🔍 First admin fields:');
      console.log('- ID:', firstAdmin.id);
      console.log('- Username:', firstAdmin.username);
      console.log('- Email:', firstAdmin.email);
      console.log('- Full Name:', firstAdmin.full_name);
      console.log('- Role:', firstAdmin.role);
      console.log('- Is Active:', firstAdmin.is_active);
      console.log('- Last Login:', firstAdmin.last_login);
      console.log('- Last Login At:', firstAdmin.last_login_at);
      console.log('- IP Address:', firstAdmin.ip_address);
      console.log('- WhatsApp Number:', firstAdmin.whatsapp_number);
      console.log('- Created At:', firstAdmin.createdAt || firstAdmin.created_at);
      console.log('- Updated At:', firstAdmin.updatedAt || firstAdmin.updated_at);
      
      console.log('\n📋 All available fields:');
      console.log(Object.keys(firstAdmin));
      
      console.log('\n🔍 Checking second admin (should have IP):');
      if (adminsData.data.admins.length > 1) {
        const secondAdmin = adminsData.data.admins[1];
        console.log('- Username:', secondAdmin.username);
        console.log('- Last Login:', secondAdmin.last_login);
        console.log('- Last Login At:', secondAdmin.last_login_at);
        console.log('- IP Address:', secondAdmin.ip_address);
      }
    }

  } catch (error) {
    console.error('❌ Error testing admins API:', error.message);
  }
}

testAdminsAPI();