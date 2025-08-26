const { Client, LocalAuth } = require('whatsapp-web.js');
const Meeting = require('../models/Meeting');
const Settings = require('../models/Settings');
const Participant = require('../models/Participant');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        args: ['--no-sandbox']
      }
    });

    this.client.on('qr', (qr) => {
      console.log('QR Code received:', qr);
    });

    this.client.on('ready', () => {
      console.log('WhatsApp client is ready!');
      this.isInitialized = true;
      this.updateWhatsAppStatus(true);
    });

    this.client.on('disconnected', () => {
      console.log('WhatsApp client disconnected');
      this.isInitialized = false;
      this.updateWhatsAppStatus(false);
    });

    await this.client.initialize();
  }

  async updateWhatsAppStatus(status) {
    try {
      const settings = await Settings.findOne();
      if (settings) {
        settings.whatsapp_connected = status;
        await settings.save();
      }
    } catch (error) {
      console.error('Error updating WhatsApp status:', error);
    }
  }

  async sendMessage(to, message) {
    if (!this.isInitialized) {
      throw new Error('WhatsApp client not initialized');
    }

    try {
      const formattedNumber = to.startsWith('+62') ? to.substring(1) : to;
      await this.client.sendMessage(`${formattedNumber}@c.us`, message);
      return true;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  async sendGroupMessage(message) {
    if (!this.isInitialized) {
      throw new Error('WhatsApp client not initialized');
    }

    try {
      const settings = await Settings.findOne();
      if (!settings?.whatsapp_group_id) {
        throw new Error('WhatsApp group ID not configured');
      }

      await this.client.sendMessage(settings.whatsapp_group_id, message);
      return true;
    } catch (error) {
      console.error('Error sending WhatsApp group message:', error);
      throw error;
    }
  }

  async sendDailyGroupNotifications() {
    try {
      const settings = await Settings.findOne();
      if (!settings?.group_notification_enabled) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const meetings = await Meeting.find({
        date: today.toISOString().split('T')[0],
        group_notification_enabled: true
      }).sort('start_time');

      if (meetings.length === 0) return;

      const message = settings.formatGroupMessage(meetings);
      await this.sendGroupMessage(message);

      // Update notification status
      await Promise.all(meetings.map(async (meeting) => {
        meeting.group_notification_sent_at = new Date();
        await meeting.save();
      }));

      settings.last_group_notification = new Date();
      await settings.save();
    } catch (error) {
      console.error('Error sending daily group notifications:', error);
      throw error;
    }
  }

  async checkAndSendMeetingReminders() {
    try {
      const settings = await Settings.findOne();
      if (!settings?.individual_reminder_enabled) return;

      const now = new Date();
      const reminderTime = new Date(now.getTime() + settings.individual_reminder_minutes * 60000);

      const meetings = await Meeting.find({
        date: now.toISOString().split('T')[0],
        whatsapp_reminder_enabled: true,
        reminder_sent_at: null,
        start_time: {
          $gte: now.toISOString().split('T')[1].substring(0, 5),
          $lte: reminderTime.toISOString().split('T')[1].substring(0, 5)
        }
      });

      for (const meeting of meetings) {
        const message = settings.formatIndividualMessage(meeting);

        // Send to each designated attendee
        for (const attendeeName of meeting.designated_attendees) {
          const participant = await Participant.findOne({ 
            name: attendeeName,
            is_active: true
          });

          if (participant) {
            await this.sendMessage(participant.whatsapp_number, message);
          }
        }

        meeting.reminder_sent_at = new Date();
        await meeting.save();
      }
    } catch (error) {
      console.error('Error checking and sending meeting reminders:', error);
      throw error;
    }
  }

  async sendTestMessage(to, type = 'individual') {
    try {
      const settings = await Settings.findOne();
      if (!settings) throw new Error('Settings not found');

      const testMeeting = {
        title: 'Test Meeting',
        date: new Date().toISOString().split('T')[0],
        start_time: '10:00',
        end_time: '11:00',
        location: 'Test Room',
        meeting_link: 'https://test-meeting.com',
        dress_code: 'Casual',
        attendance_link: 'https://test-attendance.com',
        designated_attendees: ['Test User']
      };

      if (type === 'group') {
        const message = settings.formatGroupMessage([testMeeting]);
        await this.sendGroupMessage(message);
      } else {
        const message = settings.formatIndividualMessage(testMeeting);
        await this.sendMessage(to, message);
      }

      return true;
    } catch (error) {
      console.error('Error sending test message:', error);
      throw error;
    }
  }
}

module.exports = new WhatsAppService();