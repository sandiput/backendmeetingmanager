'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Settings extends Model {
    static associate(models) {
      // Settings has no associations
    }
  }

  Settings.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    group_notification_time: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: '07:00'
    },
    group_notification_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    individual_reminder_minutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30
    },
    individual_reminder_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    whatsapp_connected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Settings',
    tableName: 'settings',
    underscored: true,
    timestamps: true,
    createdAt: false // Only need updatedAt for settings
  });

  return Settings;
};