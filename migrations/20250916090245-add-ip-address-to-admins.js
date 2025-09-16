'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('admins', 'ip_address', {
      type: Sequelize.STRING(45),
      allowNull: true,
      comment: 'Last login IP address (supports IPv6)'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('admins', 'ip_address');
  }
};
