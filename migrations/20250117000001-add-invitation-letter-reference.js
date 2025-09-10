"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("meetings", "invitation_letter_reference", {
      type: Sequelize.STRING,
      allowNull: true,
      after: "invited_by",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("meetings", "invitation_letter_reference");
  },
};
