'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create participants table
    await queryInterface.createTable('participants', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      whatsapp_number: {
        type: Sequelize.STRING,
        allowNull: false
      },
      nip: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      seksi: {
        type: Sequelize.STRING,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create meetings table
    await queryInterface.createTable('meetings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      start_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      end_time: {
        type: Sequelize.TIME
      },
      location: {
        type: Sequelize.STRING,
        allowNull: false
      },
      meeting_link: {
        type: Sequelize.STRING
      },
      dress_code: {
        type: Sequelize.STRING
      },
      discussion_result: {
        type: Sequelize.STRING
      },
      notes: {
        type: Sequelize.STRING
      },
      discussion_results: {
        type: Sequelize.TEXT
      },
      status: {
        type: Sequelize.ENUM('incoming', 'completed'),
        defaultValue: 'incoming'
      },
      whatsapp_reminder_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      group_notification_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      reminder_sent_at: {
        type: Sequelize.DATE
      },
      group_notification_sent_at: {
        type: Sequelize.DATE
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create meeting_participants table
    await queryInterface.createTable('meeting_participants', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      meeting_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'meetings',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      participant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'participants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      is_designated: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create settings table
    await queryInterface.createTable('settings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      group_notification_time: {
        type: Sequelize.TIME,
        allowNull: false,
        defaultValue: '07:00'
      },
      group_notification_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      individual_reminder_minutes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 30
      },
      individual_reminder_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      whatsapp_connected: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create notification_logs table
    await queryInterface.createTable('notification_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      meeting_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'meetings',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      participant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'participants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM('individual_reminder', 'group_notification'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('success', 'failed'),
        allowNull: false
      },
      error_message: {
        type: Sequelize.TEXT
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('participants', ['whatsapp_number']);
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