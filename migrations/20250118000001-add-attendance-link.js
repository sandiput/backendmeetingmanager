'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('meetings', 'attendance_link', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'meeting_link'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('meetings', 'attendance_link');
  }
};