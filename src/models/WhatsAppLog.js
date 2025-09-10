const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const WhatsAppLog = sequelize.define('WhatsAppLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  meeting_id: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'meetings',
      key: 'id'
    }
  },
  message_type: {
    type: DataTypes.ENUM('individual', 'group'),
    allowNull: false,
    comment: 'Type of message: individual or group'
  },
  sender_type: {
    type: DataTypes.ENUM('scheduler', 'manual'),
    allowNull: false,
    comment: 'How the message was sent: scheduler or manual'
  },
  recipient_type: {
    type: DataTypes.ENUM('participant', 'group'),
    allowNull: false,
    comment: 'Type of recipient: participant or group'
  },
  recipient_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Participant ID for individual messages or Group ID for group messages'
  },
  recipient_name: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Name of participant or group'
  },
  whatsapp_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'WhatsApp number for individual messages'
    },
  group_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'WhatsApp Group ID for group messages'
  },
  group_name: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'WhatsApp Group Name for group messages'
  },
  participant_ids: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON array of participant IDs for individual messages (when multiple participants)',
    get() {
      const value = this.getDataValue('participant_ids');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('participant_ids', value ? JSON.stringify(value) : null);
    }
  },
  message_content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Content of the WhatsApp message sent'
  },
  whatsapp_message_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'WhatsApp message ID returned after successful send'
  },
  status: {
    type: DataTypes.ENUM('success', 'failed', 'pending'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Status of message delivery'
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Error message if delivery failed'
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Timestamp when message was sent'
  },
  meeting_title: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Title of the meeting for reference'
  },
  meeting_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Date of the meeting'
  },
  meeting_time: {
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'Start time of the meeting'
  },
  reminder_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Minutes before meeting when reminder was sent'
    }
}, {
  tableName: 'whatsapp_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Static method to create log entry
WhatsAppLog.createLog = async function(logData) {
  try {
    const log = await this.create({
      meeting_id: logData.meeting_id || null,
      message_type: logData.message_type,
      sender_type: logData.sender_type,
      recipient_type: logData.recipient_type,
      recipient_id: logData.recipient_id || null,
      recipient_name: logData.recipient_name || null,
      whatsapp_number: logData.whatsapp_number || null,
      group_id: logData.group_id || null,
      group_name: logData.group_name || null,
      participant_ids: logData.participant_ids || null,
      message_content: logData.message_content,
      whatsapp_message_id: logData.whatsapp_message_id || null,
      status: logData.status || 'pending',
      error_message: logData.error_message || null,
      sent_at: logData.sent_at || new Date(),
      meeting_title: logData.meeting_title || null,
      meeting_date: logData.meeting_date || null,
      meeting_time: logData.meeting_time || null,
      reminder_minutes: logData.reminder_minutes || null
    });
    
    console.log(`📝 WhatsApp log created: ${logData.message_type} message to ${logData.recipient_name || logData.whatsapp_number || logData.group_name} - Status: ${logData.status}`);
    return log;
  } catch (error) {
    console.error('❌ Error creating WhatsApp log:', error);
    throw error;
  }
};

// Static method to update log status
WhatsAppLog.updateLogStatus = async function(logId, status, whatsappMessageId = null, errorMessage = null) {
  try {
    const updateData = { status };
    
    if (whatsappMessageId && whatsappMessageId !== '0' && whatsappMessageId !== 0) {
      // Ensure whatsapp_message_id is always a string and not empty/zero
      if (typeof whatsappMessageId === 'object') {
        // If it's an object, try to extract the id property
        const extractedId = whatsappMessageId.id ? String(whatsappMessageId.id) : String(whatsappMessageId);
        if (extractedId && extractedId !== '0') {
          updateData.whatsapp_message_id = extractedId;
        }
      } else {
        const stringId = String(whatsappMessageId);
        if (stringId && stringId !== '0') {
          updateData.whatsapp_message_id = stringId;
        }
      }
    }
    
    if (errorMessage) {
      updateData.error_message = errorMessage;
    }
    
    await this.update(updateData, { where: { id: logId } });
    console.log(`📝 WhatsApp log ${logId} updated: Status = ${status}${updateData.whatsapp_message_id ? `, Message ID = ${updateData.whatsapp_message_id}` : ''}`);
  } catch (error) {
    console.error('❌ Error updating WhatsApp log:', error);
    throw error;
  }
};

// Static method to get logs by meeting
WhatsAppLog.getLogsByMeeting = async function(meetingId) {
  try {
    return await this.findAll({
      where: { meeting_id: meetingId },
      order: [['sent_at', 'DESC']]
    });
  } catch (error) {
    console.error('❌ Error getting WhatsApp logs by meeting:', error);
    throw error;
  }
};

// Static method to get recent logs
WhatsAppLog.getRecentLogs = async function(limit = 50) {
  try {
    return await this.findAll({
      order: [['sent_at', 'DESC']],
      limit: limit
    });
  } catch (error) {
    console.error('❌ Error getting recent WhatsApp logs:', error);
    throw error;
  }
};

module.exports = WhatsAppLog;