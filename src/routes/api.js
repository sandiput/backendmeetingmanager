const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// Controllers
const meetingController = require('../controllers/meetingController');
const participantController = require('../controllers/participantController');
const settingsController = require('../controllers/settingsController');
const dashboardController = require('../controllers/dashboardController');

// Health Check Route
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Middleware
const validateMeeting = [
  body('title').notEmpty().trim(),
  body('date').isDate(),
  body('start_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('end_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('location').notEmpty().trim(),
  body('designated_attendees').optional().isArray(),
  body('dress_code').optional().trim(),
  body('invitation_reference').optional().trim(),
  body('attendance_link').optional().trim(),
  body('discussion_results').optional().trim(),
  body('whatsapp_reminder_enabled').optional().isBoolean(),
  body('group_notification_enabled').optional().isBoolean()
];

const validateParticipant = [
  body('name').notEmpty().trim(),
  body('nip').notEmpty().trim(),
  body('whatsapp_number').notEmpty().trim(),
  body('seksi').notEmpty().trim()
];

const validateSettings = [
  body('notification_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('reminder_enabled').optional().isBoolean(),
  body('group_notification_enabled').optional().isBoolean(),
  body('whatsapp_group_id').optional().notEmpty().trim()
];

// Dashboard Routes
router.get('/dashboard/stats', dashboardController.getStats);
router.get('/dashboard/upcoming', meetingController.getUpcomingMeetings);

// Review Routes
router.get('/review/stats', dashboardController.getReviewStats);
router.get('/review/top-participants', dashboardController.getTopParticipants);
router.get('/review/seksi-stats', dashboardController.getSeksiStats);
router.get('/review/meeting-trends', dashboardController.getMeetingTrends);

// Meeting Routes
router.get('/meetings', meetingController.getAllMeetings);
router.get('/meetings/search', meetingController.searchMeetings);
router.get('/meetings/upcoming', meetingController.getUpcomingMeetings);
// Removed incorrect endpoint format
router.get('/meetings/:id', meetingController.getMeeting);
router.post('/meetings', validateMeeting, meetingController.createMeeting);
router.put('/meetings/:id', validateMeeting, meetingController.updateMeeting);
router.delete('/meetings/:id', meetingController.deleteMeeting);
router.post('/meetings/:id/send-reminder', meetingController.sendReminder);

// Participant Routes
router.get('/participants', participantController.getAllParticipants);
router.get('/participants/search/:query', participantController.searchParticipants);
router.get('/participants/seksi/:seksi', participantController.getParticipantsBySeksi);
router.get('/participants/:id', participantController.getParticipant);
router.post('/participants', validateParticipant, participantController.createParticipant);
router.put('/participants/:id', validateParticipant, participantController.updateParticipant);
router.delete('/participants/:id', participantController.deleteParticipant);

// Settings Routes
router.get('/settings', settingsController.getSettings);
router.put('/settings', validateSettings, settingsController.updateSettings);
router.post('/settings/test-whatsapp', settingsController.testWhatsApp);
router.put('/settings/templates', settingsController.updateTemplates);
router.put('/settings/whatsapp-group', settingsController.setWhatsAppGroup);

module.exports = router;