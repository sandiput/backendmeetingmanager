const { sequelize } = require('../config/database');

// Import models
const Meeting = require('./Meeting')(sequelize);
const Participant = require('./Participant')(sequelize);
const Settings = require('./Settings');
const MeetingParticipant = require('./MeetingParticipant');
const MeetingFile = require('./MeetingFile');
const NotificationLog = require('./NotificationLog');

// Define associations
Meeting.belongsToMany(Participant, {
  through: MeetingParticipant,
  foreignKey: 'meeting_id',
  otherKey: 'participant_id',
  as: 'participants'
});

Participant.belongsToMany(Meeting, {
  through: MeetingParticipant,
  foreignKey: 'participant_id',
  otherKey: 'meeting_id',
  as: 'meetings'
});

Meeting.hasMany(NotificationLog, {
  foreignKey: 'meeting_id',
  as: 'notificationLogs'
});

NotificationLog.belongsTo(Meeting, {
  foreignKey: 'meeting_id',
  as: 'meeting'
});

NotificationLog.belongsTo(Participant, {
  foreignKey: 'participant_id',
  as: 'participant'
});

Meeting.hasMany(MeetingFile, {
  foreignKey: 'meeting_id',
  as: 'files'
});

MeetingFile.belongsTo(Meeting, {
  foreignKey: 'meeting_id',
  as: 'meeting'
});

module.exports = {
  sequelize,
  Meeting,
  Participant,
  Settings,
  MeetingParticipant,
  MeetingFile,
  NotificationLog
};