const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'meeting_manager'
};

async function checkAuditColumns() {
  try {
    console.log('🔍 Checking audit_logs columns...');
    
    const connection = await mysql.createConnection(DB_CONFIG);
    
    // Check recent audit logs with new columns
    const [logs] = await connection.execute(
      `SELECT title, description, description_detail, action_type, endpoint, http_method, created_at 
       FROM audit_logs 
       ORDER BY created_at DESC 
       LIMIT 5`
    );
    
    console.log(`\n📊 Latest 5 audit logs with new columns:`);
    console.log('=' .repeat(80));
    
    logs.forEach((log, index) => {
      console.log(`${index + 1}. ${log.http_method} ${log.endpoint}`);
      console.log(`   Title: ${log.title || 'NULL'}`);
      console.log(`   Description: ${log.description || 'NULL'}`);
      console.log(`   Description Detail: ${log.description_detail || 'NULL'}`);
      console.log(`   Action: ${log.action_type}`);
      console.log(`   Time: ${log.created_at}`);
      console.log('-'.repeat(60));
    });
    
    await connection.end();
    console.log('\n✅ Column check completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAuditColumns();