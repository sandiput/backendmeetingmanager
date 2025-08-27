'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // First, get all participants and meetings
    const participants = await queryInterface.sequelize.query(
      'SELECT id FROM participants',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    const meetings = await queryInterface.sequelize.query(
      'SELECT id FROM meetings',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    if (!participants.length || !meetings.length) {
      console.log('No participants or meetings found. Skipping meeting_participants seeding.');
      return;
    }
    
    const meetingParticipants = [];
    
    // For each meeting, assign random participants
    for (const meeting of meetings) {
      // Shuffle participants to get random selection
      const shuffledParticipants = [...participants].sort(() => 0.5 - Math.random());
      
      // Select between 3 and 10 participants for this meeting
      const participantCount = 3 + Math.floor(Math.random() * 8);
      const selectedParticipants = shuffledParticipants.slice(0, participantCount);
      
      // Create meeting_participants entries
      for (const participant of selectedParticipants) {
        // 60% chance of being a designated attendee
        const isDesignated = Math.random() < 0.6;
        
        meetingParticipants.push({
          id: uuidv4(),
          meeting_id: meeting.id,
          participant_id: participant.id,
          is_designated: isDesignated,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }
    
    // Insert meeting_participants
    return queryInterface.bulkInsert('meeting_participants', meetingParticipants);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('meeting_participants', null, {});
  }
};