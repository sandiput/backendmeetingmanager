const { WhatsAppLog } = require('./src/models');

async function checkLatestLogs() {
  try {
    console.log('📋 Checking latest WhatsApp logs...');
    
    // Get the most recent logs
    const recentLogs = await WhatsAppLog.findAll({
      order: [['created_at', 'DESC']],
      limit: 10
    });
    
    console.log(`\n📊 Found ${recentLogs.length} recent logs:`);
    
    recentLogs.forEach((log, index) => {
      console.log(`\n${index + 1}. Log ID: ${log.id}`);
      console.log(`   📅 Meeting: ${log.meeting_title}`);
      console.log(`   👤 Recipient: ${log.recipient_name}`);
      console.log(`   📱 Type: ${log.message_type}`);
      console.log(`   📤 Sender: ${log.sender_type}`);
      console.log(`   ✅ Status: ${log.status}`);
      console.log(`   🆔 WhatsApp Message ID: ${log.whatsapp_message_id}`);
      console.log(`   ⏰ Created: ${log.created_at}`);
      
      if (log.error_message) {
        console.log(`   ❌ Error: ${log.error_message}`);
      }
    });
    
    // Check specifically for "Rapat Peningkatan Kapasitas SDM" logs
    console.log('\n🔍 Checking logs for "Rapat Peningkatan Kapasitas SDM"...');
    
    const meetingLogs = await WhatsAppLog.findAll({
      where: {
        meeting_title: {
          [require('sequelize').Op.like]: '%Rapat Peningkatan Kapasitas SDM%'
        }
      },
      order: [['created_at', 'DESC']]
    });
    
    console.log(`\n📊 Found ${meetingLogs.length} logs for this meeting:`);
    
    meetingLogs.forEach((log, index) => {
      console.log(`\n${index + 1}. ${log.message_type} to ${log.recipient_name}`);
      console.log(`   Status: ${log.status}`);
      console.log(`   WhatsApp ID: ${log.whatsapp_message_id}`);
      console.log(`   Created: ${log.created_at}`);
      
      if (log.error_message) {
        console.log(`   Error: ${log.error_message}`);
      }
    });
    
    console.log('\n✅ Log check completed!');
    
  } catch (error) {
    console.error('❌ Error checking logs:', error);
  }
}

checkLatestLogs();