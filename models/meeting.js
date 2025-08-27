'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Meeting extends Model {
    static associate(models) {
      Meeting.belongsToMany(models.Participant, {
        through: 'meeting_participants',
        foreignKey: 'meeting_id',
        as: 'participants'
      });

      Meeting.hasMany(models.NotificationLog, {
        foreignKey: 'meeting_id',
        as: 'notification_logs'
      });
    }
  }

  Meeting.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    start_time: {
      type: DataTypes.STRING,
      allowNull: true
    },
    end_time: {
      type: DataTypes.STRING,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false
    },
    meeting_link: DataTypes.STRING,
    dress_code: DataTypes.STRING,
    invitation_reference: DataTypes.STRING,
    attendance_link: DataTypes.STRING,
    discussion_results: DataTypes.TEXT,
    status: {
      type: DataTypes.ENUM('incoming', 'completed'),
      defaultValue: 'incoming'
    },
    whatsapp_reminder_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    group_notification_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    reminder_sent_at: DataTypes.DATE,
    group_notification_sent_at: DataTypes.DATE,
    created_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Meeting',
    tableName: 'meetings',
    underscored: true,
    timestamps: true
  });

  return Meeting;
};