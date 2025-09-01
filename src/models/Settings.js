const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { formatDateIndonesian } = require('../utils/dateUtils');

class Settings extends Model {
  formatGroupMessage(meetings) {
    let meetingsText = meetings.map((meeting, index) => {
      const attendees = meeting.designated_attendees && Array.isArray(meeting.designated_attendees) 
        ? meeting.designated_attendees.join(', ') 
        : 'Semua peserta';
      
      // Replace {nomor} with meeting number for each meeting
      let meetingTemplate = `${index + 1}. _${meeting.title}_\n⏰ ${meeting.start_time} - ${meeting.end_time}\n📍 ${meeting.location}\n👥 ${attendees}${meeting.dress_code ? `\n👔 ${meeting.dress_code}` : ''}`;
      
      // If template contains {nomor}, replace it with the meeting number
      meetingTemplate = meetingTemplate.replace(/{nomor}/g, index + 1);
      
      return meetingTemplate;
    }).join('\n\n');

    let message = this.notification_templates.group_daily
       .replace('{date}', formatDateIndonesian(new Date()))
       .replace('{meetings}', meetingsText);

    // Replace individual meeting variables if there's only one meeting
    if (meetings.length === 1) {
      const meeting = meetings[0];
      message = message
        .replace(/{nomor}/g, '1')
        .replace('{title}', meeting.title || '')
        .replace('{start_time}', meeting.start_time || '')
        .replace('{end_time}', meeting.end_time || '')
        .replace('{location}', meeting.location || '')
        .replace('{meeting_link}', meeting.meeting_link || '')
        .replace('{dress_code}', meeting.dress_code || '')
        .replace('{attendance_link}', meeting.attendance_link || '');
    } else {
      // For multiple meetings, remove individual variables but keep {nomor} processing
      message = message
        .replace(/{nomor}/g, '')
        .replace('{title}', '')
        .replace('{start_time}', '')
        .replace('{end_time}', '')
        .replace('{location}', '')
        .replace('{meeting_link}', '')
        .replace('{dress_code}', '')
        .replace('{attendance_link}', '');
    }

    return message;
  }

  formatIndividualMessage(meeting) {
    let message = this.notification_templates.individual_reminder
      .replace('{title}', meeting.title)
      .replace('{date}', formatDateIndonesian(meeting.date))
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
      group_daily: '*Jadwal Rapat Hari Ini*\n*{date}*\n\n{meetings}\n\n📱 Pesan otomatis dari Meeting Manager\n🤖 Subdirektorat Intelijen',
      individual_reminder: '*Jadwal Rapat Hari Ini*\n*{date}*\n{nomor}. {title}\nWaktu : {start_time} s.d. {end_time}\nLokasi : {location} {meeting_link}_\n_Dresscode : {dress_code}\n\nHarap bersiap dan datang tepat waktu.\n\n📱 Pesan otomatis dari Meeting Manager\n🤖 Subdirektorat Intelijen'
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