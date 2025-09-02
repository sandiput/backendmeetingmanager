const cron = require('node-cron');
const whatsappService = require('../services/whatsappService');
const { Meeting, Settings } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

class WhatsAppScheduler {
  constructor() {
    this.whatsappService = whatsappService;
    this.groupDailyJob = null;
    this.individualReminderJob = null;
  }

  // Initialize all WhatsApp scheduled jobs
  initializeJobs() {
    console.log('🤖 Initializing WhatsApp scheduled jobs...');
    
    // Start group daily notification job
    this.startGroupDailyNotification();
    
    // Start individual reminder job (runs every minute to check for upcoming meetings)
    this.startIndividualReminderJob();
    
    console.log('✅ WhatsApp scheduled jobs initialized');
  }

  // Group daily notification - runs at 6 AM every day
  startGroupDailyNotification() {
    // Run at 6:00 AM every day
    this.groupDailyJob = cron.schedule('0 6 * * *', async () => {
      console.log('🌅 Running daily group notification job...');
      await this.sendDailyGroupNotification();
    }, {
      scheduled: true,
      timezone: 'Asia/Jakarta'
    });
    
    console.log('📅 Group daily notification job scheduled for 6:00 AM');
  }

  // Individual reminder job - runs every minute to check for upcoming meetings
  startIndividualReminderJob() {
    // Run every minute
    this.individualReminderJob = cron.schedule('* * * * *', async () => {
      await this.checkAndSendIndividualReminders();
    }, {
      scheduled: true,
      timezone: 'Asia/Jakarta'
    });
    
    console.log('⏰ Individual reminder job scheduled (runs every minute)');
  }

  // Send daily group notification
  async sendDailyGroupNotification() {
    try {
      const settings = await Settings.findOne();
      
      if (!settings || !settings.whatsapp_connected || !settings.whatsapp_group_id) {
        console.log('⚠️ WhatsApp not connected or no group selected, skipping daily notification');
        return;
      }

      if (!settings.group_notification_enabled) {
        console.log('⚠️ Group notifications disabled, skipping daily notification');
        return;
      }

      // Get today's meetings
      const today = moment().format('YYYY-MM-DD');
      const meetings = await Meeting.findAll({
        where: {
          date: today,
          status: {
            [Op.ne]: 'cancelled'
          }
        },
        order: [['start_time', 'ASC']]
      });

      if (meetings.length === 0) {
        console.log('📅 No meetings scheduled for today, skipping group notification');
        return;
      }

      // Generate meeting list text
      let meetingsText = '';
      meetings.forEach((meeting, index) => {
        const startTime = moment(meeting.start_time, 'HH:mm').format('HH:mm');
        const endTime = moment(meeting.end_time, 'HH:mm').format('HH:mm');
        
        meetingsText += `${index + 1}. *${meeting.title}*\n`;
        meetingsText += `   🕐 ${startTime} - ${endTime}\n`;
        meetingsText += `   📍 ${meeting.location || 'Tidak ditentukan'}\n`;
        if (meeting.meeting_link) {
          meetingsText += `   🔗 ${meeting.meeting_link}\n`;
        }
        meetingsText += '\n';
      });

      // Get message template
      const template = settings.notification_templates?.group_daily || 
        '*Jadwal Rapat Hari Ini*\\n*{date}*\\n\\n{meetings}\\n\\n📱 Pesan otomatis dari Meeting Manager\\n🤖 Subdirektorat Intelijen';

      // Replace template variables
      const message = template
        .replace('{date}', moment().format('dddd, DD MMMM YYYY'))
        .replace('{meetings}', meetingsText.trim())
        .replace(/\\\\n/g, '\n');

      // Send group message
      await this.whatsappService.sendGroupMessage(settings.whatsapp_group_id, message);
      
      // Update last group notification time
      await Settings.update(
        { last_group_notification: new Date() },
        { where: { id: settings.id } }
      );

      console.log(`✅ Daily group notification sent for ${meetings.length} meetings`);
    } catch (error) {
      console.error('❌ Error sending daily group notification:', error);
    }
  }

