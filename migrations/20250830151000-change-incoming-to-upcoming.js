'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, update all existing 'incoming' records to 'upcoming'
    await queryInterface.sequelize.query(
      "UPDATE meetings SET status = 'upcoming' WHERE status = 'incoming'"
    );
    
    // Then modify the ENUM to replace 'incoming' with 'upcoming'
    await queryInterface.changeColumn('meetings', 'status', {
      type: Sequelize.ENUM('upcoming', 'completed'),
      allowNull: false,
      defaultValue: 'upcoming'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // First, update all existing 'upcoming' records back to 'incoming'
    await queryInterface.sequelize.query(
      "UPDATE meetings SET status = 'incoming' WHERE status = 'upcoming'"
    );
    
    // Then modify the ENUM back to original
    await queryInterface.changeColumn('meetings', 'status', {
      type: Sequelize.ENUM('incoming', 'completed'),
      allowNull: false,
      defaultValue: 'incoming'
    });
  }
};