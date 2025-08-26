const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

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
  attendance_status: {
    type: DataTypes.ENUM('pending', 'present', 'absent', 'late'),
    defaultValue: 'pending',
    allowNull: false
  },
  attendance_time: {
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
  modelName: 'MeetingParticipant',
  tableName: 'meeting_participants',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['meeting_id', 'participant_id']
    }
  ]
});

module.exports = MeetingParticipant;