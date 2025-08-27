const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class MeetingParticipant extends Model {}

MeetingParticipant.init({
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
  attendance_status: {
    type: DataTypes.ENUM('pending', 'present', 'late', 'absent'),
    allowNull: false,
    defaultValue: 'pending'
  },
  arrival_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reminder_sent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  last_reminder_sent: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'MeetingParticipant',
  tableName: 'meeting_participants',
  indexes: [
    {
      fields: ['meeting_id']
    },
    {
      fields: ['participant_id']
    },
    {
      fields: ['attendance_status']
    },
    {
      fields: ['meeting_id', 'participant_id'],
      unique: true
    }
  ]
});

module.exports = MeetingParticipant;