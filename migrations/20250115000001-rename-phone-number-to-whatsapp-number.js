'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if phone_number column exists before renaming
    const tableDescription = await queryInterface.describeTable('whatsapp_logs');
    
    if (tableDescription.phone_number) {
      // Rename phone_number to whatsapp_number
      await queryInterface.renameColumn('whatsapp_logs', 'phone_number', 'whatsapp_number');
      console.log('✅ Renamed phone_number to whatsapp_number in whatsapp_logs table');
    } else if (tableDescription.whatsapp_number) {
      console.log('ℹ️ Column whatsapp_number already exists, skipping rename');
    } else {
      // If neither exists, create whatsapp_number column
      await queryInterface.addColumn('whatsapp_logs', 'whatsapp_number', {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'WhatsApp number for individual messages'
      });
      console.log('✅ Added whatsapp_number column to whatsapp_logs table');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Check if whatsapp_number column exists before renaming back
    const tableDescription = await queryInterface.describeTable('whatsapp_logs');
    
    if (tableDescription.whatsapp_number) {
      // Rename whatsapp_number back to phone_number
      await queryInterface.renameColumn('whatsapp_logs', 'whatsapp_number', 'phone_number');
      console.log('✅ Renamed whatsapp_number back to phone_number in whatsapp_logs table');
    }
  }
};