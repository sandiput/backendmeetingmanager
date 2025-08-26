const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class NotificationLog extends Model {}

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
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  participant_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'participants',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  type: {
    type: DataTypes.ENUM('reminder', 'group_notification'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'failed'),
    defaultValue: 'pending',
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'NotificationLog',
  tableName: 'notification_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['meeting_id']
    },
    {
      fields: ['participant_id']
    },
    {
      fields: ['type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['sent_at']
    }
  ]
});

module.exports = NotificationLog;