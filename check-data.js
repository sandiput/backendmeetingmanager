const { Sequelize } = require('sequelize');
const config = require('./config/config.json').development;

async function checkData() {
  // Create Sequelize instance
  const sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      host: config.host,
      dialect: config.dialect,
      logging: false
    }
  );

  try {
    // Test connection
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // Count participants
    const [participantCount] = await sequelize.query('SELECT COUNT(*) as count FROM participants');
    console.log(`Total participants: ${participantCount[0].count}`);

    // Count meetings
    const [meetingCount] = await sequelize.query('SELECT COUNT(*) as count FROM meetings');
    console.log(`Total meetings: ${meetingCount[0].count}`);

    // Count meeting participants
    const [meetingParticipantCount] = await sequelize.query('SELECT COUNT(*) as count FROM meeting_participants');
    console.log(`Total meeting participants: ${meetingParticipantCount[0].count}`);

    // Sample data
    console.log('\nSample Participants:');
    const [participants] = await sequelize.query('SELECT * FROM participants LIMIT 5');
    console.log(participants);

    console.log('\nSample Meetings:');
    const [meetings] = await sequelize.query('SELECT * FROM meetings LIMIT 5');
    console.log(meetings);

    console.log('\nSample Meeting Participants:');
    const [meetingParticipants] = await sequelize.query(
      'SELECT mp.*, p.name FROM meeting_participants mp JOIN participants p ON mp.participant_id = p.id LIMIT 5'
    );
    console.log(meetingParticipants);

  } catch (error) {
    console.error('Unable to connect to the database:', error);
  } finally {
    await sequelize.close();
  }
}

checkData();