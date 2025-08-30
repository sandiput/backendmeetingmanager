'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const participants = [];
    
    // Seksi options
    const seksiOptions = [
      'Intelijen Kepabeanan I',
      'Intelijen Kepabeanan II',
      'Intelijen Cukai',
      'Dukungan Operasi Intelijen'
    ];
    
    // Generate 30 random participants with Indonesian names
    const indonesianNames = [
      'Ahmad Rizki Pratama', 'Siti Nurhaliza', 'Budi Santoso', 'Dewi Sartika', 'Eko Prasetyo',
      'Fitri Handayani', 'Gunawan Wijaya', 'Hesti Purwanti', 'Indra Kusuma', 'Joko Widodo',
      'Kartika Sari', 'Lukman Hakim', 'Maya Sari', 'Nugroho Adi', 'Oktavia Ningsih',
      'Putra Mahendra', 'Qori Amelia', 'Rudi Hartono', 'Sari Dewi', 'Taufik Hidayat',
      'Umi Kalsum', 'Vina Panduwinata', 'Wahyu Setiawan', 'Xenia Maharani', 'Yudi Setiawan',
      'Zahra Aulia', 'Agus Salim', 'Bayu Aji', 'Citra Kirana', 'Doni Salmanan'
    ];
    
    for (let i = 1; i <= 30; i++) {
      const seksi = seksiOptions[Math.floor(Math.random() * seksiOptions.length)];
      // Generate 18 digit NIP
      const nip = `${Math.floor(100000000000000000 + Math.random() * 900000000000000000)}`;
      
      participants.push({
        id: uuidv4(),
        name: indonesianNames[i - 1],
        whatsapp_number: `628${Math.floor(100000000 + Math.random() * 900000000)}`,
        nip: nip,
        seksi: seksi,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    return queryInterface.bulkInsert('participants', participants);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('participants', null, {});
  }
};