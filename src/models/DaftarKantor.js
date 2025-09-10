'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class DaftarKantor extends Model {
    static associate(models) {
      // Define associations here if needed
    }
  }

  DaftarKantor.init({
    kd_kantor: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    alamat: {
      type: DataTypes.STRING,
      allowNull: true
    },
    nama_kantor_lengkap: {
      type: DataTypes.STRING,
      allowNull: true
    },
    nama_kantor_pendek: {
      type: DataTypes.STRING,
      allowNull: true
    },
    eselon2: {
      type: DataTypes.STRING,
      allowNull: true
    },
    is_kanwil: {
      type: DataTypes.STRING,
      allowNull: true
    },
    kota: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'DaftarKantor',
    tableName: 'daftar_kantor',
    timestamps: false // Table doesn't have created_at/updated_at
  });

  return DaftarKantor;
};