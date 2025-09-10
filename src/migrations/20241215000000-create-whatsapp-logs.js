'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('whatsapp_logs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      meeting_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'meetings',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      message_type: {
        type: Sequelize.ENUM('individual', 'group'),
        allowNull: false,
        comment: 'Type of message: individual or group'
      },
      sender_type: {
        type: Sequelize.ENUM('scheduler', 'manual'),
        allowNull: false,
        comment: 'How the message was sent: scheduler or manual'
      },
      recipient_type: {
        type: Sequelize.ENUM('participant', 'group'),
        allowNull: false,
        comment: 'Type of recipient: participant or group'
      },
      recipient_id: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Participant ID for individual messages or Group ID for group messages'
      },
      recipient_name: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Name of participant or group'
      },
      phone_number: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Phone number for individual messages'
      },
      group_id: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'WhatsApp Group ID for group messages'
      },
      group_name: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'WhatsApp Group Name for group messages'
      },
      participant_ids: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON array of participant IDs for individual messages (when multiple participants)'
      },
      message_content: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Content of the WhatsApp message sent'
      },
      whatsapp_message_id: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'WhatsApp message ID returned after successful send'
      },
      status: {
        type: Sequelize.ENUM('success', 'failed', 'pending'),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Status of message delivery'
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Error message if delivery failed'
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'Timestamp when message was sent'
      },
      meeting_title: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Title of the meeting for reference'
      },
      meeting_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Date of the meeting'
      },
      meeting_time: {
        type: Sequelize.TIME,
        allowNull: true,
        comment: 'Start time of the meeting'
      },
      reminder_minutes: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Minutes before meeting when reminder was sent (for individual reminders)'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('whatsapp_logs', ['meeting_id']);
    await queryInterface.addIndex('whatsapp_logs', ['message_type']);
    await queryInterface.addIndex('whatsapp_logs', ['sender_type']);
    await queryInterface.addIndex('whatsapp_logs', ['status']);
    await queryInterface.addIndex('whatsapp_logs', ['sent_at']);
    await queryInterface.addIndex('whatsapp_logs', ['meeting_date']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('whatsapp_logs');
  }
};