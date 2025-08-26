'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class NotificationLog extends Model {
    static associate(models) {
      NotificationLog.belongsTo(models.Meeting, {
        foreignKey: 'meeting_id',
        as: 'meeting'
      });

      NotificationLog.belongsTo(models.Participant, {
        foreignKey: 'participant_id',
        as: 'participant'
      });
    }
  }

  NotificationLog.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    meeting_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'meetings',
        key: 'id'
      }
    },
    participant_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'participants',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('individual_reminder', 'group_notification'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('success', 'failed'),
      allowNull: false
    },
    error_message: DataTypes.TEXT,
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
    modelName: 'NotificationLog',
    tableName: 'notification_logs',
    underscored: true,
    timestamps: true
  });

  return NotificationLog;
};