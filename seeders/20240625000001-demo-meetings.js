'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const meetings = [];
    
    // Location options
    const locationOptions = [
      'Ruang Rapat Utama',
      'Ruang Koordinasi A',
      'Ruang Briefing B',
      'Aula Kantor',
      'Ruang Rapat Direksi',
      'Ruang Pelatihan',
      'Ruang Konferensi',
      'Ruang Sidang',
      'Online (Zoom)',
      'Online (Google Meet)'
    ];
    
    // Generate 20 random meetings with Indonesian titles
    const indonesianMeetingTitles = [
      'Rapat Koordinasi Bulanan Tim Intelijen',
      'Evaluasi Kinerja Operasi Kepabeanan',
      'Briefing Keamanan dan Pengawasan Cukai',
      'Rapat Perencanaan Strategi Intelijen',
      'Koordinasi Lintas Seksi Operasional',
      'Review Laporan Investigasi Kepabeanan',
      'Rapat Evaluasi Sistem Pengawasan',
      'Briefing Operasi Khusus Intelijen',
      'Koordinasi dengan Unit Penegakan Hukum',
      'Rapat Analisis Risiko Kepabeanan',
      'Evaluasi Prosedur Operasi Standar',
      'Briefing Keamanan Fasilitas Pelabuhan',
      'Rapat Koordinasi Antar Instansi',
      'Review Kebijakan Pengawasan Cukai',
      'Rapat Peningkatan Kapasitas SDM',
      'Koordinasi Operasi Gabungan',
      'Briefing Teknologi Pengawasan Terbaru',
      'Rapat Evaluasi Target Kinerja',
      'Koordinasi Sistem Informasi Intelijen',
      'Review Standar Operasional Prosedur'
    ];
    
    for (let i = 1; i <= 20; i++) {
      const location = locationOptions[Math.floor(Math.random() * locationOptions.length)];
      const isOnline = location.includes('Online');
      
      // Generate random date within range of -15 to +15 days from today
      const today = new Date();
      const randomDate = new Date(today);
      const dayOffset = Math.floor(Math.random() * 31) - 15; // -15 to +15 days
      randomDate.setDate(today.getDate() + dayOffset);
      
      // Format date as YYYY-MM-DD
      const date = randomDate.toISOString().split('T')[0];
      
      // Generate random start time between 8:00 and 16:00
      const startHour = 8 + Math.floor(Math.random() * 8);
      const startMinute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, or 45
      const startTime = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}:00`;
      
      // Generate random end time between 1 and 3 hours after start time
      const endHour = startHour + 1 + Math.floor(Math.random() * 2);
      const endTime = `${endHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}:00`;
      
      // Set status based on date: incoming if >= today, completed if < today
      const status = randomDate >= today ? 'incoming' : 'completed';
      
      meetings.push({
        id: uuidv4(),
        title: indonesianMeetingTitles[i - 1],
        date: date,
        start_time: startTime,
        end_time: endTime,
        location: location,
        meeting_link: isOnline ? `https://meeting-link-${i}.example.com` : null,
        dress_code: ['Seragam Dinas', 'Pakaian Formal', 'Seragam Harian', 'Pakaian Rapi'][Math.floor(Math.random() * 4)],
        agenda: `Agenda rapat ${indonesianMeetingTitles[i - 1]}`,
        notes: `Catatan untuk rapat ${indonesianMeetingTitles[i - 1]}`,
        discussion_results: Math.random() > 0.3 ? `Hasil rapat: Telah dibahas dan disepakati beberapa poin penting terkait operasional. Tindak lanjut akan dilaksanakan sesuai timeline yang telah ditetapkan.` : null,
        status: status,
        whatsapp_reminder_enabled: Math.random() > 0.2, // 80% chance of being true
        group_notification_enabled: Math.random() > 0.3, // 70% chance of being true
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    return queryInterface.bulkInsert('meetings', meetings);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('meetings', null, {});
  }
};