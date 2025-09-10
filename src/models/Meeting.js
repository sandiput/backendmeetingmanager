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
    agenda: {
      type: DataTypes.TEXT
    },
    discussion_results: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.ENUM('upcoming', 'completed'),
      defaultValue: 'upcoming'
    },
    whatsapp_reminder_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    group_notification_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    invited_by: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Meeting',
    tableName: 'meetings',
    underscored: true
  });

  return Meeting;
};