const { AuditLog } = require('../models');
const { Admin } = require('../models');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

// Helper function to calculate time since activity
function getTimeSince(createdAt) {
  const now = new Date();
  const activityTime = new Date(createdAt);
  const diffInSeconds = Math.floor((now - activityTime) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} detik yang lalu`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} menit yang lalu`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} jam yang lalu`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} hari yang lalu`;
  } else {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} bulan yang lalu`;
  }
}

class RecentActivityController {
  // Get recent activities from audit logs (CREATE, UPDATE, DELETE only)
  getRecentActivities = async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      
      // Get recent activities with admin info using raw SQL for better performance
      const activities = await sequelize.query(`
        SELECT 
          al.id,
          al.title,
          al.description,
          al.action_type,
          al.table_name,
          al.created_at,
          a.full_name,
          TIMESTAMPDIFF(MINUTE, al.created_at, NOW()) as minutes_ago
        FROM audit_logs al
        LEFT JOIN admins a ON al.user_id = a.id
        WHERE al.action_type IN ('CREATE', 'UPDATE', 'DELETE')
          AND al.success = true
          AND (al.old_values IS NOT NULL OR al.new_values IS NOT NULL)
        ORDER BY al.created_at DESC
        LIMIT :limit
      `, {
        replacements: { limit },
        type: sequelize.QueryTypes.SELECT
      });

      // Format the response with time ago
      const formattedActivities = activities.map(activity => {
        let timeAgo;
        const minutesAgo = activity.minutes_ago;
        
        if (minutesAgo < 1) {
          timeAgo = 'Baru saja';
        } else if (minutesAgo < 60) {
          timeAgo = `${minutesAgo} menit yang lalu`;
        } else if (minutesAgo < 1440) { // Less than 24 hours
          const hoursAgo = Math.floor(minutesAgo / 60);
          timeAgo = `${hoursAgo} jam yang lalu`;
        } else {
          const daysAgo = Math.floor(minutesAgo / 1440);
          timeAgo = `${daysAgo} hari yang lalu`;
        }

        return {
          id: activity.id,
          title: activity.title || 'Aktivitas',
          description: activity.description || '',
          action_type: activity.action_type,
          table_name: activity.table_name,
          full_name: activity.full_name || 'System',
          time_ago: timeAgo,
          created_at: activity.created_at
        };
      });

      res.json({
        success: true,
        data: formattedActivities,
        total: formattedActivities.length
      });
      
    } catch (error) {
      console.error('Error getting recent activities:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data aktivitas terbaru',
        error: error.message
      });
    }
  }
  
  // Get activities by module type
  getActivitiesByModule = async (req, res) => {
    try {
      const { module } = req.params;
      const limit = parseInt(req.query.limit) || 10;
      const page = parseInt(req.query.page) || 1;
      const offset = (page - 1) * limit;
      
      if (!['participants', 'meetings'].includes(module)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid module type. Must be participants or meetings.'
        });
      }
      
      const { count, rows } = await RecentActivity.findAndCountAll({
        where: { module_type: module },
        order: [['created_at', 'DESC']],
        limit: limit,
        offset: offset,
        attributes: [
          'id',
          'activity_type',
          'module_type',
          'entity_id', 
          'entity_title',
          'entity_data',
          'user_name',
          'description',
          'created_at'
        ]
      });
      
      const formattedActivities = rows.map(activity => {
        const timeSince = getTimeSince(activity.created_at);
        
        return {
          id: activity.id,
          type: activity.activity_type,
          module: activity.module_type,
          entityId: activity.entity_id,
          title: activity.entity_title,
          data: activity.entity_data,
          user: activity.user_name,
          description: activity.description,
          timeSince: timeSince,
          createdAt: activity.created_at
        };
      });
      
      res.json({
        success: true,
        data: {
          activities: formattedActivities,
          total: count,
          page: page,
          totalPages: Math.ceil(count / limit)
        }
      });
      
    } catch (error) {
      console.error('Error getting activities by module:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving activities by module'
      });
    }
  }
}

module.exports = new RecentActivityController();