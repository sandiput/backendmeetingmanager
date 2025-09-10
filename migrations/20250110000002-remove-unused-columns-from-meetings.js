'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove unused columns from meetings table
    await queryInterface.removeColumn('meetings', 'notes');
    await queryInterface.removeColumn('meetings', 'reminder_sent_at');
    await queryInterface.removeColumn('meetings', 'group_notification_sent_at');
  },

  down: async (queryInterface, Sequelize) => {
    // Add back the columns if rollback is needed
    await queryInterface.addColumn('meetings', 'notes', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    
    await queryInterface.addColumn('meetings', 'reminder_sent_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
    
    await queryInterface.addColumn('meetings', 'group_notification_sent_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
  }
};