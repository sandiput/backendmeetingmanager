const { Meeting, Participant, MeetingParticipant } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

class DashboardController {
  // Get dashboard statistics
  async getStats(req, res) {
    try {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const [totalMeetings, thisWeekMeetings, activeParticipants, notificationsSent] = await Promise.all([
        Meeting.count(),
        Meeting.count({
          where: {
            date: {
              [Op.between]: [startOfWeek, endOfWeek]
            }
          }
        }),
        Participant.count({ where: { is_active: true } }),
        Meeting.count({
          where: {
            [Op.or]: [
              { reminder_sent_at: { [Op.not]: null } },
              { group_notification_sent_at: { [Op.not]: null } }
            ]
          }
        })
      ]);

      res.json({
        success: true,
        data: {
          total_meetings: totalMeetings,
          this_week_meetings: thisWeekMeetings,
          notifications_sent: notificationsSent,
          active_participants: activeParticipants
        }
      });
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving dashboard statistics'
      });
    }
  }

  // Get review statistics
  async getReviewStats(req, res) {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const [totalMeetings, completedMeetings, activeParticipants, avgParticipants] = await Promise.all([
        Meeting.count({
          where: {
            date: {
              [Op.between]: [startOfMonth, endOfMonth]
            }
          }
        }),
        Meeting.count({
          where: {
            date: { [Op.lt]: now },
            status: 'completed'
          }
        }),
        Participant.count({ where: { is_active: true } }),
        MeetingParticipant.findOne({
          attributes: [
            [fn('AVG', fn('COUNT', col('participant_id'))), 'avg_participants']
          ],
          group: ['meeting_id']
        })
      ]);

      // Calculate statistics
      const stats = {
        total_meetings: totalMeetings,
        completed_meetings: completedMeetings,
        attendance_rate: await this.calculateAttendanceRate(),
        total_attendees: activeParticipants,
        avg_duration: await this.calculateAverageDuration(),
        whatsapp_notifications: await Meeting.count({
          where: {
            [Op.or]: [
              { reminder_sent_at: { [Op.not]: null } },
              { group_notification_sent_at: { [Op.not]: null } }
            ]
          }
        }),
        ontime_rate: await this.calculateOntimeRate(),
        whatsapp_response_rate: await this.calculateWhatsAppResponseRate(),
        completion_rate: (completedMeetings / totalMeetings) * 100 || 0,
        avg_participants: avgParticipants?.getDataValue('avg_participants') || 0
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting review stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving review statistics'
      });
    }
  }

  // Get top participants
  async getTopParticipants(req, res) {
    try {
      const participants = await Participant.findAll({
        attributes: [
          'id',
          'name',
          'seksi',
          [fn('COUNT', col('meetings.id')), 'meeting_count'],
          [literal('(COUNT(CASE WHEN meeting_participants.attendance_status = \'present\' THEN 1 END) * 100.0 / COUNT(*))'), 'attendance_rate']
        ],
        include: [{
          model: Meeting,
          as: 'meetings',
          attributes: [],
          through: { attributes: [] }
        }],
        where: { is_active: true },
        group: ['Participant.id'],
        order: [[fn('COUNT', col('meetings.id')), 'DESC']],
        limit: 10
      });

      res.json({
        success: true,
        data: participants
      });
    } catch (error) {
      console.error('Error getting top participants:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving top participants'
      });
    }
  }

  // Get seksi statistics
  async getSeksiStats(req, res) {
    try {
      const stats = await Participant.findAll({
        attributes: [
          'seksi',
          [fn('COUNT', col('id')), 'participant_count'],
          [fn('SUM', literal('CASE WHEN is_active = true THEN 1 ELSE 0 END')), 'active_count'],
          [literal('(SELECT COUNT(*) FROM meetings)'), 'meeting_count'],
          [literal('(SELECT COUNT(*) FROM meeting_participants mp JOIN meetings m ON mp.meeting_id = m.id WHERE mp.attendance_status = \'present\') * 100.0 / (SELECT COUNT(*) FROM meeting_participants)'), 'attendance_rate']
        ],
        group: ['seksi']
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting seksi stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving seksi statistics'
      });
    }
  }

  // Get meeting trends
  async getMeetingTrends(req, res) {
    try {
      const now = new Date();
      const trends = [];

      // Get last 12 weeks
      for (let i = 11; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (i * 7));
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const [meetings, completedMeetings] = await Promise.all([
          Meeting.count({
            where: {
              date: {
                [Op.between]: [weekStart, weekEnd]
              }
            }
          }),
          Meeting.count({
            where: {
              date: {
                [Op.between]: [weekStart, weekEnd]
              },
              status: 'completed'
            }
          })
        ]);

        trends.push({
          period: `Week ${12 - i}`,
          count: meetings,
          completion_rate: meetings > 0 ? (completedMeetings / meetings) * 100 : 0
        });
      }

      res.json({
        success: true,
        data: trends
      });
    } catch (error) {
      console.error('Error getting meeting trends:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving meeting trends'
      });
    }
  }

  // Helper methods for calculating statistics
  async calculateAttendanceRate() {
    const result = await MeetingParticipant.findOne({
      attributes: [
        [literal('COUNT(CASE WHEN attendance_status = \'present\' THEN 1 END) * 100.0 / COUNT(*)'), 'rate']
      ]
    });
    return result?.getDataValue('rate') || 0;
  }

  async calculateAverageDuration() {
    const result = await Meeting.findOne({
      attributes: [
        [fn('AVG', literal('TIMESTAMPDIFF(MINUTE, start_time, end_time)')), 'avg_duration']
      ],
      where: {
        status: 'completed'
      }
    });
    return result?.getDataValue('avg_duration') || 0;
  }

  async calculateOntimeRate() {
    const result = await MeetingParticipant.findOne({
      attributes: [
        [literal('COUNT(CASE WHEN attendance_time <= meeting_start_time THEN 1 END) * 100.0 / COUNT(*)'), 'rate']
      ],
      where: {
        attendance_status: 'present'
      }
    });
    return result?.getDataValue('rate') || 0;
  }

  async calculateWhatsAppResponseRate() {
    const result = await Meeting.findOne({
      attributes: [
        [literal('COUNT(CASE WHEN reminder_sent_at IS NOT NULL AND EXISTS (SELECT 1 FROM meeting_participants WHERE meeting_id = meetings.id AND attendance_status = \'present\') THEN 1 END) * 100.0 / COUNT(CASE WHEN reminder_sent_at IS NOT NULL THEN 1 END)'), 'rate']
      ]
    });
    return result?.getDataValue('rate') || 0;
  }
}

module.exports = new DashboardController();