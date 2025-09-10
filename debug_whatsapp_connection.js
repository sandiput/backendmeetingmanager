const whatsappService = require('./src/services/whatsappService');
const { Meeting, Participant, Settings, WhatsAppLog } = require('./src/models');
const { Op } = require('sequelize');

async function debugWhatsAppConnection() {
  try {
    console.log('🔍 Debugging WhatsApp Connection and Recent Changes...');
    
    // 1. Check current WhatsApp status
    console.log('\n=== 1. CURRENT WHATSAPP STATUS ===');
    const status = whatsappService.getStatus();
    console.log(`🔗 Connected: ${status.isConnected}`);
    console.log(`📱 Phone: ${status.phoneNumber || 'Not available'}`);
    console.log(`⚡ Ready: ${status.isReady}`);
    console.log(`🕐 Last Update: ${new Date().toLocaleString()}`);
    
    // 2. Try to reinitialize WhatsApp service
    console.log('\n=== 2. ATTEMPTING REINITIALIZATION ===');
    try {
      console.log('🔄 Reinitializing WhatsApp service...');
      await whatsappService.reinitialize();
      
      // Wait a moment for connection to establish
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const newStatus = whatsappService.getStatus();
      console.log(`✅ After reinitialization:`);
      console.log(`   🔗 Connected: ${newStatus.isConnected}`);
      console.log(`   📱 Phone: ${newStatus.phoneNumber || 'Not available'}`);
      console.log(`   ⚡ Ready: ${newStatus.isReady}`);
      
    } catch (reinitError) {
      console.log(`❌ Reinitialization failed: ${reinitError.message}`);
    }
    
    // 3. Check if WhatsAppLog model is affecting the service
    console.log('\n=== 3. CHECKING WHATSAPP LOG MODEL ===');
    try {
      // Test if WhatsAppLog model is working properly
      const testLog = await WhatsAppLog.create({
        message_type: 'individual',
        sender_type: 'manual',
        recipient_type: 'participant',
        recipient_name: 'Test User',
        phone_number: '6281234567890',
        message_content: 'Test message for debugging',
        status: 'pending'
      });
      
      console.log(`✅ WhatsAppLog model working - Test log ID: ${testLog.id}`);
      
      // Clean up test log
      await WhatsAppLog.destroy({ where: { id: testLog.id } });
      console.log(`🗑️ Test log cleaned up`);
      
    } catch (logError) {
      console.log(`❌ WhatsAppLog model error: ${logError.message}`);
      console.log(`   This could be affecting WhatsApp service!`);
    }
    
    // 4. Check recent logs to see if there are any patterns
    console.log('\n=== 4. CHECKING RECENT LOGS ===');
    try {
      const recentLogs = await WhatsAppLog.findAll({
        limit: 10,
        order: [['created_at', 'DESC']]
      });
      
      console.log(`📊 Found ${recentLogs.length} recent logs:`);
      recentLogs.forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.message_type} to ${log.recipient_name} - ${log.status} (${log.created_at})`);
        if (log.error_message) {
          console.log(`      Error: ${log.error_message}`);
        }
      });
      
    } catch (logCheckError) {
      console.log(`❌ Error checking recent logs: ${logCheckError.message}`);
    }
    
    // 5. Test basic WhatsApp functionality
    console.log('\n=== 5. TESTING BASIC FUNCTIONALITY ===');
    const currentStatus = whatsappService.getStatus();
    
    if (currentStatus.isConnected) {
      console.log('✅ WhatsApp is connected - testing basic functions...');
      
      try {
        // Test connection
        const testResult = await whatsappService.testConnection();
        console.log(`🧪 Connection test: ${testResult ? 'PASSED' : 'FAILED'}`);
        
      } catch (testError) {
        console.log(`❌ Connection test failed: ${testError.message}`);
      }
      
    } else {
      console.log('❌ WhatsApp still not connected after reinitialization');
      console.log('\n🔧 TROUBLESHOOTING STEPS:');
      console.log('   1. Check if WhatsApp Web is open in browser');
      console.log('   2. Scan QR code if needed');
      console.log('   3. Ensure phone has internet connection');
      console.log('   4. Restart the backend server');
    }
    
    // 6. Check if the issue is related to the new logging system
    console.log('\n=== 6. ANALYZING LOGGING SYSTEM IMPACT ===');
    
    // Check if there are any database connection issues
    try {
      const { sequelize } = require('./src/config/database');
      await sequelize.authenticate();
      console.log('✅ Database connection is working');
      
      // Check if whatsapp_logs table exists and is accessible
      const [results] = await sequelize.query("SHOW TABLES LIKE 'whatsapp_logs'");
      if (results.length > 0) {
        console.log('✅ whatsapp_logs table exists and is accessible');
      } else {
        console.log('❌ whatsapp_logs table not found!');
      }
      
    } catch (dbError) {
      console.log(`❌ Database issue detected: ${dbError.message}`);
      console.log('   This could be preventing WhatsApp service from starting!');
    }
    
    console.log('\n=== DEBUGGING COMPLETE ===');
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  }
}

debugWhatsAppConnection();