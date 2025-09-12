"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Attachment extends Model {
    static associate(models) {
      Attachment.belongsTo(models.Meeting, {
        foreignKey: "meeting_id",
        as: "meeting",
      });
    }
  }

  Attachment.init(
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
      original_filename: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      filename: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      file_path: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      file_size: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      file_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      file_category: {
        type: DataTypes.ENUM("attachment", "photo"),
        allowNull: false,
        defaultValue: "attachment",
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
      modelName: "Attachment",
      tableName: "attachments",
      underscored: true,
      timestamps: true,
    }
  );

  return Attachment;
};