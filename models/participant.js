'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Participant extends Model {
    static associate(models) {
      Participant.belongsToMany(models.Meeting, {
        through: 'meeting_participants',
        foreignKey: 'participant_id',
        as: 'meetings'
      });
      
      Participant.hasMany(models.NotificationLog, {
        foreignKey: 'participant_id',
        as: 'notification_logs'
      });
    }
  }
  
  Participant.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    whatsapp_number: {
      type: DataTypes.STRING,
      allowNull: false
    },
    nip: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    seksi: {
      type: DataTypes.STRING,
      allowNull: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
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
    modelName: 'Participant',
    tableName: 'participants',
    underscored: true,
    timestamps: true
  });
  
  return Participant;
};