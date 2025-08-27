'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const participants = [];
    
    // Seksi options
    const seksiOptions = [
      'Umum',
      'Keuangan',
      'Perencanaan',
      'SDM',
      'IT',
      'Operasional',
      'Marketing',
      'Hukum',
      'Kepatuhan',
      'Audit'
    ];
    
    // Generate 50 random participants
    for (let i = 1; i <= 50; i++) {
      const seksi = seksiOptions[Math.floor(Math.random() * seksiOptions.length)];
      const nip = `${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      
      participants.push({
        id: uuidv4(),
        name: `Participant ${i}`,
        whatsapp_number: `08${Math.floor(1000000000 + Math.random() * 9000000000)}`,
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