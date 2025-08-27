'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const meetings = [];
    
    // Location options
    const locationOptions = [
      'Ruang Rapat Utama',
      'Ruang Rapat Lantai 2',
      'Ruang Rapat Lantai 3',
      'Ruang Direktur',
      'Aula',
      'Ruang Konferensi',
      'Online (Zoom)',
      'Online (Google Meet)',
      'Online (Microsoft Teams)',
      'Ruang Training'
    ];
    
    // Generate 20 random meetings
    for (let i = 1; i <= 20; i++) {
      const location = locationOptions[Math.floor(Math.random() * locationOptions.length)];
      const isOnline = location.includes('Online');
      
      // Generate random date within the next 30 days
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + Math.floor(Math.random() * 30));
      
      // Format date as YYYY-MM-DD
      const date = futureDate.toISOString().split('T')[0];
      
      // Generate random start time between 8:00 and 16:00
      const startHour = 8 + Math.floor(Math.random() * 8);
      const startMinute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, or 45
      const startTime = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}:00`;
      
      // Generate random end time between 1 and 3 hours after start time
      const endHour = startHour + 1 + Math.floor(Math.random() * 2);
      const endTime = `${endHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}:00`;
      
      // Generate random status
      const statusOptions = ['confirmed', 'pending', 'completed', 'cancelled'];
      const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      
      meetings.push({
        id: uuidv4(),
        title: `Meeting ${i}: ${['Weekly Update', 'Project Planning', 'Status Review', 'Team Sync', 'Strategic Discussion'][Math.floor(Math.random() * 5)]}`,
        date: date,
        start_time: startTime,
        end_time: endTime,
        location: location,
        meeting_link: isOnline ? `https://meeting-link-${i}.example.com` : null,
        dress_code: ['Formal', 'Business Casual', 'Casual', null][Math.floor(Math.random() * 4)],
        invitation_reference: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
        attendance_link: `https://attendance-${i}.example.com`,
        discussion_results: '',
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