"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class NotificationLog extends Model {
    static associate(models) {
      NotificationLog.belongsTo(models.Meeting, {
        foreignKey: "meeting_id",
        as: "meeting",
      });
    }
  }

  NotificationLog.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      meeting_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "meetings",
          key: "id",
        },
      },
      notification_type: {
        type: DataTypes.ENUM("reminder", "group_notification", "individual_notification"),
        allowNull: false,
      },
      recipient_type: {
        type: DataTypes.ENUM("individual", "group"),
        allowNull: false,
      },
      recipient_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      recipient_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("pending", "sent", "failed", "delivered"),
        defaultValue: "pending",
      },
      sent_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      delivered_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      error_message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "NotificationLog",
      tableName: "notification_logs",
      underscored: true,
      timestamps: true,
    }
  );

  return NotificationLog;
};