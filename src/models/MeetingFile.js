const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { formatFileSize } = require('../utils/formatUtils');

class MeetingFile extends Model {
  getFileInfo() {
    return {
      id: this.id,
      filename: this.filename,
      original_name: this.original_name,
      mime_type: this.mime_type,
      size: this.size,
      formatted_size: formatFileSize(this.size),
      upload_date: this.createdAt,
      download_url: `/api/meetings/${this.meeting_id}/files/${this.id}/download`
    };
  }
}

MeetingFile.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  meeting_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'meetings',
      key: 'id'
    }
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false
  },
  original_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mime_type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  file_path: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  upload_by: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'MeetingFile',
  tableName: 'meeting_files',
  timestamps: true,
  indexes: [
    {
      fields: ['meeting_id']
    },
    {
      fields: ['filename']
    }
  ]
});

module.exports = MeetingFile;