'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Langkah 1: Hapus constraint ENUM yang ada
    await queryInterface.changeColumn('meetings', 'status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'incoming'
    });

    // Langkah 2: Update nilai status yang ada
    await queryInterface.sequelize.query(
      `UPDATE meetings SET status = 'incoming' WHERE status IN ('confirmed', 'pending', 'cancelled')`
    );

    await queryInterface.sequelize.query(
      `UPDATE meetings SET status = 'completed' WHERE status = 'completed'`
    );

    // Langkah 3: Buat kembali kolom dengan ENUM baru
    await queryInterface.changeColumn('meetings', 'status', {
      type: Sequelize.ENUM('incoming', 'completed'),
      allowNull: false,
      defaultValue: 'incoming'
    });
  },

  async down(queryInterface, Sequelize) {
    // Langkah 1: Hapus constraint ENUM yang ada
    await queryInterface.changeColumn('meetings', 'status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'pending'
    });

    // Langkah 2: Update nilai status yang ada
    await queryInterface.sequelize.query(
      `UPDATE meetings SET status = 'pending' WHERE status = 'incoming'`
    );

    // Langkah 3: Buat kembali kolom dengan ENUM lama
    await queryInterface.changeColumn('meetings', 'status', {
      type: Sequelize.ENUM('confirmed', 'pending', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    });
  }
};