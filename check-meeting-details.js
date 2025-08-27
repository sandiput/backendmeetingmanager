const { Sequelize } = require('sequelize');
const config = require('./config/config.json').development;

async function checkMeetingDetails() {
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

    // Get meetings with participant counts
    const [meetingsWithCounts] = await sequelize.query(`
      SELECT 
        m.id, 
        m.title, 
        m.date, 
        m.start_time, 
        m.location,
        COUNT(mp.participant_id) as participant_count,
        SUM(CASE WHEN mp.is_designated = 1 THEN 1 ELSE 0 END) as designated_count
      FROM 
        meetings m
      LEFT JOIN 
        meeting_participants mp ON m.id = mp.meeting_id
      GROUP BY 
        m.id
      ORDER BY 
        m.date DESC, m.start_time DESC
      LIMIT 10
    `);

    console.log('\nMeetings with Participant Counts:');
    console.log(meetingsWithCounts);

    // Get a specific meeting with its participants
    if (meetingsWithCounts.length > 0) {
      const meetingId = meetingsWithCounts[0].id;
      
      const [meetingParticipants] = await sequelize.query(`
        SELECT 
          p.id, 
          p.name, 
          p.whatsapp_number, 
          p.seksi,
          mp.is_designated
        FROM 
          participants p
        JOIN 
          meeting_participants mp ON p.id = mp.participant_id
        WHERE 
          mp.meeting_id = :meetingId
        ORDER BY 
          p.name
      `, {
        replacements: { meetingId }
      });

      console.log(`\nParticipants for Meeting: ${meetingsWithCounts[0].title}`);
      console.log(meetingParticipants);
    }

  } catch (error) {
    console.error('Unable to connect to the database:', error);
  } finally {
    await sequelize.close();
  }
}

checkMeetingDetails();