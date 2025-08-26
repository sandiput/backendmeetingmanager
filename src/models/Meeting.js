'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Meeting extends Model {
    static associate(models) {
      // Define associations here
      Meeting.belongsToMany(models.Participant, {
        through: 'meeting_participants',
        foreignKey: 'meeting_id',
        otherKey: 'participant_id',
        as: 'participants'
      });

      Meeting.hasMany(models.NotificationLog, {
        foreignKey: 'meeting_id',
        as: 'notificationLogs'
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
      type: DataTypes.TIME,
      allowNull: false
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false
    },
    meeting_link: {
      type: DataTypes.STRING
    },
    dress_code: {
      type: DataTypes.STRING
    },
    invitation_reference: {
      type: DataTypes.STRING
    },
    attendance_link: {
      type: DataTypes.STRING
    },
    discussion_results: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.ENUM('confirmed', 'pending', 'completed', 'cancelled'),
      defaultValue: 'pending'
    },
    whatsapp_reminder_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    group_notification_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    reminder_sent_at: {
      type: DataTypes.DATE
    },
    group_notification_sent_at: {
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    modelName: 'Meeting',
    tableName: 'meetings',
    underscored: true
  });

  return Meeting;
};