const { Meeting, Participant, MeetingParticipant, sequelize } = require("../models");
const { Op, fn, col, literal } = require("sequelize");
const { logDetailedAudit } = require("../middleware/auditLogger");
const XLSX = require("xlsx");

class DashboardController {
  // Helper function to calculate date range based on period
  getDateRange(period = "monthly", customStartDate = null, customEndDate = null) {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case "custom":
        // Custom date range
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
        } else {
          // Fallback to monthly if custom dates not provided
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }
        break;
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
        // Notifications feature has been removed
        0,
      ]);

      // Log audit for dashboard stats view
      await logDetailedAudit(req, {
        action_type: "read",
        table_name: "dashboard_stats",
        description: "Lihat Statistik Dashboard",
        success: true,
      });

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

      // Log audit for failed dashboard stats view
      await logDetailedAudit(req, {
        action_type: "read",
        table_name: "dashboard_stats",
        description: "Gagal Lihat Statistik Dashboard",
        success: false,
        error_message: error.message,
      });

      res.status(500).json({
        success: false,
        message: "Error retrieving dashboard statistics",
      });
    }
  }

  // Get review statistics
  async getReviewStats(req, res) {
    try {
      const { period = "monthly", startDate: customStartDate, endDate: customEndDate } = req.query;
      const { startDate, endDate } = this.getDateRange(period, customStartDate, customEndDate);
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
            date: {
              [Op.between]: [startDate, endDate],
            },
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
      // WhatsApp notifications feature has been removed
      const whatsappNotifications = 0;

      // Calculate statistics
      const stats = {
        total_meetings: totalMeetings,
        completed_meetings: completedMeetings,
        active_participants: activeParticipants,
        avg_duration: avgDuration,
        whatsapp_notifications: whatsappNotifications,
        completion_rate: (completedMeetings / totalMeetings) * 100 || 0,
        avg_participants: avgParticipants,
      };

      // Log audit for review stats view
      await logDetailedAudit(req, {
        action_type: "READ",
        table_name: "review_stats",
        description: `Viewed review statistics for ${period} period`,
        success: true,
      });

      // Log audit for seksi stats view
      await logDetailedAudit(req, {
        action_type: "READ",
        table_name: "seksi_stats",
        description: `Viewed seksi statistics for ${period} period`,
        success: true,
      });

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error getting review stats:", error);

      // Log audit for failed review stats view
      await logDetailedAudit(req, {
        action_type: "READ",
        table_name: "review_stats",
        description: "Failed to view review statistics",
        success: false,
        error_message: error.message,
      });

      res.status(500).json({
        success: false,
        message: "Error retrieving review statistics",
      });
    }
  }

  // Get top participants
  async getTopParticipants(req, res) {
    try {
      const { period = "monthly", startDate: customStartDate, endDate: customEndDate } = req.query;
      const { startDate, endDate } = this.getDateRange(period, customStartDate, customEndDate);

      const [participants] = await sequelize.query(
        `
        SELECT 
          p.id,
          p.name,
          p.seksi,
          COUNT(mp.meeting_id) as meeting_count,
          ROUND(
            (COUNT(mp.meeting_id) * 100.0 / 
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
        LIMIT 5
      `,
        {
          replacements: [startDate, endDate],
        }
      );

      // Log audit for top participants view
      await logDetailedAudit(req, {
        action_type: "read",
        table_name: "top_participants",
        description: `Viewed top participants for ${period} period`,
        success: true,
      });

      res.json({
        success: true,
        data: participants,
      });
    } catch (error) {
      console.error("Error getting top participants:", error);

      // Log audit for failed top participants view
      await logDetailedAudit(req, {
        action_type: "read",
        table_name: "top_participants",
        description: "Failed to view top participants",
        success: false,
        error_message: error.message,
      });

      res.status(500).json({
        success: false,
        message: "Error retrieving top participants",
      });
    }
  }

  // Get top invited by
  async getTopInvitedBy(req, res) {
    try {
      const { period = "monthly", startDate: customStartDate, endDate: customEndDate } = req.query;
      const { startDate, endDate } = this.getDateRange(period, customStartDate, customEndDate);

      const [invitedBy] = await sequelize.query(
        `
        SELECT 
          invited_by,
          COUNT(*) as meeting_count
        FROM meetings
        WHERE invited_by IS NOT NULL
          AND date BETWEEN ? AND ?
        GROUP BY invited_by
        ORDER BY meeting_count DESC
        LIMIT 5
      `,
        {
          replacements: [startDate, endDate],
        }
      );

      // Log audit for top invited by view
      await logDetailedAudit(req, {
        action_type: "read",
        table_name: "top_invited_by",
        description: `Viewed top invited by for ${period} period`,
        success: true,
      });

      res.json({
        success: true,
        data: invitedBy,
      });
    } catch (error) {
      console.error("Error getting top invited by:", error);

      // Log audit for failed top invited by view
      await logDetailedAudit(req, {
        action_type: "read",
        table_name: "top_invited_by",
        description: "Failed to view top invited by",
        success: false,
        error_message: error.message,
      });

      res.status(500).json({
        success: false,
        message: "Error retrieving top invited by",
      });
    }
  }

  // Get seksi statistics
  async getSeksiStats(req, res) {
    try {
      const { period = "monthly", startDate: customStartDate, endDate: customEndDate } = req.query;
      const { startDate, endDate } = this.getDateRange(period, customStartDate, customEndDate);

      const [stats] = await sequelize.query(
        `
        SELECT 
          p.seksi,
          COUNT(p.id) as participant_count,
          SUM(CASE WHEN p.is_active = true THEN 1 ELSE 0 END) as active_count,
          COUNT(DISTINCT m.id) as meeting_count
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

      // Log audit for failed seksi stats view
      await logDetailedAudit(req, {
        action_type: "read",
        table_name: "seksi_stats",
        description: "Gagal Lihat Statistik Seksi",
        success: false,
        error_message: error.message,
      });

      res.status(500).json({
        success: false,
        message: "Error retrieving seksi statistics",
      });
    }
  }

  // Get meeting trends
  async getMeetingTrends(req, res) {
    try {
      const { period = "monthly", startDate, endDate } = req.query;
      
      // Use getMeetingTrendsData method for consistent logic
      const trends = await this.getMeetingTrendsData(period, startDate, endDate);

      // Log audit for meeting trends view
      await logDetailedAudit(req, {
        action_type: "read",
        table_name: "meeting_trends",
        description: `Lihat Tren Meeting untuk periode ${period}`,
        success: true,
      });

      res.json({
        success: true,
        data: trends,
      });
    } catch (error) {
      console.error("Error getting meeting trends:", error);

      // Log audit for failed meeting trends view
      await logDetailedAudit(req, {
        action_type: "read",
        table_name: "meeting_trends",
        description: "Gagal Lihat Tren Meeting",
        success: false,
        error_message: error.message,
      });

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

  // Export Excel report
  async exportExcel(req, res) {
    try {
      const { period = "monthly", startDate: customStartDate, endDate: customEndDate } = req.query;
      console.log(`Starting Excel export for period: ${period}`);
      
      const { startDate, endDate } = this.getDateRange(period, customStartDate, customEndDate);
      console.log(`Date range: ${startDate} to ${endDate}`);
      
      const now = new Date();

      // Get all data for export with individual error handling
      console.log('Fetching data for export...');
      let reviewStats, topParticipants, seksiStats, meetingTrends;
      
      try {
        [reviewStats, topParticipants, seksiStats, meetingTrends] = await Promise.all([
          this.getReviewStatsData(period, customStartDate, customEndDate),
          this.getTopParticipantsData(period, customStartDate, customEndDate),
          this.getSeksiStatsData(period, customStartDate, customEndDate),
          this.getMeetingTrendsData(period, customStartDate, customEndDate),
        ]);
        console.log('Data fetched successfully');
      } catch (dataError) {
        console.error('Error fetching data:', dataError);
        throw new Error(`Data fetch failed: ${dataError.message}`);
      }

      // Validate data
      if (!reviewStats || !topParticipants || !seksiStats || !meetingTrends) {
        throw new Error('One or more data sources returned null/undefined');
      }

      console.log('Creating Excel workbook...');
      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Review Statistics
      const statsData = [
        ["Metric", "Value"],
        ["Total Meetings", reviewStats.total_meetings || 0],
        ["Completed Meetings", reviewStats.completed_meetings || 0],
        ["Active Participants", reviewStats.active_participants || 0],
        ["Average Duration (minutes)", Math.round(reviewStats.avg_duration || 0)],
        ["WhatsApp Notifications", reviewStats.whatsapp_notifications || 0],
        ["Completion Rate (%)", Math.round((reviewStats.completion_rate || 0) * 100) / 100],
        ["Average Participants", Math.round((reviewStats.avg_participants || 0) * 100) / 100],
      ];
      const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
      XLSX.utils.book_append_sheet(workbook, statsSheet, "Statistics");

      // Sheet 2: Top Participants
      const participantsData = [["Name", "Seksi", "Meeting Count", "Attendance Rate (%)"]];
      if (Array.isArray(topParticipants)) {
        topParticipants.forEach((p) => {
          participantsData.push([
            p.name || 'Unknown',
            p.seksi || 'Unknown',
            p.meeting_count || 0,
            p.attendance_rate || 0
          ]);
        });
      }
      const participantsSheet = XLSX.utils.aoa_to_sheet(participantsData);
      XLSX.utils.book_append_sheet(workbook, participantsSheet, "Top Participants");

      // Sheet 3: Seksi Statistics
      const seksiData = [["Seksi", "Participant Count", "Active Count", "Meeting Count"]];
      if (Array.isArray(seksiStats)) {
        seksiStats.forEach((s) => {
          seksiData.push([
            s.seksi || 'Unknown',
            s.participant_count || 0,
            s.active_count || 0,
            s.meeting_count || 0
          ]);
        });
      }
      const seksiSheet = XLSX.utils.aoa_to_sheet(seksiData);
      XLSX.utils.book_append_sheet(workbook, seksiSheet, "Seksi Statistics");

      // Sheet 4: Meeting Trends
      const trendsData = [["Period", "Meeting Count", "Completion Rate (%)"]];
      if (Array.isArray(meetingTrends)) {
        meetingTrends.forEach((t) => {
          trendsData.push([
            t.period || 'Unknown',
            t.count || 0,
            Math.round((t.completion_rate || 0) * 100) / 100
          ]);
        });
      }
      const trendsSheet = XLSX.utils.aoa_to_sheet(trendsData);
      XLSX.utils.book_append_sheet(workbook, trendsSheet, "Meeting Trends");

      console.log('Generating Excel buffer...');
      // Generate Excel buffer
      const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      
      if (!excelBuffer || excelBuffer.length === 0) {
        throw new Error('Failed to generate Excel buffer');
      }

      // Set response headers
      const filename = `meeting-review-${period}-${new Date().toISOString().split("T")[0]}.xlsx`;
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", excelBuffer.length);

      // Log audit for Excel export
      await logDetailedAudit(req, {
        action_type: "export",
        table_name: "review_export",
        description: `Exported Excel report for ${period} period`,
        success: true,
      });

      console.log(`Excel export successful: ${filename}`);
      // Send Excel file
      res.send(excelBuffer);
    } catch (error) {
      console.error("Error exporting Excel:", error);
      console.error("Error stack:", error.stack);

      // Log audit for failed Excel export
      try {
        await logDetailedAudit(req, {
          action_type: "export",
          table_name: "review_export",
          description: "Failed to export Excel report",
          success: false,
          error_message: error.message,
        });
      } catch (auditError) {
        console.error("Failed to log audit:", auditError);
      }

      res.status(500).json({
        success: false,
        message: "Error exporting Excel report",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Helper methods to get data for export
  async getReviewStatsData(period, customStartDate = null, customEndDate = null) {
    const { startDate, endDate } = this.getDateRange(period, customStartDate, customEndDate);
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
          date: {
            [Op.between]: [startDate, endDate],
          },
          status: "completed",
        },
      }),
      Participant.count({ where: { is_active: true } }),
    ]);

    const avgParticipantsResult = await sequelize.query(
      `SELECT AVG(participant_count) as avg_participants 
       FROM (
         SELECT meeting_id, COUNT(participant_id) as participant_count 
         FROM meeting_participants mp
         INNER JOIN meetings m ON mp.meeting_id = m.id
         WHERE m.date BETWEEN ? AND ?
         GROUP BY meeting_id
       ) as meeting_counts`,
      { 
        replacements: [startDate, endDate],
        type: sequelize.QueryTypes.SELECT 
      }
    );
    const avgParticipants = parseFloat(avgParticipantsResult[0]?.avg_participants) || 0;

    const avgDuration = await this.calculateAverageDuration(startDate, endDate);
    const whatsappNotifications = await Meeting.count({
      where: {
        date: {
          [Op.between]: [startDate, endDate],
        },
        reminder_sent: true,
      },
    });

    return {
      total_meetings: totalMeetings || 0,
      completed_meetings: completedMeetings || 0,
      active_participants: activeParticipants || 0,
      avg_duration: parseFloat(avgDuration) || 0,
      whatsapp_notifications: whatsappNotifications || 0,
      completion_rate: totalMeetings > 0 ? ((completedMeetings / totalMeetings) * 100) : 0,
      avg_participants: avgParticipants,
    };
  }

  async getTopParticipantsData(period, customStartDate = null, customEndDate = null) {
    const { startDate, endDate } = this.getDateRange(period, customStartDate, customEndDate);

    const [participants] = await sequelize.query(
      `
      SELECT 
        p.id,
        p.name,
        COALESCE(p.seksi, 'Unknown') as seksi,
        COUNT(mp.meeting_id) as meeting_count,
        ROUND(
          CASE 
            WHEN COUNT(mp.meeting_id) > 0 THEN 100.0
            ELSE 0.0
          END, 2
        ) as attendance_rate
      FROM participants p
      LEFT JOIN meeting_participants mp ON p.id = mp.participant_id
      LEFT JOIN meetings m ON mp.meeting_id = m.id AND m.date BETWEEN ? AND ?
      WHERE p.is_active = true
      GROUP BY p.id, p.name, p.seksi
      HAVING COUNT(mp.meeting_id) > 0
      ORDER BY meeting_count DESC
      LIMIT 10
    `,
      {
        replacements: [startDate, endDate],
        type: sequelize.QueryTypes.SELECT
      }
    );

    return participants || [];
  }

  async getTopInvitedByData(period, customStartDate = null, customEndDate = null) {
    const { startDate, endDate } = this.getDateRange(period, customStartDate, customEndDate);

    const [invitedBy] = await sequelize.query(
      `
      SELECT 
        invited_by,
        COUNT(*) as meeting_count
      FROM meetings
      WHERE invited_by IS NOT NULL
        AND date BETWEEN ? AND ?
      GROUP BY invited_by
      ORDER BY meeting_count DESC
      LIMIT 5
    `,
      {
        replacements: [startDate, endDate],
        type: sequelize.QueryTypes.SELECT
      }
    );

    return invitedBy || [];
  }

  async getSeksiStatsData(period, customStartDate = null, customEndDate = null) {
    const { startDate, endDate } = this.getDateRange(period, customStartDate, customEndDate);

    const [stats] = await sequelize.query(
      `
      SELECT 
        COALESCE(p.seksi, 'Unknown') as seksi,
        COUNT(p.id) as participant_count,
        SUM(CASE WHEN p.is_active = true THEN 1 ELSE 0 END) as active_count,
        COUNT(DISTINCT m.id) as meeting_count
      FROM participants p
      LEFT JOIN meeting_participants mp ON p.id = mp.participant_id
      LEFT JOIN meetings m ON mp.meeting_id = m.id AND m.date BETWEEN ? AND ?
      GROUP BY p.seksi
      ORDER BY p.seksi
    `,
      {
        replacements: [startDate, endDate],
        type: sequelize.QueryTypes.SELECT
      }
    );

    return stats || [];
  }

  async getMeetingTrendsData(period, customStartDate = null, customEndDate = null) {
    // For custom period, break down data by appropriate intervals
    if (period === "custom" && customStartDate && customEndDate) {
      const { startDate, endDate } = this.getDateRange(period, customStartDate, customEndDate);
      
      try {
        const trends = [];
        const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        let intervals, intervalDays, periodLabel;
        
        // Determine appropriate interval based on date range
        if (daysDiff <= 7) {
          // 1 week or less: daily intervals
          intervals = daysDiff;
          intervalDays = 1;
          periodLabel = "Day";
        } else if (daysDiff <= 31) {
          // 1 month or less: weekly intervals
          intervals = Math.ceil(daysDiff / 7);
          intervalDays = 7;
          periodLabel = "Week";
        } else if (daysDiff <= 365) {
          // 1 year or less: monthly intervals
          intervals = Math.ceil(daysDiff / 30);
          intervalDays = 30;
          periodLabel = "Month";
        } else {
          // More than 1 year: quarterly intervals
          intervals = Math.ceil(daysDiff / 90);
          intervalDays = 90;
          periodLabel = "Quarter";
        }
        
        for (let i = 0; i < intervals; i++) {
          const periodStart = new Date(startDate);
          periodStart.setDate(startDate.getDate() + (i * intervalDays));
          
          const periodEnd = new Date(periodStart);
          periodEnd.setDate(periodStart.getDate() + intervalDays - 1);
          periodEnd.setHours(23, 59, 59, 999);
          
          // Ensure we don't exceed the end date
          if (periodEnd > endDate) {
            periodEnd.setTime(endDate.getTime());
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
            period: `${periodLabel} ${i + 1}`,
            count: meetings || 0,
            completion_rate: meetings > 0 ? Math.round((completedMeetings / meetings) * 100 * 100) / 100 : 0,
          });
        }
        
        return trends;
      } catch (error) {
        console.error('Error fetching custom period trend data:', error);
        return [{
          period: "Custom Period",
          count: 0,
          completion_rate: 0,
        }];
      }
    }

    const now = new Date();
    const trends = [];

    let intervals, periodLabel;

    switch (period) {
      case "weekly":
        intervals = 7;
        periodLabel = "Day";
        break;
      case "yearly":
        intervals = 12;
        periodLabel = "Month";
        break;
      case "monthly":
      default:
        intervals = 4;
        periodLabel = "Week";
        break;
    }

    for (let i = intervals - 1; i >= 0; i--) {
      let periodStart, periodEnd;

      if (period === "weekly") {
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - i);
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(periodStart);
        periodEnd.setHours(23, 59, 59, 999);
      } else if (period === "yearly") {
        periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      } else {
        // Monthly - show last 4 weeks within current month
        const { startDate: monthStart, endDate: monthEnd } = this.getDateRange("monthly");
        const weekInMonth = Math.floor((monthEnd.getDate() - monthStart.getDate() + 1) / 4);
        
        periodStart = new Date(monthStart);
        periodStart.setDate(monthStart.getDate() + (i * weekInMonth));
        periodStart.setHours(0, 0, 0, 0);
        
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodStart.getDate() + weekInMonth - 1);
        periodEnd.setHours(23, 59, 59, 999);
        
        // Ensure we don't exceed month boundary
        if (periodEnd > monthEnd) {
          periodEnd = new Date(monthEnd);
        }
      }

      try {
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
          count: meetings || 0,
          completion_rate: meetings > 0 ? Math.round((completedMeetings / meetings) * 100 * 100) / 100 : 0,
        });
      } catch (error) {
        console.error(`Error fetching trend data for period ${i}:`, error);
        trends.push({
          period: `${periodLabel} ${intervals - i}`,
          count: 0,
          completion_rate: 0,
        });
      }
    }

    return trends;
  }
}

module.exports = new DashboardController();
