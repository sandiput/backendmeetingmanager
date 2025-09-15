'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RecentActivity extends Model {
    static associate(models) {
      // Define associations here if needed
    }
  }
  
  RecentActivity.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    activity_type: {
      type: DataTypes.ENUM('create', 'update', 'delete'),
      allowNull: false
    },
    module_type: {
      type: DataTypes.ENUM('meeting', 'participant'),
      allowNull: false
    },
    entity_id: {
      type: DataTypes.STRING,
      allowNull: true // Null for READ operations on lists
    },
    entity_title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    entity_data: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('entity_data');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('entity_data', value ? JSON.stringify(value) : null);
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    user_name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'System'
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'RecentActivity',
    tableName: 'recent_activities',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['created_at']
      },
      {
        fields: ['module_type']
      },
      {
        fields: ['activity_type']
      }
    ]
  });
  
  return RecentActivity;
};