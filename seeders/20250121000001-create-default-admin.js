'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Hash password untuk admin default
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    await queryInterface.bulkInsert('admins', [
      {
        username: 'admin',
        email: 'admin@meetingmanager.com',
        password: hashedPassword,
        full_name: 'Administrator',
        role: 'super_admin',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        username: 'manager',
        email: 'manager@meetingmanager.com',
        password: hashedPassword,
        full_name: 'Meeting Manager',
        role: 'admin',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('admins', {
      username: ['admin', 'manager']
    }, {});
  }
};