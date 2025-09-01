const WhatsAppService = require('./src/services/whatsappService');
const { Settings } = require('./models');

async function checkWhatsAppStatus() {
  try {
    console.log('🔍 Checking WhatsApp Service Status...');
    console.log('=' .repeat(50));
    
    // Check service initialization status
    console.log('Service initialized:', WhatsAppService.isInitialized);
    console.log('Client exists:', !!WhatsAppService.client);
    
    // Check database status
    const settings = await Settings.findOne();
    console.log('Database whatsapp_connected:', settings ? settings.whatsapp_connected : 'No settings');
    
    if (WhatsAppService.client) {
      console.log('Client state:', WhatsAppService.client.info ? 'Ready' : 'Not ready');
      
      // Try to get client info if available
      try {
        if (WhatsAppService.isInitialized) {
          const info = await WhatsAppService.client.getState();
          console.log('Client state details:', info);
        }
      } catch (error) {
        console.log('Cannot get client state:', error.message);
      }
    }
    
    console.log('\n💡 Recommendations:');
    if (!WhatsAppService.isInitialized) {
      console.log('- WhatsApp client is not initialized');
      console.log('- Check server logs for QR code or initialization errors');
      console.log('- You may need to scan QR code to authenticate');
    } else {
      console.log('- WhatsApp service appears to be running');
      console.log('- Database status may need to be updated');
    }
    
  } catch (error) {
    console.error('❌ Error checking WhatsApp status:', error);
  }
  
  process.exit(0);
}

checkWhatsAppStatus();