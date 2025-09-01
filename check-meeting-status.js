const { Meeting } = require('./src/models');

(async () => {
  try {
    console.log('Today date:', new Date().toISOString().split('T')[0]);
    
    const meetings = await Meeting.findAll();
    console.log(`\nAll meetings (${meetings.length}):`);
    meetings.forEach(m => {
      console.log(`- ${m.title}: date=${m.date}, group_enabled=${m.group_notification_enabled}, group_sent_at=${m.group_notification_sent_at}`);
    });
    
    // Check today's meetings specifically
    const today = new Date().toISOString().split('T')[0];
    const todayMeetings = await Meeting.findAll({
      where: {
        date: today,
        group_notification_enabled: true
      }
    });
    
    console.log(`\nToday's meetings with group notifications enabled (${todayMeetings.length}):`);
    todayMeetings.forEach(m => {
      console.log(`- ${m.title}: group_sent_at=${m.group_notification_sent_at}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();