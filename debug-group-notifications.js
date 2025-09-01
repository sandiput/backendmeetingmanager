const WhatsAppService = require('./src/services/whatsappService');
const { Meeting, Settings } = require('./src/models');

(async () => {
  try {
    console.log('=== DEBUG: Daily Group Notifications ===');
    
    // Check WhatsApp service status
    console.log('1. WhatsApp service initialized:', WhatsAppService.isInitialized);
    console.log('2. WhatsApp client exists:', !!WhatsAppService.client);
    
    // Check settings
    const settings = await Settings.findOne();
    console.log('3. Settings:', {
      group_notification_enabled: settings?.group_notification_enabled,
      whatsapp_connected: settings?.whatsapp_connected,
      whatsapp_group_id: settings?.whatsapp_group_id
    });
    
    // Check meetings for today
    const today = new Date().toISOString().split('T')[0];
    console.log('   Today date:', today);
    const meetings = await Meeting.findAll({
      where: {
        date: today,
        group_notification_enabled: true
      },
      order: [['start_time', 'ASC']]
    });
    
    console.log('4. Meetings found for today:', meetings.length);
    meetings.forEach(m => {
      console.log(`   - ${m.title}: group_notification_sent_at = ${m.group_notification_sent_at}`);
    });
    
    if (meetings.length === 0) {
      console.log('5. No meetings found, exiting.');
      process.exit(0);
    }
    
    // Test message formatting
    const message = settings.formatGroupMessage(meetings);
    console.log('5. Formatted message:', message.substring(0, 100) + '...');
    
    // Test sendGroupMessage directly
    console.log('6. Testing sendGroupMessage...');
    try {
      await WhatsAppService.sendGroupMessage(message);
      console.log('   ✅ sendGroupMessage succeeded');
    } catch (error) {
      console.log('   ❌ sendGroupMessage failed:', error.message);
      process.exit(1);
    }
    
    // Check if meetings were updated
    const updatedMeetings = await Meeting.findAll({
      where: {
        date: today.toISOString().split('T')[0],
        group_notification_enabled: true
      }
    });
    
    console.log('7. After sendGroupMessage, meetings status:');
    updatedMeetings.forEach(m => {
      console.log(`   - ${m.title}: group_notification_sent_at = ${m.group_notification_sent_at}`);
    });
    
    // Now test the full sendDailyGroupNotifications
    console.log('8. Testing full sendDailyGroupNotifications...');
    try {
      await WhatsAppService.sendDailyGroupNotifications();
      console.log('   ✅ sendDailyGroupNotifications succeeded');
    } catch (error) {
      console.log('   ❌ sendDailyGroupNotifications failed:', error.message);
    }
    
    // Final check
    const finalMeetings = await Meeting.findAll({
      where: {
        date: today.toISOString().split('T')[0],
        group_notification_enabled: true
      }
    });
    
    console.log('9. Final meetings status:');
    finalMeetings.forEach(m => {
      console.log(`   - ${m.title}: group_notification_sent_at = ${m.group_notification_sent_at}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();