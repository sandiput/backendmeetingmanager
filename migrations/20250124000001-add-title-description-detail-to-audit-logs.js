'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('audit_logs', 'title', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Judul singkat aksi yang dilakukan (contoh: Hapus Meeting, Buat Meeting)'
    });
    
    await queryInterface.addColumn('audit_logs', 'description_detail', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Detail perubahan yang dilakukan (contoh: merubah judul dari xxx ke yyy)'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('audit_logs', 'title');
    await queryInterface.removeColumn('audit_logs', 'description_detail');
  }
};