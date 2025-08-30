'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MeetingParticipant extends Model {
    static associate(models) {
      // MeetingParticipant is a junction table, associations are defined in Meeting and Participant models
    }
  }

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
    is_designated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
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
      allowNull: true,
      defaultValue: false
    },
    last_reminder_sent: {
      type: DataTypes.DATE,
      allowNull: true
    },
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
    modelName: 'MeetingParticipant',
    tableName: 'meeting_participants',
    underscored: true,
    timestamps: true
  });

  return MeetingParticipant;
};