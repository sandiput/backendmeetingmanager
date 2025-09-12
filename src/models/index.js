const { sequelize } = require('../config/database');

// Import models
const Meeting = require('./Meeting')(sequelize);
const Participant = require('./Participant')(sequelize);
const Settings = require('./Settings');
const MeetingParticipant = require('./MeetingParticipant');
const MeetingFile = require('./MeetingFile');
const Attachment = require('./Attachment')(sequelize);
const AuditLog = require('./audit_log');
const WhatsAppLog = require('./WhatsAppLog');
const DaftarKantor = require('./DaftarKantor')(sequelize);

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



Meeting.hasMany(MeetingFile, {
  foreignKey: 'meeting_id',
  as: 'files'
});

MeetingFile.belongsTo(Meeting, {
  foreignKey: 'meeting_id',
  as: 'meeting'
});

Meeting.hasMany(Attachment, {
  foreignKey: 'meeting_id',
  as: 'attachments'
});

Attachment.belongsTo(Meeting, {
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
  Attachment,
  AuditLog,
  WhatsAppLog,
  DaftarKantor
};