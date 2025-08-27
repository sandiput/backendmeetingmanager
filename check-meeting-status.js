const { sequelize, Meeting } = require('./src/models');

async function checkMeetingStatus() {
  try {
    const meetings = await Meeting.findAll();
    console.log('Status meetings yang ada di database:');
    meetings.forEach(m => {
      console.log(`ID: ${m.id}, Title: ${m.title}, Status: ${m.status}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkMeetingStatus();