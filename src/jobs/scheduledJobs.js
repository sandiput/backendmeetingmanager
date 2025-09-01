const cron = require('node-cron');
const { Meeting } = require('../models');
const { Settings } = require('../models');
const WhatsAppService = require('../services/whatsappService');

class ScheduledJobs {
  // Initialize all scheduled jobs
  static initializeJobs() {
    this.scheduleDailyGroupNotification();
    this.scheduleReminderChecks();
    this.scheduleMeetingStatusUpdate();
    console.log('Scheduled jobs initialized');
  }

  // Schedule daily group notification job
  static scheduleDailyGroupNotification() {
    // Run at specified notification time (default: 07:00)
    cron.schedule('0 7 * * *', async () => {
      try {
        console.log('Running daily group notification job...');

        const settings = await Settings.findOne();
        if (!settings?.group_notification_enabled) {
          console.log('Group notifications are disabled');
          return;
        }

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // Get today's meetings
        const meetings = await Meeting.findAll({
          where: {
            date: todayStr,
            group_notification_sent_at: null
          }
        });

        if (meetings.length === 0) {
          console.log('No meetings found for today');
          return;
        }

        // Send group notification
        await WhatsAppService.sendDailyGroupNotifications();

        // Update meetings to mark notification as sent
        await Meeting.update(
          { group_notification_sent_at: new Date() },
          { 
            where: { 
              id: meetings.map(m => m.id) 
            } 
          }
        );

        console.log(`Daily group notification sent for ${meetings.length} meetings`);
      } catch (error) {
        console.error('Error in daily group notification job:', error);
      }
    }, {
      timezone: "Asia/Jakarta"
    });
  }

  // Schedule individual reminder checks
  static scheduleReminderChecks() {
    // Check every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      try {
        console.log('Running reminder check job...');

        const settings = await Settings.findOne();
        if (!settings?.reminder_enabled) {
          console.log('Individual reminders are disabled');
          return;
        }

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        // Get upcoming meetings that need reminders
        const meetings = await Meeting.findAll({
          where: {
            date: todayStr,
            reminder_sent_at: null,
            whatsapp_reminder_enabled: true
          }
        });

        for (const meeting of meetings) {
          try {
            // Ensure time is in ISO format (HH:mm:ss)
            const timeISO = meeting.time.includes(':') ? 
              (meeting.time.split(':').length === 2 ? `${meeting.time}:00` : meeting.time) : 
              `${meeting.time}:00:00`;
              
            const meetingTime = new Date(`${meeting.date}T${timeISO}`);
            const reminderTime = new Date(meetingTime.getTime() - (meeting.reminder_minutes * 60000));

            // Check if it's time to send reminder
            if (now >= reminderTime && now < meetingTime) {
              console.log(`Sending reminders for meeting: ${meeting.title}`);
              
              // Send individual reminders
              await WhatsAppService.sendMeetingReminders(meeting);

              // Mark reminder as sent
              meeting.reminder_sent_at = now;
              await meeting.save();

              console.log(`Reminders sent for meeting: ${meeting.title}`);
            }
          } catch (error) {
            console.error(`Error processing reminder for meeting ${meeting._id}:`, error);
          }
        }

        console.log('Reminder check job completed');
      } catch (error) {
        console.error('Error in reminder check job:', error);
      }
    }, {
      timezone: "Asia/Jakarta"
    });
  }

  // Schedule meeting status update job
  static scheduleMeetingStatusUpdate() {
    // Check every 5 minutes to update meeting status
    cron.schedule('*/5 * * * *', async () => {
      try {
        console.log('Running meeting status update job...');

        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().split(' ')[0]; // HH:mm:ss format

        // Find meetings that should be marked as completed
        // Meeting is completed if current date > meeting date OR (current date = meeting date AND current time > end_time)
        const { QueryTypes } = require('sequelize');
        const { sequelize } = require('../models');

        const meetingsToUpdate = await sequelize.query(`
          SELECT id, title, date, start_time, end_time 
          FROM meetings 
          WHERE status = 'upcoming' 
          AND (
            date < :currentDate 
            OR (date = :currentDate AND end_time < :currentTime)
          )
        `, {
          replacements: { currentDate, currentTime },
          type: QueryTypes.SELECT
        });

        if (meetingsToUpdate.length > 0) {
          // Update meetings to completed status
          await sequelize.query(`
            UPDATE meetings 
            SET status = 'completed' 
            WHERE status = 'upcoming' 
            AND (
              date < :currentDate 
              OR (date = :currentDate AND end_time < :currentTime)
            )
          `, {
            replacements: { currentDate, currentTime },
            type: QueryTypes.UPDATE
          });

          console.log(`Updated ${meetingsToUpdate.length} meetings to completed status:`);
          meetingsToUpdate.forEach(meeting => {
            console.log(`- ${meeting.title} (${meeting.date} ${meeting.start_time}-${meeting.end_time})`);
          });
        } else {
          console.log('No meetings to update to completed status');
        }

        console.log('Meeting status update job completed');
      } catch (error) {
        console.error('Error in meeting status update job:', error);
      }
    }, {
      timezone: "Asia/Jakarta"
    });
  }

  // Schedule cleanup job for old meetings
  static scheduleCleanup() {
    // Run at 00:00 every day
    cron.schedule('0 0 * * *', async () => {
      try {
        console.log('Running cleanup job...');

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Archive or delete old meetings
        const result = await Meeting.updateMany(
          {
            date: { $lt: thirtyDaysAgo.toISOString().split('T')[0] },
            status: { $ne: 'archived' }
          },
          { status: 'archived' }
        );

        console.log(`Archived ${result.modifiedCount} old meetings`);
      } catch (error) {
        console.error('Error in cleanup job:', error);
      }
    }, {
      timezone: "Asia/Jakarta"
    });
  }
}

module.exports = ScheduledJobs;