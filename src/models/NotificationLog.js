const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class NotificationLog extends Model {}

NotificationLog.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.ENUM('group_daily', 'individual_reminder', 'meeting_cancelled', 'meeting_rescheduled', 'meeting_summary'),
    allowNull: false
  },
  recipient: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'WhatsApp number or group ID'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'failed'),
    allowNull: false,
    defaultValue: 'pending'
  },
  error: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  meeting_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'meetings',
      key: 'id'
    }
  },
  participant_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'participants',
      key: 'id'
    }
  },
  retry_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  next_retry: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'NotificationLog',
  tableName: 'notification_logs',
  timestamps: true,
  indexes: [
    {
      fields: ['type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['meeting_id']
    },
    {
      fields: ['participant_id']
    },
    {
      fields: ['sent_at']
    }
  ]
});

module.exports = NotificationLog;