const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class Settings extends Model {
  formatGroupMessage(meetings) {
    let meetingsText = meetings.map((meeting, index) => {
      const attendees = meeting.designated_attendees && Array.isArray(meeting.designated_attendees) 
        ? meeting.designated_attendees.join(', ') 
        : 'Semua peserta';
      return `${index + 1}. _${meeting.title}_\n⏰ ${meeting.start_time} - ${meeting.end_time}\n📍 ${meeting.location}\n👥 ${attendees}${meeting.dress_code ? `\n👔 ${meeting.dress_code}` : ''}`;
    }).join('\n\n');

    return this.notification_templates.group_daily
      .replace('{date}', new Date().toLocaleDateString('id-ID'))
      .replace('{meetings}', meetingsText);
  }

  formatIndividualMessage(meeting) {
    let message = this.notification_templates.individual_reminder
      .replace('{title}', meeting.title)
      .replace('{date}', meeting.date)
      .replace('{start_time}', meeting.start_time)
      .replace('{end_time}', meeting.end_time)
      .replace('{location}', meeting.location);

    if (meeting.meeting_link) {
      message = message.replace('{meeting_link}', `💻 Join: ${meeting.meeting_link}`);
    } else {
      message = message.replace('{meeting_link}\n', '');
    }

    if (meeting.dress_code) {
      message = message.replace('{dress_code}', `👔 Dress Code: ${meeting.dress_code}`);
    } else {
      message = message.replace('{dress_code}\n', '');
    }

    if (meeting.attendance_link) {
      message = message.replace('{attendance_link}', `🔗 Attendance: ${meeting.attendance_link}`);
    } else {
      message = message.replace('{attendance_link}\n', '');
    }

    return message;
  }
}

Settings.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  group_notification_time: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: '07:00'
  },
  group_notification_enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  individual_reminder_minutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 30,
    validate: {
      min: 1,
      max: 120
    }
  },
  individual_reminder_enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  whatsapp_connected: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  whatsapp_group_id: {
    type: DataTypes.STRING
  },
  last_group_notification: {
    type: DataTypes.DATE
  },
  notification_templates: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      group_daily: '🗓️ _Jadwal Meeting Hari Ini_\n📅 {date}\n\n{meetings}\n\n📱 Pesan otomatis dari Meeting Manager\n🤖 Subdirektorat Intelijen',
      individual_reminder: '⏰ _Meeting Reminder_\n\n📋 _{title}_\n📅 {date}\n⏰ {start_time} - {end_time}\n📍 {location}\n{meeting_link}\n{dress_code}\n{attendance_link}\n\nHarap bersiap dan datang tepat waktu.\n\n📱 Pesan otomatis dari Meeting Manager\n🤖 Subdirektorat Intelijen'
    },
    get() {
      const rawValue = this.getDataValue('notification_templates');
      if (typeof rawValue === 'string') {
        try {
          return JSON.parse(rawValue);
        } catch (e) {
          console.error('Error parsing notification_templates:', e);
          return this.constructor.rawAttributes.notification_templates.defaultValue;
        }
      }
      return rawValue;
    }
  }
}, {
  sequelize,
  modelName: 'Settings',
  tableName: 'settings',
  timestamps: true
});

// Hook to ensure only one settings record exists
Settings.beforeCreate(async (settings, options) => {
  const count = await Settings.count();
  if (count > 0) {
    throw new Error('Hanya boleh ada satu dokumen Settings!');
  }
});

module.exports = Settings;