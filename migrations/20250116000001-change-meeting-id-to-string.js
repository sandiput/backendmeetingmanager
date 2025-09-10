'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if whatsapp_logs table exists
    const tableDescription = await queryInterface.describeTable('whatsapp_logs');
    
    if (tableDescription.meeting_id) {
      try {
        // First, remove foreign key constraint if it exists
        await queryInterface.removeConstraint('whatsapp_logs', 'whatsapp_logs_meeting_id_foreign_idx');
        console.log('✅ Removed foreign key constraint');
      } catch (error) {
        console.log('ℹ️ Foreign key constraint may not exist, continuing...');
      }
      
      // Change meeting_id column from INTEGER to STRING
      await queryInterface.changeColumn('whatsapp_logs', 'meeting_id', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Changed meeting_id column type from INTEGER to STRING in whatsapp_logs table');
      
      // Add foreign key constraint back
      try {
        await queryInterface.addConstraint('whatsapp_logs', {
          fields: ['meeting_id'],
          type: 'foreign key',
          name: 'whatsapp_logs_meeting_id_foreign_idx',
          references: {
            table: 'meetings',
            field: 'id'
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        });
        console.log('✅ Added foreign key constraint back');
      } catch (error) {
        console.log('⚠️ Could not add foreign key constraint:', error.message);
      }
    } else {
      console.log('ℹ️ meeting_id column does not exist in whatsapp_logs table');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Check if whatsapp_logs table exists
    const tableDescription = await queryInterface.describeTable('whatsapp_logs');
    
    if (tableDescription.meeting_id) {
      // Change meeting_id column back from STRING to INTEGER
      await queryInterface.changeColumn('whatsapp_logs', 'meeting_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'meetings',
          key: 'id'
        }
      });
      console.log('✅ Changed meeting_id column type back from STRING to INTEGER in whatsapp_logs table');
    }
  }
};