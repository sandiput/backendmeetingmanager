const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { authenticateAdmin } = require("../middleware/auth");

// Import controllers
const meetingController = require("../controllers/meetingController");
const participantController = require("../controllers/participantController");
const settingsController = require("../controllers/settingsController");
const dashboardController = require("../controllers/dashboardController");
const daftarKantorController = require("../controllers/daftarKantorController");
const recentActivityController = require("../controllers/recentActivityController");
const adminController = require("../controllers/adminController");

// Health Check Route
router.get("/health", (req, res) => {
  res.json({ status: "ok", message: "API is running" });
});

// Middleware
const validateMeeting = [
  body("title").notEmpty().trim(),
  body("date").isDate(),
  body("location").notEmpty().trim(),
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

const validateAdmin = [
  body("username").notEmpty().trim().isLength({ min: 3, max: 50 }),
  body("email").isEmail().normalizeEmail(),
  body("full_name").notEmpty().trim().isLength({ min: 2, max: 100 }),
  body("role").optional().isIn(['admin', 'super_admin']),
  body("whatsapp_number").optional().trim(),
  body("password").optional().isLength({ min: 6 })
];

// Dashboard Routes
router.get("/dashboard/stats", authenticateAdmin, (req, res) => dashboardController.getStats(req, res));
router.get("/dashboard/upcoming", authenticateAdmin, meetingController.getUpcomingMeetings);

// Review Routes
router.get("/review/stats", authenticateAdmin, (req, res) => dashboardController.getReviewStats(req, res));
router.get("/review/top-participants", authenticateAdmin, (req, res) => dashboardController.getTopParticipants(req, res));
router.get("/review/top-invited-by", authenticateAdmin, (req, res) => dashboardController.getTopInvitedBy(req, res));
router.get("/review/seksi-stats", authenticateAdmin, (req, res) => dashboardController.getSeksiStats(req, res));
router.get("/review/meeting-trends", authenticateAdmin, (req, res) => dashboardController.getMeetingTrends(req, res));
router.get("/review/export-excel", authenticateAdmin, (req, res) => dashboardController.exportExcel(req, res));

// Meeting Routes
router.get("/meetings", authenticateAdmin, meetingController.getAllMeetings);
router.get("/meetings/search", authenticateAdmin, meetingController.searchMeetings);
router.get("/meetings/upcoming", authenticateAdmin, meetingController.getUpcomingMeetings);
// Removed incorrect endpoint format
router.get("/meetings/:id", authenticateAdmin, meetingController.getMeeting);
router.post("/meetings", authenticateAdmin, validateMeeting, meetingController.createMeeting);
router.put("/meetings/:id", authenticateAdmin, validateMeeting, meetingController.updateMeeting);
router.delete("/meetings/:id", authenticateAdmin, meetingController.deleteMeeting);
router.post("/meetings/:id/send-reminder", authenticateAdmin, meetingController.sendReminder);

// Participant Routes
router.get("/participants", authenticateAdmin, (req, res) => participantController.getAllParticipants(req, res));
router.get("/participants/search/:query", authenticateAdmin, (req, res) => participantController.searchParticipants(req, res));
router.get("/participants/seksi/:seksi", authenticateAdmin, (req, res) => participantController.getParticipantsBySeksi(req, res));
router.get("/participants/:id", authenticateAdmin, (req, res) => participantController.getParticipant(req, res));
router.post("/participants", validateParticipant, (req, res) => participantController.createParticipant(req, res));
router.put("/participants/:id", validateParticipant, (req, res) => participantController.updateParticipant(req, res));
router.delete("/participants/:id", (req, res) => participantController.deleteParticipant(req, res));

// Settings Routes
router.get("/settings", authenticateAdmin, settingsController.getSettings);
router.put("/settings", validateSettings, settingsController.updateSettings);
router.put("/settings/templates", settingsController.updateTemplates);

// Daftar Kantor Routes
router.get("/kantor", authenticateAdmin, daftarKantorController.getAllKantor);
router.get("/kantor/search/:query", authenticateAdmin, daftarKantorController.searchKantor);

// Recent Activities Routes
router.get("/recent-activities", authenticateAdmin, recentActivityController.getRecentActivities);

// Admin Management Routes
router.get("/admins", authenticateAdmin, adminController.getAllAdmins);
router.get("/admins/:id", authenticateAdmin, adminController.getAdminById);
router.post("/admins", authenticateAdmin, validateAdmin, adminController.createAdmin);
router.put("/admins/:id", authenticateAdmin, adminController.updateAdmin);
router.delete("/admins/:id", authenticateAdmin, adminController.deleteAdmin);
router.put("/admins/:id/password", authenticateAdmin, adminController.updateAdminPassword);
router.put("/admins/:id/toggle-status", authenticateAdmin, adminController.toggleAdminStatus);

module.exports = router;
