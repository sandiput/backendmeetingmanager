const axios = require('axios');
const mysql = require('mysql2/promise');

const API_BASE = 'http://localhost:8000/api';
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'meeting_manager'
};

async function testPageViewAudit() {
  try {
    console.log('🧪 Testing Page View Audit Logging...');
    
    // Login admin untuk mendapatkan token
    console.log('\n1. Login admin...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    const adminId = loginResponse.data.data.admin.id;
    console.log(`✅ Login berhasil, admin ID: ${adminId}`);
    
    // Extract token from cookie header
    const cookies = loginResponse.headers['set-cookie'];
    let token = null;
    if (cookies) {
      const tokenCookie = cookies.find(cookie => cookie.startsWith('admin_token='));
      if (tokenCookie) {
        token = tokenCookie.split('admin_token=')[1].split(';')[0];
      }
    }
    
    if (!token) {
      throw new Error('Token tidak ditemukan dalam response');
    }
    
    // Setup axios dengan cookie
    const axiosConfig = {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `admin_token=${token}`
      },
      withCredentials: true
    };
    
    // Test berbagai routes GET untuk melihat page
    const routesToTest = [
      '/dashboard/stats',
      '/meetings',
      '/participants',
      '/settings',
      '/kantor'
    ];
    
    console.log('\n2. Testing page view routes...');
    for (const route of routesToTest) {
      try {
        console.log(`\n📄 Accessing ${route}...`);
        const response = await axios.get(`${API_BASE}${route}`, axiosConfig);
        console.log(`✅ ${route} - Status: ${response.status}`);
      } catch (error) {
        console.log(`❌ ${route} - Error: ${error.response?.status || error.message}`);
      }
    }
    
    // Tunggu sebentar untuk memastikan audit logs tersimpan
    console.log('\n⏳ Waiting for audit logs to be saved...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check audit logs
    console.log('\n3. Checking audit logs...');
    const connection = await mysql.createConnection(DB_CONFIG);
    
    const [logs] = await connection.execute(
      `SELECT id, user_id, action_type, endpoint, http_method, ip_address, user_agent, created_at 
       FROM audit_logs 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)
       ORDER BY created_at DESC`
    );
    
    console.log(`\n📊 Found ${logs.length} recent audit logs:`);
    
    let logsWithUserId = 0;
    let logsWithoutUserId = 0;
    
    logs.forEach((log, index) => {
      const hasUserId = log.user_id !== null;
      if (hasUserId) logsWithUserId++;
      else logsWithoutUserId++;
      
      console.log(`${index + 1}. ${log.http_method} ${log.endpoint} - User ID: ${log.user_id || 'NULL'} - ${log.created_at}`);
    });
    
    console.log(`\n📈 Summary:`);
    console.log(`- Logs with user_id: ${logsWithUserId}`);
    console.log(`- Logs without user_id: ${logsWithoutUserId}`);
    console.log(`- Total logs: ${logs.length}`);
    
    // Verify results
    if (logsWithUserId > 0) {
      console.log('\n✅ SUCCESS: Page view audit logging is working correctly!');
      console.log('✅ User ID is being recorded when viewing pages with authentication.');
    } else {
      console.log('\n❌ ISSUE: No audit logs found with user_id.');
      console.log('❌ Page view audit logging may not be working properly.');
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testPageViewAudit();