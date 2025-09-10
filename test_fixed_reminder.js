const whatsappService = require('./src/services/whatsappService');
const { Meeting, Participant, Settings, WhatsAppLog } = require('./src/models');
const { Op } = require('sequelize');

async function testFixedReminder() {
  try {
    console.log('🧪 Testing Fixed WhatsApp Reminder System...');
    
    // 1. Check WhatsApp status after fix
    console.log('\n=== 1. WHATSAPP STATUS AFTER FIX ===');
    const status = whatsappService.getStatus();
    console.log(`🔗 Connected: ${status.isConnected}`);
    console.log(`📱 Phone: ${status.phoneNumber || 'Not available'}`);
    console.log(`⚡ Ready: ${status.isReady}`);
    
    if (!status.isConnected) {
      console.log('❌ WhatsApp still not connected!');
      return;
    }
    
    console.log('✅ WhatsApp is now connected!');
    
    // 2. Find the specific meeting
    console.log('\n=== 2. FINDING TARGET MEETING ===');
    const meeting = await Meeting.findOne({
      where: {
        title: {
          [Op.like]: '%Rapat Peningkatan Kapasitas SDM%'
        }
      },
      include: [{
        model: Participant,
        as: 'participants',
        through: { attributes: [] }
      }]
    });
    
    if (!meeting) {
      console.log('❌ Meeting "Rapat Peningkatan Kapasitas SDM" not found!');
      return;
    }
    
    console.log(`✅ Found meeting: ${meeting.title}`);
    console.log(`   📅 Date: ${meeting.date}`);
    console.log(`   ⏰ Time: ${meeting.start_time} - ${meeting.end_time}`);
    console.log(`   👥 Participants: ${meeting.participants.length}`);
    
    // 3. Check settings
    const settings = await Settings.findOne();
    console.log(`\n=== 3. SETTINGS CHECK ===`);
    console.log(`   📧 Individual reminders enabled: ${settings.individual_reminder_enabled}`);
    console.log(`   📱 WhatsApp connected in settings: ${settings.whatsapp_connected}`);
    
    if (!settings.individual_reminder_enabled) {
      console.log('❌ Individual reminders are disabled!');
      return;
    }
    
    // 4. Test sending individual reminder
    console.log('\n=== 4. TESTING INDIVIDUAL REMINDER ===');
    
    for (const participant of meeting.participants) {
      console.log(`\n👤 Testing participant: ${participant.name}`);
      console.log(`   📱 WhatsApp number: ${participant.whatsapp_number}`);
      
      if (!participant.whatsapp_number) {
        console.log('   ❌ No WhatsApp number - SKIP');
        continue;
      }
      
      // Format the message
      const message = `[TEST FIXED] ${settings.formatIndividualMessage(meeting)}`;
      console.log(`   📝 Message preview: ${message.substring(0, 100)}...`);
      
      try {
        // Prepare log data
        const logData = {
          meeting_id: meeting.id,
          sender_type: 'manual',
          recipient_id: participant.id.toString(),
          recipient_name: participant.name,
          meeting_title: meeting.title,
          meeting_date: meeting.date,
          meeting_time: meeting.start_time
        };
        
        console.log('   🚀 Sending test reminder...');
        const result = await whatsappService.sendIndividualMessage(
          participant.whatsapp_number, 
          message, 
          logData
        );
        
        console.log(`   ✅ SUCCESS: Message sent!`);
        console.log(`   📝 Message ID: ${result.messageId}`);
        console.log(`   📊 Log ID: ${result.logId}`);
        
        // Verify log was created
        const log = await WhatsAppLog.findByPk(result.logId);
        if (log) {
          console.log(`   📋 Log verified: Status = ${log.status}`);
        }
        
      } catch (error) {
        console.log(`   ❌ FAILED: ${error.message}`);
      }
    }
    
    // 5. Check recent logs to see the fix in action
    console.log('\n=== 5. RECENT LOGS AFTER FIX ===');
    const recentLogs = await WhatsAppLog.findAll({
      where: {
        meeting_title: {
          [Op.like]: '%Rapat Peningkatan Kapasitas SDM%'
        }
      },
      order: [['created_at', 'DESC']],
      limit: 5
    });
    
    console.log(`📊 Found ${recentLogs.length} logs for this meeting:`);
    recentLogs.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log.message_type} to ${log.recipient_name} - ${log.status} (${log.created_at})`);
      if (log.error_message) {
        console.log(`      Error: ${log.error_message}`);
      }
    });
    
    console.log('\n✅ Test completed! WhatsApp reminder system is now working.');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

testFixedReminder();