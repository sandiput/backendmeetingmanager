const cron = require("node-cron");
const whatsappService = require("../services/whatsappService");
const { Meeting, Settings, Participant, WhatsAppLog } = require("../models");
const { Op } = require("sequelize");
const moment = require("moment");

class WhatsAppScheduler {
  constructor() {
    this.whatsappService = whatsappService;
    this.groupDailyJob = null;
    this.individualReminderJob = null;
  }

  // Initialize all WhatsApp scheduled jobs
  async initializeJobs() {
    console.log("🤖 Initializing WhatsApp scheduled jobs...");

    // Start group daily notification job
    await this.startGroupDailyNotification();

    // Start individual reminder job (runs every minute to check for upcoming meetings)
    this.startIndividualReminderJob();

    console.log("✅ WhatsApp scheduled jobs initialized");
  }

  // Group daily notification - runs based on settings time
  async startGroupDailyNotification() {
    try {
      const settings = await Settings.findOne();
      const notificationTime = settings?.group_notification_time || "07:00";

      // Parse time (format: HH:mm)
      const [hours, minutes] = notificationTime.split(":");
      const cronExpression = `${minutes} ${hours} * * *`;

      // Run based on settings time
      this.groupDailyJob = cron.schedule(
        cronExpression,
        async () => {
          console.log(`🌅 Running daily group notification job at ${notificationTime}...`);
          await this.sendDailyGroupNotification();
        },
        {
          scheduled: true,
          timezone: "Asia/Jakarta",
        }
      );

      console.log(`📅 Group daily notification job scheduled for ${notificationTime}`);
    } catch (error) {
      console.error("❌ Error setting up group daily notification:", error);
      // Fallback to default time if error
      this.groupDailyJob = cron.schedule(
        "0 7 * * *",
        async () => {
          console.log("🌅 Running daily group notification job (fallback)...");
          await this.sendDailyGroupNotification();
        },
        {
          scheduled: true,
          timezone: "Asia/Jakarta",
        }
      );
      console.log("📅 Group daily notification job scheduled for 07:00 (fallback)");
    }
  }

  // Individual reminder job - runs every minute to check for upcoming meetings
  startIndividualReminderJob() {
    // Run every minute
    this.individualReminderJob = cron.schedule(
      "* * * * *",
      async () => {
        await this.checkAndSendIndividualReminders();
      },
      {
        scheduled: true,
        timezone: "Asia/Jakarta",
      }
    );

    console.log("⏰ Individual reminder job scheduled (runs every minute)");
  }

  // Send daily group notification
  async sendDailyGroupNotification() {
    try {
      const settings = await Settings.findOne();

      if (!settings || !settings.whatsapp_connected || !settings.whatsapp_group_id) {
        console.log("⚠️ WhatsApp not connected or no group selected, skipping daily notification");
        return;
      }

      if (!settings.group_notification_enabled) {
        console.log("⚠️ Group notifications disabled, skipping daily notification");
        return;
      }

      // Get today's meetings
      const today = moment().format("YYYY-MM-DD");
      const meetings = await Meeting.findAll({
        where: {
          date: today,
          status: {
            [Op.ne]: "cancelled",
          },
        },
        include: [{
          model: Participant,
          as: 'participants',
          through: { attributes: [] }
        }],
        order: [["start_time", "ASC"]],
      });

      if (meetings.length === 0) {
        console.log("📅 No meetings scheduled for today, skipping group notification");
        return;
      }

      // Generate meeting list text
      let meetingsText = "";
      meetings.forEach((meeting, index) => {
        const startTime = moment(meeting.start_time, "HH:mm").format("HH:mm");
        console.log("Cek Participants 2:", meeting.participants);
        const endTime = moment(meeting.end_time, "HH:mm").format("HH:mm");

        meetingsText += `${index + 1}. *${meeting.title}*\n`;
        meetingsText += `   🕐 ${startTime} - ${endTime}\n`;
        meetingsText += `   📍 ${meeting.location || "Tidak ditentukan"}\n`;
        if (meeting.meeting_link) {
          meetingsText += `   🔗 ${meeting.meeting_link}\n`;
        }
        meetingsText += "\n";
      });

      // Use template from database
      const message = settings.formatGroupMessage(meetings, moment().format("dddd, DD MMMM YYYY"));

      // Prepare log data for group notification
      const logData = {
        meeting_id: meetings.length === 1 ? meetings[0].id : null,
        sender_type: 'scheduler',
        group_name: 'Daily Group Notification',
        meeting_title: meetings.length === 1 ? meetings[0].title : `${meetings.length} meetings`,
        meeting_date: moment().format("YYYY-MM-DD"),
        participant_ids: meetings.flatMap(m => m.participants ? m.participants.map(p => p.id) : [])
      };

      // Send group message
      await this.whatsappService.sendGroupMessage(settings.whatsapp_group_id, message, logData);

      // Update last group notification time
      await Settings.update({ last_group_notification: new Date() }, { where: { id: settings.id } });

      console.log(`✅ Daily group notification sent for ${meetings.length} meetings`);
    } catch (error) {
      console.error("❌ Error sending daily group notification:", error);
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
      const currentTime = moment();
      
      // Calculate the exact target time (current time + reminder minutes)
      const targetTime = currentTime.clone().add(reminderMinutes, "minutes");
      const targetDate = targetTime.format("YYYY-MM-DD");
      const targetTimeStr = targetTime.format("HH:mm");

      console.log(`🔍 Checking for meetings at ${targetDate} ${targetTimeStr} (${reminderMinutes} minutes from now)`);

      // Find meetings that start exactly at the target time (no range)
      const meetings = await Meeting.findAll({
        where: {
          date: targetDate,
          start_time: targetTimeStr, // Exact match instead of range
          status: {
            [Op.ne]: "cancelled",
          },
          reminder_sent: {
            [Op.or]: [false, null],
          },
        },
        include: [
          {
            model: Participant,
            as: "participants",
            through: { attributes: [] },
            required: false,
          },
        ],
      });

      console.log(`📋 Found ${meetings.length} meetings requiring reminders`);

      for (const meeting of meetings) {
        console.log(`📤 Processing reminder for meeting: ${meeting.title} at ${meeting.date} ${meeting.start_time}`);
        await this.sendIndividualReminder(meeting, settings);
      }
    } catch (error) {
      console.error("❌ Error checking individual reminders:", error);
    }
  }

