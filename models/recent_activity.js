'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RecentActivity extends Model {
    static associate(models) {
      // Define associations here if needed
      // RecentActivity.belongsTo(models.Admin, { foreignKey: 'user_id', as: 'user' });
    }

    // Helper method to create activity log
    static async logActivity({
      activityType,
      moduleType,
      entityId,
      entityTitle,
      entityData = null,
      userId = null,
      userName,
      description = null
    }) {
      try {
        return await this.create({
          activity_type: activityType,
          module_type: moduleType,
          entity_id: entityId,
          entity_title: entityTitle,
          entity_data: entityData ? JSON.stringify(entityData) : null,
          user_id: userId,
          user_name: userName,
          description: description
        });
      } catch (error) {
        console.error('Error logging activity:', error);
        throw error;
      }
    }

    // Get recent activities with limit
    static async getRecentActivities(limit = 3) {
      try {
        return await this.findAll({
          order: [['created_at', 'DESC']],
          limit: limit,
          attributes: [
            'id',
            'activity_type',
            'module_type',
            'entity_id',
            'entity_title',
            'entity_data',
            'user_id',
            'user_name',
            'description',
            'created_at'
          ]
        });
      } catch (error) {
        console.error('Error fetching recent activities:', error);
        throw error;
      }
    }

    // Format entity data for display
    getFormattedEntityData() {
      if (!this.entity_data) return null;
      try {
        return JSON.parse(this.entity_data);
      } catch (error) {
        console.error('Error parsing entity data:', error);
        return null;
      }
    }

    // Get time difference in minutes
    getMinutesAgo() {
      const now = new Date();
      const createdAt = new Date(this.created_at);
      const diffInMs = now - createdAt;
      return Math.floor(diffInMs / (1000 * 60));
    }

    // Format activity title
    getActivityTitle() {
      const actionMap = {
        create: 'Membuat',
        update: 'Mengubah',
        delete: 'Menghapus'
      };
      
      const moduleMap = {
        meeting: 'Meeting',
        participant: 'Participant'
      };

      return `${actionMap[this.activity_type]} ${moduleMap[this.module_type]}`;
    }
  }

  RecentActivity.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    activity_type: {
      type: DataTypes.ENUM('create', 'update', 'delete'),
      allowNull: false
    },
    module_type: {
      type: DataTypes.ENUM('meeting', 'participant'),
      allowNull: false
    },
    entity_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    entity_title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    entity_data: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    user_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'RecentActivity',
    tableName: 'recent_activities',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return RecentActivity;
};