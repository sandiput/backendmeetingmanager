'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.renameColumn('meetings', 'agenda', 'discussion_result');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.renameColumn('meetings', 'discussion_result', 'agenda');
  }
};
