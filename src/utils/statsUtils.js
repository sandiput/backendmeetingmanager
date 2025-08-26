const Meeting = require('../models/Meeting');
const Participant = require('../models/Participant');
const { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } = require('date-fns');

class StatsUtils {
  // Calculate meeting statistics for a given period
  static async calculateMeetingStats(startDate, endDate) {
    try {
      const meetings = await Meeting.find({
        date: {
          $gte: format(startDate, 'yyyy-MM-dd'),
          $lte: format(endDate, 'yyyy-MM-dd')
        }
      }).populate('attendees');

      const totalMeetings = meetings.length;
      let completedMeetings = 0;
      let totalDuration = 0;
      let totalAttendees = 0;
      let onTimeMeetings = 0;

      meetings.forEach(meeting => {
        if (meeting.status === 'completed') {
          completedMeetings++;
        }

        if (meeting.actual_start_time && 
            meeting.actual_start_time <= meeting.time) {
          onTimeMeetings++;
        }

        totalDuration += meeting.duration || 60; // Default 1 hour if not specified
        totalAttendees += meeting.attendees.length;
      });

      return {
        total_meetings: totalMeetings,
        completed_meetings: completedMeetings,
        completion_rate: totalMeetings ? (completedMeetings / totalMeetings) * 100 : 0,
        avg_duration: totalMeetings ? totalDuration / totalMeetings : 0,
        avg_participants: totalMeetings ? totalAttendees / totalMeetings : 0,
        ontime_rate: totalMeetings ? (onTimeMeetings / totalMeetings) * 100 : 0
      };
    } catch (error) {
      console.error('Error calculating meeting stats:', error);
      throw error;
    }
  }

  // Calculate participant statistics
  static async calculateParticipantStats() {
    try {
      const participants = await Participant.find().populate('meetings_attended');
      const totalParticipants = participants.length;
      let totalAttendance = 0;
      let totalResponses = 0;

      participants.forEach(participant => {
        totalAttendance += participant.meetings_attended.length;
        totalResponses += participant.meetings_attended.filter(
          meeting => meeting.attendance_confirmed
        ).length;
      });

      return {
        total_participants: totalParticipants,
        avg_attendance: totalParticipants ? totalAttendance / totalParticipants : 0,
        response_rate: totalAttendance ? (totalResponses / totalAttendance) * 100 : 0
      };
    } catch (error) {
      console.error('Error calculating participant stats:', error);
      throw error;
    }
  }

  // Calculate section (seksi) statistics
  static async calculateSeksiStats() {
    try {
      const stats = await Participant.aggregate([
        {
          $group: {
            _id: '$seksi',
            total_participants: { $sum: 1 },
            active_participants: {
              $sum: { $cond: [{ $eq: ['$is_active', true] }, 1, 0] }
            }
          }
        },
        {
          $project: {
            seksi: '$_id',
            total_participants: 1,
            active_participants: 1,
            active_rate: {
              $multiply: [
                { $divide: ['$active_participants', '$total_participants'] },
                100
              ]
            }
          }
        },
        { $sort: { total_participants: -1 } }
      ]);

      return stats;
    } catch (error) {
      console.error('Error calculating seksi stats:', error);
      throw error;
    }
  }

  // Calculate WhatsApp notification statistics
  static async calculateNotificationStats(startDate, endDate) {
    try {
      const meetings = await Meeting.find({
        date: {
          $gte: format(startDate, 'yyyy-MM-dd'),
          $lte: format(endDate, 'yyyy-MM-dd')
        }
      });

      let totalNotifications = 0;
      let successfulNotifications = 0;

      meetings.forEach(meeting => {
        if (meeting.reminder_sent_at) {
          totalNotifications += meeting.attendees.length;
          successfulNotifications += meeting.reminder_success_count || 0;
        }
        if (meeting.group_notification_sent_at) {
          totalNotifications++;
          if (meeting.group_notification_success) {
            successfulNotifications++;
          }
        }
      });

      return {
        total_notifications: totalNotifications,
        successful_notifications: successfulNotifications,
        success_rate: totalNotifications ? 
          (successfulNotifications / totalNotifications) * 100 : 0
      };
    } catch (error) {
      console.error('Error calculating notification stats:', error);
      throw error;
    }
  }

  // Get meeting trends
  static async getMeetingTrends(weeks = 12) {
    try {
      const now = new Date();
      const trends = [];

      for (let i = weeks - 1; i >= 0; i--) {
        const weekStart = startOfWeek(now);
        weekStart.setDate(weekStart.getDate() - (i * 7));
        
        const weekEnd = endOfWeek(weekStart);

        const stats = await this.calculateMeetingStats(weekStart, weekEnd);
        
        trends.push({
          period: `Week ${weeks - i}`,
          start_date: format(weekStart, 'yyyy-MM-dd'),
          end_date: format(weekEnd, 'yyyy-MM-dd'),
          ...stats
        });
      }

      return trends;
    } catch (error) {
      console.error('Error getting meeting trends:', error);
      throw error;
    }
  }

  // Get top participants
  static async getTopParticipants(limit = 10) {
    try {
      const participants = await Participant.aggregate([
        {
          $match: { is_active: true }
        },
        {
          $project: {
            name: 1,
            seksi: 1,
            meetings_count: { $size: '$meetings_attended' },
            attendance_rate: {
              $multiply: [
                {
                  $divide: [
                    { $size: '$meetings_attended' },
                    { $add: [{ $size: '$meetings_attended' }, '$meetings_missed'] }
                  ]
                },
                100
              ]
            }
          }
        },
        { $sort: { meetings_count: -1, attendance_rate: -1 } },
        { $limit: limit }
      ]);

      return participants;
    } catch (error) {
      console.error('Error getting top participants:', error);
      throw error;
    }
  }
}

module.exports = StatsUtils;