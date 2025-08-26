const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const APP_CONSTANTS = require('./constants');

class WhatsAppConfig {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.qrCode = null;
    this.connectionStatus = 'disconnected';
  }

  // Initialize WhatsApp client
  async initialize() {
    try {
      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: APP_CONSTANTS.WHATSAPP.SESSION_PATH
        }),
        puppeteer: {
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      });

      // Handle QR code generation
      this.client.on('qr', (qr) => {
        this.qrCode = qr;
        this.connectionStatus = 'waiting_for_qr';
        
        // Display QR in terminal
        qrcode.generate(qr, { small: true });
        
        console.log('WhatsApp QR Code generated. Please scan with your phone.');
      });

      // Handle client ready event
      this.client.on('ready', () => {
        this.isReady = true;
        this.connectionStatus = 'connected';
        this.qrCode = null;
        console.log('WhatsApp client is ready!');
      });

      // Handle authentication failure
      this.client.on('auth_failure', (msg) => {
        this.connectionStatus = 'auth_failed';
        console.error('WhatsApp authentication failed:', msg);
      });

      // Handle disconnection
      this.client.on('disconnected', (reason) => {
        this.isReady = false;
        this.connectionStatus = 'disconnected';
        console.log('WhatsApp client disconnected:', reason);

        // Attempt to reconnect
        setTimeout(() => {
          console.log('Attempting to reconnect WhatsApp client...');
          this.initialize();
        }, 5000);
      });

      // Initialize the client
      await this.client.initialize();

    } catch (error) {
      console.error('Error initializing WhatsApp client:', error);
      this.connectionStatus = 'error';
      throw error;
    }
  }

  // Get client instance
  getClient() {
    return this.client;
  }

  // Get connection status
  getStatus() {
    return {
      isReady: this.isReady,
      status: this.connectionStatus,
      qrCode: this.qrCode
    };
  }

  // Check if client is ready
  isClientReady() {
    return this.isReady && this.client !== null;
  }

  // Get QR code
  getQRCode() {
    return this.qrCode;
  }

  // Validate WhatsApp number
  static validateNumber(number) {
    // Remove any non-digit characters
    let cleaned = number.replace(/\D/g, '');

    // Remove leading 0
    cleaned = cleaned.replace(/^0+/, '');

    // Add country code if not present
    if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned;
    }

    return cleaned;
  }

  // Format chat ID
  static formatChatId(number) {
    const cleaned = this.validateNumber(number);
    return cleaned + '@c.us';
  }

  // Format group chat ID
  static formatGroupChatId(groupId) {
    return groupId.endsWith('@g.us') ? groupId : groupId + '@g.us';
  }

  // Disconnect client
  async disconnect() {
    if (this.client) {
      try {
        await this.client.destroy();
        this.isReady = false;
        this.connectionStatus = 'disconnected';
        this.client = null;
        console.log('WhatsApp client disconnected successfully');
      } catch (error) {
        console.error('Error disconnecting WhatsApp client:', error);
        throw error;
      }
    }
  }

  // Restart client
  async restart() {
    try {
      await this.disconnect();
      await this.initialize();
    } catch (error) {
      console.error('Error restarting WhatsApp client:', error);
      throw error;
    }
  }
}

// Create singleton instance
const whatsappConfig = new WhatsAppConfig();

module.exports = whatsappConfig;