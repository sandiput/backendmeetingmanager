const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

// Controllers
const meetingController = require("../controllers/meetingController");
const participantController = require("../controllers/participantController");
const settingsController = require("../controllers/settingsController");
const dashboardController = require("../controllers/dashboardController");
const daftarKantorController = require("../controllers/daftarKantorController");

// Health Check Route
router.get("/health", (req, res) => {
  res.json({ status: "ok", message: "API is running" });
});

// Middleware
const validateMeeting = [
  body("title").notEmpty().trim(),
  body("date").isDate(),
  body("location").notEmpty().trim(),
  body("designated_attendees").optional().isArray(),
  body("dress_code").optional().trim(),
  body("agenda").optional().trim(),
  body("discussion_results").optional().trim(),
  body("notes").optional().trim(),
  body("whatsapp_reminder_enabled").optional().isBoolean(),
  body("group_notification_enabled").optional().isBoolean(),
];

const validateParticipant = [body("name").notEmpty().trim(), body("nip").notEmpty().trim(), body("whatsapp_number").notEmpty().trim(), body("seksi").notEmpty().trim()];

const validateSettings = [
  body("notification_time")
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body("reminder_enabled").optional().isBoolean(),
  body("group_notification_enabled").optional().isBoolean(),
  body("whatsapp_group_id").optional().notEmpty().trim(),
];

// Dashboard Routes
router.get("/dashboard/stats", (req, res) => dashboardController.getStats(req, res));
router.get("/dashboard/upcoming", meetingController.getUpcomingMeetings);

// Review Routes
router.get("/review/stats", (req, res) => dashboardController.getReviewStats(req, res));
router.get("/review/top-participants", (req, res) => dashboardController.getTopParticipants(req, res));
router.get("/review/seksi-stats", (req, res) => dashboardController.getSeksiStats(req, res));
router.get("/review/meeting-trends", (req, res) => dashboardController.getMeetingTrends(req, res));
router.get("/review/export-excel", (req, res) => dashboardController.exportExcel(req, res));

// Meeting Routes
router.get("/meetings", meetingController.getAllMeetings);
router.get("/meetings/search", meetingController.searchMeetings);
router.get("/meetings/upcoming", meetingController.getUpcomingMeetings);
// Removed incorrect endpoint format
router.get("/meetings/:id", meetingController.getMeeting);
router.post("/meetings", validateMeeting, meetingController.createMeeting);
router.put("/meetings/:id", validateMeeting, meetingController.updateMeeting);
router.delete("/meetings/:id", meetingController.deleteMeeting);
router.post("/meetings/:id/send-reminder", meetingController.sendReminder);

// Participant Routes
router.get("/participants", (req, res) => participantController.getAllParticipants(req, res));
router.get("/participants/search/:query", (req, res) => participantController.searchParticipants(req, res));
router.get("/participants/seksi/:seksi", (req, res) => participantController.getParticipantsBySeksi(req, res));
router.get("/participants/:id", (req, res) => participantController.getParticipant(req, res));
router.post("/participants", validateParticipant, (req, res) => participantController.createParticipant(req, res));
router.put("/participants/:id", validateParticipant, (req, res) => participantController.updateParticipant(req, res));
router.delete("/participants/:id", (req, res) => participantController.deleteParticipant(req, res));

// Settings Routes
router.get("/settings", settingsController.getSettings);
router.put("/settings", validateSettings, settingsController.updateSettings);
router.put("/settings/templates", settingsController.updateTemplates);

// Daftar Kantor Routes
router.get("/kantor", daftarKantorController.getAllKantor);
router.get("/kantor/search/:query", daftarKantorController.searchKantor);

module.exports = router;