  // Send individual reminder for a specific meeting
  async sendIndividualReminder(meeting, settings) {
    try {
      // Double-check reminder_sent status to prevent race conditions
      const freshMeeting = await Meeting.findByPk(meeting.id, {
        attributes: ['id', 'reminder_sent', 'title']
      });
      
      if (freshMeeting && freshMeeting.reminder_sent) {
        console.log(`⚠️ Reminder already sent for meeting: ${meeting.title} (ID: ${meeting.id})`);
        return;
      }
      
      console.log(`📤 Sending individual reminder for meeting: ${meeting.title}`);
      console.log(`   📅 Date: ${meeting.date}`);
      console.log(`   ⏰ Time: ${meeting.start_time} - ${meeting.end_time}`);
      console.log(`   📍 Location: ${meeting.location}`);

      const participants = meeting.participants || [];
      
      if (!participants || participants.length === 0) {
        console.log(`⚠️ No participants found for meeting: ${meeting.title}`);
        return;
      }

      // Use template from database
      const message = settings.formatIndividualMessage(meeting);

      // Send to each participant
      let successCount = 0;
      let failCount = 0;

      for (const participant of participants) {
        if (participant.whatsapp_number) {
          // Format phone number (remove non-digits and add country code if needed)
          let phoneNumber = participant.whatsapp_number.replace(/\D/g, "");
          if (phoneNumber.startsWith("0")) {
            phoneNumber = "62" + phoneNumber.substring(1);
          } else if (!phoneNumber.startsWith("62")) {
            phoneNumber = "62" + phoneNumber;
          }

          try {
            // Prepare log data for individual reminder
            const logData = {
              meeting_id: meeting.id,
              sender_type: 'scheduler',
              recipient_id: participant.id.toString(),
              recipient_name: participant.name,
              meeting_title: meeting.title,
              meeting_date: meeting.date,
              meeting_time: meeting.start_time,
              reminder_minutes: settings.individual_reminder_minutes || 30
            };
            
            // Send message
            await whatsappService.sendIndividualMessage(phoneNumber, message, logData);

            console.log(`✅ Reminder sent to ${participant.name} (${phoneNumber})`);
            successCount++;
          } catch (error) {
            console.error(`❌ Failed to send reminder to ${participant.name} (${phoneNumber}): ${error.message}`);
            failCount++;
          }
        } else {
          console.log(`⚠️ No WhatsApp number for participant: ${participant.name}`);
        }
      }

      // Always mark reminder as sent after first attempt to prevent duplicate sending
      // This prevents the scheduler from sending the same reminder multiple times
      const updateResult = await Meeting.update(
        { reminder_sent: true }, 
        { 
          where: { id: meeting.id },
          returning: true // For debugging
        }
      );
      
      console.log(`✅ Reminder status updated for meeting ID: ${meeting.id}`);
      console.log(`📊 Individual reminder summary for meeting: ${meeting.title}`);
      console.log(`   ✅ Successfully sent: ${successCount}`);
      console.log(`   ❌ Failed to send: ${failCount}`);
      console.log(`   📱 Total participants: ${participants.length}`);
      console.log(`   🔒 Reminder marked as sent to prevent duplicates`);
    } catch (error) {
      console.error(`❌ Error sending individual reminder for meeting ${meeting.title}:`, error);
    }
  }

  // Stop all scheduled jobs
  stopJobs() {
    if (this.groupDailyJob) {
      this.groupDailyJob.stop();
      console.log("🛑 Group daily notification job stopped");
    }

    if (this.individualReminderJob) {
      this.individualReminderJob.stop();
      console.log("🛑 Individual reminder job stopped");
    }
  }

  // Restart all jobs
  async restartJobs() {
    this.stopJobs();
    await this.initializeJobs();
  }

  // Update group notification schedule when settings change
  async updateGroupNotificationSchedule() {
    try {
      // Stop current job if exists
      if (this.groupDailyJob) {
        this.groupDailyJob.stop();
        console.log("🛑 Stopped current group daily notification job");
      }

      // Start with new schedule
      await this.startGroupDailyNotification();
      console.log("✅ Group notification schedule updated");
    } catch (error) {
      console.error("❌ Error updating group notification schedule:", error);
    }
  }
}

module.exports = WhatsAppScheduler;
