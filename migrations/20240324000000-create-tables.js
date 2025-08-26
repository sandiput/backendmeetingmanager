'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  /** @type {import('sequelize-cli').Migration} */
  async up(queryInterface, Sequelize) {
    // Create participants table
    await queryInterface.createTable('participants', {
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
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });

    // Create meetings table
    await queryInterface.createTable('meetings', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      start_time: {
        type: DataTypes.TIME,
        allowNull: false
      },
      end_time: {
        type: DataTypes.TIME,
        allowNull: false
      },
      location: {
        type: DataTypes.STRING,
        allowNull: false
      },
      meeting_link: {
        type: DataTypes.STRING
      },
      dress_code: {
        type: DataTypes.STRING
      },
      invitation_reference: {
        type: DataTypes.STRING
      },
      attendance_link: {
        type: DataTypes.STRING
      },
      discussion_results: {
        type: DataTypes.TEXT
      },
      status: {
        type: DataTypes.ENUM('confirmed', 'pending', 'completed', 'cancelled'),
        defaultValue: 'pending'
      },
      whatsapp_reminder_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      group_notification_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      reminder_sent_at: {
        type: DataTypes.DATE
      },
      group_notification_sent_at: {
        type: DataTypes.DATE
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });

    // Create meeting_participants (junction table)
    await queryInterface.createTable('meeting_participants', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      meeting_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'meetings',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      participant_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'participants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      is_designated: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });

    // Create settings table
    await queryInterface.createTable('settings', {
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
    });

    // Create notification_logs table for tracking
    await queryInterface.createTable('notification_logs', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      meeting_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'meetings',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      participant_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'participants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: DataTypes.ENUM('individual_reminder', 'group_notification'),
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('success', 'failed'),
        allowNull: false
      },
      error_message: {
        type: DataTypes.TEXT
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('participants', ['nip']);
    await queryInterface.addIndex('participants', ['seksi']);
    await queryInterface.addIndex('meetings', ['date']);
    await queryInterface.addIndex('meetings', ['status']);
    await queryInterface.addIndex('meeting_participants', ['meeting_id']);
    await queryInterface.addIndex('meeting_participants', ['participant_id']);
    await queryInterface.addIndex('notification_logs', ['meeting_id']);
    await queryInterface.addIndex('notification_logs', ['participant_id']);
    await queryInterface.addIndex('notification_logs', ['type']);
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order
    await queryInterface.dropTable('notification_logs');
    await queryInterface.dropTable('meeting_participants');
    await queryInterface.dropTable('meetings');
    await queryInterface.dropTable('participants');
    await queryInterface.dropTable('settings');
  }
};