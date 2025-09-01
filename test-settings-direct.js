const { Settings } = require('./src/models');

async function testSettingsDirect() {
  try {
    console.log('Testing direct Settings model access...');
    
    let settings = await Settings.findOne();
    console.log('Settings found:', settings ? 'Yes' : 'No');
    
    if (!settings) {
      console.log('Creating default settings...');
      settings = await Settings.create({
        whatsapp_enabled: false,
        whatsapp_api_key: '',
        whatsapp_api_url: '',
        whatsapp_group_id: '',
        notification_templates: {
          reminder: 'Reminder: {meeting_title} akan dimulai pada {meeting_time}',
          confirmation: 'Konfirmasi kehadiran Anda untuk {meeting_title}',
          summary: 'Ringkasan rapat {meeting_title}: {summary}'
        }
      });
    }
    
    console.log('Settings data:', JSON.stringify(settings.toJSON(), null, 2));
    console.log('✅ Direct Settings access successful');
    
  } catch (error) {
    console.error('❌ Error in direct Settings access:', error.message);
    console.error('Stack:', error.stack);
  }
  
  process.exit(0);
}

testSettingsDirect();