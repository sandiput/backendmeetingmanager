"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("attachments", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      meeting_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "meetings",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      original_filename: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      filename: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      file_path: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      file_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      file_category: {
        type: Sequelize.ENUM("attachment", "photo"),
        allowNull: false,
        defaultValue: "attachment",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Add index for better query performance
    await queryInterface.addIndex("attachments", ["meeting_id"]);
    await queryInterface.addIndex("attachments", ["file_category"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("attachments");
  },
};