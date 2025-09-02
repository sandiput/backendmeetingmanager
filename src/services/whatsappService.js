const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const { Meeting, Participant, Settings } = require('../models');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isInitialized = false;
    this.isConnected = false;
    this.qrCode = null;
    this.availableGroups = [];
    this.initializeClient();
  }

  initializeClient() {
    try {
      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: 'meeting-manager',
          dataPath: path.join(__dirname, '../../.wwebjs_auth')
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
          ]
        }
      });

      this.setupEventHandlers();
    } catch (error) {
      console.error('Error initializing WhatsApp client:', error);
    }
  }

  setupEventHandlers() {
    this.client.on('qr', async (qr) => {
      console.log('QR Code received');
      try {
        // Convert QR code string to base64 image
        const qrCodeDataURL = await QRCode.toDataURL(qr);
        // Extract base64 part (remove data:image/png;base64, prefix)
        this.qrCode = qrCodeDataURL.split(',')[1];
      } catch (error) {
        console.error('Error generating QR code image:', error);
        this.qrCode = null;
      }
      qrcode.generate(qr, { small: true });
    });

    this.client.on('ready', async () => {
      console.log('WhatsApp client is ready!');
      this.isInitialized = true;
      this.isConnected = true;
      this.qrCode = null;
      
      // Update settings
      await this.updateConnectionStatus(true);
      
      // Load available groups
      await this.loadAvailableGroups();
    });

    this.client.on('authenticated', () => {
      console.log('WhatsApp client authenticated');
    });

    this.client.on('auth_failure', (msg) => {
      console.error('WhatsApp authentication failed:', msg);
      this.isConnected = false;
      this.updateConnectionStatus(false);
    });

    this.client.on('disconnected', (reason) => {
      console.log('WhatsApp client disconnected:', reason);
      this.isConnected = false;
      this.isInitialized = false;
      this.updateConnectionStatus(false);
    });
  }

  async initialize() {
    if (!this.client) {
      this.initializeClient();
    }

    if (!this.isInitialized) {
      try {
        await this.client.initialize();
        return { success: true, message: 'WhatsApp client initialized' };
      } catch (error) {
        console.error('Error initializing WhatsApp:', error);
        return { success: false, message: error.message };
      }
    }

    return { success: true, message: 'WhatsApp already initialized' };
  }

  async updateConnectionStatus(connected) {
    try {
      await Settings.update(
        { whatsapp_connected: connected },
        { where: {} }
      );
    } catch (error) {
      console.error('Error updating WhatsApp connection status:', error);
    }
  }

  async loadAvailableGroups() {
    try {
      const chats = await this.client.getChats();
      this.availableGroups = chats
        .filter(chat => chat.isGroup)
        .map(chat => ({
          id: chat.id._serialized,
          name: chat.name,
          participants: chat.participants ? chat.participants.length : 0
        }));
      
      console.log(`Loaded ${this.availableGroups.length} WhatsApp groups`);
    } catch (error) {
      console.error('Error loading WhatsApp groups:', error);
      this.availableGroups = [];
    }
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isConnected: this.isConnected,
      isEnabled: this.client !== null
    };
  }

  getQRCode() {
    return {
      qrCode: this.qrCode,
      isAvailable: this.qrCode !== null
    };
  }

  getAvailableGroups() {
    return this.availableGroups;
  }

  async sendMessage(chatId, message) {
    if (!this.isConnected) {
      throw new Error('WhatsApp not connected');
    }

    try {
      await this.client.sendMessage(chatId, message);
      return { success: true, message: 'Message sent successfully' };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  async sendGroupMessage(groupId, message) {
    return await this.sendMessage(groupId, message);
  }

  async sendIndividualMessage(phoneNumber, message) {
    // Format phone number (remove non-digits and add country code if needed)
    let formattedNumber = phoneNumber.replace(/\D/g, '');
    
    // Add Indonesia country code if not present
    if (!formattedNumber.startsWith('62')) {
      if (formattedNumber.startsWith('0')) {
        formattedNumber = '62' + formattedNumber.substring(1);
      } else {
        formattedNumber = '62' + formattedNumber;
      }
    }
    
    const chatId = formattedNumber + '@c.us';
    return await this.sendMessage(chatId, message);
  }

  async sendDailyGroupNotification(date = null) {
    try {
      const settings = await Settings.findOne();
      if (!settings || !settings.group_notification_enabled || !settings.whatsapp_group_id) {
        return { success: false, message: 'Group notifications not configured' };
      }

      const targetDate = date || new Date().toISOString().split('T')[0];
      
      // Get meetings for the specified date
      const meetings = await Meeting.findAll({
        where: {
          date: targetDate,
          status: 'upcoming'
        },
        include: [{
          model: Participant,
          as: 'participants',
          through: { attributes: [] }
        }],
        order: [['start_time', 'ASC']]
      });

      if (meetings.length === 0) {
        return { success: true, message: 'No meetings found for today' };
      }

      // Generate message using template
      const message = this.generateGroupMessage(meetings, targetDate, settings);
      
      // Send to group
      await this.sendGroupMessage(settings.whatsapp_group_id, message);
      
      // Update last notification time
      await Settings.update(
        { last_group_notification: new Date() },
        { where: { id: settings.id } }
      );

      return { success: true, message: `Group notification sent for ${meetings.length} meetings` };
    } catch (error) {
      console.error('Error sending daily group notification:', error);
      return { success: false, message: error.message };
    }
  }

  async sendIndividualReminder(meetingId) {
    try {
      const meeting = await Meeting.findByPk(meetingId, {
        include: [{
          model: Participant,
          as: 'participants',
          through: { attributes: [] }
        }]
      });

      if (!meeting) {
        return { success: false, message: 'Meeting not found' };
      }

      const settings = await Settings.findOne();
      if (!settings || !settings.individual_reminder_enabled) {
        return { success: false, message: 'Individual reminders not enabled' };
      }

      const message = this.generateIndividualMessage(meeting, settings);
      const results = [];

      // Send to all participants with phone numbers
      for (const participant of meeting.participants) {
        if (participant.phone) {
          try {
            await this.sendIndividualMessage(participant.phone, message);
            results.push({ participant: participant.name, success: true });
          } catch (error) {
            console.error(`Error sending reminder to ${participant.name}:`, error);
            results.push({ participant: participant.name, success: false, error: error.message });
          }
        }
      }

      return {
        success: true,
        message: `Individual reminders sent`,
        results
      };
    } catch (error) {
      console.error('Error sending individual reminders:', error);
      return { success: false, message: error.message };
    }
  }

  generateGroupMessage(meetings, date, settings) {
    const template = settings.notification_templates?.group_daily || 
      '*Jadwal Rapat Hari Ini*\n*{date}*\n\n{meetings}';
    
    const formattedDate = new Date(date).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let meetingsText = '';
    meetings.forEach((meeting, index) => {
      const startTime = meeting.start_time.substring(0, 5);
      const endTime = meeting.end_time.substring(0, 5);
      const location = meeting.location || 'TBD';
      const meetingLink = meeting.meeting_link ? `\n🔗 ${meeting.meeting_link}` : '';
      
      meetingsText += `${index + 1}. ${meeting.title}\n\nWaktu : ${startTime} s.d. ${endTime}\n\nLokasi : ${location}${meetingLink}\n\n`;
    });

    return template
      .replace('{date}', formattedDate)
      .replace('{meetings}', meetingsText.trim())
      .replace('{nomor}', '{index}')
      .replace('{title}', '{meeting.title}')
      .replace('{start_time}', '{meeting.start_time}')
      .replace('{end_time}', '{meeting.end_time}')
      .replace('{location}', '{meeting.location}')
      .replace('{meeting_link}', '{meeting.meeting_link}');
  }

  generateIndividualMessage(meeting, settings) {
    const template = settings.notification_templates?.individual_reminder || 
      '*Pengingat Rapat*\n\n📅 {title}\n🕐 {start_time} - {end_time}\n📍 {location}\n\nRapat akan dimulai dalam 30 menit.{meeting_link}';
    
    const startTime = meeting.start_time.substring(0, 5);
    const endTime = meeting.end_time.substring(0, 5);
    const location = meeting.location || 'TBD';
    const meetingLink = meeting.meeting_link ? `\n\n🔗 Link: ${meeting.meeting_link}` : '';

    return template
      .replace('{title}', meeting.title)
      .replace('{start_time}', startTime)
      .replace('{end_time}', endTime)
      .replace('{location}', location)
      .replace('{meeting_link}', meetingLink);
  }

  async testConnection() {
    try {
      if (!this.isConnected) {
        return { connected: false, message: 'WhatsApp not connected' };
      }

      // Try to get client info
      const info = await this.client.info;
      return { 
        connected: true, 
        message: 'WhatsApp connected successfully',
        info: {
          number: info.wid.user,
          name: info.pushname
        }
      };
    } catch (error) {
      console.error('Error testing WhatsApp connection:', error);
      return { connected: false, message: error.message };
    }
  }

  async reinitialize() {
    try {
      if (this.client) {
        await this.client.destroy();
      }
      
      this.isInitialized = false;
      this.isConnected = false;
      this.qrCode = null;
      this.availableGroups = [];
      
      this.initializeClient();
      return await this.initialize();
    } catch (error) {
      console.error('Error reinitializing WhatsApp:', error);
      return { success: false, message: error.message };
    }
  }

  async previewGroupMessage(date = null) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      const meetings = await Meeting.findAll({
        where: {
          date: targetDate,
          status: 'upcoming'
        },
        include: [{
          model: Participant,
          as: 'participants',
          through: { attributes: [] }
        }],
        order: [['start_time', 'ASC']]
      });

      const settings = await Settings.findOne();
      const message = this.generateGroupMessage(meetings, targetDate, settings);
      
      return {
        message,
        meetings: meetings.map(m => ({
          id: m.id,
          title: m.title,
          start_time: m.start_time,
          end_time: m.end_time,
          location: m.location,
          meeting_link: m.meeting_link
        }))
      };
    } catch (error) {
      console.error('Error previewing group message:', error);
      throw error;
    }
  }
}

// Create singleton instance
const whatsappService = new WhatsAppService();

module.exports = whatsappService;