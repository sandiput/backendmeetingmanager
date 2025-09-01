const { Meeting, Settings } = require('./src/models');
const WhatsAppService = require('./src/services/whatsappService');

async function testGroupNotification() {
  try {
    console.log('Testing group notification...');
    
    // Check WhatsApp service initialization
    console.log('WhatsApp service initialized:', WhatsAppService.isInitialized);
    console.log('WhatsApp client ready:', WhatsAppService.client ? 'exists' : 'not exists');
    
    // Get today's date
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    console.log('Looking for meetings on:', todayStr);
    
    // Check settings first
    const settings = await Settings.findOne();
    console.log('Settings found:', {
      group_notification_enabled: settings?.group_notification_enabled,
      whatsapp_connected: settings?.whatsapp_connected,
      whatsapp_group_id: settings?.whatsapp_group_id
    });
    
    // Check if there are meetings today
    const meetings = await Meeting.findAll({
      where: {
        date: todayStr,
        group_notification_sent_at: null
      }
    });
    
    console.log('Found meetings for group notification:', meetings.length);
    meetings.forEach(meeting => {
      console.log(`- ${meeting.title} at ${meeting.start_time}`);
    });
    
    if (meetings.length === 0) {
      console.log('No meetings found for today. Creating a test meeting...');
      
      // Create a test meeting for today
      const testMeeting = await Meeting.create({
        title: 'Test Meeting for Group Notification',
        date: todayStr,
        start_time: '10:00:00',
        end_time: '11:00:00',
        location: 'Test Location',
        group_notification_enabled: true,
        whatsapp_reminder_enabled: true,
        group_notification_sent_at: null
      });
      
      console.log('Test meeting created:', testMeeting.id);
    }
    
    // Test sending a simple group message first
    console.log('\nTesting sendGroupMessage directly...');
    try {
      await WhatsAppService.sendGroupMessage('Test message from script');
      console.log('Direct group message sent successfully!');
    } catch (error) {
      console.error('Error sending direct group message:', error.message);
    }
    
    // Test the group notification function
    console.log('\nCalling sendDailyGroupNotifications...');
    try {
      await WhatsAppService.sendDailyGroupNotifications();
      console.log('sendDailyGroupNotifications completed without error');
    } catch (error) {
      console.error('Error in sendDailyGroupNotifications:', error.message);
    }
    
    console.log('\nChecking if meetings were updated...');
    const updatedMeetings = await Meeting.findAll({
      where: {
        date: todayStr
      }
    });
    
    updatedMeetings.forEach(meeting => {
      console.log(`- ${meeting.title}: group_notification_sent_at = ${meeting.group_notification_sent_at}`);
    });
    
    console.log('\nGroup notification test completed!');
    
  } catch (error) {
    console.error('Error testing group notification:', error);
  } finally {
    process.exit(0);
  }
}

testGroupNotification();