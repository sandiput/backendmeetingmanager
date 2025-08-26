'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Participant extends Model {
    static associate(models) {
      // Define associations here
      Participant.belongsToMany(models.Meeting, {
        through: 'meeting_participants',
        foreignKey: 'participant_id',
        otherKey: 'meeting_id',
        as: 'meetings'
      });

      Participant.hasMany(models.NotificationLog, {
        foreignKey: 'participant_id',
        as: 'notificationLogs'
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
    }
  }, {
    sequelize,
    modelName: 'Participant',
    tableName: 'participants',
    underscored: true
  });

  return Participant;
};