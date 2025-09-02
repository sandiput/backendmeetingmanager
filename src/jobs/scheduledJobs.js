const cron = require('node-cron');
const { Meeting } = require('../models');
const { Settings } = require('../models');

class ScheduledJobs {
  // Initialize all scheduled jobs
  static initializeJobs() {
    this.scheduleMeetingStatusUpdate();
    console.log('Scheduled jobs initialized');
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