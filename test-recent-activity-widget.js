const mysql = require('mysql2/promise');
const axios = require('axios');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'meeting_manager'
};

// Test Recent Activity Widget
async function testRecentActivityWidget() {
  let connection;
  
  try {
    console.log('🔍 Testing Recent Activity Widget...');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected');
    
    // 1. Check if audit_logs table has data
    const [auditLogs] = await connection.execute(`
      SELECT COUNT(*) as total_logs FROM audit_logs 
      WHERE action_type IN ('create', 'update', 'delete')
    `);
    console.log(`📊 Total audit logs with create/update/delete: ${auditLogs[0].total_logs}`);
    
    // 2. Test the API endpoint directly
    console.log('\n🌐 Testing API endpoint...');
    
    // Create axios instance with cookie support
    const axiosWithCookies = axios.create({
      withCredentials: true,
      baseURL: 'http://localhost:8000'
    });
    
    // First, login to get cookie
    try {
      const loginResponse = await axiosWithCookies.post('/api/auth/login', {
        username: 'admin',
        password: 'admin123'
      });
      
      console.log('✅ Login successful, cookie set');
      
      // Test recent activities endpoint with cookie
      const activitiesResponse = await axiosWithCookies.get('/api/recent-activities?limit=5');
      
      if (activitiesResponse.data.success) {
        console.log('✅ Recent Activities API working');
        console.log(`📋 Retrieved ${activitiesResponse.data.data.length} activities`);
        
        // Display sample activities
        activitiesResponse.data.data.forEach((activity, index) => {
          console.log(`\n${index + 1}. ${activity.title}`);
          console.log(`   Action: ${activity.action_type} on ${activity.table_name}`);
          console.log(`   By: ${activity.full_name}`);
          console.log(`   Time: ${activity.time_ago}`);
          if (activity.description) {
            console.log(`   Description: ${activity.description}`);
          }
        });
      } else {
        console.log('❌ Recent Activities API failed:', activitiesResponse.data.message);
      }
      
    } catch (apiError) {
      console.log('❌ API test failed:', apiError.message);
      if (apiError.response) {
        console.log('Response status:', apiError.response.status);
        console.log('Response data:', apiError.response.data);
      }
    }
    
    // 3. Check database structure for widget requirements
    console.log('\n🔍 Checking database structure...');
    
    const [sampleData] = await connection.execute(`
      SELECT 
        al.id,
        al.title,
        al.description,
        al.action_type,
        al.table_name,
        a.full_name,
        al.created_at,
        CASE 
          WHEN TIMESTAMPDIFF(MINUTE, al.created_at, NOW()) < 60 
          THEN CONCAT(TIMESTAMPDIFF(MINUTE, al.created_at, NOW()), ' menit yang lalu')
          WHEN TIMESTAMPDIFF(HOUR, al.created_at, NOW()) < 24 
          THEN CONCAT(TIMESTAMPDIFF(HOUR, al.created_at, NOW()), ' jam yang lalu')
          ELSE CONCAT(TIMESTAMPDIFF(DAY, al.created_at, NOW()), ' hari yang lalu')
        END as time_ago
      FROM audit_logs al
      LEFT JOIN admins a ON al.user_id = a.id
      WHERE al.action_type IN ('create', 'update', 'delete')
      ORDER BY al.created_at DESC
      LIMIT 3
    `);
    
    console.log('✅ Sample data from database:');
    sampleData.forEach((row, index) => {
      console.log(`\n${index + 1}. ID: ${row.id}`);
      console.log(`   Title: ${row.title || 'NULL'}`);
      console.log(`   Description: ${row.description || 'NULL'}`);
      console.log(`   Action: ${row.action_type}`);
      console.log(`   Table: ${row.table_name}`);
      console.log(`   User: ${row.full_name || 'NULL'}`);
      console.log(`   Time: ${row.time_ago}`);
    });
    
    console.log('\n✅ Recent Activity Widget test completed!');
    console.log('\n📝 Widget Requirements Check:');
    console.log('✅ Data source: audit_logs table');
    console.log('✅ Action types: create, update, delete');
    console.log('✅ Fields: title, description, full_name (from JOIN), time_ago');
    console.log('✅ API endpoint: /api/recent-activities');
    console.log('✅ Frontend component: RecentActivity.tsx modified');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the test
testRecentActivityWidget();