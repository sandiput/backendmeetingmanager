'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.renameColumn('meetings', 'discussion_result', 'discussion_results');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.renameColumn('meetings', 'discussion_results', 'discussion_result');
  }
};