  // Check and send individual reminders
  async checkAndSendIndividualReminders() {
    try {
      const settings = await Settings.findOne();
      
      if (!settings || !settings.whatsapp_connected) {
        return;
      }

      if (!settings.individual_reminder_enabled) {
        return;
      }

      const reminderMinutes = settings.individual_reminder_minutes || 30;
      
      // Calculate the target time (current time + reminder minutes)
      const targetTime = moment().add(reminderMinutes, 'minutes');
      const targetDate = targetTime.format('YYYY-MM-DD');
      const targetTimeStr = targetTime.format('HH:mm');
      
      // Find meetings that start at the target time
      const meetings = await Meeting.findAll({
        where: {
          date: targetDate,
          start_time: {
            [Op.between]: [
              moment(targetTimeStr, 'HH:mm').subtract(1, 'minute').format('HH:mm'),
              moment(targetTimeStr, 'HH:mm').add(1, 'minute').format('HH:mm')
            ]
          },
          status: {
            [Op.ne]: 'cancelled'
          },
          reminder_sent: {
            [Op.or]: [false, null]
          }
        }
      });

      for (const meeting of meetings) {
        await this.sendIndividualReminder(meeting, settings);
      }
    } catch (error) {
      console.error('❌ Error checking individual reminders:', error);
    }
  }

  // Send individual reminder for a specific meeting
  async sendIndividualReminder(meeting, settings) {
    try {
      if (!meeting.participants || meeting.participants.length === 0) {
        console.log(`⚠️ No participants found for meeting: ${meeting.title}`);
        return;
      }

      // Get message template
      const template = settings.notification_templates?.individual_reminder || 
        '*Pengingat Rapat*\\n\\n📅 {title}\\n🕐 {start_time} - {end_time}\\n📍 {location}\\n\\nRapat akan dimulai dalam 30 menit.{meeting_link}';

      // Prepare meeting link text
      const meetingLinkText = meeting.meeting_link ? `\n🔗 ${meeting.meeting_link}` : '';

      // Replace template variables
      const message = template
        .replace('{title}', meeting.title)
        .replace('{start_time}', moment(meeting.start_time, 'HH:mm').format('HH:mm'))
        .replace('{end_time}', moment(meeting.end_time, 'HH:mm').format('HH:mm'))
        .replace('{location}', meeting.location || 'Tidak ditentukan')
        .replace('{meeting_link}', meetingLinkText)
        .replace(/\\\\n/g, '\n');

      // Send to each participant
      const participants = Array.isArray(meeting.participants) ? meeting.participants : JSON.parse(meeting.participants || '[]');
      
      for (const participant of participants) {
        if (participant.phone) {
          // Format phone number (remove non-digits and add country code if needed)
          let phoneNumber = participant.phone.replace(/\D/g, '');
          if (phoneNumber.startsWith('0')) {
            phoneNumber = '62' + phoneNumber.substring(1);
          } else if (!phoneNumber.startsWith('62')) {
            phoneNumber = '62' + phoneNumber;
          }
          
          await this.whatsappService.sendIndividualMessage(phoneNumber + '@c.us', message);
          console.log(`✅ Reminder sent to ${participant.name} (${phoneNumber})`);
        }
      }

      // Mark reminder as sent
      await Meeting.update(
        { reminder_sent: true },
        { where: { id: meeting.id } }
      );

      console.log(`✅ Individual reminders sent for meeting: ${meeting.title}`);
    } catch (error) {
      console.error(`❌ Error sending individual reminder for meeting ${meeting.title}:`, error);
    }
  }

  // Stop all scheduled jobs
  stopJobs() {
    if (this.groupDailyJob) {
      this.groupDailyJob.stop();
      console.log('🛑 Group daily notification job stopped');
    }
    
    if (this.individualReminderJob) {
      this.individualReminderJob.stop();
      console.log('🛑 Individual reminder job stopped');
    }
  }

  // Restart all jobs
  restartJobs() {
    this.stopJobs();
    this.initializeJobs();
  }
}

module.exports = WhatsAppScheduler;