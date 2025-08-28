const { Meeting, Participant, MeetingParticipant, sequelize } = require("../models");
const { Op, fn, col, literal } = require("sequelize");

class DashboardController {
  // Helper function to calculate date range based on period
  getDateRange(period = "monthly") {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case "weekly":
        // Current week (Monday to Sunday)
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate = new Date(now);
        startDate.setDate(now.getDate() + mondayOffset);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "yearly":
        // Current year
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case "monthly":
      default:
        // Current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
    }

    return { startDate, endDate };
  }
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
              [Op.between]: [startOfWeek, endOfWeek],
            },
          },
        }),
        Participant.count({ where: { is_active: true } }),
        Meeting.count({
          where: {
            [Op.or]: [{ reminder_sent_at: { [Op.not]: null } }, { group_notification_sent_at: { [Op.not]: null } }],
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          total_meetings: totalMeetings,
          this_week_meetings: thisWeekMeetings,
          notifications_sent: notificationsSent,
          active_participants: activeParticipants,
        },
      });
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      res.status(500).json({
        success: false,
        message: "Error retrieving dashboard statistics",
      });
    }
  }

  // Get review statistics
  async getReviewStats(req, res) {
    try {
      const { period = "monthly" } = req.query;
      const { startDate, endDate } = this.getDateRange(period);
      const now = new Date();

      const [totalMeetings, completedMeetings, activeParticipants] = await Promise.all([
        Meeting.count({
          where: {
            date: {
              [Op.between]: [startDate, endDate],
            },
          },
        }),
        Meeting.count({
          where: {
            date: { [Op.lt]: now },
            status: "completed",
          },
        }),
        Participant.count({ where: { is_active: true } }),
      ]);

      // Calculate average participants using subquery
      const avgParticipantsResult = await sequelize.query(
        `SELECT AVG(participant_count) as avg_participants 
         FROM (
           SELECT meeting_id, COUNT(participant_id) as participant_count 
           FROM meeting_participants 
           GROUP BY meeting_id
         ) as meeting_counts`,
        { type: sequelize.QueryTypes.SELECT }
      );
      const avgParticipants = avgParticipantsResult[0]?.avg_participants || 0;

      // Calculate additional statistics
      const avgDuration = await this.calculateAverageDuration(startDate, endDate);
      const ontimeRate = await this.calculateOntimeRate();
      const whatsappResponseRate = await this.calculateWhatsAppResponseRate();
      const whatsappNotifications = await Meeting.count({
        where: {
          [Op.or]: [{ reminder_sent_at: { [Op.not]: null } }, { group_notification_sent_at: { [Op.not]: null } }],
        },
      });

      // Calculate statistics
      const stats = {
        total_meetings: totalMeetings,
        completed_meetings: completedMeetings,
        active_participants: activeParticipants,
        avg_duration: avgDuration,
        whatsapp_notifications: whatsappNotifications,
        ontime_rate: ontimeRate,
        whatsapp_response_rate: whatsappResponseRate,
        completion_rate: (completedMeetings / totalMeetings) * 100 || 0,
        avg_participants: avgParticipants,
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error getting review stats:", error);
      res.status(500).json({
        success: false,
        message: "Error retrieving review statistics",
      });
    }
  }

  // Get top participants
  async getTopParticipants(req, res) {
    try {
      const { period = "monthly" } = req.query;
      const { startDate, endDate } = this.getDateRange(period);

      const [participants] = await sequelize.query(
        `
        SELECT 
          p.id,
          p.name,
          p.seksi,
          COUNT(mp.meeting_id) as meeting_count,
          ROUND(
            (COUNT(CASE WHEN mp.attendance_status = 'present' THEN 1 END) * 100.0 / 
             NULLIF(COUNT(mp.meeting_id), 0)), 2
          ) as attendance_rate
        FROM participants p
        LEFT JOIN meeting_participants mp ON p.id = mp.participant_id
        LEFT JOIN meetings m ON mp.meeting_id = m.id
        WHERE p.is_active = true
          AND (m.date IS NULL OR m.date BETWEEN ? AND ?)
        GROUP BY p.id, p.name, p.seksi
        HAVING COUNT(mp.meeting_id) > 0
        ORDER BY meeting_count DESC
        LIMIT 10
      `,
        {
          replacements: [startDate, endDate],
        }
      );

      res.json({
        success: true,
        data: participants,
      });
    } catch (error) {
      console.error("Error getting top participants:", error);
      res.status(500).json({
        success: false,
        message: "Error retrieving top participants",
      });
    }
  }

  // Get seksi statistics
  async getSeksiStats(req, res) {
    try {
      const { period = "monthly" } = req.query;
      const { startDate, endDate } = this.getDateRange(period);

      const [stats] = await sequelize.query(
        `
        SELECT 
          p.seksi,
          COUNT(p.id) as participant_count,
          SUM(CASE WHEN p.is_active = true THEN 1 ELSE 0 END) as active_count,
          COUNT(DISTINCT m.id) as meeting_count,
          ROUND(
            (COUNT(CASE WHEN mp.attendance_status = 'present' THEN 1 END) * 100.0 / 
             NULLIF(COUNT(mp.id), 0)), 2
          ) as attendance_rate
        FROM participants p
        LEFT JOIN meeting_participants mp ON p.id = mp.participant_id
        LEFT JOIN meetings m ON mp.meeting_id = m.id AND m.date BETWEEN ? AND ?
        GROUP BY p.seksi
        ORDER BY p.seksi
      `,
        {
          replacements: [startDate, endDate],
        }
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error getting seksi stats:", error);
      res.status(500).json({
        success: false,
        message: "Error retrieving seksi statistics",
      });
    }
  }

  // Get meeting trends
  async getMeetingTrends(req, res) {
    try {
      const { period = "monthly" } = req.query;
      const now = new Date();
      const trends = [];

      let intervals, periodCount, periodLabel;

      switch (period) {
        case "weekly":
          intervals = 7; // Last 7 days
          periodCount = 1; // 1 day intervals
          periodLabel = "Day";
          break;
        case "yearly":
          intervals = 12; // Last 12 months
          periodCount = 30; // ~1 month intervals
          periodLabel = "Month";
          break;
        case "monthly":
        default:
          intervals = 12; // Last 12 weeks
          periodCount = 7; // 1 week intervals
          periodLabel = "Week";
          break;
      }

      for (let i = intervals - 1; i >= 0; i--) {
        let periodStart, periodEnd;

        if (period === "weekly") {
          // Daily intervals for weekly view
          periodStart = new Date(now);
          periodStart.setDate(now.getDate() - i);
          periodStart.setHours(0, 0, 0, 0);
          periodEnd = new Date(periodStart);
          periodEnd.setHours(23, 59, 59, 999);
        } else if (period === "yearly") {
          // Monthly intervals for yearly view
          periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
          periodEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
        } else {
          // Weekly intervals for monthly view
          periodStart = new Date(now);
          periodStart.setDate(now.getDate() - i * 7);
          periodStart.setHours(0, 0, 0, 0);
          periodEnd = new Date(periodStart);
          periodEnd.setDate(periodStart.getDate() + 6);
          periodEnd.setHours(23, 59, 59, 999);
        }

        const [meetings, completedMeetings] = await Promise.all([
          Meeting.count({
            where: {
              date: {
                [Op.between]: [periodStart, periodEnd],
              },
            },
          }),
          Meeting.count({
            where: {
              date: {
                [Op.between]: [periodStart, periodEnd],
              },
              status: "completed",
            },
          }),
        ]);

        trends.push({
          period: `${periodLabel} ${intervals - i}`,
          count: meetings,
          completion_rate: meetings > 0 ? (completedMeetings / meetings) * 100 : 0,
        });
      }

      res.json({
        success: true,
        data: trends,
      });
    } catch (error) {
      console.error("Error getting meeting trends:", error);
      res.status(500).json({
        success: false,
        message: "Error retrieving meeting trends",
      });
    }
  }

  // Helper methods for calculating statistics
  async calculateAverageDuration(startDate = null, endDate = null) {
    const whereCondition = {
      status: "completed",
    };
    
    // Add date range filter if provided
    if (startDate && endDate) {
      whereCondition.date = {
        [Op.between]: [startDate, endDate],
      };
    }
    
    const result = await Meeting.findOne({
      attributes: [[fn("AVG", literal("TIMESTAMPDIFF(MINUTE, start_time, end_time)")), "avg_duration"]],
      where: whereCondition,
    });
    return result?.getDataValue("avg_duration") || 0;
  }

  async calculateOntimeRate() {
    const result = await MeetingParticipant.findOne({
      attributes: [[literal("COUNT(CASE WHEN arrival_time <= (SELECT start_time FROM meetings WHERE id = meeting_id) THEN 1 END) * 100.0 / COUNT(*)"), "rate"]],
      where: {
        attendance_status: "present",
      },
    });
    return result?.getDataValue("rate") || 0;
  }

  async calculateWhatsAppResponseRate() {
    const result = await Meeting.findOne({
      attributes: [
        [
          literal(
            "COUNT(CASE WHEN reminder_sent_at IS NOT NULL AND EXISTS (SELECT 1 FROM meeting_participants WHERE meeting_id = Meeting.id AND attendance_status = 'present') THEN 1 END) * 100.0 / COUNT(CASE WHEN reminder_sent_at IS NOT NULL THEN 1 END)"
          ),
          "rate",
        ],
      ],
    });
    return result?.getDataValue("rate") || 0;
  }
}

module.exports = new DashboardController();
