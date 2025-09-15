'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('admins', 'profile_picture', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Path to user profile picture'
    });
    
    await queryInterface.addColumn('admins', 'whatsapp_number', {
      type: Sequelize.STRING(20),
      allowNull: true,
      comment: 'User WhatsApp number'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('admins', 'profile_picture');
    await queryInterface.removeColumn('admins', 'whatsapp_number');
  }
};