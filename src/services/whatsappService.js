const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { Meeting, Settings, Participant } = require('../models');
const { Op } = require('sequelize');

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
      console.log('\n📱 Scan QR Code dengan WhatsApp Anda:');
      qrcode.generate(qr, { small: true });
      console.log('\n⚠️  QR Code akan expired dalam 20 detik. Scan sekarang!');
    });

    this.client.on('ready', async () => {
      console.log('WhatsApp client is ready!');
      this.isInitialized = true;
      this.updateWhatsAppStatus(true);
      
      // List all groups the bot is part of
      await this.listAvailableGroups();
    });

    this.client.on('disconnected', () => {
      console.log('WhatsApp client disconnected');
      this.isInitialized = false;
      this.updateWhatsAppStatus(false);
    });

    // Listen for when bot is added to new groups
    this.client.on('group_join', async (notification) => {
      console.log('\n🎉 Bot ditambahkan ke grup baru!');
      console.log('Group ID:', notification.chatId);
      console.log('Group Name:', notification.body);
      console.log('\n💡 Gunakan Group ID ini untuk konfigurasi notifikasi grup.');
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
      console.log('📋 Starting sendDailyGroupNotifications...');
      
      const settings = await Settings.findOne();
      console.log('⚙️ Settings loaded:', {
        group_notification_enabled: settings?.group_notification_enabled,
        whatsapp_group_id: settings?.whatsapp_group_id
      });
      
      if (!settings?.group_notification_enabled) {
        console.log('❌ Group notifications disabled, returning');
        return;
      }

      // Use local date to avoid timezone issues
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      console.log('📅 Looking for meetings on:', dateStr, '(local date)');
      console.log('📅 Current date object:', today.toString());

      const meetings = await Meeting.findAll({
        where: {
          date: dateStr,
          group_notification_enabled: true
        },
        order: [['start_time', 'ASC']]
      });

      console.log(`📊 Found ${meetings.length} meetings for today`);
      meetings.forEach(m => {
        console.log(`   - ${m.title}: group_sent_at=${m.group_notification_sent_at}`);
      });

      if (meetings.length === 0) {
        console.log('❌ No meetings found, returning');
        return;
      }

      const message = settings.formatGroupMessage(meetings);
      console.log('💬 Formatted message length:', message.length);
      
      console.log('📱 Calling sendGroupMessage...');
      await this.sendGroupMessage(message);
      console.log('✅ sendGroupMessage completed successfully');

      // Update notification status
      console.log('💾 Updating meeting notification status...');
      await Promise.all(meetings.map(async (meeting) => {
        const oldValue = meeting.group_notification_sent_at;
        meeting.group_notification_sent_at = new Date();
        await meeting.save();
        console.log(`   ✅ Updated ${meeting.title}: ${oldValue} -> ${meeting.group_notification_sent_at}`);
      }));

      console.log('💾 Updating settings last_group_notification...');
      settings.last_group_notification = new Date();
      await settings.save();
      console.log('✅ Settings updated successfully');
      
      console.log('🎉 sendDailyGroupNotifications completed successfully');
    } catch (error) {
      console.error('❌ Error sending daily group notifications:', error);
      throw error;
    }
  }

  async checkAndSendMeetingReminders() {
    try {
      const settings = await Settings.findOne();
      if (!settings?.individual_reminder_enabled) return;

      const now = new Date();
      const reminderTime = new Date(now.getTime() + settings.individual_reminder_minutes * 60000);

      const meetings = await Meeting.findAll({
        where: {
          date: now.toISOString().split('T')[0],
          whatsapp_reminder_enabled: true,
          reminder_sent_at: null,
          start_time: {
            [Op.gte]: now.toISOString().split('T')[1].substring(0, 8),
            [Op.lte]: reminderTime.toISOString().split('T')[1].substring(0, 8)
          }
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

        await meeting.update({
          reminder_sent_at: new Date()
        });
      }
    } catch (error) {
      console.error('Error checking and sending meeting reminders:', error);
      throw error;
    }
  }

  async listAvailableGroups() {
    if (!this.isInitialized) {
      throw new Error('WhatsApp client not initialized');
    }

    try {
      const chats = await this.client.getChats();
      const groups = chats.filter(chat => chat.isGroup);
      
      if (groups.length > 0) {
        console.log('\n📋 Daftar Grup yang Bot Ikuti:');
        console.log('=' .repeat(50));
        groups.forEach((group, index) => {
          console.log(`${index + 1}. ${group.name}`);
          console.log(`   ID: ${group.id._serialized}`);
          console.log(`   Participants: ${group.participants.length} members`);
          console.log('-'.repeat(40));
        });
        console.log('\n💡 Copy Group ID di atas untuk konfigurasi notifikasi grup.');
        console.log('💡 Gunakan endpoint POST /api/settings/whatsapp-group dengan group_id.');
      } else {
        console.log('\n❌ Bot belum bergabung dengan grup manapun.');
        console.log('💡 Tambahkan bot ke grup WhatsApp terlebih dahulu.');
      }
      
      return groups;
    } catch (error) {
      console.error('Error listing groups:', error);
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
        start_time: '10:00:00',
        end_time: '11:00:00',
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